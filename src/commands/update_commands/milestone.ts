import chalk from 'chalk';
import * as moment from 'moment';
import { Arguments, CommandBuilder } from 'yargs';
import { getMilestones, updateMilestone, isGitHubMessage } from '../../github';
import { Bubba, GitHub } from '../../interfaces';

const { green, red, yellow } = chalk;

interface UpdateMilestoneArguments extends Arguments {
	title: string;
	state?: 'open' | 'closed';
	description?: string;
	due?: string;
}

const DOJO2_REPOS = '../../../data/dojo2-repositories.json';

export const command = 'milestone <title> [options]';

export const describe =
	'update a milestone with the supplied title\n\nby default this will update the milestone across Dojo 2 repos';

export const builder: CommandBuilder = function(yargs) {
	return yargs
		.example(
			'$0 update milestone foo --due 2017-12-01',
			'updates a milestone named "foo" with a due data of 1st Dec 2017'
		)
		.example(
			'$0 update milestone foo --description "Foo bar baz"',
			'updates a milestone named "foo" with a description of "Foo bar baz"'
		)
		.options({
			description: {
				alias: 'desc',
				type: 'string'
			},
			due: {
				type: 'string'
			},
			state: {
				type: 'string'
			}
		})
		.check((args) => {
			const { due, state } = args as UpdateMilestoneArguments;
			if (state && !(state === 'open' || state === 'closed')) {
				throw new Error('--state must be either "open" or "closed"\n');
			}
			if (due && !moment(due).isValid()) {
				throw new Error('<due> is not a valid date\n');
			}
			return true;
		});
};

export async function handler({ description, due, state, title }: UpdateMilestoneArguments) {
	console.log(`- Updating milestone: ${title}\n`);
	const milestone: Partial<GitHub.Post.Milestone> = {
		title
	};
	if (description) {
		milestone.description = description;
	}
	if (due) {
		milestone.due_on = moment(due).toISOString();
	}
	if (state) {
		milestone.state = state;
	}
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
	const updatePromises: Promise<GitHub.Milestone | GitHub.Message>[] = [];
	const updateRepos: { org: string; repo: string }[] = [];
	milestoneNumbers.forEach((milestoneNumber, idx) => {
		const { org, repo } = repos[idx];
		if (typeof milestoneNumber === 'undefined') {
			console.log(yellow(`> Not found on "${org}/${repo}"`));
		} else {
			updatePromises.push(updateMilestone(org, repo, milestoneNumber, milestone));
			updateRepos.push({ org, repo });
		}
	});
	(await Promise.all(updatePromises)).forEach((result, idx) => {
		const { org, repo } = updateRepos[idx];
		if (isGitHubMessage(result)) {
			console.log(red(`> Failed on "${org}/${repo}" with "${result.message}"`));
			if (result.errors) {
				result.errors.forEach((err) =>
					console.log(
						red(`  Error: { resource: "${err.resource}", core: "${err.code}", field: "${err.field}" }`)
					)
				);
			}
		} else {
			console.log(green(`> Updated on "${org}/${repo}"`));
		}
	});
	console.log();
}
