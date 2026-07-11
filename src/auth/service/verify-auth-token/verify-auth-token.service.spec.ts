import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { VerifyJwtAuthTokenService } from './verify-auth-token.service';

describe('VerifyJwtAuthTokenService', () => {
  const previousSecret: string | undefined = process.env.AUTH_SECRET;
  let jwtService: JwtService;
  let service: VerifyJwtAuthTokenService;

  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret';
    jwtService = new JwtService();
    service = new VerifyJwtAuthTokenService(jwtService);
  });

  afterAll(() => {
    process.env.AUTH_SECRET = previousSecret;
  });

  it('rejects a missing authorization header', async () => {
    await expect(
      service.verifyAuthorizationHeader(undefined),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a malformed authorization header', async () => {
    await expect(
      service.verifyAuthorizationHeader('Token abc'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid bearer token', async () => {
    await expect(
      service.verifyAuthorizationHeader('Bearer invalid'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the authenticated user for a valid JWT', async () => {
    const token: string = await jwtService.signAsync(
      { name: 'Test User', email: 'user@example.com' },
      { secret: 'test-secret' },
    );

    await expect(
      service.verifyAuthorizationHeader(`Bearer ${token}`),
    ).resolves.toEqual({
      name: 'Test User',
      email: 'user@example.com',
    });
  });
});
