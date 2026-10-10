# 🌟 trending-repos CLI

A fast, beautiful command-line interface (CLI) tool that interacts with the GitHub REST API to retrieve and display trending repositories filtered by time range (**day**, **week**, **month**, or **year**), sorted by star count.

---

## 🚀 Features

- **Time Range Filtering**: Discover trending repositories created in the past `day`, `week`, `month`, or `year`.
- **Configurable Limit**: Retrieve anywhere from 1 to 100 repositories (defaults to 10).
- **Star Sorting**: Automatically sorts repositories in descending order by star count.
- **Rich Terminal UI**: Beautiful, responsive Unicode tables with color-coded programming languages and star badges.
- **Language Filtering**: Optional `--language` flag to filter by language (e.g. Python, TypeScript, Rust, Go).
- **Multiple Output Formats**:
  - **Table View** (default): Clean, structured table with repository name, stars, language, description, and link.
  - **Detailed View** (`-D`, `--details`): Extended table showing forks, license, and repository metrics.
  - **Compact View** (`--compact`): Minimalist numbered terminal list.
  - **JSON Output** (`--json`): Machine-readable JSON output for scripting and piping to tools like `jq`.
- **Zero Authentication Required**: Works right out of the box with public repositories.
- **Graceful Rate Limiting**: Displays remaining GitHub API search quota and countdowns, with optional personal access token support via `--token` or `GITHUB_TOKEN` environment variable.
- **Robust Error Handling**: Clear, friendly error messages for invalid input, network dropouts, and rate limits.

---

## 📦 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm (v8.0.0 or higher)

### Global Installation (Recommended)

To install the command globally on your machine so you can run `trending-repos` from anywhere:

```bash
# Clone or navigate to the repository directory
cd d:/projects/trending-repos

# Link globally
npm link
```

*Alternatively, install globally via npm:*
```bash
npm install -g .
```

Now the `trending-repos` binary is available across your terminal!

### Running Without Global Installation

You can also run it directly using Node:

```bash
node ./bin/cli.js --duration month --limit 20
```

---

## 💻 Usage

### Basic Usage

```bash
# View trending repositories from the past week (default: duration=week, limit=10)
trending-repos

# View top 20 trending repositories for the past month
trending-repos --duration month --limit 20

# View top 5 trending repositories from today
trending-repos --duration day --limit 5

# View top 15 trending repositories from the past year
trending-repos --duration year --limit 15
```

### Advanced Examples

```bash
# Filter trending repositories by programming language
trending-repos --duration week --limit 10 --language python
trending-repos --duration month --limit 15 --language rust

# View extended details (stars, forks, license, URL)
trending-repos --duration week --limit 5 --details

# Compact list view
trending-repos --duration month --limit 10 --compact

# Output machine-readable JSON (pipeable to jq or files)
trending-repos --duration day --limit 5 --json > trending.json

# Using a GitHub Personal Access Token for increased rate limits
trending-repos --duration month --limit 20 --token ghp_yourTokenHere
# Or set the environment variable:
export GITHUB_TOKEN="ghp_yourTokenHere"  # On Linux/macOS
$env:GITHUB_TOKEN="ghp_yourTokenHere"     # On Windows PowerShell
trending-repos --duration month --limit 20
```

---

## ⚙️ Command-Line Options

| Option | Shorthand | Description | Default | Allowed Values |
|---|---|---|---|---|
| `--duration` | `-d` | Time range to filter trending repositories | `week` | `day`, `week`, `month`, `year` |
| `--limit` | `-l` | Number of repositories to display | `10` | Integer between `1` and `100` |
| `--language` | `-lang` | Filter repositories by programming language | `none` | Any language (e.g. `python`, `rust`, `typescript`, `go`) |
| `--details` | `-D` | Display extended table columns (forks, license) | `false` | Flag |
| `--compact` | `-c` | Display results in a compact list format | `false` | Flag |
| `--json` | `-j` | Output raw JSON data | `false` | Flag |
| `--token` | `-t` | GitHub Personal Access Token | `none` | GitHub PAT string |
| `--help` | `-h` | Display help screen with full instructions | - | - |
| `--version` | `-V` | Output version number | - | - |

---

## 🛡️ Error Handling

The CLI provides human-readable error messages for common scenarios:

1. **Invalid Duration**:
   ```
   ❌ Error: Invalid duration "decade". Allowed values are: day, week, month, year.
   Run trending-repos --help for usage instructions.
   ```
2. **Invalid Limit**:
   ```
   ❌ Error: Invalid limit "-5". Limit must be a positive integer greater than 0.
   ```
3. **Limit Exceeding Maximum**:
   ```
   ❌ Error: Limit "250" exceeds maximum supported limit of 100 (GitHub API maximum per page).
   ```
4. **Rate Limit Exceeded (HTTP 403)**:
   ```
   ❌ Error fetching trending repositories:
   GitHub API rate limit exceeded. Reset in ~45s (18:45:00).
   Tip: GitHub permits 10 search queries/min for unauthenticated requests.
   To increase this to 30/min, pass a token via --token <token> or set the GITHUB_TOKEN environment variable.
   ```
5. **Network Connectivity / Timeout**:
   ```
   ❌ Error fetching trending repositories:
   Request timed out after 10 seconds. Please check your internet connection.
   ```

---

## 🧪 Running Automated Tests

The project includes unit and integration tests powered by Node.js's native test runner (`node:test`):

```bash
npm test
```

Test coverage includes:
- Duration string parsing and aliases (`day`, `week`, `month`, `year`, `daily`, etc.)
- Date boundary calculation for each time window
- Limit boundary and type validation
- Formatter table, compact, and JSON outputs
- Error classes and rate-limiting header handling

---

## 📁 Project Architecture

```
trending-repos/
├── bin/
│   └── cli.js            # Executable entry point (#!/usr/bin/env node)
├── src/
│   ├── api.js            # GitHub REST Search API integration & error handler
│   ├── cli.js            # Commander setup, options validation & controller
│   ├── formatter.js      # Terminal table, badges, JSON, & list formatters
│   └── utils.js          # Date math, duration normalization & number formatters
├── test/
│   ├── api.test.js       # API & error class unit tests
│   ├── formatter.test.js # Output rendering tests
│   └── utils.test.js     # Date math and input validator tests
├── package.json          # Project metadata, dependencies, bin mapping
└── README.md             # Complete documentation
```

---

## 📄 License

MIT
