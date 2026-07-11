/** Agent domain model owned by an authenticated user. */
export interface Agent {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;

  /** Authenticated owner email address. */
  readonly author: string;
}

/** Agent summary exposed when listing owned agents. */
export interface AgentSummary {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;
}
