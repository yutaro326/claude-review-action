import { jest } from '@jest/globals';
import { getChangedFiles, postReviewComment, getPRDiff } from '../src/github.js';

describe('GitHub API Functions', () => {
  let mockOctokit;

  beforeEach(() => {
    mockOctokit = {
      rest: {
        pulls: {
          listFiles: jest.fn(),
          get: jest.fn(),
          createReviewComment: jest.fn()
        }
      }
    };
  });

  describe('getChangedFiles', () => {
    test('should return list of changed files matching patterns', async () => {
      const mockFiles = [
        { filename: 'src/test.js', status: 'modified' },
        { filename: 'src/test.ts', status: 'added' },
        { filename: 'README.md', status: 'modified' }
      ];
      
      mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles });

      const result = await getChangedFiles(mockOctokit, 'owner', 'repo', 123, '*.js,*.ts');
      
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { filename: 'src/test.js', status: 'modified' },
        { filename: 'src/test.ts', status: 'added' }
      ]);
    });

    test('should limit files to maxFiles parameter', async () => {
      const mockFiles = Array.from({ length: 15 }, (_, i) => ({
        filename: `src/test${i}.js`,
        status: 'modified'
      }));
      
      mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles });

      const result = await getChangedFiles(mockOctokit, 'owner', 'repo', 123, '*.js', 10);
      
      expect(result).toHaveLength(10);
    });
  });

  describe('getPRDiff', () => {
    test('should return PR diff content', async () => {
      const mockPR = {
        data: {
          diff_url: 'https://github.com/owner/repo/pull/123.diff'
        }
      };
      
      mockOctokit.rest.pulls.get.mockResolvedValue(mockPR);
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('diff content')
      });

      const result = await getPRDiff(mockOctokit, 'owner', 'repo', 123);
      
      expect(result).toBe('diff content');
    });
  });

  describe('postReviewComment', () => {
    test('should post review comment successfully', async () => {
      mockOctokit.rest.pulls.createReviewComment.mockResolvedValue({
        data: { id: 123 }
      });

      const result = await postReviewComment(
        mockOctokit, 
        'owner', 
        'repo', 
        123, 
        'Test comment', 
        'file.js', 
        1
      );
      
      expect(result.data.id).toBe(123);
      expect(mockOctokit.rest.pulls.createReviewComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
        body: 'Test comment',
        path: 'file.js',
        line: 1
      });
    });
  });
});