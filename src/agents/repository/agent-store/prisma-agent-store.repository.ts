import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AgentDao } from './agent.dao';
import { AgentStoreRepository } from './agent-store.repository.interface';

/** Prisma-backed store for user-owned agents. */
@Injectable()
export class PrismaAgentStoreRepository implements AgentStoreRepository {
  /** Creates the repository with the Prisma client. */
  constructor(private readonly prismaService: PrismaService) {}

  /** Persists an agent for the supplied owner email. */
  async create(name: string, author: string): Promise<AgentDao> {
    return this.prismaService.agent.create({
      data: {
        name,
        author,
      },
    });
  }

  /** Lists all agents owned by the supplied owner email. */
  async listByAuthor(author: string): Promise<readonly AgentDao[]> {
    return this.prismaService.agent.findMany({
      where: { author },
      orderBy: { id: 'asc' },
    });
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
