/**
 * CLI runner for trending-repos
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { fetchTrendingRepositories, GitHubApiError } from './api.js';
import { formatTableOutput, formatJsonOutput, formatCompactOutput } from './formatter.js';
import { normalizeDuration, validateLimit, SUPPORTED_DURATIONS } from './utils.js';

export function createProgram() {
  const program = new Command();

  program
    .name('trending-repos')
    .description('CLI tool to retrieve and display trending repositories from GitHub')
    .version('1.0.0')
    .option(
      '-d, --duration <duration>',
      `Time range: ${SUPPORTED_DURATIONS.join(', ')}`,
      'week'
    )
    .option(
      '-l, --limit <limit>',
      'Number of repositories to display (1-100)',
      '10'
    )
    .option(
      '--language <language>',
      'Filter repositories by programming language (e.g. javascript, python, rust)'
    )
    .option('--json', 'Output results in JSON format')
    .option('--compact', 'Display results in a compact list format')
    .option('-D, --details', 'Display extended columns (forks, license, etc.) in table')
    .option('--token <token>', 'GitHub Personal Access Token for increased rate limits')
    .addHelpText(
      'after',
      `
${chalk.bold('Examples:')}
  $ trending-repos
  $ trending-repos --duration month --limit 20
  $ trending-repos --duration day --limit 5
  $ trending-repos --duration year --limit 15 --language rust
  $ trending-repos --duration week --limit 10 --json
  $ trending-repos --duration month --compact

${chalk.bold('Supported Durations:')}
  ${SUPPORTED_DURATIONS.map((d) => chalk.cyan(d)).join(', ')}

${chalk.bold('Rate Limits & Authentication:')}
  Unauthenticated requests are allowed (no token needed).
  To avoid rate limits on high-frequency usage, set ${chalk.green('GITHUB_TOKEN')} in your environment
  or provide ${chalk.cyan('--token <token>')}.
`
    );

  return program;
}

export async function runCli(argv = process.argv) {
  const program = createProgram();

  program.parse(argv);
  const options = program.opts();

  // Validate inputs
  let duration;
  try {
    duration = normalizeDuration(options.duration);
  } catch (err) {
    console.error(chalk.red.bold('\n❌ Error: ') + chalk.red(err.message));
    console.error(chalk.gray(`\nRun ${chalk.cyan('trending-repos --help')} for usage instructions.\n`));
    process.exitCode = 1;
    return;
  }

  let limit;
  try {
    limit = validateLimit(options.limit);
  } catch (err) {
    console.error(chalk.red.bold('\n❌ Error: ') + chalk.red(err.message));
    console.error(chalk.gray(`\nRun ${chalk.cyan('trending-repos --help')} for usage instructions.\n`));
    process.exitCode = 1;
    return;
  }

  const isJson = !!options.json;
  const isInteractive = Boolean(process.stdout.isTTY && !isJson);
  let spinner = null;

  if (isInteractive) {
    spinner = ora({
      text: chalk.cyan(`Fetching trending GitHub repositories for the past ${duration}...`),
      color: 'yellow',
    }).start();
  }

  try {
    const data = await fetchTrendingRepositories({
      duration,
      limit,
      language: options.language,
      token: options.token,
    });

    if (spinner) {
      spinner.stop();
    }

    if (isJson) {
      console.log(formatJsonOutput(data));
    } else if (options.compact) {
      console.log(formatCompactOutput(data));
    } else {
      console.log(
        formatTableOutput(data, {
          detailed: options.details,
          language: options.language,
        })
      );
    }
  } catch (err) {
    if (spinner) {
      spinner.stop();
    }

    if (isJson) {
      console.error(
        JSON.stringify(
          {
            error: true,
            message: err.message,
            status: err.status || null,
          },
          null,
          2
        )
      );
    } else {
      console.error('\n' + chalk.red.bold('❌ Error fetching trending repositories:'));
      console.error(chalk.red(err.message));

      if (err instanceof GitHubApiError && err.isRateLimit) {
        console.error(
          chalk.yellow(
            '\n💡 To bypass rate limits, generate a free token at https://github.com/settings/tokens and run:\n' +
              `   trending-repos --token <token>\n` +
              `   or set the GITHUB_TOKEN environment variable.\n`
          )
        );
      } else {
        console.error(chalk.gray(`\nRun ${chalk.cyan('trending-repos --help')} for options and syntax.\n`));
      }
    }

    process.exitCode = 1;
  }
}
