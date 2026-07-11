/** Persistence representation for an agent row. */
export interface AgentDao {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** Stored user-visible agent name. */
  readonly name: string;

  /** Stored owner email address. */
  readonly author: string;
}
