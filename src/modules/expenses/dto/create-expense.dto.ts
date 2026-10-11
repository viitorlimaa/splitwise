import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Supermercado', minLength: 3, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  description!: string;

  @ApiProperty({ example: 15000, description: 'Valor em centavos' })
  @IsInt()
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID do pagador' })
  @IsString()
  @IsNotEmpty()
  payerId!: string;
}
