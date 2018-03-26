/**
 * Interfaces internally for bubba
 */
export namespace Bubba {
	/**
	 * The schema for repository JSON
	 */
	interface Repositories {
		[org: string]: string[];
	}
}

/**
 * Interfaces for objects on GitHub
 */
export namespace GitHub {
	interface Asset {
		url: string;
		browser_download_url: string;
		id: number;
		name: string;
		label: string;
		state: string;
		content_type: string;
		size: number;
		download_count: number;
		created_at: string;
		updated_at: string;
		uploader: Person;
	}

	interface Commit {
		url: string;
		author: {
			name: string;
			email: string;
			date: string;
		};
		committer: {
			name: string;
			email: string;
			date: string;
		};
		message: string;
		tree: {
			url: string;
			sha: string;
		};
		comment_count: number;
		verification: {
			verified: boolean;
			reason: string;
			signature: string;
			payload: string;
		};
	}

	interface CommitFile {
		sha: string;
		filename: string;
		status: string;
		additions: number;
		deletions: number;
		changes: number;
		raw_url: string;
		blob_url: string;
		contents_url: string;
		patch: string;
	}

	interface Comparison {
		url: string;
		html_url: string;
		permalink_url: string;
		diff_url: string;
		patch_url: string;
		base_commit: Commit;
		merge_base_commit: Commit;
		status: string;
		ahead_by: number;
		behind_by: number;
		total_commits: number;
		commits: {
			sha: string;
			commit: Commit;
		}[];
		files: CommitFile[];
	}

	interface Error {
		resource: string;
		code: string;
		field: string;
	}

	interface Issue {
		id: number;
		url: string;
		repository_url: string;
		labels_url: string;
		comments_url: string;
		events_url: string;
		html_url: string;
		number: number;
		state: string;
		title: string;
		body: string;
		user: Person;
		labels: Label[];
		assignee: Person;
		assignees: Person[];
		milestone: Milestone;
		locked: boolean;
		comments: number;
		pull_request?: {
			url: string;
			html_url: string;
			diff_url: string;
			patch_url: string;
		};
		closed_at: string | null;
		created_at: string;
		updated_at: string | null;
		closed_by: Person | null;
	}

	interface Label {
		id: number;
		url: string;
		name: string;
		color: string;
		default: boolean;
	}

	interface Message {
		message: string;
		errors?: Error[];
		documentation_url: string;
	}

	interface Milestone {
		url: string;
		html_url: string;
		labels_url: string;
		id: number;
		number: number;
		state: 'open' | 'closed';
		title: string;
		description: string;
		creator: Person;
		open_issues: number;
		closed_issues: number;
		create_at: string;
		updated_at: string;
		closed_at: string;
		due_on: string;
	}

	interface NotFoundMessage extends Message {
		message: 'Not Found';
	}

	interface Person {
		login: string;
		id: number;
		avatar_url: string;
		gravatar_id: string;
		url: string;
		html_url: string;
		followers_url: string;
		following_url: string;
		gists_url: string;
		starred_url: string;
		subscriptions_url: string;
		organizations_url: string;
		repos_url: string;
		events_url: string;
		received_events_url: string;
		type: string;
		site_admin: boolean;
	}

	interface Release {
		url: string;
		html_url: string;
		assets_url: string;
		upload_url: string;
		tarball_url: string;
		zipball_url: string;
		id: number;
		tag_name: string;
		target_commitish: string;
		name: string;
		body: string;
		draft: boolean;
		prerelease: boolean;
		created_at: string;
		published_at: string;
		author: Person;
		assets: Asset[];
	}

	interface RepositoryCommit {
		url: string;
		sha: string;
		html_url: string;
		comments_url: string;
		commit: Commit;
		author: Person;
		committer: Person;
		parents: { url: string; sha: string }[];
		stats: {
			additions: number;
			deletions: number;
			total: number;
		};
		files: CommitFile[];
	}

	interface Tag {
		name: string;
		zipball_url: string;
		tarball_url: string;
		commit: {
			sha: string;
			url: string;
		};
	}

	/**
	 * Interfaces for git objects on GitHub
	 */
	namespace Git {
		interface Ref {
			ref: string;
			url: string;
			object: {
				sha: string;
				type: string;
				url: string;
			};
		}

		interface Tag {
			tag: string;
			sha: string;
			url: string;
			message: string;
			tagger: {
				name: string;
				email: string;
				date: string;
			};
			object: {
				type: string;
				sha: string;
				url: string;
			};
		}
	}

	/**
	 * Interfaces for creating or posting objects on GitHub
	 */
	namespace Post {
		interface Label {
			name: string;
			color: string;
		}

		interface Milestone {
			title: string;
			state?: 'open' | 'closed';
			description?: string;
			due_on?: string;
		}

		interface Release {
			tag_name: string;
			target_commitish?: string;
			name: string;
			body: string;
			draft?: boolean;
			prerelease?: boolean;
		}
	}
}
