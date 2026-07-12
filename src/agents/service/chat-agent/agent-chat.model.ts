import { type UIMessageChunk } from 'ai';

/** Chat message roles accepted by the agent chat domain. */
export type ChatMessageRole = 'user' | 'assistant' | 'developer';

/** One normalized message submitted to an agent chat request. */
export interface ChatMessage {
  /** Role used by the response generator for this message. */
  readonly role: ChatMessageRole;

  /** Text content for this message. */
  readonly content: string;
}

/** Domain request for starting an authenticated agent chat stream. */
export interface ChatRequest {
  /** Unique identifier of the target agent. */
  readonly agentId: string;

  /** Ordered messages to submit to the response generator. */
  readonly messages: readonly ChatMessage[];
}

/** Domain response containing generated UI message stream output. */
export interface ChatResponseStream {
  /** Generated UI message chunks streamed progressively to the HTTP response. */
  readonly uiMessageStream: ReadableStream<UIMessageChunk>;
}
