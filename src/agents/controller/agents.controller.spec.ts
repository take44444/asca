import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { CreateAgentDto } from './agent.dto';
import { VerifyAuthTokenService } from '../../auth/service/verify-auth-token/verify-auth-token.service.interface';
import { ManageAgentsService } from '../service/manage-agents/manage-agents.service.interface';
import { AuthenticatedUser } from '../../auth/service/verify-auth-token/authenticated-user.model';

describe('AgentsController', () => {
  const user: AuthenticatedUser = {
    name: 'Test User',
    email: 'user@example.com',
  };
  let authService: jest.Mocked<VerifyAuthTokenService>;
  let manageAgentsService: jest.Mocked<ManageAgentsService>;
  let controller: AgentsController;

  beforeEach(() => {
    authService = {
      verifyAuthorizationHeader: jest.fn<
        Promise<AuthenticatedUser>,
        [string | undefined]
      >(),
    };
    manageAgentsService = {
      create: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    };
    controller = new AgentsController(manageAgentsService, authService);
  });

  it.each([
    ['create', () => controller.create(undefined, { name: 'Support Agent' })],
    ['list', () => controller.list(undefined)],
    ['delete', () => controller.delete(undefined, 'agent-1')],
  ])(
    'rejects unauthenticated %s before service calls',
    async (_name: string, act: () => Promise<unknown>) => {
      authService.verifyAuthorizationHeader.mockRejectedValue(
        new UnauthorizedException(),
      );

      await expect(act()).rejects.toBeInstanceOf(UnauthorizedException);
      expect(manageAgentsService.create.mock.calls).toHaveLength(0);
      expect(manageAgentsService.list.mock.calls).toHaveLength(0);
      expect(manageAgentsService.delete.mock.calls).toHaveLength(0);
    },
  );

  it('creates an agent for the authenticated user', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.create.mockResolvedValue({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
    });

    await expect(
      controller.create('Bearer token', { name: 'Support Agent' }),
    ).resolves.toEqual({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
    });
    expect(manageAgentsService.create.mock.calls).toEqual([
      ['Support Agent', user],
    ]);
  });

  it.each([undefined, '', '   '])(
    'rejects invalid create name %p',
    async (name: string | undefined) => {
      authService.verifyAuthorizationHeader.mockResolvedValue(user);
      const body: Partial<CreateAgentDto> = { name };

      await expect(
        controller.create('Bearer token', body as CreateAgentDto),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(manageAgentsService.create.mock.calls).toHaveLength(0);
    },
  );

  it('lists owned agent summaries', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.list.mockResolvedValue([
      { id: 'agent-1', name: 'Support Agent' },
    ]);

    await expect(controller.list('Bearer token')).resolves.toEqual([
      { id: 'agent-1', name: 'Support Agent' },
    ]);
    expect(manageAgentsService.list.mock.calls).toEqual([[user]]);
  });

  it('returns an empty owned list', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.list.mockResolvedValue([]);

    await expect(controller.list('Bearer token')).resolves.toEqual([]);
  });

  it('deletes an owned agent', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.delete.mockResolvedValue(undefined);

    await expect(
      controller.delete('Bearer token', 'agent-1'),
    ).resolves.toBeUndefined();
    expect(manageAgentsService.delete.mock.calls).toEqual([['agent-1', user]]);
  });

  it.each(['missing-agent', 'other-user-agent'])(
    'returns not found for %s delete',
    async (id: string) => {
      authService.verifyAuthorizationHeader.mockResolvedValue(user);
      manageAgentsService.delete.mockRejectedValue(new NotFoundException());

      await expect(
        controller.delete('Bearer token', id),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
});
