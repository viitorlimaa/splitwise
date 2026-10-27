import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Supermercado', minLength: 3, maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  description!: string;

  @ApiProperty({
    example: 15000,
    description: 'Valor total em centavos',
    maximum: 2147483647,
  })
  @IsInt()
  @IsPositive()
  @Max(2147483647)
  amountCents!: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID do pagador; por padrão, o usuário autenticado',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  paidById?: string;

  @ApiProperty({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    description: 'IDs dos membros entre os quais dividir a despesa',
    required: false,
    uniqueItems: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  participantIds?: string[];
}
