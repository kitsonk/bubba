import chalk from 'chalk';
import { Arguments, CommandBuilder } from 'yargs';
import { deleteLabel, isGitHubMessage } from '../../github';
import { Bubba, GitHub } from '../../interfaces';

const { green, red } = chalk;

interface DeleteLabelArguments extends Arguments {
	label: string;
}

const DOJO2_REPOS = '../../../data/dojo2-repositories.json';

export const command = 'label <label>';

export const describe = 'delete a label with the supplied title\n\nby default this will delete the label across Dojo 2 repos';

export const builder: CommandBuilder = function (yargs) {
	return yargs
		.example('$0 delete label foo', 'deletes a label with the title of "foo" across Dojo 2 repos');
};

export async function handler({ description, due, state, label }: DeleteLabelArguments) {
	console.log(`- Deleting label: ${label}\n`);
	const repoSet: Bubba.Repositories = require(DOJO2_REPOS);
	const promises: Promise<true | GitHub.Message>[] = [];
	const repos: { org: string, repo: string }[] = [];
	for (const org in repoSet) {
		repoSet[org].forEach((repo) => {
			repos.push({ org, repo });
			promises.push(deleteLabel(org, repo, label));
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
			console.log(green(`> Deleted on "${org}/${repo}"`));
		}
	});
	console.log();
}
