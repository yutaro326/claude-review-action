# Claude Code Review Action

Automated code review using Claude API for GitHub pull requests.

## Overview

This GitHub Action uses Anthropic's Claude AI to automatically review code changes in pull requests and post constructive feedback as review comments.

## Features

- 🤖 AI-powered code review using Claude
- 📝 Contextual comments posted directly on PR lines
- 🎯 Configurable file patterns for targeted reviews
- ⚡ Customizable file limits to control API usage
- 🔧 Flexible configuration options

## Usage

### Basic Usage

```yaml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: your-org/claude-review-action@v2
        with:
          api-key: ${{ secrets.CLAUDE_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Configuration

```yaml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: your-org/claude-review-action@v2
        with:
          api-key: ${{ secrets.CLAUDE_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          file-patterns: '*.js,*.ts,*.jsx,*.tsx,*.py'
          max-files: '15'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `api-key` | Claude API key from Anthropic | Yes | - |
| `github-token` | GitHub token for posting comments | Yes | - |
| `file-patterns` | Comma-separated file patterns to review | No | `*.js,*.ts,*.jsx,*.tsx` |
| `max-files` | Maximum number of files to review per PR | No | `10` |

## Setup

### 1. Get Claude API Key

1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Add it to your repository secrets as `CLAUDE_API_KEY`

### 2. Configure GitHub Token

The action uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions. Ensure your workflow has the necessary permissions:

```yaml
permissions:
  contents: read
  pull-requests: write
```

### 3. Add Workflow File

Create `.github/workflows/code-review.yml` in your repository:

```yaml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: your-org/claude-review-action@v2
        with:
          api-key: ${{ secrets.CLAUDE_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          file-patterns: '*.js,*.ts,*.jsx,*.tsx'
          max-files: '10'
```

## File Patterns

The `file-patterns` input supports glob patterns:

- `*.js` - All JavaScript files
- `*.{js,ts}` - JavaScript and TypeScript files
- `src/**/*.js` - JavaScript files in src directory and subdirectories
- `*.py,*.rb` - Python and Ruby files

## Cost Management

To manage Claude API costs:

1. Use `max-files` to limit files per PR
2. Configure `file-patterns` to target specific file types
3. Consider running only on specific branches or conditions

## Example Review Comment

The action posts comments like:

> 🤖 **Claude Code Review**: Consider using const instead of let for variables that don't change. This improves code clarity and prevents accidental reassignment.

## Troubleshooting

### Common Issues

**Action fails with "CLAUDE_API_KEY not found"**
- Ensure you've added your Claude API key to repository secrets

**Comments not posted**
- Check that `GITHUB_TOKEN` has `pull-requests: write` permission
- Verify the file patterns match your changed files

**Too many API calls**
- Reduce `max-files` limit
- Use more specific `file-patterns`

### Debug Mode

Enable debug logging by setting the `ACTIONS_STEP_DEBUG` secret to `true` in your repository.

## Development

### Local Testing

```bash
cd claude-review-action
npm install
npm test
```

### Environment Variables for Testing

```bash
export CLAUDE_API_KEY="your-api-key"
export GITHUB_TOKEN="your-github-token"
export FILE_PATTERNS="*.js,*.ts"
export MAX_FILES="5"
node src/review.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the [troubleshooting section](#troubleshooting)
- Open an issue on GitHub
- Review the [Claude API documentation](https://docs.anthropic.com/)