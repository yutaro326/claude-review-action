import { jest } from '@jest/globals';
import { reviewCode } from '../src/claude.js';

describe('Claude API Functions', () => {
  let mockAnthropic;

  beforeEach(() => {
    mockAnthropic = {
      messages: {
        create: jest.fn()
      }
    };
  });

  describe('reviewCode', () => {
    test('should return code review comments', async () => {
      const mockResponse = {
        content: [{
          text: 'Line 5: Consider using const instead of let for better code clarity.\nLine 10: Add error handling for this async operation.'
        }]
      };
      
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const result = await reviewCode(mockAnthropic, 'const x = 1;', 'test.js');
      
      expect(result).toEqual([
        { line: 5, comment: 'Consider using const instead of let for better code clarity.' },
        { line: 10, comment: 'Add error handling for this async operation.' }
      ]);
    });

    test('should handle empty response', async () => {
      const mockResponse = {
        content: [{ text: 'No issues found.' }]
      };
      
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const result = await reviewCode(mockAnthropic, 'const x = 1;', 'test.js');
      
      expect(result).toEqual([]);
    });

    test('should handle API errors gracefully', async () => {
      mockAnthropic.messages.create.mockRejectedValue(new Error('API Error'));

      const result = await reviewCode(mockAnthropic, 'const x = 1;', 'test.js');
      
      expect(result).toEqual([]);
    });
  });
});