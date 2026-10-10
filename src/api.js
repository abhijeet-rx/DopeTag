/**
 * GitHub REST API Client for fetching trending repositories
 */

import { calculateSinceDate, validateLimit } from './utils.js';

const GITHUB_API_URL = 'https://api.github.com/search/repositories';

/**
 * Custom error class for GitHub API errors with rate-limit and status metadata
 */
export class GitHubApiError extends Error {
  constructor(message, { status, rateLimitReset, documentationUrl, isRateLimit = false } = {}) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.rateLimitReset = rateLimitReset;
    this.documentationUrl = documentationUrl;
    this.isRateLimit = isRateLimit;
  }
}

/**
 * Fetches trending repositories from the GitHub Search API
 *
 * @param {Object} options
 * @param {string} [options.duration='week'] - Time range: day, week, month, year
 * @param {number} [options.limit=10] - Number of repositories to return
 * @param {string} [options.language] - Optional language filter (e.g. javascript, python)
 * @param {string} [options.token] - Optional GitHub personal access token
 * @param {number} [options.timeout=10000] - Request timeout in milliseconds
 * @returns {Promise<{ items: Array, totalCount: number, rateLimit: Object, sinceDate: string }>}
 */
export async function fetchTrendingRepositories({
  duration = 'week',
  limit = 10,
  language = null,
  token = null,
  timeout = 10000,
} = {}) {
  const validLimit = validateLimit(limit);
  const sinceDate = calculateSinceDate(duration);

  // Build GitHub search query
  // Example: created:>2026-10-03 language:javascript
  let query = `created:>${sinceDate}`;
  if (language && typeof language === 'string' && language.trim()) {
    query += ` language:${language.trim()}`;
  }

  const searchParams = new URLSearchParams({
    q: query,
    sort: 'stars',
    order: 'desc',
    per_page: String(validLimit),
  });

  const url = `${GITHUB_API_URL}?${searchParams.toString()}`;

  // Headers
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'trending-repos-cli/1.0.0',
  };

  const authToken = token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken.trim()}`;
  }

  // Create AbortController for network timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new GitHubApiError(`Request timed out after ${timeout / 1000} seconds. Please check your internet connection.`, {
        status: 408,
      });
    }
    throw new GitHubApiError(`Network error while connecting to GitHub API: ${err.message}`, {
      status: 0,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  // Rate limit header information
  const rateLimitHeader = response.headers.get('x-ratelimit-limit');
  const rateLimitRemainingHeader = response.headers.get('x-ratelimit-remaining');
  const rateLimitResetHeader = response.headers.get('x-ratelimit-reset');

  const rateLimit = {
    limit: rateLimitHeader ? parseInt(rateLimitHeader, 10) : null,
    remaining: rateLimitRemainingHeader ? parseInt(rateLimitRemainingHeader, 10) : null,
    resetTime: rateLimitResetHeader ? new Date(parseInt(rateLimitResetHeader, 10) * 1000) : null,
  };

  // Handle non-OK HTTP status codes
  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      // response body was not json
    }

    const message = errorData.message || response.statusText || `HTTP ${response.status}`;
    const isRateLimit =
      response.status === 403 &&
      (message.toLowerCase().includes('rate limit') || rateLimit.remaining === 0);

    if (isRateLimit) {
      let resetInfo = '';
      if (rateLimit.resetTime) {
        const secondsRemaining = Math.max(
          0,
          Math.round((rateLimit.resetTime.getTime() - Date.now()) / 1000)
        );
        resetInfo = ` Reset in ~${secondsRemaining}s (${rateLimit.resetTime.toLocaleTimeString()}).`;
      }

      throw new GitHubApiError(
        `GitHub API rate limit exceeded.${resetInfo}\n` +
          'Tip: GitHub permits 10 search queries/min for unauthenticated requests. ' +
          'To increase this to 30/min, pass a token via --token <token> or set the GITHUB_TOKEN environment variable.',
        {
          status: response.status,
          rateLimitReset: rateLimit.resetTime,
          documentationUrl: errorData.documentation_url,
          isRateLimit: true,
        }
      );
    }

    if (response.status === 422) {
      throw new GitHubApiError(
        `GitHub API validation error: ${message}. Check query parameters (e.g. language).`,
        {
          status: 422,
          documentationUrl: errorData.documentation_url,
        }
      );
    }

    throw new GitHubApiError(`GitHub API error (${response.status}): ${message}`, {
      status: response.status,
      documentationUrl: errorData.documentation_url,
    });
  }

  // Parse JSON response
  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new GitHubApiError(`Failed to parse GitHub API JSON response: ${err.message}`, {
      status: response.status,
    });
  }

  // Parse and map items
  const items = (data.items || []).map((repo, index) => ({
    rank: index + 1,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner ? repo.owner.login : '',
    ownerAvatar: repo.owner ? repo.owner.avatar_url : '',
    description: repo.description || 'No description provided.',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language || 'Plain Text',
    url: repo.html_url,
    homepage: repo.homepage || '',
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    openIssues: repo.open_issues_count,
    topics: repo.topics || [],
    license: repo.license ? repo.license.spdx_id || repo.license.name : 'None',
  }));

  return {
    items,
    totalCount: data.total_count || 0,
    rateLimit,
    sinceDate,
    duration,
  };
}
