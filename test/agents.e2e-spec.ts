import { execFileSync } from 'node:child_process';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

describe('AgentsController (e2e)', () => {
  const previousSecret: string | undefined = process.env.AUTH_SECRET;
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const signToken = async (
    email: string,
    name = 'Test User',
  ): Promise<string> =>
    jwtService.signAsync({ email, name }, { secret: 'test-secret' });

  beforeAll(async () => {
    process.env.AUTH_SECRET = 'test-secret';
    process.env.DATABASE_URL = 'file:./e2e-agents.db';
    execFileSync('npx', ['prisma', 'db', 'push'], {
      env: { ...process.env, DATABASE_URL: 'file:./e2e-agents.db' },
      stdio: 'ignore',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get(JwtService);
    prismaService = moduleFixture.get(PrismaService);
  });

  beforeEach(async () => {
    await prismaService.agent.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    process.env.AUTH_SECRET = previousSecret;
  });

  it.each([
    ['POST', '/agents'],
    ['GET', '/agents'],
    ['GET', '/agents/test-id'],
    ['PATCH', '/agents/test-id'],
    ['DELETE', '/agents/test-id'],
  ])(
    'rejects unauthenticated %s %s and leaves data unchanged',
    async (method: string, path: string) => {
      await prismaService.agent.create({
        data: { name: 'Existing Agent', author: 'user@example.com' },
      });

      const response =
        method === 'POST'
          ? await request(app.getHttpServer())
              .post(path)
              .send({ name: 'Support Agent' })
          : method === 'GET'
            ? await request(app.getHttpServer()).get(path)
            : method === 'PATCH'
              ? await request(app.getHttpServer())
                  .patch(path)
                  .send({ name: 'Updated Agent' })
              : await request(app.getHttpServer()).delete(path);

      expect(response.status).toBe(401);
      await expect(prismaService.agent.count()).resolves.toBe(1);
    },
  );

  it.each([
    ['POST', '/agents'],
    ['GET', '/agents'],
    ['GET', '/agents/test-id'],
    ['PATCH', '/agents/test-id'],
    ['DELETE', '/agents/test-id'],
  ])(
    'rejects invalid-token %s %s and leaves data unchanged',
    async (method: string, path: string) => {
      await prismaService.agent.create({
        data: { name: 'Existing Agent', author: 'user@example.com' },
      });

      const response =
        method === 'POST'
          ? await request(app.getHttpServer())
              .post(path)
              .set('Authorization', 'Bearer invalid')
              .send({ name: 'Support Agent' })
          : method === 'GET'
            ? await request(app.getHttpServer())
                .get(path)
                .set('Authorization', 'Bearer invalid')
            : method === 'PATCH'
              ? await request(app.getHttpServer())
                  .patch(path)
                  .set('Authorization', 'Bearer invalid')
                  .send({ name: 'Updated Agent' })
              : await request(app.getHttpServer())
                  .delete(path)
                  .set('Authorization', 'Bearer invalid');

      expect(response.status).toBe(401);
      await expect(prismaService.agent.count()).resolves.toBe(1);
    },
  );

  it('creates an agent for the authenticated user', async () => {
    const token: string = await signToken('user@example.com');

    const response = await request(app.getHttpServer())
      .post('/agents')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Support Agent' })
      .expect(201);

    const responseBody: unknown = response.body;
    expect(isRecord(responseBody)).toBe(true);
    if (!isRecord(responseBody)) {
      throw new Error('Expected response body to be an object.');
    }
    expect(typeof responseBody.id).toBe('string');
    expect(responseBody.name).toBe('Support Agent');
    expect(responseBody).not.toHaveProperty('author');
    expect(responseBody).not.toHaveProperty('role');
  });

  it.each([{}, { name: '' }, { name: '   ' }])(
    'rejects invalid create payload %p',
    async (body: object) => {
      const token: string = await signToken('user@example.com');

      await request(app.getHttpServer())
        .post('/agents')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
      await expect(prismaService.agent.count()).resolves.toBe(0);
    },
  );

  it('lists only agents owned by the authenticated user', async () => {
    const token: string = await signToken('user@example.com');
    await prismaService.agent.createMany({
      data: [
        { name: 'User Agent', author: 'user@example.com' },
        { name: 'Other Agent', author: 'other@example.com' },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/agents')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const responseBody: unknown = response.body;
    expect(Array.isArray(responseBody)).toBe(true);
    if (!Array.isArray(responseBody)) {
      throw new Error('Expected response body to be an array.');
    }
    expect(responseBody).toHaveLength(1);
    const firstAgent: unknown = responseBody[0];
    expect(isRecord(firstAgent)).toBe(true);
    if (!isRecord(firstAgent)) {
      throw new Error('Expected listed agent to be an object.');
    }
    expect(typeof firstAgent.id).toBe('string');
    expect(firstAgent.name).toBe('User Agent');
    expect(firstAgent).not.toHaveProperty('author');
    expect(firstAgent).not.toHaveProperty('role');
  });

  it('returns an empty list for users without agents', async () => {
    const token: string = await signToken('empty@example.com');

    const response = await request(app.getHttpServer())
      .get('/agents')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const responseBody: unknown = response.body;
    expect(responseBody).toEqual([]);
  });

  it('gets an owned agent detail with role', async () => {
    const token: string = await signToken('user@example.com');
    const agent = await prismaService.agent.create({
      data: {
        name: 'Support Agent',
        author: 'user@example.com',
        role: 'Answer support questions.',
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/agents/${agent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: agent.id,
      name: 'Support Agent',
      author: 'user@example.com',
      role: 'Answer support questions.',
    });
  });

  it('returns 404 for unknown get', async () => {
    const token: string = await signToken('user@example.com');

    await request(app.getHttpServer())
      .get('/agents/missing-agent')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('updates an owned agent with name and role', async () => {
    const token: string = await signToken('user@example.com');
    const agent = await prismaService.agent.create({
      data: { name: 'Support Agent', author: 'user@example.com' },
    });

    const response = await request(app.getHttpServer())
      .patch(`/agents/${agent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Agent',
        role: 'Answer billing questions.',
      })
      .expect(200);

    expect(response.body).toEqual({
      id: agent.id,
      name: 'Updated Agent',
      author: 'user@example.com',
      role: 'Answer billing questions.',
    });
  });

  it.each([
    [{ name: 'Updated Agent' }, 'Updated Agent', 'Original role.'],
    [{ role: 'Updated role.' }, 'Support Agent', 'Updated role.'],
  ])(
    'updates an owned agent with partial payload %p',
    async (body: object, expectedName: string, expectedRole: string) => {
      const token: string = await signToken('user@example.com');
      const agent = await prismaService.agent.create({
        data: {
          name: 'Support Agent',
          author: 'user@example.com',
          role: 'Original role.',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/agents/${agent.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(200);

      expect(response.body).toEqual({
        id: agent.id,
        name: expectedName,
        author: 'user@example.com',
        role: expectedRole,
      });
    },
  );

  it.each([{}, { name: '' }, { name: '   ' }, { extra: 'nope' }])(
    'rejects invalid update payload %p',
    async (body: object) => {
      const token: string = await signToken('user@example.com');
      const agent = await prismaService.agent.create({
        data: { name: 'Support Agent', author: 'user@example.com' },
      });

      await request(app.getHttpServer())
        .patch(`/agents/${agent.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
      await expect(
        prismaService.agent.findUnique({ where: { id: agent.id } }),
      ).resolves.toMatchObject({ name: 'Support Agent', role: null });
    },
  );

  it('returns 404 for unknown update', async () => {
    const token: string = await signToken('user@example.com');

    await request(app.getHttpServer())
      .patch('/agents/missing-agent')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Agent' })
      .expect(404);
  });

  it.each(['get', 'patch'])(
    'returns 403 for cross-owner %s without changing data',
    async (method: string) => {
      const token: string = await signToken('user@example.com');
      const otherAgent = await prismaService.agent.create({
        data: {
          name: 'Other Agent',
          author: 'other@example.com',
          role: 'Other role.',
        },
      });

      if (method === 'get') {
        await request(app.getHttpServer())
          .get(`/agents/${otherAgent.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      } else {
        await request(app.getHttpServer())
          .patch(`/agents/${otherAgent.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Updated Agent', role: 'Updated role.' })
          .expect(403);
      }

      await expect(
        prismaService.agent.findUnique({ where: { id: otherAgent.id } }),
      ).resolves.toMatchObject({
        name: 'Other Agent',
        role: 'Other role.',
      });
    },
  );

  it('deletes an owned agent and removes it from subsequent lists', async () => {
    const token: string = await signToken('user@example.com');
    const agent = await prismaService.agent.create({
      data: { name: 'Owned Agent', author: 'user@example.com' },
    });

    await request(app.getHttpServer())
      .delete(`/agents/${agent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const response = await request(app.getHttpServer())
      .get('/agents')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const responseBody: unknown = response.body;
    expect(responseBody).toEqual([]);
  });

  it('returns 404 for missing and non-owned deletes', async () => {
    const token: string = await signToken('user@example.com');
    const otherAgent = await prismaService.agent.create({
      data: { name: 'Other Agent', author: 'other@example.com' },
    });

    await request(app.getHttpServer())
      .delete('/agents/missing-agent')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/agents/${otherAgent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    await expect(prismaService.agent.count()).resolves.toBe(1);
  });
});
