'use client';

import { useState, useEffect } from "react";
import { Heading } from "@/components/heading";
import { ApplicationLayout } from "@/app/application-layout";
import { Text } from "@/components/text";

type GitHubIssue = {
  number: number;
  title: string;
  closed_at: string;
  html_url: string;
  labels: Array<{ name: string; color: string }>;
  body: string | null;
};

export default function ChangelogPage() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const GITHUB_REPO = "dionsnoeijen/polysynergy";

  useEffect(() => {
    const fetchGitHubIssues = async () => {
      try {
        // First try with 'completed' label
        let response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/issues?state=closed&labels=completed&sort=closed&direction=desc&per_page=50`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              // Optional: Add GitHub token for higher rate limits
              // 'Authorization': `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.statusText}`);
        }

        let data: GitHubIssue[] = await response.json();

        // If no issues found with 'completed' label, try all closed issues
        if (data.length === 0) {
          setDebugInfo('No issues found with "completed" label. Showing all closed issues instead.');

          response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/issues?state=closed&sort=closed&direction=desc&per_page=50`,
            {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
              }
            }
          );

          if (response.ok) {
            data = await response.json();
          }
        }

        // Filter out pull requests (they also appear in issues endpoint)
        const issuesOnly = data.filter(issue => !('pull_request' in issue));

        setIssues(issuesOnly);
      } catch (err) {
        console.error('Failed to fetch GitHub issues:', err);
        setError(err instanceof Error ? err.message : 'Failed to load changelog');
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubIssues();
  }, []);

  // Group issues by month
  const groupedIssues = issues.reduce((acc, issue) => {
    const date = new Date(issue.closed_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: monthLabel,
        issues: []
      };
    }

    acc[monthKey].issues.push(issue);
    return acc;
  }, {} as Record<string, { label: string; issues: GitHubIssue[] }>);

  if (loading) {
    return (
      <ApplicationLayout>
        <Heading>Changelog</Heading>
        <div className="mt-6">
          <Text>Loading changelog from GitHub...</Text>
        </div>
      </ApplicationLayout>
    );
  }

  if (error) {
    return (
      <ApplicationLayout>
        <Heading>Changelog</Heading>
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <Text className="text-red-600 dark:text-red-400">
            {error}
          </Text>
          <Text className="text-sm text-red-500 dark:text-red-300 mt-2">
            Make sure to update the GITHUB_REPO constant in the code.
          </Text>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout>
      <div className="mx-auto max-w-4xl p-10">
        <Heading>Changelog</Heading>
        <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
          Recent completed issues and improvements from GitHub
        </Text>

        {/* Debug info */}
        {debugInfo && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Text className="text-sm text-yellow-700 dark:text-yellow-300">
              {debugInfo}
            </Text>
          </div>
        )}

        <div className="mt-8 space-y-12">
          {Object.entries(groupedIssues).map(([monthKey, { label, issues: monthIssues }]) => (
            <section key={monthKey}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
                {label}
              </h2>

              <div className="space-y-6">
                {monthIssues.map((issue) => (
                  <div
                    key={issue.number}
                    className="border-l-4 border-sky-500 dark:border-sky-400 pl-4 py-2"
                  >
                    <div className="flex items-start gap-3">
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-base font-medium text-zinc-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                      >
                        {issue.title}
                        <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                          #{issue.number}
                        </span>
                      </a>
                    </div>

                    {/* Labels */}
                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {issue.labels.map((label) => (
                          <span
                            key={label.name}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `#${label.color}20`,
                              color: `#${label.color}`,
                              borderColor: `#${label.color}40`,
                              borderWidth: '1px'
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Issue body preview */}
                    {issue.body && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {issue.body}
                      </p>
                    )}

                    {/* Closed date */}
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      Completed on {new Date(issue.closed_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {issues.length === 0 && (
          <div className="mt-8 text-center">
            <Text className="text-zinc-500 dark:text-zinc-400">
              No completed issues found
            </Text>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
