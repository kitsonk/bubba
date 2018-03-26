import chalk from 'chalk';
import { Arguments, CommandBuilder } from 'yargs';
import { deleteMilestone, getMilestones } from '../../github';
import { Bubba, GitHub } from '../../interfaces';

const { green, red, yellow } = chalk;

interface DeleteMilestoneArguments extends Arguments {
	title: string;
}

const DOJO2_REPOS = '../../../data/dojo2-repositories.json';

export const command = 'milestone <title>';

export const describe =
	'delete a milestone with the supplied title\n\nby default this will delete the milestone across Dojo 2 repos';

export const builder: CommandBuilder = function(yargs) {
	return yargs.example('$0 delete milestone foo', 'deletes a milestone with the title of "foo" across Dojo 2 repos');
};

export async function handler({ description, due, state, title }: DeleteMilestoneArguments) {
	console.log(`- Deleting milestone: ${title}\n`);
	const repoSet: Bubba.Repositories = require(DOJO2_REPOS);
	const promises: Promise<GitHub.Milestone[]>[] = [];
	const repos: { org: string; repo: string }[] = [];
	for (const org in repoSet) {
		repoSet[org].forEach((repo) => {
			repos.push({ org, repo });
			promises.push(getMilestones(org, repo));
		});
	}
	const milestoneMaps = (await Promise.all(promises)).map(
		(response) => new Map(response.map(({ title, number: num }): [string, number] => [title, num]))
	);
	const milestoneNumbers = milestoneMaps.map((milestoneMap) => milestoneMap.get(title));
	const deletePromises: Promise<true | GitHub.Message>[] = [];
	const deleteRepos: { org: string; repo: string }[] = [];
	milestoneNumbers.forEach((milestoneNumber, idx) => {
		const { org, repo } = repos[idx];
		if (typeof milestoneNumber === 'undefined') {
			console.log(yellow(`> Not found on "${org}/${repo}"`));
		} else {
			deletePromises.push(deleteMilestone(org, repo, milestoneNumber));
			deleteRepos.push({ org, repo });
		}
	});
	(await Promise.all(deletePromises)).forEach((result, idx) => {
		const { org, repo } = deleteRepos[idx];
		if (result !== true) {
			console.log(red(`> Failed on "${org}/${repo}" with "${result.message}"`));
			if (result.errors) {
				result.errors.forEach((err) =>
					console.log(
						red(`  Error: { resource: "${err.resource}", core: "${err.code}", field: "${err.field}" }`)
					)
				);
			}
		} else {
			console.log(green(`> Deleted on "${org}/${repo}"`));
		}
	});
	console.log();
}
