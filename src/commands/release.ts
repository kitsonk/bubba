import { Arguments, CommandBuilder } from 'yargs';
import { bold, green, red } from 'chalk';
import { createRelease, getCompare, getTags, isGitHubMessage } from '../github';

interface ReleaseArguments extends Arguments {
	draft: boolean;
	from?: string;
	org: string;
	prerelease?: boolean;
	repo: string;
	tag: string;
}

/**
 * A preamble for the release notes
 */
const RELEASE_NOTE_PREAMBLE = `## Breaking Changes

## New Features

## Fixes

`;

function initialCap(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
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
	const tags = (await getTags(org, repo)).map(({ name, commit: { sha }}) => {
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
	// generate the body of the release notes
	const body = messages.reduce((releaseNotes, message) => {
		const [ firstLine, ...lines ] = message.split(/\r?\n/);
		let details = '\n';
		if (lines.length) {
			details += `  <details><summary>Details</summary>\n  ${lines.join('\n  ')}\n  </details>\n`;
		}
		return releaseNotes + '* ' + firstLine + details + '\n';
	}, RELEASE_NOTE_PREAMBLE);

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
