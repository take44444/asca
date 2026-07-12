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
import { AgentDao } from '../../repository/agent-store/agent.dao';
import { Agent, AgentSummary, UpdateAgent } from './agent.model';
import { ManageAgentsService } from './manage-agents.service.interface';

/** Domain service for creating, listing, and deleting user-owned agents. */
@Injectable()
export class ManageAgentsDomainService implements ManageAgentsService {
  /** Creates the domain service with its persistence boundary. */
  constructor(
    @Inject(AGENT_STORE_REPOSITORY)
    private readonly agentStoreRepository: AgentStoreRepository,
  ) {}

  /** Creates an agent owned by the authenticated user. */
  async create(name: string, user: AuthenticatedUser): Promise<Agent> {
    const trimmedName: string = name.trim();
    if (trimmedName === '') {
      throw new BadRequestException();
    }

    const agent: AgentDao = await this.agentStoreRepository.create(
      trimmedName,
      user.email,
    );
    return this.toAgent(agent);
  }

  /** Lists agents owned by the authenticated user. */
  async list(user: AuthenticatedUser): Promise<readonly AgentSummary[]> {
    const agents: readonly AgentDao[] =
      await this.agentStoreRepository.listByAuthor(user.email);
    return agents.map((agent: AgentDao): AgentSummary => ({
      id: agent.id,
      name: agent.name,
    }));
  }

  /** Gets one agent owned by the authenticated user. */
  async get(id: string, user: AuthenticatedUser): Promise<Agent> {
    const agent: AgentDao = await this.findExistingAgent(id);
    this.assertOwner(agent, user);
    return this.toAgent(agent);
  }

  /** Updates one agent owned by the authenticated user. */
  async update(
    id: string,
    update: UpdateAgent,
    user: AuthenticatedUser,
  ): Promise<Agent> {
    const agent: AgentDao = await this.findExistingAgent(id);
    this.assertOwner(agent, user);

    const updatedAgent: AgentDao | null =
      await this.agentStoreRepository.updateByIdAndAuthor(
        id,
        user.email,
        update,
      );
    if (updatedAgent === null) {
      throw new ForbiddenException();
    }

    return this.toAgent(updatedAgent);
  }

  /** Deletes an agent owned by the authenticated user. */
  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    const deleted: boolean =
      await this.agentStoreRepository.deleteByIdAndAuthor(id, user.email);
    if (!deleted) {
      throw new NotFoundException();
    }
  }

  private toAgent(agent: AgentDao): Agent {
    return {
      id: agent.id,
      name: agent.name,
      author: agent.author,
      role: agent.role ?? '',
    };
  }

  private async findExistingAgent(id: string): Promise<AgentDao> {
    const agent: AgentDao | null = await this.agentStoreRepository.findById(id);
    if (agent === null) {
      throw new NotFoundException();
    }

    return agent;
  }

  private assertOwner(agent: AgentDao, user: AuthenticatedUser): void {
    if (agent.author !== user.email) {
      throw new ForbiddenException();
    }
  }
}
