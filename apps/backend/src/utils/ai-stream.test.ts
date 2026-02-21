import { describe, it, expect, vi } from 'vitest';
import { handleOpenAIStream } from './ai-stream';
import { AIChatStreamEvent } from '../types/ai-chat';

describe('AI Stream Utilities', () => {
  describe('handleOpenAIStream', () => {
    it('should correctly stream text deltas', async () => {
      const mockEvents = [
        { type: 'response.output_text.delta', delta: 'Hello' },
        { type: 'response.output_text.delta', delta: ', world!' },
        { type: 'response.completed', response: { id: 'resp_123' } }
      ];

      const stream = (async function* () {
        for (const event of mockEvents) yield event;
      })();

      const onResponseId = vi.fn();
      const controller = new AbortController();

      const results: AIChatStreamEvent[] = [];
      for await (const event of handleOpenAIStream(stream, { onResponseId, controller })) {
        results.push(event);
      }

      expect(results).toEqual([
        { type: 'text', content: 'Hello' },
        { type: 'text', content: ', world!' }
      ]);
      expect(onResponseId).toHaveBeenCalledWith('resp_123');
    });

    it('should handle fragmented tool call arguments', async () => {
      const mockEvents = [
        { type: 'response.function_call_arguments.delta', delta: '{"propo' },
        { type: 'response.function_call_arguments.delta', delta: 'sal": {"sk' },
        { type: 'response.function_call_arguments.delta', delta: 'ills": []},' },
        { type: 'response.function_call_arguments.delta', delta: '"explanation": "Test"}' },
        { type: 'response.completed', response: { id: 'resp_tool' } }
      ];

      const stream = (async function* () {
        for (const event of mockEvents) yield event;
      })();

      const onResponseId = vi.fn();
      const controller = new AbortController();

      const results: AIChatStreamEvent[] = [];
      for await (const event of handleOpenAIStream(stream, { onResponseId, controller })) {
        results.push(event);
      }

      // Should yield 'thinking' once at start of tool call
      expect(results[0]).toEqual({ type: 'thinking', content: 'Drafting changes...' });
      
      // Should yield final proposal
      expect(results[results.length - 1]).toEqual({
        type: 'proposal',
        data: { skills: [] },
        explanation: 'Test'
      });
      
      // Response ID should be cleared for tool calls (as per existing logic)
      expect(onResponseId).toHaveBeenCalledWith('');
    });

    it('should handle completed tool call arguments', async () => {
      const mockEvents = [
        { 
          type: 'response.function_call_arguments.done', 
          arguments: '{"proposal": {}, "explanation": "Done"}' 
        },
        { type: 'response.completed', response: { id: 'resp_done' } }
      ];

      const stream = (async function* () {
        for (const event of mockEvents) yield event;
      })();

      const onResponseId = vi.fn();
      const controller = new AbortController();

      const results: AIChatStreamEvent[] = [];
      for await (const event of handleOpenAIStream(stream, { onResponseId, controller })) {
        results.push(event);
      }

      expect(results).toContainEqual({
        type: 'proposal',
        data: {},
        explanation: 'Done'
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      const mockEvents = [
        { type: 'response.function_call_arguments.done', arguments: '{bad_json' },
        { type: 'response.completed', response: { id: 'resp_err' } }
      ];

      const stream = (async function* () {
        for (const event of mockEvents) yield event;
      })();

      const onResponseId = vi.fn();
      const controller = new AbortController();

      const results: AIChatStreamEvent[] = [];
      for await (const event of handleOpenAIStream(stream, { onResponseId, controller })) {
        results.push(event);
      }

      expect(results).toContainEqual({
        type: 'text',
        content: 'I encountered an error processing that edit.'
      });
    });

    it('should repair truncated JSON with missing quotes and braces', async () => {
      // {"explanation": "Fixing typo", "proposal": {"summary": "Hel
      const truncatedJson = '{"explanation": "Fixing typo", "proposal": {"summary": "Hel';
      
      const mockEvents = [
        { 
          type: 'response.function_call_arguments.done', 
          arguments: truncatedJson
        },
        { type: 'response.completed', response: { id: 'resp_trunc' } }
      ];

      const stream = (async function* () {
        for (const event of mockEvents) yield event;
      })();

      const onResponseId = vi.fn();
      const controller = new AbortController();

      const results: AIChatStreamEvent[] = [];
      for await (const event of handleOpenAIStream(stream, { onResponseId, controller })) {
        results.push(event);
      }

      // We expect it to try to close the string and object
      const proposal = results.find(r => r.type === 'proposal');
      expect(proposal).toBeDefined();
      expect((proposal as any).data.summary).toContain('Hel');
      expect((proposal as any).explanation).toBe('Fixing typo');
    });
  });
});
