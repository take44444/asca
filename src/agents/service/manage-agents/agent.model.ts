/** Agent domain model owned by an authenticated user. */
export interface Agent {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;

  /** Authenticated owner email address. */
  readonly author: string;

  /** User-authored role instructions. Empty string means unset. */
  readonly role: string;
}

/** Agent summary exposed when listing owned agents. */
export interface AgentSummary {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;
}

/** Partial customization changes for an existing agent. */
export interface UpdateAgent {
  /** New user-visible agent name. */
  readonly name?: string;

  /** New user-authored role instructions. */
  readonly role?: string;
}
