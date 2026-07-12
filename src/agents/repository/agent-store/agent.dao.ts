/** Persistence representation for agent summary rows. */
export interface AgentSummaryDao {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** Stored user-visible agent name. */
  readonly name: string;
}

/** Persistence representation for agent detail rows. */
export interface AgentDetailDao extends AgentSummaryDao {
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
