import {
  ChatMessage,
  ChatResponseStream,
} from '../chat-agent/agent-chat.model';

/** Request passed to the response-generation provider boundary. */
export interface GenerateAgentResponseRequest {
  /** Authorized agent role instructions, if configured. */
  readonly agentRole: string;

  /** Normalized chat messages from the accepted request. */
  readonly messages: readonly ChatMessage[];
}

/** Generates AI UI message streams for authorized agent chat requests. */
export interface GenerateAgentResponseService {
  /** Starts provider response generation and returns a UI message stream. */
  generate(request: GenerateAgentResponseRequest): Promise<ChatResponseStream>;
}

/** Injection token for the response-generation provider service. */
export const GENERATE_AGENT_RESPONSE_SERVICE = Symbol(
  'GENERATE_AGENT_RESPONSE_SERVICE',
);
