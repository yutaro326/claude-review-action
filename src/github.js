import { minimatch } from 'minimatch';

export async function getChangedFiles(octokit, owner, repo, pullNumber, filePatterns, maxFiles = 10) {
  try {
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber
    });

    const patterns = filePatterns.split(',').map(p => p.trim());
    
    const matchingFiles = files.filter(file => 
      patterns.some(pattern => minimatch(file.filename, pattern))
    );

    return matchingFiles.slice(0, maxFiles);
  } catch (error) {
    console.error('Error fetching changed files:', error);
    return [];
  }
}

export async function getPRDiff(octokit, owner, repo, pullNumber) {
  try {
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
      mediaType: {
        format: 'diff'
      }
    });

    return pr;
  } catch (error) {
    console.error('Error fetching PR diff:', error);
    return '';
  }
}

export async function postReviewComment(octokit, owner, repo, pullNumber, body, path, line) {
  try {
    return await octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: pullNumber,
      body,
      path,
      line
    });
  } catch (error) {
    console.error('Error posting review comment:', error);
    throw error;
  }
}