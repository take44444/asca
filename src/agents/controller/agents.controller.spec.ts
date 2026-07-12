import {
  BadRequestException,
  ForbiddenException,
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
      get: jest.fn(),
      update: jest.fn(),
    };
    controller = new AgentsController(manageAgentsService, authService);
  });

  it.each([
    ['create', () => controller.create(undefined, { name: 'Support Agent' })],
    ['list', () => controller.list(undefined)],
    ['get', () => controller.get(undefined, 'agent-1')],
    [
      'update',
      () =>
        controller.update(undefined, 'agent-1', {
          name: 'Support Agent',
        }),
    ],
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
      expect(manageAgentsService.get.mock.calls).toHaveLength(0);
      expect(manageAgentsService.update.mock.calls).toHaveLength(0);
      expect(manageAgentsService.delete.mock.calls).toHaveLength(0);
    },
  );

  it('creates an agent for the authenticated user', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.create.mockResolvedValue({
      id: 'agent-1',
      name: 'Support Agent',
    });

    await expect(
      controller.create('Bearer token', { name: 'Support Agent' }),
    ).resolves.toEqual({
      id: 'agent-1',
      name: 'Support Agent',
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

  it('omits role from owned agent summaries', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.list.mockResolvedValue([
      { id: 'agent-1', name: 'Support Agent' },
    ]);

    await expect(controller.list('Bearer token')).resolves.toEqual([
      { id: 'agent-1', name: 'Support Agent' },
    ]);
  });

  it('gets an owned agent detail', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.get.mockResolvedValue({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
      role: 'Answer support questions.',
    });

    await expect(controller.get('Bearer token', 'agent-1')).resolves.toEqual({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
      role: 'Answer support questions.',
    });
    expect(manageAgentsService.get.mock.calls).toEqual([['agent-1', user]]);
  });

  it('returns not found for unknown get', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.get.mockRejectedValue(new NotFoundException());

    await expect(
      controller.get('Bearer token', 'missing-agent'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns forbidden for cross-owner get', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.get.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.get('Bearer token', 'other-agent'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([
    [
      'name and role',
      { name: 'Updated Agent', role: 'Answer billing questions.' },
      { name: 'Updated Agent', role: 'Answer billing questions.' },
    ],
    ['name only', { name: 'Updated Agent' }, { name: 'Updated Agent' }],
    [
      'role only',
      { role: 'Answer billing questions.' },
      { role: 'Answer billing questions.' },
    ],
  ])(
    'updates an owned agent with %s',
    async (
      _caseName: string,
      body: { readonly name?: string; readonly role?: string },
      expectedUpdate: { readonly name?: string; readonly role?: string },
    ) => {
      authService.verifyAuthorizationHeader.mockResolvedValue(user);
      manageAgentsService.update.mockResolvedValue({
        id: 'agent-1',
        name: body.name ?? 'Support Agent',
        author: user.email,
        role: body.role ?? 'Answer support questions.',
      });

      await expect(
        controller.update('Bearer token', 'agent-1', body),
      ).resolves.toEqual({
        id: 'agent-1',
        name: body.name ?? 'Support Agent',
        author: user.email,
        role: body.role ?? 'Answer support questions.',
      });
      expect(manageAgentsService.update.mock.calls).toEqual([
        ['agent-1', expectedUpdate, user],
      ]);
    },
  );

  it.each([{}, { name: '' }, { name: '   ' }, { role: 12 }])(
    'rejects invalid update payload %p',
    async (body: object) => {
      authService.verifyAuthorizationHeader.mockResolvedValue(user);

      await expect(
        controller.update('Bearer token', 'agent-1', body),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(manageAgentsService.update.mock.calls).toHaveLength(0);
    },
  );

  it('returns not found for unknown update', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.update.mockRejectedValue(new NotFoundException());

    await expect(
      controller.update('Bearer token', 'missing-agent', {
        name: 'Updated Agent',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns forbidden for cross-owner update', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue(user);
    manageAgentsService.update.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.update('Bearer token', 'other-agent', {
        role: 'Answer billing questions.',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
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
