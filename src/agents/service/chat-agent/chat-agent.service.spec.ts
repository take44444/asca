import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../../auth/service/verify-auth-token/authenticated-user.model';
import { AgentStoreRepository } from '../../repository/agent-store/agent-store.repository.interface';
import { GenerateAgentResponseService } from '../generate-agent-response/generate-agent-response.service.interface';
import { ChatMessage } from './agent-chat.model';
import { ChatAgentDomainService } from './chat-agent.service';

describe('ChatAgentDomainService', () => {
  const user: AuthenticatedUser = {
    name: 'Test User',
    email: 'user@example.com',
  };
  let repository: jest.Mocked<AgentStoreRepository>;
  let generator: jest.Mocked<GenerateAgentResponseService>;
  let service: ChatAgentDomainService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      listByAuthor: jest.fn(),
      findById: jest.fn(),
      updateByIdAndAuthor: jest.fn(),
      deleteByIdAndAuthor: jest.fn(),
    };
    generator = {
      generate: jest.fn(),
    };
    service = new ChatAgentDomainService(repository, generator);
  });

  it('starts response generation for an owned agent and forwards role guidance', async () => {
    repository.findById.mockResolvedValue({
      id: 'agent-1',
      name: 'Support Agent',
      author: user.email,
      role: 'Answer support questions.',
    });
    const expectedResponse = { uiMessageStream: new ReadableStream() };
    generator.generate.mockResolvedValue(expectedResponse);

    await expect(
      service.chat(
        {
          agentId: 'agent-1',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        user,
      ),
    ).resolves.toBe(expectedResponse);

    expect(repository.findById.mock.calls).toEqual([['agent-1']]);
    expect(generator.generate.mock.calls).toEqual([
      [
        {
          agentRole: 'Answer support questions.',
          messages: [{ role: 'user', content: 'Hello' }],
        },
      ],
    ]);
  });

  it('returns not found for an unknown agent before generation starts', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.chat(
        {
          agentId: 'missing-agent',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        user,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(generator.generate.mock.calls).toHaveLength(0);
  });

  it('returns forbidden for a cross-owner agent before generation starts', async () => {
    repository.findById.mockResolvedValue({
      id: 'agent-1',
      name: 'Other Agent',
      author: 'other@example.com',
      role: 'Other role.',
    });

    await expect(
      service.chat(
        {
          agentId: 'agent-1',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        user,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(generator.generate.mock.calls).toHaveLength(0);
  });

  const invalidMessageCases: readonly [string, readonly ChatMessage[]][] = [
    ['empty list', []],
    ['whitespace-only user message', [{ role: 'user', content: '   ' }]],
  ];

  it.each(invalidMessageCases)(
    'rejects invalid chat request %s before generation starts',
    async (
      _caseName: string,
      messages: Parameters<ChatAgentDomainService['chat']>[0]['messages'],
    ) => {
      await expect(
        service.chat(
          {
            agentId: 'agent-1',
            messages,
          },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.findById.mock.calls).toHaveLength(0);
      expect(generator.generate.mock.calls).toHaveLength(0);
    },
  );
});
