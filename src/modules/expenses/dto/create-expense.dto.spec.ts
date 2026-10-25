import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExpenseDto } from './create-expense.dto.js';

describe('CreateExpenseDto', () => {
  it('trims the description before validating its length', async () => {
    const dto = plainToInstance(CreateExpenseDto, {
      description: '  a  ',
      amountCents: 100,
    });

    expect(dto.description).toBe('a');
    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'description',
          constraints: expect.objectContaining({
            minLength: expect.any(String),
          }),
        }),
      ]),
    );
  });

  it('accepts optional payer and unique UUID participants', async () => {
    const dto = plainToInstance(CreateExpenseDto, {
      description: '  Jantar  ',
      amountCents: 100,
      participantIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    });

    expect(dto.description).toBe('Jantar');
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects duplicate participants', async () => {
    const participantId = '550e8400-e29b-41d4-a716-446655440000';
    const dto = plainToInstance(CreateExpenseDto, {
      description: 'Jantar',
      amountCents: 100,
      participantIds: [participantId, participantId],
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'participantIds',
          constraints: expect.objectContaining({
            arrayUnique: expect.any(String),
          }),
        }),
      ]),
    );
  });
});
