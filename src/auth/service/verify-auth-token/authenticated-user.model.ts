/** Authenticated identity extracted from a verified bearer token. */
export interface AuthenticatedUser {
  /** Display name from the token claims. */
  readonly name: string;

  /** Email address used as the owner key for agents. */
  readonly email: string;
}
