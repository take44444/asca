import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { type OpenAIProvider } from '@ai-sdk/openai';
import { type LanguageModel, type ModelMessage } from 'ai';
import {
  ChatMessage,
  ChatResponseStream,
} from '../chat-agent/agent-chat.model';
import {
  GenerateAgentResponseRequest,
  GenerateAgentResponseService,
} from './generate-agent-response.service.interface';
import { loadAiSdk, AiSdkBindings } from './ai-sdk.loader';

/** AI SDK backed provider service for agent chat response generation. */
@Injectable()
export class GenerateOpenAiAgentResponseService implements GenerateAgentResponseService {
  private readonly instructionPath: string = join(__dirname, 'instructions.md');

  /** Starts OpenAI text stream generation for an authorized chat request. */
  async generate(
    request: GenerateAgentResponseRequest,
  ): Promise<ChatResponseStream> {
    const modelName: string | undefined = process.env.ASCA_MODEL;
    if (modelName === undefined || modelName.trim() === '') {
      throw new InternalServerErrorException('ASCA_MODEL is not configured.');
    }

    const instructions: string = this.loadInstructions();
    const aiSdk: AiSdkBindings = await loadAiSdk();
    const openaiProvider: OpenAIProvider = aiSdk.createOpenAI();
    const model: LanguageModel = openaiProvider(modelName.trim());

    try {
      const result = aiSdk.streamText({
        model,
        instructions,
        messages: this.toModelMessages(request),
      });
      return {
        uiMessageStream: aiSdk.toUIMessageStream({
          stream: result.stream,
          onError: (): string => 'Agent response stream failed.',
        }),
      };
    } catch {
      throw new BadGatewayException('Agent response generation failed.');
    }
  }

  private loadInstructions(): string {
    const instructions: string = readFileSync(
      this.resolveInstructionPath(),
      'utf8',
    );
    if (instructions.trim() === '') {
      throw new InternalServerErrorException(
        'Agent response instructions are empty.',
      );
    }

    return instructions;
  }

  private resolveInstructionPath(): string {
    if (existsSync(this.instructionPath)) {
      return this.instructionPath;
    }

    return join(
      process.cwd(),
      'src/agents/service/generate-agent-response/instructions.md',
    );
  }

  private toModelMessages(
    request: GenerateAgentResponseRequest,
  ): ModelMessage[] {
    const messages: ModelMessage[] = request.messages.map(
      (message: ChatMessage): ModelMessage => this.toModelMessage(message),
    );
    const hasDeveloperMessage: boolean = request.messages.some(
      (message: ChatMessage): boolean => message.role === 'developer',
    );
    const trimmedRole: string = request.agentRole.trim();

    if (!hasDeveloperMessage && trimmedRole !== '') {
      return [{ role: 'system', content: trimmedRole }, ...messages];
    }

    return messages;
  }

  private toModelMessage(message: ChatMessage): ModelMessage {
    if (message.role === 'developer') {
      return { role: 'system', content: message.content };
    }
    return {
      role: message.role,
      content: message.content,
    };
  }
}
