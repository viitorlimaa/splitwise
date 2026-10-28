import { describe, expect, it } from 'vitest';
import { calculateBalances } from './calculate-balances.js';
import { simplifyDebts } from './simplify-debts.js';
import { splitEqually } from '../expenses/split-equally.js';

describe('simplifyDebts', () => {
  it('settles Ana, Bia, and Caio with two transfers', () => {
    expect(
      simplifyDebts([
        { userId: 'ana', balanceCents: 6000 },
        { userId: 'bia', balanceCents: -3000 },
        { userId: 'caio', balanceCents: -3000 },
      ]),
    ).toEqual([
      { fromUserId: 'bia', toUserId: 'ana', amountCents: 3000 },
      { fromUserId: 'caio', toUserId: 'ana', amountCents: 3000 },
    ]);
  });

  it('combines a chain of debts into one transfer', () => {
    expect(
      simplifyDebts([
        { userId: 'a', balanceCents: -5000 },
        { userId: 'b', balanceCents: 0 },
        { userId: 'c', balanceCents: 5000 },
      ]),
    ).toEqual([{ fromUserId: 'a', toUserId: 'c', amountCents: 5000 }]);
  });

  it('returns no transfers when every balance is zero', () => {
    expect(
      simplifyDebts([
        { userId: 'a', balanceCents: 0 },
        { userId: 'b', balanceCents: 0 },
      ]),
    ).toEqual([]);
  });

  it('rejects fractional and unbalanced balances', () => {
    expect(() =>
      simplifyDebts([{ userId: 'a', balanceCents: 1.5 }]),
    ).toThrow(RangeError);
    expect(() =>
      simplifyDebts([
        { userId: 'a', balanceCents: -1 },
        { userId: 'b', balanceCents: 2 },
      ]),
    ).toThrow(RangeError);
  });

  it('produces the same transfers regardless of input order', () => {
    const balances = [
      { userId: 'd', balanceCents: 700 },
      { userId: 'b', balanceCents: -500 },
      { userId: 'a', balanceCents: 300 },
      { userId: 'c', balanceCents: -500 },
    ];

    expect(simplifyDebts([...balances].reverse())).toEqual(
      simplifyDebts(balances),
    );
  });

  it('does not mutate the input balances', () => {
    const balances = [
      { userId: 'a', balanceCents: -500 },
      { userId: 'b', balanceCents: 500 },
    ];
    const originalBalances = structuredClone(balances);

    simplifyDebts(balances);

    expect(balances).toEqual(originalBalances);
  });

  it('settles generated expense balances with at most n - 1 transfers', () => {
    for (let memberCount = 1; memberCount <= 8; memberCount++) {
      const memberIds = Array.from(
        { length: memberCount },
        (_, index) => `user-${index}`,
      );

      for (let scenario = 0; scenario < 25; scenario++) {
        const expenses = Array.from({ length: 3 }, (_, expenseIndex) => {
          const participantIds = memberIds.filter(
            (_, index) => (index + expenseIndex + scenario) % 2 === 0,
          );
          const participants =
            participantIds.length > 0 ? participantIds : [memberIds[0]];
          const amountCents =
            memberCount * 17 + scenario * 11 + expenseIndex + 1;

          return {
            paidById: memberIds[(scenario + expenseIndex) % memberCount],
            amountCents,
            splits: splitEqually(amountCents, participants),
          };
        });
        const balances = calculateBalances(memberIds, expenses);
        const transfers = simplifyDebts(balances);
        const settledBalances = new Map(
          balances.map(({ userId, balanceCents }) => [userId, balanceCents]),
        );

        for (const transfer of transfers) {
          expect(transfer.amountCents).toBeGreaterThan(0);
          expect(transfer.fromUserId).not.toBe(transfer.toUserId);
          settledBalances.set(
            transfer.fromUserId,
            settledBalances.get(transfer.fromUserId)! + transfer.amountCents,
          );
          settledBalances.set(
            transfer.toUserId,
            settledBalances.get(transfer.toUserId)! - transfer.amountCents,
          );
        }

        expect(transfers.length).toBeLessThanOrEqual(memberCount - 1);
        expect([...settledBalances.values()].every((balance) => balance === 0))
          .toBe(true);
      }
    }
  });
});
