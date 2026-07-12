import { AuthenticatedUser } from '../../../auth/service/verify-auth-token/authenticated-user.model';
import { ChatRequest, ChatResponseStream } from './agent-chat.model';

/** Starts authorized chat with a user-owned agent. */
export interface ChatAgentService {
  /** Validates ownership and starts response generation for an agent chat. */
  chat(
    request: ChatRequest,
    user: AuthenticatedUser,
  ): Promise<ChatResponseStream>;
}

/** Injection token for the agent chat domain service. */
export const CHAT_AGENT_SERVICE = Symbol('CHAT_AGENT_SERVICE');
