import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GitHubApiError } from '../src/api.js';

describe('api: GitHubApiError', () => {
  it('should instantiate with proper error metadata', () => {
    const resetTime = new Date();
    const err = new GitHubApiError('Rate limit exceeded', {
      status: 403,
      rateLimitReset: resetTime,
      isRateLimit: true,
      documentationUrl: 'https://docs.github.com/rest',
    });

    assert.equal(err.name, 'GitHubApiError');
    assert.equal(err.message, 'Rate limit exceeded');
    assert.equal(err.status, 403);
    assert.equal(err.rateLimitReset, resetTime);
    assert.equal(err.isRateLimit, true);
    assert.equal(err.documentationUrl, 'https://docs.github.com/rest');
  });

  it('should default optional properties when not provided', () => {
    const err = new GitHubApiError('Standard error');
    assert.equal(err.message, 'Standard error');
    assert.equal(err.status, undefined);
    assert.equal(err.isRateLimit, false);
  });
});
