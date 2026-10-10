/**
 * Terminal output formatting for trending repositories
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { formatNumber, truncate } from './utils.js';

/**
 * Returns a chalk-colorized language badge
 * @param {string} lang
 * @returns {string}
 */
export function colorizeLanguage(lang) {
  if (!lang || lang === 'Unknown' || lang === 'Plain Text') {
    return chalk.gray(lang || 'Unknown');
  }

  const l = lang.toLowerCase();
  switch (l) {
    case 'javascript':
      return chalk.yellow(lang);
    case 'typescript':
      return chalk.blueBright(lang);
    case 'python':
      return chalk.greenBright(lang);
    case 'rust':
      return chalk.redBright(lang);
    case 'go':
      return chalk.cyan(lang);
    case 'c++':
    case 'c':
      return chalk.magentaBright(lang);
    case 'c#':
      return chalk.green(lang);
    case 'java':
      return chalk.red(lang);
    case 'ruby':
      return chalk.redBright(lang);
    case 'php':
      return chalk.blue(lang);
    case 'swift':
      return chalk.yellow(lang);
    case 'kotlin':
      return chalk.magenta(lang);
    case 'dart':
      return chalk.cyanBright(lang);
    case 'html':
      return chalk.red(lang);
    case 'css':
      return chalk.blue(lang);
    case 'shell':
      return chalk.green(lang);
    case 'lean':
      return chalk.hex('#3b82f6')(lang);
    default:
      return chalk.whiteBright(lang);
  }
}

/**
 * Renders repositories in a table format
 * @param {Object} data
 * @param {Array} data.items - Repositories
 * @param {number} data.totalCount - Total repositories found
 * @param {string} data.duration - Duration used
 * @param {string} data.sinceDate - Start date
 * @param {Object} [data.rateLimit] - GitHub rate limit details
 * @param {Object} [options]
 * @param {boolean} [options.detailed=false]
 * @returns {string}
 */
export function formatTableOutput(data, options = {}) {
  const { items, totalCount, duration, sinceDate, rateLimit } = data;
  const detailed = !!options.detailed;

  if (!items || items.length === 0) {
    return (
      '\n' +
      chalk.yellow('⚠️  No trending repositories found for the specified criteria.') +
      '\n' +
      chalk.gray(`Duration: past ${duration} (since ${sinceDate})\n`)
    );
  }

  const output = [];

  // Header banner
  output.push('');
  output.push(
    chalk.bold.hex('#F59E0B')('🌟 Trending GitHub Repositories') +
      chalk.gray('  |  ') +
      chalk.cyan(`Duration: `) +
      chalk.bold.white(duration.toUpperCase()) +
      chalk.gray(` (created since ${sinceDate})`)
  );
  if (options.language) {
    output.push(chalk.cyan(`Language Filter: `) + chalk.bold.yellow(options.language));
  }
  output.push(chalk.gray(`Showing top ${items.length} repositories sorted by star count`));
  output.push('');

  // Table columns definition
  let head;
  let colWidths;

  if (detailed) {
    head = [
      chalk.cyan('#'),
      chalk.cyan('Repository'),
      chalk.cyan('Stars ⭐'),
      chalk.cyan('Forks 🍴'),
      chalk.cyan('Language'),
      chalk.cyan('License'),
      chalk.cyan('Description'),
    ];
    colWidths = [4, 28, 12, 11, 14, 10, 36];
  } else {
    head = [
      chalk.cyan('#'),
      chalk.cyan('Repository'),
      chalk.cyan('Stars ⭐'),
      chalk.cyan('Language'),
      chalk.cyan('Description & URL'),
    ];
    colWidths = [4, 28, 13, 14, 52];
  }

  const table = new Table({
    head,
    colWidths,
    wordWrap: true,
    style: {
      head: [],
      border: ['gray'],
      compact: false,
    },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
  });

  items.forEach((repo) => {
    const rankStr = chalk.gray(String(repo.rank));
    const nameStr = chalk.bold.white(repo.fullName);
    const starsStr = chalk.yellow(`${formatNumber(repo.stars)} ⭐`);
    const langStr = colorizeLanguage(repo.language);

    if (detailed) {
      const forksStr = chalk.gray(`${formatNumber(repo.forks)} 🍴`);
      const licenseStr = chalk.gray(repo.license || 'None');
      const descStr = `${repo.description}\n${chalk.dim.underline(repo.url)}`;
      table.push([rankStr, nameStr, starsStr, forksStr, langStr, licenseStr, descStr]);
    } else {
      const descAndUrl = `${repo.description}\n${chalk.dim.underline(repo.url)}`;
      table.push([rankStr, nameStr, starsStr, langStr, descAndUrl]);
    }
  });

  output.push(table.toString());
  output.push('');

  // Summary footer
  const totalFormatted = formatNumber(totalCount);
  output.push(
    chalk.gray(`📊 Total matching repositories created in this period: `) +
      chalk.bold.white(totalFormatted)
  );

  if (rateLimit && rateLimit.remaining !== null) {
    const rateColor =
      rateLimit.remaining > 3
        ? chalk.green
        : rateLimit.remaining > 0
          ? chalk.yellow
          : chalk.red;
    output.push(
      chalk.gray(`⏱️  GitHub API search queries remaining: `) +
        rateColor(`${rateLimit.remaining}/${rateLimit.limit}`)
    );
  }

  output.push('');
  return output.join('\n');
}

/**
 * Formats output as raw JSON string
 * @param {Object} data
 * @returns {string}
 */
export function formatJsonOutput(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Formats output as a compact terminal list
 * @param {Object} data
 * @returns {string}
 */
export function formatCompactOutput(data) {
  const { items, duration, sinceDate } = data;
  if (!items || items.length === 0) {
    return chalk.yellow(`No repositories found for past ${duration}.`);
  }

  const lines = [
    chalk.bold.hex('#F59E0B')(`🌟 Trending Repositories (Past ${duration}, since ${sinceDate}):\n`),
  ];

  items.forEach((repo) => {
    lines.push(
      `${chalk.cyan(String(repo.rank) + '.')} ${chalk.bold.white(repo.fullName)} ` +
        `(${chalk.yellow(formatNumber(repo.stars) + ' ⭐')}) ` +
        `[${colorizeLanguage(repo.language)}]`
    );
    lines.push(`   ${chalk.gray(truncate(repo.description, 80))}`);
    lines.push(`   ${chalk.dim.underline(repo.url)}`);
    lines.push('');
  });

  return lines.join('\n');
}
