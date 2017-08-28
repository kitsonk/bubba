import { green, red } from 'chalk';
import { Arguments, CommandBuilder } from 'yargs';
import { createLabel, isGitHubMessage } from '../../github';
import { Bubba, GitHub } from '../../interfaces';

interface CreateTagArguments extends Arguments {
	name: string;
	color: string;
	set?: string;
	repo?: string;
}

const DOJO2_REPOS = '../../../data/dojo2-repositories.json';

export const command = 'label <name> <color> [options]';

export const describe = 'create a label with the supplied name, color, and description\n\nby default this will create the label across Dojo 2 repos';

export const builder: CommandBuilder = function (yargs) {
	return yargs
		.example('$0 create label foo-bar cccccc', 'creates a label name "foo-bar" for all Dojo 2 repositories')
		.options({
			'set': {
				describe: 'specify a JSON file that contains the set of repositories to create the labels for, defaults to a built in set of Dojo 2 repositories',
				type: 'string'
			},
			'repo': {
				describe: 'create the label on a specified repository',
				type: 'string'
			}
		})
		.check(({ color }: CreateTagArguments) => {
			if (!color.match(/^[a-fA-F0-9]{6}$/)) {
				throw new Error('<color> must be specified as a 6-digit hex value\n');
			}
			return true;
		});
};

export async function handler({ name, color }: CreateTagArguments) {
	console.log(`- Creating label: ${name}\n`);
	const label = { name, color };
	const repoSet: Bubba.Repositories = require(DOJO2_REPOS);
	const promises: Promise<GitHub.Label | GitHub.Message>[] = [];
	const repos: { org: string, repo: string }[] = [];
	for (const org in repoSet) {
		repoSet[org].forEach((repo) => {
			repos.push({ org, repo });
			promises.push(createLabel(org, repo, label));
		});
	}
	const results = await Promise.all(promises);
	results.forEach((result, idx) => {
		const { org, repo } = repos[idx];
		if (isGitHubMessage(result)) {
			console.log(red(`> Failed on "${org}/${repo}" with "${result.message}"`));
			if (result.errors) {
				result.errors.forEach((err) => console.log(red(`  Error: { resource: "${err.resource}", core: "${err.code}", field: "${err.field}" }`)));
			}
		}
		else {
			console.log(green(`> Created on "${org}/${repo}"`));
		}
	});
	console.log();
}
