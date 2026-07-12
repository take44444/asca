/** Persistence representation for an agent row. */
export interface AgentDao {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** Stored user-visible agent name. */
  readonly name: string;

  /** Stored owner email address. */
  readonly author: string;

  /** Stored role instructions, absent for agents without customization. */
  readonly role: string | null;
}

/** Persistence update shape for mutable agent fields. */
export interface AgentUpdateDao {
  /** Updated user-visible agent name. */
  readonly name?: string;

  /** Updated role instructions. */
  readonly role?: string;
}
