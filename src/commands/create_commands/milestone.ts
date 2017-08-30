import { green, red } from 'chalk';
import * as moment from 'moment';
import { Arguments, CommandBuilder } from 'yargs';
import { createMilestone, isGitHubMessage } from '../../github';
import { Bubba, GitHub } from '../../interfaces';

interface CreateMilestoneArguments extends Arguments {
	title: string;
	state: 'open' | 'closed';
	description: string;
	due: string;
}

const DOJO2_REPOS = '../../../data/dojo2-repositories.json';

export const command = 'milestone <title> <due> [options]';

export const describe = 'create a milestone with the supplied title, and due date\n\nby default this will create the milestone across Dojo 2 repos';

export const builder: CommandBuilder = function (yargs) {
	return yargs
		.example('$0 create milestone foo 2017-12-01', 'creates a milestone named "foo" with a due data of 1st Dec 2017')
		.options({
			'description': {
				alias: 'desc',
				default: '',
				type: 'string'
			},
			'state': {
				default: 'open',
				type: 'string'
			}
		})
		.check(({ due, state }: CreateMilestoneArguments) => {
			if (!(state === 'open' || state === 'closed')) {
				throw new Error('--state must be either "open" or "closed"\n');
			}
			if (!moment(due).isValid()) {
				throw new Error('<due> is not a valid date\n');
			}
			return true;
		});
};

export async function handler({ description, due, state, title}: CreateMilestoneArguments) {
	console.log(`- Creating milestone: ${title}\n`);
	const milestone = {
		title,
		state,
		description,
		due_on: moment(due).toISOString()
	};
	const repoSet: Bubba.Repositories = require(DOJO2_REPOS);
	const promises: Promise<GitHub.Milestone | GitHub.Message>[] = [];
	const repos: { org: string, repo: string }[] = [];
	for (const org in repoSet) {
		repoSet[org].forEach((repo) => {
			repos.push({ org, repo });
			promises.push(createMilestone(org, repo, milestone));
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
