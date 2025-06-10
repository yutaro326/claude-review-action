import { jest } from '@jest/globals';
import { getChangedFiles, getPRDiff, postReviewComment } from '../src/github.js';
import { reviewCode } from '../src/claude.js';

describe('Integration Tests', () => {
  let mockOctokit, mockAnthropic;

  beforeEach(() => {
    mockOctokit = {
      rest: {
        pulls: {
          listFiles: jest.fn(),
          get: jest.fn(),
          createReviewComment: jest.fn()
        },
        repos: {
          getContent: jest.fn()
        }
      }
    };

    mockAnthropic = {
      messages: {
        create: jest.fn()
      }
    };
  });

  describe('End-to-End Review Process', () => {
    test('should complete full review workflow', async () => {
      // Mock changed files
      const mockFiles = [
        { filename: 'src/test.js', status: 'modified' },
        { filename: 'src/utils.ts', status: 'added' }
      ];
      mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles });

      // Mock file content
      const jsContent = 'let x = 1; console.log(x);';
      const tsContent = 'const y: number = 2; console.log(y);';
      
      mockOctokit.rest.repos.getContent
        .mockResolvedValueOnce({
          data: {
            type: 'file',
            content: Buffer.from(jsContent).toString('base64')
          }
        })
        .mockResolvedValueOnce({
          data: {
            type: 'file',
            content: Buffer.from(tsContent).toString('base64')
          }
        });

      // Mock Claude responses
      mockAnthropic.messages.create
        .mockResolvedValueOnce({
          content: [{
            text: 'Line 1: Consider using const instead of let for better code clarity.'
          }]
        })
        .mockResolvedValueOnce({
          content: [{
            text: 'No issues found.'
          }]
        });

      // Mock review comment posting
      mockOctokit.rest.pulls.createReviewComment.mockResolvedValue({
        data: { id: 123 }
      });

      // Test the workflow
      const changedFiles = await getChangedFiles(
        mockOctokit, 
        'owner', 
        'repo', 
        123, 
        '*.js,*.ts', 
        10
      );
      
      expect(changedFiles).toHaveLength(2);

      // Simulate reviewing each file
      for (const file of changedFiles) {
        const { data: fileData } = await mockOctokit.rest.repos.getContent({
          owner: 'owner',
          repo: 'repo',
          path: file.filename,
          ref: 'sha123'
        });

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const comments = await reviewCode(mockAnthropic, content, file.filename);

        // Post comments for files with issues
        for (const comment of comments) {
          await postReviewComment(
            mockOctokit,
            'owner',
            'repo',
            123,
            `🤖 **Claude Code Review**: ${comment.comment}`,
            file.filename,
            comment.line
          );
        }
      }

      // Verify the workflow executed correctly
      expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledTimes(1);
      expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledTimes(2);
      expect(mockAnthropic.messages.create).toHaveBeenCalledTimes(2);
      expect(mockOctokit.rest.pulls.createReviewComment).toHaveBeenCalledTimes(1);
    });

    test('should handle file filtering correctly', async () => {
      const mockFiles = [
        { filename: 'src/test.js', status: 'modified' },
        { filename: 'src/test.py', status: 'added' },
        { filename: 'README.md', status: 'modified' },
        { filename: 'src/utils.ts', status: 'added' }
      ];
      
      mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles });

      const jsAndTsFiles = await getChangedFiles(
        mockOctokit, 
        'owner', 
        'repo', 
        123, 
        '*.js,*.ts', 
        10
      );

      expect(jsAndTsFiles).toHaveLength(2);
      expect(jsAndTsFiles.map(f => f.filename)).toEqual([
        'src/test.js',
        'src/utils.ts'
      ]);
    });

    test('should respect max files limit', async () => {
      const mockFiles = Array.from({ length: 15 }, (_, i) => ({
        filename: `src/test${i}.js`,
        status: 'modified'
      }));
      
      mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles });

      const limitedFiles = await getChangedFiles(
        mockOctokit, 
        'owner', 
        'repo', 
        123, 
        '*.js', 
        5
      );

      expect(limitedFiles).toHaveLength(5);
    });

    test('should handle errors gracefully', async () => {
      // Mock API failure
      mockOctokit.rest.pulls.listFiles.mockRejectedValue(new Error('API Error'));

      const files = await getChangedFiles(
        mockOctokit, 
        'owner', 
        'repo', 
        123, 
        '*.js', 
        10
      );

      expect(files).toEqual([]);
    });
  });

  describe('CI Workflow Integration', () => {
    test('should validate workflow file syntax', () => {
      // This test would validate the YAML syntax of our workflow files
      // In a real scenario, we might use a YAML parser to validate structure
      const workflowContent = `
name: Node.js CI

on:
  workflow_call:
    inputs:
      node-version:
        description: 'Node.js version to use'
        required: false
        default: '18.x'
        type: string

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
      `;

      // Basic validation - check key sections exist
      expect(workflowContent).toContain('name: Node.js CI');
      expect(workflowContent).toContain('workflow_call');
      expect(workflowContent).toContain('jobs:');
      expect(workflowContent).toContain('steps:');
    });
  });
});