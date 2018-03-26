import { Arguments, CommandBuilder } from 'yargs';
import { getReleases, getTags } from '../github';
import { GitHub } from '../interfaces';

interface TagsArguments extends Arguments {
	org: string;
	repo: string;
}

export const command = 'tags <repo>';

export const describe = 'list the tags currently available for a repository';

export const builder: CommandBuilder = {
	org: {
		describe: 'the GitHub organization',
		default: 'dojo',
		type: 'string'
	}
};

export async function handler({ org, repo }: TagsArguments) {
	console.log(`- Fetching tags for: ${org}/${repo}\n`);
	let page = 1;
	let tags: GitHub.Tag[] = [];
	let response: any[] = await getTags(org, repo, page);
	while (response.length) {
		tags = [...tags, ...response];
		response = await getTags(org, repo, ++page);
	}
	let releases: GitHub.Release[] = [];
	page = 1;
	response = await getReleases(org, repo, page);
	while (response.length) {
		releases = [...releases, ...response];
		response = await getTags(org, repo, ++page);
	}
	const releaseTags = releases.map((release) => release.tag_name);
	tags.forEach((tag) => {
		console.log(tag.name, releaseTags.includes(tag.name) ? '[released]' : '');
	});
	console.log();
}
