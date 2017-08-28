import { Arguments, CommandBuilder } from 'yargs';
import { getReleases, getTags } from '../github';

interface TagsArguments extends Arguments {
	org: string;
	repo: string;
}

export const command = 'tags <repo>';

export const describe = 'list the tags currently available for a repository';

export const builder: CommandBuilder = {
	'org': {
		describe: 'the GitHub organization',
		default: 'dojo',
		type: 'string'
	}
};

export async function handler({ org, repo }: TagsArguments) {
	console.log(`- Fetching tags for: ${org}/${repo}\n`);
	const tags = await getTags(org, repo);
	const releases = await getReleases(org, repo);
	const releaseTags = releases.map((release) => release.tag_name);
	tags.forEach((tag) => {
		console.log(tag.name, releaseTags.includes(tag.name) ? '[released]' : '');
	});
	console.log();
}
