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
  });

  it('lists only agents for the requested author', async () => {
    await repository.create('User Agent', 'user@example.com');
    await repository.create('Other Agent', 'other@example.com');

    await expect(
      repository.listByAuthor('user@example.com'),
    ).resolves.toMatchObject([
      { name: 'User Agent', author: 'user@example.com' },
    ]);
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
