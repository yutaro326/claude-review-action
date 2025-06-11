#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import Anthropic from '@anthropic-ai/sdk';
import { getChangedFiles, getPRDiff, postReviewComment } from './github.js';
import { reviewCode } from './claude.js';

async function main() {
  const githubToken = process.env.GITHUB_TOKEN;
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const filePatterns = process.env.FILE_PATTERNS || '*.js,*.ts,*.jsx,*.tsx';
  const maxFiles = parseInt(process.env.MAX_FILES || '10');

  if (!githubToken || !claudeApiKey) {
    console.error('GITHUB_TOKEN and CLAUDE_API_KEY environment variables are required');
    process.exit(1);
  }

  // Extract GitHub context from environment
  const context = JSON.parse(process.env.GITHUB_CONTEXT || '{}');
  const pullRequest = context.event?.pull_request;
  const hasChangesText = !!process.env.CHANGES_TEXT;
  
  if (!pullRequest && !hasChangesText) {
    console.log('Not a pull request event and no CHANGES_TEXT provided, skipping review');
    return;
  }

  const owner = context.repository?.owner?.login;
  const repo = context.repository?.name;
  const pullNumber = pullRequest.number;

  if (!owner || !repo || !pullNumber) {
    console.error('Unable to extract repository information from context');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: githubToken });
  const anthropic = new Anthropic({ apiKey: claudeApiKey });

  try {
    console.log(`Reviewing PR #${pullNumber} in ${owner}/${repo}`);

    // Get changed files
    const changedFiles = await getChangedFiles(octokit, owner, repo, pullNumber, filePatterns, maxFiles);
    console.log(`Found ${changedFiles.length} files to review`);

    // Get PR diff for context
    const diff = await getPRDiff(octokit, owner, repo, pullNumber);

    for (const file of changedFiles) {
      console.log(`Reviewing ${file.filename}...`);
      
      // Get file content from the PR
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.filename,
        ref: pullRequest.head.sha
      });

      if (fileData.type !== 'file') {
        console.log(`Skipping ${file.filename} (not a file)`);
        continue;
      }

      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      
      // Review the file with Claude
      const comments = await reviewCode(anthropic, content, file.filename);
      
      console.log(`Found ${comments.length} review comments for ${file.filename}`);

      // Post comments to GitHub
      for (const comment of comments) {
        try {
          await postReviewComment(
            octokit,
            owner,
            repo,
            pullNumber,
            `🤖 **Claude Code Review**: ${comment.comment}`,
            file.filename,
            comment.line
          );
          console.log(`Posted comment on ${file.filename}:${comment.line}`);
        } catch (error) {
          console.error(`Failed to post comment on ${file.filename}:${comment.line}:`, error.message);
        }
      }
    }

    console.log('Code review completed successfully');
  } catch (error) {
    console.error('Error during code review:', error);
    process.exit(1);
  }
}

main();