import { describe, expect, it } from 'vitest';
import { splitEqually } from './split-equally.js';

describe('splitEqually', () => {
  it.each([
    {
      totalCents: 1000,
      participantIds: ['user-c', 'user-a', 'user-b'],
      expected: [
        { userId: 'user-a', amountCents: 334 },
        { userId: 'user-b', amountCents: 333 },
        { userId: 'user-c', amountCents: 333 },
      ],
    },
    {
      totalCents: 10,
      participantIds: ['user-b', 'user-a', 'user-c'],
      expected: [
        { userId: 'user-a', amountCents: 4 },
        { userId: 'user-b', amountCents: 3 },
        { userId: 'user-c', amountCents: 3 },
      ],
    },
    {
      totalCents: 1,
      participantIds: ['user-c', 'user-a', 'user-b'],
      expected: [
        { userId: 'user-a', amountCents: 1 },
        { userId: 'user-b', amountCents: 0 },
        { userId: 'user-c', amountCents: 0 },
      ],
    },
    {
      totalCents: 100,
      participantIds: ['user-d', 'user-b', 'user-a', 'user-c'],
      expected: [
        { userId: 'user-a', amountCents: 25 },
        { userId: 'user-b', amountCents: 25 },
        { userId: 'user-c', amountCents: 25 },
        { userId: 'user-d', amountCents: 25 },
      ],
    },
    {
      totalCents: 9,
      participantIds: ['user-b', 'user-a', 'user-c'],
      expected: [
        { userId: 'user-a', amountCents: 3 },
        { userId: 'user-b', amountCents: 3 },
        { userId: 'user-c', amountCents: 3 },
      ],
    },
    {
      totalCents: 5,
      participantIds: ['user-a'],
      expected: [{ userId: 'user-a', amountCents: 5 }],
    },
  ])(
    'splits $totalCents cents deterministically',
    ({ totalCents, participantIds, expected }) => {
      expect(splitEqually(totalCents, participantIds)).toEqual(expected);
    },
  );

  it('preserves the total and never differs by more than 1 cent', () => {
    for (let total = 1; total <= 200; total++) {
      for (let n = 1; n <= 10; n++) {
        const ids = Array.from({ length: n }, (_, i) => `user-${i}`);
        const amounts = splitEqually(total, ids).map(
          (split) => split.amountCents,
        );

        expect(amounts.reduce((a, b) => a + b, 0)).toBe(total);
        expect(Math.max(...amounts) - Math.min(...amounts)).toBeLessThanOrEqual(
          1,
        );
      }
    }
  });

  it('does not mutate the participant ID list', () => {
    const ids = ['b', 'a'];

    splitEqually(10, ids);

    expect(ids).toEqual(['b', 'a']);
  });

  it('rejects invalid totals and empty participants', () => {
    expect(() => splitEqually(0, ['user-a'])).toThrow(RangeError);
    expect(() => splitEqually(1.5, ['user-a'])).toThrow(RangeError);
    expect(() => splitEqually(1, [])).toThrow(RangeError);
  });
});
