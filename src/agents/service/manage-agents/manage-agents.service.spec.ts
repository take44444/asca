import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AgentStoreRepository } from '../../repository/agent-store/agent-store.repository.interface';
import { ManageAgentsDomainService } from './manage-agents.service';
import { AuthenticatedUser } from '../../../auth/service/verify-auth-token/authenticated-user.model';

describe('ManageAgentsDomainService', () => {
  const user: AuthenticatedUser = {
    name: 'Test User',
    email: 'user@example.com',
  };
  let repository: jest.Mocked<AgentStoreRepository>;
  let service: ManageAgentsDomainService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      listByAuthor: jest.fn(),
      deleteByIdAndAuthor: jest.fn(),
      findById: jest.fn(),
      updateByIdAndAuthor: jest.fn(),
    };
    service = new ManageAgentsDomainService(repository);
  });

  it('creates an agent with the authenticated email and trimmed name', async () => {
    repository.create.mockResolvedValue({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
      role: null,
    });

    await expect(service.create('  Support Agent  ', user)).resolves.toEqual({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
      role: '',
    });
    expect(repository.create.mock.calls).toEqual([
      ['Support Agent', user.email],
    ]);
  });

  it('rejects a blank agent name', async () => {
    await expect(service.create('   ', user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.create.mock.calls).toHaveLength(0);
  });

  it('lists only agents for the authenticated author as summaries', async () => {
    repository.listByAuthor.mockResolvedValue([
      {
        id: 'agent-1',
        name: 'Support Agent',
        author: user.email,
        role: 'Answer support questions.',
      },
    ]);

    await expect(service.list(user)).resolves.toEqual([
      { id: 'agent-1', name: 'Support Agent' },
    ]);
    expect(repository.listByAuthor.mock.calls).toEqual([[user.email]]);
  });

  it('returns an empty owned list', async () => {
    repository.listByAuthor.mockResolvedValue([]);

    await expect(service.list(user)).resolves.toEqual([]);
  });

  it('gets an owned agent by id with role details', async () => {
    repository.findById.mockResolvedValue({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
      role: 'Answer support questions.',
    });

    await expect(service.get('agent-1', user)).resolves.toEqual({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
      role: 'Answer support questions.',
    });
    expect(repository.findById.mock.calls).toEqual([['agent-1']]);
  });

  it('returns not found when get id does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.get('missing-agent', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns forbidden when getting another author agent', async () => {
    repository.findById.mockResolvedValue({
      id: 'agent-1',
      name: 'Other Agent',
      author: 'other@example.com',
      role: 'Other role.',
    });

    await expect(service.get('agent-1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it.each([
    [
      'name and role',
      { name: 'Updated Agent', role: 'Answer billing questions.' },
      {
        id: 'agent-1',
        name: 'Updated Agent',
        author: user.email,
        role: 'Answer billing questions.',
      },
    ],
    [
      'name only',
      { name: 'Updated Agent' },
      {
        id: 'agent-1',
        name: 'Updated Agent',
        author: user.email,
        role: 'Answer support questions.',
      },
    ],
    [
      'role only',
      { role: 'Answer billing questions.' },
      {
        id: 'agent-1',
        name: 'Support Agent',
        author: user.email,
        role: 'Answer billing questions.',
      },
    ],
  ])(
    'updates an owned agent with %s and preserves omitted fields',
    async (
      _caseName: string,
      update: { readonly name?: string; readonly role?: string },
      updatedAgent: {
        readonly id: string;
        readonly name: string;
        readonly author: string;
        readonly role: string;
      },
    ) => {
      repository.findById.mockResolvedValue({
        id: 'agent-1',
        name: 'Support Agent',
        author: user.email,
        role: 'Answer support questions.',
      });
      repository.updateByIdAndAuthor.mockResolvedValue(updatedAgent);

      await expect(service.update('agent-1', update, user)).resolves.toEqual(
        updatedAgent,
      );
      expect(repository.updateByIdAndAuthor.mock.calls).toEqual([
        ['agent-1', user.email, update],
      ]);
    },
  );

  it('returns not found when update id does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.update('missing-agent', { name: 'Updated Agent' }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updateByIdAndAuthor.mock.calls).toHaveLength(0);
  });

  it('returns forbidden and does not mutate when updating another author agent', async () => {
    repository.findById.mockResolvedValue({
      id: 'agent-1',
      name: 'Other Agent',
      author: 'other@example.com',
      role: 'Other role.',
    });

    await expect(
      service.update('agent-1', { name: 'Updated Agent' }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.updateByIdAndAuthor.mock.calls).toHaveLength(0);
  });

  it('deletes an owned agent', async () => {
    repository.deleteByIdAndAuthor.mockResolvedValue(true);

    await expect(service.delete('agent-1', user)).resolves.toBeUndefined();
    expect(repository.deleteByIdAndAuthor.mock.calls).toEqual([
      ['agent-1', user.email],
    ]);
  });

  it('returns not found when delete does not match an owned agent', async () => {
    repository.deleteByIdAndAuthor.mockResolvedValue(false);

    await expect(service.delete('agent-1', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
