import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AgentDetailDao, AgentSummaryDao, AgentUpdateDao } from './agent.dao';
import { AgentStoreRepository } from './agent-store.repository.interface';

/** Prisma-backed store for user-owned agents. */
@Injectable()
export class PrismaAgentStoreRepository implements AgentStoreRepository {
  /** Creates the repository with the Prisma client. */
  constructor(private readonly prismaService: PrismaService) {}

  /** Persists an agent for the supplied owner email. */
  async create(name: string, author: string): Promise<AgentSummaryDao> {
    return this.prismaService.agent.create({
      data: {
        name,
        author,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  /** Lists all agents owned by the supplied owner email. */
  async listByAuthor(author: string): Promise<readonly AgentSummaryDao[]> {
    return this.prismaService.agent.findMany({
      where: { author },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });
  }

  /** Finds one agent by its unique identifier. */
  async findById(id: string): Promise<AgentDetailDao | null> {
    return this.prismaService.agent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        author: true,
        role: true,
      },
    });
  }

  /** Updates an agent only when its id and owner email both match. */
  async updateByIdAndAuthor(
    id: string,
    author: string,
    update: AgentUpdateDao,
  ): Promise<AgentDetailDao | null> {
    const result: { readonly count: number } =
      await this.prismaService.agent.updateMany({
        where: { id, author },
        data: update,
      });
    if (result.count !== 1) {
      return null;
    }

    return this.findById(id);
  }

  /** Deletes an agent only when its id and owner email both match. */
  async deleteByIdAndAuthor(id: string, author: string): Promise<boolean> {
    const result: { readonly count: number } =
      await this.prismaService.agent.deleteMany({
        where: { id, author },
      });
    return result.count === 1;
  }
}
