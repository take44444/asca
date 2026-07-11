import { AuthenticatedUser } from './authenticated-user.model';

/** Verifies bearer credentials and returns the authenticated identity. */
export interface VerifyAuthTokenService {
  /** Verifies an Authorization header value and returns its authenticated user. */
  verifyAuthorizationHeader(
    authorizationHeader: string | undefined,
  ): Promise<AuthenticatedUser>;
}

/** Injection token for the auth token verification service. */
export const VERIFY_AUTH_TOKEN_SERVICE = Symbol('VERIFY_AUTH_TOKEN_SERVICE');
