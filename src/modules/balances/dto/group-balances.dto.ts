import { ApiProperty } from '@nestjs/swagger';

export class MemberBalanceDto {
  @ApiProperty({ description: 'ID do usuário' })
  userId!: string;

  @ApiProperty({ type: String, nullable: true })
  name!: string | null;

  @ApiProperty({
    description: 'Em centavos. Positivo = a receber; negativo = a pagar.',
    example: 6000,
  })
  balanceCents!: number;
}

export class GroupBalancesDto {
  @ApiProperty({ description: 'ID do grupo' })
  groupId!: string;

  @ApiProperty({ type: [MemberBalanceDto] })
  balances!: MemberBalanceDto[];
}
