export interface FetchGithubCommitsInput {
  accessToken: string;
  owner: string;
  repo: string;
  limit?: number;
}

export interface FetchGithubPullRequestsInput {
  accessToken: string;
  owner: string;
  repo: string;
  limit?: number;
}

export interface FetchRepoFileInput {
  accessToken: string;
  owner: string;
  repo: string;
  path: string;
}

export interface DetectRepoTechStackInput {
  accessToken: string;
  owner: string;
  repo: string;
}

// GitHub API Commit Response
export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
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
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
  } | null;
  committer: {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
  } | null;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

// GitHub API Pull Request Response
export interface GitHubPullRequest {
  url: string;
  id: number;
  node_id: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  number: number;
  state: 'open' | 'closed';
  locked: boolean;
  title: string;
  user: {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
  };
  body: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  assignee: {
    login: string;
    id: number;
  } | null;
  assignees: Array<{
    login: string;
    id: number;
  }>;
  requested_reviewers: Array<{
    login: string;
    id: number;
  }>;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  milestone: {
    id: number;
    number: number;
    title: string;
    description: string | null;
    state: 'open' | 'closed';
  } | null;
  draft: boolean;
  commits_url: string;
  review_comments_url: string;
  comments_url: string;
  statuses_url: string;
  head: {
    label: string;
    ref: string;
    sha: string;
    user: {
      login: string;
      id: number;
    };
    repo: {
      id: number;
      name: string;
      full_name: string;
    } | null;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    user: {
      login: string;
      id: number;
    };
    repo: {
      id: number;
      name: string;
      full_name: string;
    };
  };
  _links: {
    self: { href: string };
    html: { href: string };
    issue: { href: string };
    comments: { href: string };
    review_comments: { href: string };
    commits: { href: string };
    statuses: { href: string };
  };
  author_association: string;
  auto_merge: any | null;
  active_lock_reason: string | null;
}
