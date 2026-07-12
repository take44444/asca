import {
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { type LanguageModel, type UIMessageChunk } from 'ai';
import { GenerateOpenAiAgentResponseService } from './generate-agent-response.service';
import { loadAiSdk } from './ai-sdk.loader';

jest.mock('./ai-sdk.loader', () => ({
  loadAiSdk: jest.fn(),
}));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const createUiMessageStream = (): ReadableStream<UIMessageChunk> =>
  new ReadableStream<UIMessageChunk>({
    start(controller: ReadableStreamDefaultController<UIMessageChunk>): void {
      controller.enqueue({ type: 'text-start', id: '0' });
      controller.enqueue({ type: 'text-delta', id: '0', delta: 'Generated' });
      controller.enqueue({ type: 'text-end', id: '0' });
      controller.close();
    },
  });

describe('GenerateOpenAiAgentResponseService', () => {
  const previousModel: string | undefined = process.env.ASCA_MODEL;
  let service: GenerateOpenAiAgentResponseService;
  let model: LanguageModel;
  let provider: jest.Mock<LanguageModel, [string]>;
  let streamText: jest.Mock<unknown, [unknown]>;
  let toUIMessageStream: jest.Mock<ReadableStream<UIMessageChunk>, [unknown]>;
  let pipeUIMessageStreamToResponse: jest.Mock<void, [unknown]>;
  let createOpenAI: jest.Mock;
  let textPartStream: ReadableStream<unknown>;
  let uiMessageStream: ReadableStream<UIMessageChunk>;

  beforeEach(() => {
    process.env.ASCA_MODEL = 'gpt-test';
    model = { provider: 'openai', modelId: 'gpt-test' } as LanguageModel;
    provider = jest.fn<LanguageModel, [string]>(() => model);
    createOpenAI = jest.fn(() => provider);
    textPartStream = new ReadableStream<unknown>();
    uiMessageStream = createUiMessageStream();
    streamText = jest.fn<unknown, [unknown]>().mockReturnValue({
      stream: textPartStream,
    });
    toUIMessageStream = jest
      .fn<ReadableStream<UIMessageChunk>, [unknown]>()
      .mockReturnValue(uiMessageStream);
    pipeUIMessageStreamToResponse = jest.fn<void, [unknown]>();
    jest.mocked(loadAiSdk).mockResolvedValue({
      createOpenAI,
      streamText: streamText as unknown as Awaited<
        ReturnType<typeof loadAiSdk>
      >['streamText'],
      toUIMessageStream: toUIMessageStream as unknown as Awaited<
        ReturnType<typeof loadAiSdk>
      >['toUIMessageStream'],
      pipeUIMessageStreamToResponse:
        pipeUIMessageStreamToResponse as unknown as Awaited<
          ReturnType<typeof loadAiSdk>
        >['pipeUIMessageStreamToResponse'],
    });
    service = new GenerateOpenAiAgentResponseService();
  });

  afterEach(() => {
    process.env.ASCA_MODEL = previousModel;
    jest.resetAllMocks();
  });

  it('loads instructions.md, uses ASCA_MODEL, and returns a UI message stream', async () => {
    const response = await service.generate({
      agentRole: 'Answer support questions.',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(response.uiMessageStream).toBe(uiMessageStream);
    expect(createOpenAI.mock.calls).toEqual([[]]);
    expect(provider).toHaveBeenCalledWith('gpt-test');
    const streamTextCall: unknown = streamText.mock.calls[0]?.[0];
    expect(isRecord(streamTextCall)).toBe(true);
    if (!isRecord(streamTextCall)) {
      throw new Error('Expected streamText options to be an object.');
    }
    expect(streamTextCall.model).toBe(model);
    expect(streamTextCall.instructions).toEqual(
      expect.stringContaining('A.S.C.A.'),
    );
    expect(streamTextCall.messages).toEqual([
      { role: 'system', content: 'Answer support questions.' },
      { role: 'user', content: 'Hello' },
    ]);
    expect(toUIMessageStream.mock.calls[0]?.[0]).toMatchObject({
      stream: textPartStream,
    });
  });

  it('requires ASCA_MODEL before provider generation starts', async () => {
    process.env.ASCA_MODEL = '';

    await expect(
      service.generate({
        agentRole: '',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(streamText).not.toHaveBeenCalled();
  });

  it('maps provider start failures to a clear operational error', async () => {
    jest.mocked(streamText).mockImplementation(() => {
      throw new Error('provider unavailable');
    });

    await expect(
      service.generate({
        agentRole: '',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('preserves developer messages and skips automatic role injection', async () => {
    await service.generate({
      agentRole: 'Answer support questions.',
      messages: [
        { role: 'developer', content: 'Keep answers concise.' },
        { role: 'user', content: 'Hello' },
      ],
    });

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'Keep answers concise.' },
          { role: 'user', content: 'Hello' },
        ],
      }),
    );
  });

  it('maps UI stream failures to a clear operational message', async () => {
    await service.generate({
      agentRole: '',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    const toUIMessageStreamCall: unknown = toUIMessageStream.mock.calls[0]?.[0];
    expect(isRecord(toUIMessageStreamCall)).toBe(true);
    if (!isRecord(toUIMessageStreamCall)) {
      throw new Error('Expected toUIMessageStream options to be an object.');
    }
    expect(typeof toUIMessageStreamCall.onError).toBe('function');
    const onError = toUIMessageStreamCall.onError as (error: unknown) => string;
    expect(onError(new Error('stream failed'))).toBe(
      'Agent response stream failed.',
    );
  });
});
