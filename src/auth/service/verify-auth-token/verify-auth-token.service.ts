import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from './authenticated-user.model';
import { VerifyAuthTokenService } from './verify-auth-token.service.interface';

interface AuthTokenPayload {
  readonly name: string;
  readonly email: string;
}

/** Verifies bearer JWT credentials using the configured AUTH_SECRET. */
@Injectable()
export class VerifyJwtAuthTokenService implements VerifyAuthTokenService {
  /** Creates the token verifier. */
  constructor(private readonly jwtService: JwtService) {}

  /** Verifies an Authorization header value and returns its authenticated user. */
  async verifyAuthorizationHeader(
    authorizationHeader: string | undefined,
  ): Promise<AuthenticatedUser> {
    if (authorizationHeader === undefined) {
      throw new UnauthorizedException();
    }

    const [scheme, token]: readonly string[] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || token === undefined || token.trim() === '') {
      throw new UnauthorizedException();
    }

    const secret: string | undefined = process.env.AUTH_SECRET;
    if (secret === undefined || secret.trim() === '') {
      throw new UnauthorizedException();
    }

    try {
      const payload: unknown = await this.jwtService.verifyAsync(token, {
        secret,
      });
      if (!this.isAuthTokenPayload(payload)) {
        throw new UnauthorizedException();
      }

      return {
        name: payload.name,
        email: payload.email,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException();
    }
  }

  private isAuthTokenPayload(payload: unknown): payload is AuthTokenPayload {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }

    const candidate: Partial<AuthTokenPayload> = payload;
    return (
      typeof candidate.name === 'string' &&
      candidate.name.trim() !== '' &&
      typeof candidate.email === 'string' &&
      candidate.email.trim() !== ''
    );
  }
}
