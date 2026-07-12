import { execFileSync } from 'node:child_process';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaAgentStoreRepository } from './prisma-agent-store.repository';

describe('PrismaAgentStoreRepository', () => {
  let prismaService: PrismaService;
  let repository: PrismaAgentStoreRepository;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'file:./unit-agents.db';
    execFileSync('npx', ['prisma', 'db', 'push'], {
      env: { ...process.env, DATABASE_URL: 'file:./unit-agents.db' },
      stdio: 'ignore',
    });
    prismaService = new PrismaService();
    repository = new PrismaAgentStoreRepository(prismaService);
    await prismaService.$connect();
  });

  beforeEach(async () => {
    await prismaService.agent.deleteMany();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  it('persists id, name, and author email', async () => {
    const agent = await repository.create('Support Agent', 'user@example.com');

    expect(agent.id).toEqual(expect.any(String));
    expect(agent.name).toBe('Support Agent');
    expect(agent.author).toBe('user@example.com');
    expect(agent.role).toBeNull();
  });

  it('lists only agents for the requested author', async () => {
    await repository.create('User Agent', 'user@example.com');
    await repository.create('Other Agent', 'other@example.com');

    await expect(
      repository.listByAuthor('user@example.com'),
    ).resolves.toMatchObject([
      { name: 'User Agent', author: 'user@example.com', role: null },
    ]);
  });

  it('finds an agent by id with role data', async () => {
    const agent = await prismaService.agent.create({
      data: {
        name: 'Support Agent',
        author: 'user@example.com',
        role: 'Answer support questions.',
      },
    });

    await expect(repository.findById(agent.id)).resolves.toMatchObject({
      id: agent.id,
      name: 'Support Agent',
      author: 'user@example.com',
      role: 'Answer support questions.',
    });
  });

  it('returns null when find by id misses', async () => {
    await expect(repository.findById('missing-agent')).resolves.toBeNull();
  });

  it('updates an agent only when id and author both match', async () => {
    const ownedAgent = await prismaService.agent.create({
      data: {
        name: 'Owned Agent',
        author: 'user@example.com',
        role: 'Original role.',
      },
    });
    const otherAgent = await prismaService.agent.create({
      data: {
        name: 'Other Agent',
        author: 'other@example.com',
        role: 'Other role.',
      },
    });

    await expect(
      repository.updateByIdAndAuthor(otherAgent.id, 'user@example.com', {
        name: 'Updated Other Agent',
        role: 'Updated role.',
      }),
    ).resolves.toBeNull();
    await expect(
      repository.updateByIdAndAuthor(ownedAgent.id, 'user@example.com', {
        role: 'Updated role.',
      }),
    ).resolves.toMatchObject({
      id: ownedAgent.id,
      name: 'Owned Agent',
      author: 'user@example.com',
      role: 'Updated role.',
    });
    await expect(repository.findById(otherAgent.id)).resolves.toMatchObject({
      name: 'Other Agent',
      role: 'Other role.',
    });
  });

  it('keeps list ordering and summary-compatible fields after role persistence', async () => {
    const secondAgent = await repository.create(
      'Second Agent',
      'user@example.com',
    );
    const firstAgent = await repository.create(
      'First Agent',
      'user@example.com',
    );
    await repository.updateByIdAndAuthor(firstAgent.id, 'user@example.com', {
      role: 'First role.',
    });
    const expectedAgents = [
      {
        id: firstAgent.id,
        name: 'First Agent',
        author: 'user@example.com',
        role: 'First role.',
      },
      {
        id: secondAgent.id,
        name: 'Second Agent',
        author: 'user@example.com',
        role: null,
      },
    ].sort(
      (left: { readonly id: string }, right: { readonly id: string }): number =>
        left.id.localeCompare(right.id),
    );

    await expect(repository.listByAuthor('user@example.com')).resolves.toEqual(
      expectedAgents,
    );
  });

  it('deletes only when id and author both match', async () => {
    const ownedAgent = await repository.create(
      'Owned Agent',
      'user@example.com',
    );
    const otherAgent = await repository.create(
      'Other Agent',
      'other@example.com',
    );

    await expect(
      repository.deleteByIdAndAuthor(otherAgent.id, 'user@example.com'),
    ).resolves.toBe(false);
    await expect(
      repository.deleteByIdAndAuthor(ownedAgent.id, 'user@example.com'),
    ).resolves.toBe(true);
    await expect(repository.listByAuthor('user@example.com')).resolves.toEqual(
      [],
    );
    await expect(
      repository.listByAuthor('other@example.com'),
    ).resolves.toHaveLength(1);
  });
});
