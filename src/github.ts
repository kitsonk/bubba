import * as process from 'process';
import request from '@dojo/core/request';
import { GitHub } from './interfaces';

/**
 * The URI for the GitHub API
 */
const GITHUB_API_URI = 'https://api.github.com';

/**
 * The GitHub user authorization token to perform the requests on behalf of
 */
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

async function deleteRepo(organization: string, repository: string, command: string, resource: string): Promise<true | GitHub.Message> {
	const response = await request(`${GITHUB_API_URI}/repos/${organization}/${repository}/${command}/${resource}`, {
		headers: {
			'Authorization': `token ${GITHUB_TOKEN}`
		},
		method: 'DELETE'
	});
	if (response.status === 204) {
		return Promise.resolve<true>(true);
	}
	return response.json<GitHub.Message>();
}

/**
 * Get information from GitHub
 * @param organization The GitHub organization/owner to get the information from
 * @param repository The GitHub respository to get the information from
 * @param command The command/path of the information to retrieve
 * @param page The page of information to retrieve (defaults to `1`)
 */
async function getRepo<T>(organization: string, repository: string, command: string, page = 1): Promise<T> {
	return (await request(`${GITHUB_API_URI}/repos/${organization}/${repository}/${command}?page=${page}`, {
		headers: {
			'Authorization': `token ${GITHUB_TOKEN}`
		}
	})).json<T>();
}

/**
 * Patch information to GitHub
 * @param organization The GitHub organization/owner to patch the information to
 * @param repository The GitHub repository to patch the information to
 * @param command The command/path to patch the information to
 * @param body The body (data) to be patched
 */
async function patchRepo<T>(organization: string, repository: string, command: string, body: object): Promise<T> {
	return (await request(`${GITHUB_API_URI}/repos/${organization}/${repository}/${command}`, {
		body: JSON.stringify(body),
		headers: {
			'Authorization': `token ${GITHUB_TOKEN}`
		},
		method: 'PATCH'
	})).json<T>();
}

/**
 * Post information to GitHub
 * @param organization The GitHub organization/owner to post the information to
 * @param repository The GitHub repository to post the information to
 * @param command The command/path to post the information to
 * @param body The body (data) to be posted
 */
async function postRepo<T>(organization: string, repository: string, command: string, body: object): Promise<T> {
	return (await request(`${GITHUB_API_URI}/repos/${organization}/${repository}/${command}`, {
		body: JSON.stringify(body),
		headers: {
			'Authorization': `token ${GITHUB_TOKEN}`
		},
		method: 'POST'
	})).json<T>();
}

/**
 * Create an issue label on GitHub
 * @param organization The organization/owner the label belongs to
 * @param repository The repository the label belongs to
 * @param label The label to be created
 */
export function createLabel(organization: string, repository: string, label: GitHub.Post.Label): Promise<GitHub.Label | GitHub.Message> {
	return postRepo(organization, repository, 'labels', label);
}

export function createMilestone(organization: string, repository: string, milestone: GitHub.Post.Milestone): Promise<GitHub.Milestone | GitHub.Message> {
	return postRepo(organization, repository, 'milestones', milestone);
}

/**
 * Create a release (release notes) on GitHub
 * @param organization The organization/owner the release notes belong to
 * @param repository The repository the release notes belong to
 * @param release The release information to be created on GitHub
 */
export function createRelease(organization: string, repository: string, release: GitHub.Post.Release): Promise<GitHub.Release | GitHub.Message> {
	return postRepo(organization, repository, 'releases', release);
}

export function deleteMilestone(organization: string, repository: string, milestone: number): Promise<true | GitHub.Message> {
	return deleteRepo(organization, repository, 'milestones', String(milestone));
}

export function deleteLabel(organization: string, repository: string, label: string): Promise<true | GitHub.Message> {
	return deleteRepo(organization, repository, 'labels', label);
}

/**
 * Retrieve commits for a GitHub repository
 * @param organization The GitHub organization/owner
 * @param repository The GitHub repository
 */
export function getCommits(organization: string, repository: string): Promise<GitHub.RepositoryCommit[]> {
	return getRepo(organization, repository, 'commits');
}

/**
 * Retrieve a comparison between two references on GitHub
 * @param organization The GitHub organization/owner
 * @param repository The GitHub repository
 * @param reference1 The first reference for the comparison
 * @param reference2 The second reference for the comparison
 */
export function getCompare(organization: string, repository: string, reference1: string, reference2: string): Promise<GitHub.Comparison> {
	return getRepo(organization, repository, `compare/${reference1}...${reference2}`);
}

/**
 * Retrieve git tags for a repository on GitHub
 * @param organization The GitHub organization/owner
 * @param repository The GitHub repository
 */
export function getGitRefsTags(organization: string, repository: string): Promise<GitHub.Git.Ref[]> {
	return getRepo(organization, repository, 'git/refs/tags');
}

/**
 * Retrieve the labels for a GitHub repository
 * @param organization The GitHub organization/owner
 * @param repository The GitHub repository
 */
export function getLabels(organization: string, repository: string): Promise<GitHub.Label[]> {
	return getRepo(organization, repository, 'labels');
}

/**
 * Retrieve the milestones for a GitHub repository
 * @param organization The GitHub organization/owner
 * @param repository The GitHub repository
 */
export function getMilestones(organization: string, repository: string): Promise<GitHub.Milestone[]> {
	return getRepo(organization, repository, 'milestones');
}

export function getIssue(organization: string, repository: string, issue: number): Promise<GitHub.Issue> {
	return getRepo(organization, repository, `issues/${issue}`);
}

/**
 * Retrieve the releases for a GitHub repository
 * @param organization The GitHub organization/owner
 * @param repository The GitHub repository
 */
export function getReleases(organization: string, repository: string, page = 1): Promise<GitHub.Release[]> {
	return getRepo(organization, repository, 'releases', page);
}

/**
 * Retrieve tags for a GitHub repository
 * @param organization The GitHub organization/owner
 * @param repository The GitHub repository
 * @param page The page of results (defaults to `1`)
 */
export function getTags(organization: string, repository: string, page = 1): Promise<GitHub.Tag[]> {
	return getRepo(organization, repository, 'tags', page);
}

/**
 * A type guard that determines if the `value` is a `GitHub.Message` or not
 * @param value The value to check
 */
export function isGitHubMessage(value: any): value is GitHub.Message {
	return value && typeof value.message === 'string';
}

/**
 * Update an issue label on GitHub
 * @param organization The organization/owner the label belongs to
 * @param repository The repository the label belongs to
 * @param name The name of the label to update
 * @param label The label to be updated
 */
export function updateLabel(organization: string, repository: string, name: string, label: GitHub.Post.Label): Promise<GitHub.Label | GitHub.Message> {
	return patchRepo(organization, repository, `labels/${name}`, label);
}

/**
 * Update a milestone on GitHub
 * @param organization The organization/owner the milestone belongs to
 * @param repository The repository the milestone belongs to
 * @param id The ID number of the milestone to update
 * @param milestone The milestone to be updated
 */
export function updateMilestone(organization: string, repository: string, id: number, milestone: Partial<GitHub.Post.Milestone>): Promise<GitHub.Milestone | GitHub.Message> {
	return patchRepo(organization, repository, `milestones/${id}`, milestone);
}
