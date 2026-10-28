import { ApiProperty } from '@nestjs/swagger';

export class SettlementTransferDto {
  @ApiProperty({ description: 'ID do membro que deve pagar' })
  fromUserId!: string;

  @ApiProperty({ type: String, nullable: true })
  fromName!: string | null;

  @ApiProperty({ description: 'ID do membro que deve receber' })
  toUserId!: string;

  @ApiProperty({ type: String, nullable: true })
  toName!: string | null;

  @ApiProperty({
    description: 'Valor da transferência em centavos',
    example: 3000,
  })
  amountCents!: number;
}

export class GroupSettlementsDto {
  @ApiProperty({ description: 'ID do grupo' })
  groupId!: string;

  @ApiProperty({ type: [SettlementTransferDto] })
  transfers!: SettlementTransferDto[];
}
