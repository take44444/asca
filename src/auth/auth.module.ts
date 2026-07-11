import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VERIFY_AUTH_TOKEN_SERVICE } from './service/verify-auth-token/verify-auth-token.service.interface';
import { VerifyJwtAuthTokenService } from './service/verify-auth-token/verify-auth-token.service';

/** Provides bearer JWT authentication services. */
@Module({
  imports: [JwtModule.register({})],
  providers: [
    VerifyJwtAuthTokenService,
    {
      provide: VERIFY_AUTH_TOKEN_SERVICE,
      useExisting: VerifyJwtAuthTokenService,
    },
  ],
  exports: [VERIFY_AUTH_TOKEN_SERVICE],
})
export class AuthModule {}
