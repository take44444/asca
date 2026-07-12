import { Transform } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Valid HTTP chat message roles. */
export type AgentChatMessageRoleDto = 'user' | 'assistant' | 'developer';

/** Request body for creating a user-owned agent. */
export class CreateAgentDto {
  /** Non-empty agent name, trimmed before validation. */
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  readonly name!: string;
}

/** Request body for updating a user-owned agent. */
export class UpdateAgentDto {
  /** Optional non-empty agent name, trimmed before validation. */
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(1)
  readonly name?: string;

  /** Optional role instructions. Empty string is valid. */
  @IsOptional()
  @IsString()
  readonly role?: string;
}

/** Request message item for chatting with an agent. */
export class AgentChatMessageDto {
  /** Role for the submitted chat message. */
  @IsIn(['user', 'assistant', 'developer'])
  readonly role!: AgentChatMessageRoleDto;

  /** Text content for the submitted chat message. */
  @IsString()
  readonly content!: string;
}

/** Request body for chatting with an owned agent. */
export class AgentChatRequestDto {
  /** Single user message or ordered conversation messages. */
  @Allow()
  readonly input?: string | readonly AgentChatMessageDto[];

  /** Ordered conversation messages for validation metadata when input is an array. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly messages?: readonly AgentChatMessageDto[];
}

/** HTTP response typing for streamed agent chat output. */
export type AgentChatResponseDto = AsyncIterable<string>;

/** HTTP response for a newly created agent. */
export interface CreatedAgentDto {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;
}

/** HTTP response for one agent with customization details. */
export interface AgentDetailDto {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;

  /** Authenticated owner email address. */
  readonly author: string;

  /** User-authored role instructions. Empty string means unset. */
  readonly role: string;
}

/** HTTP response item for listing owned agents. */
export interface AgentSummaryDto {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;
}
