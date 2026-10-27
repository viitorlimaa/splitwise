import { describe, expect, it } from 'vitest';
import { splitEqually } from '../expenses/split-equally.js';
import { calculateBalances } from './calculate-balances.js';

describe('calculateBalances', () => {
  it('calculates balances for Ana, Bia, and Caio', () => {
    const balances = calculateBalances(
      ['user-c', 'user-a', 'user-b'],
      [
        {
          paidById: 'user-a',
          amountCents: 9000,
          splits: [
            { userId: 'user-a', amountCents: 3000 },
            { userId: 'user-b', amountCents: 3000 },
            { userId: 'user-c', amountCents: 3000 },
          ],
        },
      ],
    );

    expect(balances).toEqual([
      { userId: 'user-a', balanceCents: 6000 },
      { userId: 'user-b', balanceCents: -3000 },
      { userId: 'user-c', balanceCents: -3000 },
    ]);
  });

  it('includes a payer outside the participants and keeps the total balanced', () => {
    const balances = calculateBalances(
      ['user-a', 'user-b', 'user-c'],
      [
        {
          paidById: 'user-a',
          amountCents: 6000,
          splits: [
            { userId: 'user-b', amountCents: 3000 },
            { userId: 'user-c', amountCents: 3000 },
          ],
        },
      ],
    );

    expect(balances).toEqual([
      { userId: 'user-a', balanceCents: 6000 },
      { userId: 'user-b', balanceCents: -3000 },
      { userId: 'user-c', balanceCents: -3000 },
    ]);
  });

  it('combines multiple expenses paid by different members', () => {
    expect(
      calculateBalances(
        ['user-a', 'user-b'],
        [
          {
            paidById: 'user-a',
            amountCents: 1000,
            splits: [
              { userId: 'user-a', amountCents: 500 },
              { userId: 'user-b', amountCents: 500 },
            ],
          },
          {
            paidById: 'user-b',
            amountCents: 1000,
            splits: [
              { userId: 'user-a', amountCents: 500 },
              { userId: 'user-b', amountCents: 500 },
            ],
          },
        ],
      ),
    ).toEqual([
      { userId: 'user-a', balanceCents: 0 },
      { userId: 'user-b', balanceCents: 0 },
    ]);
  });

  it('includes members with no expenses at zero balance', () => {
    expect(calculateBalances(['user-b', 'user-a'], [])).toEqual([
      { userId: 'user-a', balanceCents: 0 },
      { userId: 'user-b', balanceCents: 0 },
    ]);
  });

  it('includes IDs found only in expenses', () => {
    expect(
      calculateBalances(
        ['member'],
        [
          {
            paidById: 'outsider-payer',
            amountCents: 500,
            splits: [{ userId: 'outsider-split', amountCents: 500 }],
          },
        ],
      ),
    ).toEqual([
      { userId: 'member', balanceCents: 0 },
      { userId: 'outsider-payer', balanceCents: 500 },
      { userId: 'outsider-split', balanceCents: -500 },
    ]);
  });

  it('preserves a zero sum for varied generated expenses', () => {
    for (let total = 1; total <= 200; total++) {
      for (let memberCount = 1; memberCount <= 10; memberCount++) {
        const memberIds = Array.from(
          { length: memberCount },
          (_, index) => `user-${index}`,
        );
        const splits = splitEqually(total, memberIds);
        const expenses = [
          {
            paidById: memberIds[total % memberCount],
            amountCents: total,
            splits,
          },
        ];
        const balances = calculateBalances(memberIds, expenses);

        expect(
          balances.reduce((sum, balance) => sum + balance.balanceCents, 0),
        ).toBe(0);
      }
    }
  });
});
