import { AuthenticatedUser } from '../../../auth/service/verify-auth-token/authenticated-user.model';
import { Agent, AgentSummary, UpdateAgent } from './agent.model';

/** Manages user-owned agents. */
export interface ManageAgentsService {
  /** Creates an agent owned by the authenticated user. */
  create(name: string, user: AuthenticatedUser): Promise<Agent>;

  /** Lists agents owned by the authenticated user. */
  list(user: AuthenticatedUser): Promise<readonly AgentSummary[]>;

  /** Gets one agent for the authenticated user. */
  get(id: string, user: AuthenticatedUser): Promise<Agent>;

  /** Updates one agent for the authenticated user. */
  update(
    id: string,
    update: UpdateAgent,
    user: AuthenticatedUser,
  ): Promise<Agent>;

  /** Deletes an agent owned by the authenticated user. */
  delete(id: string, user: AuthenticatedUser): Promise<void>;
}

/** Injection token for the agent management service. */
export const MANAGE_AGENTS_SERVICE = Symbol('MANAGE_AGENTS_SERVICE');
