import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTableOutput,
  formatJsonOutput,
  formatCompactOutput,
  colorizeLanguage,
} from '../src/formatter.js';

const mockData = {
  items: [
    {
      rank: 1,
      name: 'super-ai',
      fullName: 'org/super-ai',
      owner: 'org',
      description: 'An extraordinary AI framework',
      stars: 12500,
      forks: 980,
      language: 'Python',
      url: 'https://github.com/org/super-ai',
      license: 'MIT',
    },
    {
      rank: 2,
      name: 'fast-tool',
      fullName: 'dev/fast-tool',
      owner: 'dev',
      description: 'Blazing fast CLI utility',
      stars: 4320,
      forks: 210,
      language: 'Rust',
      url: 'https://github.com/dev/fast-tool',
      license: 'Apache-2.0',
    },
  ],
  totalCount: 5000,
  duration: 'week',
  sinceDate: '2026-10-03',
  rateLimit: {
    limit: 10,
    remaining: 8,
    resetTime: new Date(Date.now() + 60000),
  },
};

const stripAnsi = (str) => str.replace(/\u001B\[[0-9;]*[a-zA-Z]/g, '');

describe('formatter: colorizeLanguage', () => {
  it('should return gray for Unknown or Plain Text', () => {
    assert.ok(stripAnsi(colorizeLanguage('Unknown')).includes('Unknown'));
    assert.ok(stripAnsi(colorizeLanguage('Plain Text')).includes('Plain Text'));
  });

  it('should format recognized languages', () => {
    assert.ok(stripAnsi(colorizeLanguage('JavaScript')).includes('JavaScript'));
    assert.ok(stripAnsi(colorizeLanguage('Python')).includes('Python'));
    assert.ok(stripAnsi(colorizeLanguage('Rust')).includes('Rust'));
  });
});

describe('formatter: formatTableOutput', () => {
  it('should contain repository names, star counts, and language in output', () => {
    const rawOutput = formatTableOutput(mockData);
    const output = stripAnsi(rawOutput);
    assert.ok(output.includes('org/super-ai'));
    assert.ok(output.includes('12,500 ⭐'));
    assert.ok(output.includes('Python'));
    assert.ok(output.includes('dev/fast-tool'));
    assert.ok(output.includes('4,320 ⭐'));
    assert.ok(output.includes('Rust'));
    assert.ok(output.includes('5,000'));
    assert.ok(output.includes('8/10'));
  });

  it('should show detailed columns when requested', () => {
    const detailed = stripAnsi(formatTableOutput(mockData, { detailed: true }));
    assert.ok(detailed.includes('Forks 🍴'));
    assert.ok(detailed.includes('License'));
    assert.ok(detailed.includes('980 🍴'));
    assert.ok(detailed.includes('MIT'));
  });

  it('should handle empty result set gracefully', () => {
    const emptyData = {
      items: [],
      totalCount: 0,
      duration: 'day',
      sinceDate: '2026-10-09',
    };
    const output = stripAnsi(formatTableOutput(emptyData));
    assert.ok(output.includes('No trending repositories found'));
  });
});

describe('formatter: formatJsonOutput', () => {
  it('should generate valid parseable JSON', () => {
    const jsonStr = formatJsonOutput(mockData);
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.items.length, 2);
    assert.equal(parsed.items[0].name, 'super-ai');
    assert.equal(parsed.items[0].stars, 12500);
  });
});

describe('formatter: formatCompactOutput', () => {
  it('should format compact list', () => {
    const output = stripAnsi(formatCompactOutput(mockData));
    assert.ok(output.includes('1. org/super-ai'));
    assert.ok(output.includes('12,500 ⭐'));
    assert.ok(output.includes('https://github.com/org/super-ai'));
    assert.ok(output.includes('2. dev/fast-tool'));
  });
});
