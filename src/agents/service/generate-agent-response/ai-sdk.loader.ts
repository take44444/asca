import { type OpenAIProvider } from '@ai-sdk/openai';
import {
  type pipeUIMessageStreamToResponse,
  type streamText,
  type toUIMessageStream,
} from 'ai';

/** Lazily loaded AI SDK functions used by the OpenAI response generator. */
export interface AiSdkBindings {
  /** Creates an OpenAI provider configured from the environment. */
  readonly createOpenAI: () => OpenAIProvider;

  /** Starts streamed text generation with the selected model and prompt. */
  readonly streamText: typeof streamText;

  /** Converts AI SDK text stream parts to UI message stream chunks. */
  readonly toUIMessageStream: typeof toUIMessageStream;

  /** Pipes UI message stream chunks to a Node.js HTTP response. */
  readonly pipeUIMessageStreamToResponse: typeof pipeUIMessageStreamToResponse;
}

/** Loads ESM AI SDK modules only when real response generation is invoked. */
export async function loadAiSdk(): Promise<AiSdkBindings> {
  const [openAiModule, aiModule] = await Promise.all([
    import('@ai-sdk/openai'),
    import('ai'),
  ]);

  return {
    createOpenAI: openAiModule.createOpenAI,
    streamText: aiModule.streamText,
    toUIMessageStream: aiModule.toUIMessageStream,
    pipeUIMessageStreamToResponse: aiModule.pipeUIMessageStreamToResponse,
  };
}
