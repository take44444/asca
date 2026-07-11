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
    execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
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
            : await request(app.getHttpServer()).delete(path);

      expect(response.status).toBe(401);
      await expect(prismaService.agent.count()).resolves.toBe(1);
    },
  );

  it.each([
    ['POST', '/agents'],
    ['GET', '/agents'],
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
    expect(responseBody.author).toBe('user@example.com');
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
