import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../../auth/service/verify-auth-token/authenticated-user.model';
import {
  AGENT_STORE_REPOSITORY,
  AgentStoreRepository,
} from '../../repository/agent-store/agent-store.repository.interface';
import { AgentDetailDao } from '../../repository/agent-store/agent.dao';
import {
  GENERATE_AGENT_RESPONSE_SERVICE,
  GenerateAgentResponseService,
} from '../generate-agent-response/generate-agent-response.service.interface';
import {
  ChatMessage,
  ChatRequest,
  ChatResponseStream,
} from './agent-chat.model';
import { ChatAgentService } from './chat-agent.service.interface';

/** Domain service for authorized agent chat orchestration. */
@Injectable()
export class ChatAgentDomainService implements ChatAgentService {
  /** Creates the domain service with persistence and generation boundaries. */
  constructor(
    @Inject(AGENT_STORE_REPOSITORY)
    private readonly agentStoreRepository: AgentStoreRepository,
    @Inject(GENERATE_AGENT_RESPONSE_SERVICE)
    private readonly generateAgentResponseService: GenerateAgentResponseService,
  ) {}

  /** Starts response generation for an authenticated agent chat request. */
  async chat(
    request: ChatRequest,
    user: AuthenticatedUser,
  ): Promise<ChatResponseStream> {
    this.assertValidMessages(request.messages);
    const agent: AgentDetailDao = await this.findExistingAgent(request.agentId);
    if (agent.author !== user.email) {
      throw new ForbiddenException();
    }

    return this.generateAgentResponseService.generate({
      agentRole: agent.role ?? '',
      messages: request.messages,
    });
  }

  private assertValidMessages(messages: readonly ChatMessage[]): void {
    if (messages.length === 0) {
      throw new BadRequestException();
    }

    const hasContent: boolean = messages.some(
      (message: ChatMessage): boolean => message.content.trim() !== '',
    );
    if (!hasContent) {
      throw new BadRequestException();
    }

    for (const message of messages) {
      if (
        !['user', 'assistant', 'developer'].includes(message.role) ||
        typeof message.content !== 'string'
      ) {
        throw new BadRequestException();
      }
      if (message.role === 'user' && message.content.trim() === '') {
        throw new BadRequestException();
      }
    }
  }

  private async findExistingAgent(id: string): Promise<AgentDetailDao> {
    const agent: AgentDetailDao | null =
      await this.agentStoreRepository.findById(id);
    if (agent === null) {
      throw new NotFoundException();
    }

    return agent;
  }
}
