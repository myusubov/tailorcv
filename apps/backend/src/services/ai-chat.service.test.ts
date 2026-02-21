import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamChatResponse, generateConversationTitle } from './ai-chat.service';
import { openai } from '../lib/openai';

// Mock openai
vi.mock('../lib/openai', () => ({
  openai: {
    responses: {
      stream: vi.fn(),
    },
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

// Mock resilience policy to just execute the function
vi.mock('../lib/resilience', () => ({
  openaiApiPolicy: {
    execute: vi.fn((fn) => fn()),
  },
}));

// Mock ai-stream utility since we tested it separately
vi.mock('../utils/ai-stream', () => ({
  handleOpenAIStream: vi.fn(() => (async function* () {})()),
}));

// Mock intent classification
vi.mock('../utils/ai-intent', () => ({
  classifyIntent: vi.fn(),
}));

import { classifyIntent } from '../utils/ai-intent';

describe('AI Chat Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('streamChatResponse', () => {
    it('should call openai.responses.stream with correct parameters', async () => {
      const input = 'Hello AI';
      const resumeContext = { contact: { firstName: 'Test' } };
      
      (classifyIntent as any).mockResolvedValue('complex');
      await streamChatResponse({ input, resumeContext } as any);

      expect(openai.responses.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          input,
          tools: expect.any(Array), // Should include tools when resumeContext is present
        }),
        expect.any(Object)
      );
    });

    it('should omit tools if no resumeContext is provided', async () => {
      const input = 'Just chat';
      
      await streamChatResponse({ input } as any);

      expect(openai.responses.stream).toHaveBeenCalledWith(
        expect.not.objectContaining({
          tools: expect.anything(),
        }),
        expect.any(Object)
      );
    });

    it('should include previous_response_id if provided and valid', async () => {
      const input = 'Follow up';
      const previousResponseId = 'resp_123';
      
      await streamChatResponse({ input, previousResponseId } as any);

      expect(openai.responses.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          previous_response_id: previousResponseId,
        }),
        expect.any(Object)
      );
    });

    it('should NOT include previous_response_id if it is a tool call ID', async () => {
      const input = 'Follow up';
      const previousResponseId = 'edit-123'; // Legacy/Tool pattern
      
      await streamChatResponse({ input, previousResponseId } as any);

      expect(openai.responses.stream).toHaveBeenCalledWith(
        expect.not.objectContaining({
          previous_response_id: previousResponseId,
        }),
        expect.any(Object)
      );
    });
  });

  describe('generateConversationTitle', () => {
    it('should return generated title on success', async () => {
      const mockTitle = 'My Conversation';
      (openai.chat.completions.create as any).mockResolvedValue({
        choices: [{ message: { content: mockTitle } }],
      });

      const title = await generateConversationTitle('Hello world');
      expect(title).toBe(mockTitle);
    });

    it('should fallback to input slice on empty response', async () => {
      (openai.chat.completions.create as any).mockResolvedValue({
        choices: [{ message: { content: '' } }],
      });

      const input = 'A very long message that should be sliced if the AI fails';
      const title = await generateConversationTitle(input);
      expect(title).toBe(input.slice(0, 50));
    });

    it('should fallback to input slice on error', async () => {
      (openai.chat.completions.create as any).mockRejectedValue(new Error('API Error'));

      const input = 'Fallback test';
      const title = await generateConversationTitle(input);
      expect(title).toBe(input);
    });
  });
});
