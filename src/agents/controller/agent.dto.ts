import { Transform } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';

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

/** HTTP response for a newly created agent. */
export interface CreatedAgentDto {
  /** Unique immutable agent identifier. */
  readonly id: string;

  /** User-visible agent name. */
  readonly name: string;

  /** Authenticated owner email address. */
  readonly author: string;
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
