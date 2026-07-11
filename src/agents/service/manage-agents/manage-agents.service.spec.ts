import { BadRequestException, NotFoundException } from '@nestjs/common';
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
    };
    service = new ManageAgentsDomainService(repository);
  });

  it('creates an agent with the authenticated email and trimmed name', async () => {
    repository.create.mockResolvedValue({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
    });

    await expect(service.create('  Support Agent  ', user)).resolves.toEqual({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
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
      { id: 'agent-1', name: 'Support Agent', author: user.email },
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
