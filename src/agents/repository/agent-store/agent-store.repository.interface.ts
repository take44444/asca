import { AgentDao, AgentUpdateDao } from './agent.dao';

/** Stores and retrieves user-owned agents. */
export interface AgentStoreRepository {
  /** Persists an agent for the supplied owner email. */
  create(name: string, author: string): Promise<AgentDao>;

  /** Lists all agents owned by the supplied owner email. */
  listByAuthor(author: string): Promise<readonly AgentDao[]>;

  /** Finds one agent by its unique identifier. */
  findById(id: string): Promise<AgentDao | null>;

  /** Updates an agent only when its id and owner email both match. */
  updateByIdAndAuthor(
    id: string,
    author: string,
    update: AgentUpdateDao,
  ): Promise<AgentDao | null>;

  /** Deletes an agent only when its id and owner email both match. */
  deleteByIdAndAuthor(id: string, author: string): Promise<boolean>;
}

/** Injection token for the agent persistence repository. */
export const AGENT_STORE_REPOSITORY = Symbol('AGENT_STORE_REPOSITORY');
