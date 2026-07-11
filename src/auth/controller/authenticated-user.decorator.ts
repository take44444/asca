import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../service/verify-auth-token/authenticated-user.model';

interface RequestWithAuthenticatedUser {
  readonly user?: AuthenticatedUser;
}

/** Reads the authenticated user attached to the current HTTP request. */
export const AuthenticatedUserParam = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedUser | undefined => {
    const request: RequestWithAuthenticatedUser = context
      .switchToHttp()
      .getRequest();
    return request.user;
  },
);
