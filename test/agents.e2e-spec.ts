import { execFileSync } from 'node:child_process';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GENERATE_AGENT_RESPONSE_SERVICE } from '../src/agents/service/generate-agent-response/generate-agent-response.service.interface';
import { GenerateAgentResponseService } from '../src/agents/service/generate-agent-response/generate-agent-response.service.interface';
import { type UIMessageChunk } from 'ai';
import { loadAiSdk } from '../src/agents/service/generate-agent-response/ai-sdk.loader';

jest.mock(
  '../src/agents/service/generate-agent-response/ai-sdk.loader',
  () => ({
    loadAiSdk: jest.fn(),
  }),
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

interface WritableResponseLike {
  statusCode: number;
  setHeader(name: string, value: string): void;
  write(chunk: string): void;
  end(): void;
}

const createUiMessageStream = (): ReadableStream<UIMessageChunk> =>
  new ReadableStream<UIMessageChunk>({
    start(controller: ReadableStreamDefaultController<UIMessageChunk>): void {
      controller.enqueue({ type: 'text-start', id: '0' });
      controller.enqueue({ type: 'text-delta', id: '0', delta: 'Hello there' });
      controller.enqueue({ type: 'text-end', id: '0' });
      controller.close();
    },
  });

describe('AgentsController (e2e)', () => {
  const previousSecret: string | undefined = process.env.AUTH_SECRET;
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let generator: jest.Mocked<GenerateAgentResponseService>;
  let pipeUIMessageStreamToResponse: jest.Mock<void, [unknown]>;

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

    generator = {
      generate: jest.fn(),
    };
    pipeUIMessageStreamToResponse = jest.fn<void, [unknown]>(
      (options: unknown): void => {
        pipeUiMessageStreamForTest(options);
      },
    );
    jest.mocked(loadAiSdk).mockResolvedValue({
      pipeUIMessageStreamToResponse,
    } as unknown as Awaited<ReturnType<typeof loadAiSdk>>);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GENERATE_AGENT_RESPONSE_SERVICE)
      .useValue(generator)
      .compile();

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
    generator.generate.mockReset();
    pipeUIMessageStreamToResponse.mockClear();
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
    ['POST', '/agents/test-id/chat'],
  ])(
    'rejects unauthenticated %s %s and leaves data unchanged',
    async (method: string, path: string) => {
      await prismaService.agent.create({
        data: { name: 'Existing Agent', author: 'user@example.com' },
      });

      const response =
        method === 'POST'
          ? path.endsWith('/chat')
            ? await request(app.getHttpServer())
                .post(path)
                .send({ input: 'Hello' })
            : await request(app.getHttpServer())
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
    ['POST', '/agents/test-id/chat'],
  ])(
    'rejects invalid-token %s %s and leaves data unchanged',
    async (method: string, path: string) => {
      await prismaService.agent.create({
        data: { name: 'Existing Agent', author: 'user@example.com' },
      });

      const response =
        method === 'POST'
          ? path.endsWith('/chat')
            ? await request(app.getHttpServer())
                .post(path)
                .set('Authorization', 'Bearer invalid')
                .send({ input: 'Hello' })
            : await request(app.getHttpServer())
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

  it('streams AI UI messages for authenticated owner chat', async () => {
    const token: string = await signToken('user@example.com');
    const agent = await prismaService.agent.create({
      data: {
        name: 'Support Agent',
        author: 'user@example.com',
        role: 'Answer support questions.',
      },
    });
    generator.generate.mockResolvedValue({
      uiMessageStream: createUiMessageStream(),
    });

    const response = await request(app.getHttpServer())
      .post(`/agents/${agent.id}/chat`)
      .set('Authorization', `Bearer ${token}`)
      .send({ input: 'Hello' })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.headers['x-vercel-ai-ui-message-stream']).toBe('v1');
    expect(response.text).toContain('"type":"text-delta"');
    expect(response.text).toContain('"delta":"Hello there"');
    expect(pipeUIMessageStreamToResponse.mock.calls).toHaveLength(1);
    expect(generator.generate.mock.calls).toEqual([
      [
        {
          agentRole: 'Answer support questions.',
          messages: [{ role: 'user', content: 'Hello' }],
        },
      ],
    ]);
    await expect(
      prismaService.agent.findUnique({ where: { id: agent.id } }),
    ).resolves.toMatchObject({
      name: 'Support Agent',
      role: 'Answer support questions.',
    });
  });

  it.each([
    ['missing input', {}],
    ['empty string input', { input: '' }],
    ['whitespace input', { input: '   ' }],
    ['invalid message role', { input: [{ role: 'system', content: 'Nope' }] }],
    ['empty message list', { input: [] }],
  ])(
    'returns 400 for chat with %s',
    async (_caseName: string, body: object) => {
      const token: string = await signToken('user@example.com');
      const agent = await prismaService.agent.create({
        data: {
          name: 'Support Agent',
          author: 'user@example.com',
          role: 'Answer support questions.',
        },
      });

      await request(app.getHttpServer())
        .post(`/agents/${agent.id}/chat`)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);

      expect(generator.generate.mock.calls).toHaveLength(0);
      await expect(
        prismaService.agent.findUnique({ where: { id: agent.id } }),
      ).resolves.toMatchObject({
        name: 'Support Agent',
        role: 'Answer support questions.',
      });
    },
  );

  it('returns 403 for cross-owner chat without generation or data changes', async () => {
    const token: string = await signToken('user@example.com');
    const otherAgent = await prismaService.agent.create({
      data: {
        name: 'Other Agent',
        author: 'other@example.com',
        role: 'Other role.',
      },
    });

    await request(app.getHttpServer())
      .post(`/agents/${otherAgent.id}/chat`)
      .set('Authorization', `Bearer ${token}`)
      .send({ input: 'Hello' })
      .expect(403);

    expect(generator.generate.mock.calls).toHaveLength(0);
    await expect(
      prismaService.agent.findUnique({ where: { id: otherAgent.id } }),
    ).resolves.toMatchObject({
      name: 'Other Agent',
      role: 'Other role.',
    });
  });

  it('returns 404 for unknown agent chat before generation', async () => {
    const token: string = await signToken('user@example.com');

    await request(app.getHttpServer())
      .post('/agents/missing-agent/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ input: 'Hello' })
      .expect(404);

    expect(generator.generate.mock.calls).toHaveLength(0);
  });
});

function pipeUiMessageStreamForTest(options: unknown): void {
  if (!isRecord(options) || !isWritableResponseLike(options.response)) {
    throw new Error('Expected UI message stream pipe options.');
  }

  const response: WritableResponseLike = options.response;
  const stream: ReadableStream<UIMessageChunk> =
    options.stream as ReadableStream<UIMessageChunk>;
  response.statusCode =
    typeof options.status === 'number' ? options.status : response.statusCode;
  response.setHeader('content-type', 'text/event-stream');
  response.setHeader('cache-control', 'no-cache');
  response.setHeader('connection', 'keep-alive');
  response.setHeader('x-vercel-ai-ui-message-stream', 'v1');
  response.setHeader('x-accel-buffering', 'no');

  void writeUiMessageStreamForTest(response, stream);
}

async function writeUiMessageStreamForTest(
  response: WritableResponseLike,
  stream: ReadableStream<UIMessageChunk>,
): Promise<void> {
  const reader: ReadableStreamDefaultReader<UIMessageChunk> =
    stream.getReader();

  while (true) {
    const result: ReadableStreamReadResult<UIMessageChunk> =
      await reader.read();
    if (result.done) {
      response.end();
      return;
    }

    response.write(`data: ${JSON.stringify(result.value)}\n\n`);
  }
}

function isWritableResponseLike(value: unknown): value is WritableResponseLike {
  return (
    isRecord(value) &&
    typeof value.statusCode === 'number' &&
    typeof value.setHeader === 'function' &&
    typeof value.write === 'function' &&
    typeof value.end === 'function'
  );
}
