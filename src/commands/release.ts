import * as ProgressBar from 'progress';
import { Arguments, CommandBuilder } from 'yargs';
import chalk from 'chalk';
import { createRelease, getCompare, getIssue, getTags, isGitHubMessage } from '../github';
import { GitHub } from '../interfaces';

const { bold, green, red } = chalk;

interface Changes {
	breaking: string[];
	enhancement: string[];
	fix: string[];
	uncategorized: string[];
}

interface CommitMetaData {
	message: string;
	pr: number;
	category?: 'breaking' | 'enhancement' | 'fix';
}

interface ReleaseArguments extends Arguments {
	draft: boolean;
	from?: string;
	org: string;
	prerelease?: boolean;
	repo: string;
	tag: string;
}

/**
 * Regex that matches patterns that look like a GitHub comment that resolves or fixes and issue.
 *
 * Diagram: https://goo.gl/xvpZtt
 */
const RESOLVES_REGEX = /(?:resolv|fix)(?:es)?:?\s+(?:https:\/\/github\.com\/)?(?:([a-z0-9\-]+)\/([a-z0-9\-]+))?(?:\/issues\/|#)(\d+)/i;

function initialCap(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseCommitMessage(message: string) {
	const [ firstLine, ...lines ] = message.split(/\r?\n/);
	return `* ${firstLine}\n${lines.length ? `  <details><summary>Details</summary>\n  ${lines.join('\n  ')}\n  </details>\n` : ''}\n`;
}

export const command = 'release <repo> <tag> [options]';

export const describe = 'generate release notes, where <repo> is the GitHub repository to use and the <tag> is the git tag to use as a base for the release.';

export const builder: CommandBuilder = function (yargs) {
	return yargs
		.example('$0 release foo v2.0.0', 'creates release notes for repository dojo/foo for tag v2.0.0')
		.example('$0 release foo v2.0.0 --org foo', 'creates release notes for repository foo/foo for tag v2.0.0')
		.options({
			'draft': {
				describe: 'release notes should be generated as a draft',
				default: true,
				type: 'boolean'
			},
			'from': {
				describe: 'instead of the previous tag in the repository, generate the release notes from this tag',
				type: 'string'
			},
			'org': {
				alias: 'owner',
				describe: 'the GitHub organization/owner',
				default: 'dojo',
				type: 'string'
			},
			'prerelease': {
				describe: 'The release notes should be marked as a "pre release", defaults to being determined by the tag name',
				type: 'boolean'
			}
		});
};

export async function handler({ draft, from, org, prerelease, repo, tag }: ReleaseArguments) {
	console.log(`- Creating release notes for: ${org}/${repo} ${tag}\n`);

	// try to parse the tag, to see if it fits the expected convention
	const parsedTag = /(\d+\.\d+\.\d+)(?:-([^\.]+)\.(\d+))?/.exec(tag);
	if (!parsedTag) {
		console.error(red(`Could not parse release tag: ${tag}\n`));
		return;
	}
	const [ , version, preReleaseTag, release ] = parsedTag;
	const name = preReleaseTag ? `Release ${version} ${initialCap(preReleaseTag)} ${release}` : `Release ${version}`;

	// retrieve the available tags for the repository
	let tagData: GitHub.Tag[] = [];
	let page = 1;
	let tagResponse = await getTags(org, repo, page);
	while (tagResponse.length) {
		tagData = [ ...tagData, ...tagResponse ];
		tagResponse = await getTags(org, repo, ++page);
	}
	const tags = tagData.map(({ name, commit: { sha }}) => {
		return { name, sha };
	});
	const tagIndex = tags.map(({ name }) => name).indexOf(tag);
	if (tagIndex < 0) {
		console.error(red(`Tag not found: ${tag}\n`));
		return;
	}
	const start = tags[tagIndex].sha;

	// either find the tag for the `from` option or use the tag prior to the current one
	const endIndex = from ? tags.map(({ name }) => name).indexOf(from) : tagIndex + 1;
	if (!tags[endIndex]) {
		console.error(red(`Unable to resolve previous tag.\n`));
		return;
	}
	const end = tags[endIndex].sha;

	// compare the starting and ending commit
	const comparison = await getCompare(org, repo, end, start);

	// take all the commit messages, filtering out any metadata update only messages
	const messages = comparison.commits
		.map((commit) => commit.commit.message).filter((message) => !message.match(/Update\spackage\smetadata/i));
	// remove the last commit message, which should just be the meta data update message
	messages.pop();

	// Now take the commit messages and try to find a related PR
	const commitInfo = messages.map((message) => {
		const prMatch = message.match(/\(#(\d+)\)/);
		return {
			message,
			pr: prMatch ? Number(prMatch[1]) : undefined
		} as CommitMetaData;
	});

	// Display a progress bar that displays the progress of resolving the commit info
	const progressBar = new ProgressBar('  Processing Commits: [:bar] :current/:total', {
		complete: '=',
		incomplete: ' ',
		width: 20,
		total: commitInfo.length
	});

	for (let i = 0; i < commitInfo.length; i++) {
		progressBar.tick();
		const info = commitInfo[i];

		// check the labels on issue to set the category
		function checkLabel(label: GitHub.Label) {
			if (label.name === 'breaking-change') {
				info.category = 'breaking';
			}
			if (info.category) {
				return;
			}
			if (label.name === 'enhancement') {
				info.category = 'enhancement';
			}
			else if (label.name === 'bug') {
				info.category = 'fix';
			}
		}

		const commitResolves = info.message.match(RESOLVES_REGEX);
		// if the commit message looks like it is fixing an issue, we will lookup that issue
		if (commitResolves) {
			const [ , resolveOrg, resolveRepo, resolveIssueNumber ] = commitResolves;
			const resolvesIssue = await getIssue(resolveOrg || org, resolveRepo || repo, Number(resolveIssueNumber));
			resolvesIssue.labels.forEach(checkLabel);
		}
		// if we found the PR from the message, look it up
		else if (info.pr) {
			const issue = await getIssue(org, repo, info.pr);
			const resolves = issue.body.match(RESOLVES_REGEX);
			// If it looks like the PR resolves another issue, we will use the labels on that issue
			if (resolves) {
				const [ , resolveOrg, resolveRepo, resolveIssueNumber ] = resolves;
				const resolvesIssue = await getIssue(resolveOrg || org, resolveRepo || repo, Number(resolveIssueNumber));
				resolvesIssue.labels.forEach(checkLabel);
			}
			// otherwise we will just look at labels on the PR
			else {
				issue.labels.forEach(checkLabel);
			}
		}
	}

	console.log();

	// Now we create a structure the categorise the changes
	const changes = commitInfo.reduce((changeMap, info) => {
		if (!info.category) {
			changeMap.uncategorized.push(info.message);
		}
		else if (info.category === 'breaking') {
			changeMap.breaking.push(info.message);
		}
		else if (info.category === 'enhancement') {
			changeMap.enhancement.push(info.message);
		}
		else {
			changeMap.fix.push(info.message);
		}
		return changeMap;
	}, {
		breaking: [],
		enhancement: [],
		fix: [],
		uncategorized: []
	} as Changes);

	// Now we will assemble it into the release notes body
	let body = '';
	if (changes.breaking.length) {
		body += `## ⚠️ Breaking Changes\n\n` + changes.breaking.map(parseCommitMessage).join('\n');
	}
	if (changes.fix.length) {
		body += `## ✅ Fixes\n\n` + changes.fix.map(parseCommitMessage).join('\n');
	}
	if (changes.enhancement.length) {
		body += `## 👍 Enhancements\n\n` + changes.enhancement.map(parseCommitMessage).join('\n');
	}
	if (changes.uncategorized.length) {
		body += `<!-- uncategorized -->\n---\n\n` + changes.uncategorized.map(parseCommitMessage).join('\n');
	}

	// create the release on GitHub
	const response = await createRelease(org, repo, {
		tag_name: tag,
		name,
		body,
		draft,
		prerelease: typeof prerelease !== 'undefined' ? prerelease : preReleaseTag ? true : false
	});
	if (isGitHubMessage(response)) {
		// we didn't get a release back, instead something went wrong
		console.error(red(`Could not create release notes: ${response.message}\n`));
		return;
	}
	// let the user know we successfully created the release notes
	console.log(green(`> Created release notes for: ${bold(response.name)}`));
	console.log(`  at: ${response.html_url}\n`);
}
