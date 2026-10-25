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

  it.each([
    { totalCents: 1, participantIds: ['c', 'a', 'b'] },
    { totalCents: 10, participantIds: ['b', 'a', 'c'] },
    { totalCents: 101, participantIds: ['c', 'b', 'a', 'd'] },
  ])(
    'always preserves the total of $totalCents cents',
    ({ totalCents, participantIds }) => {
      const splits = splitEqually(totalCents, participantIds);

      expect(
        splits.reduce((total, split) => total + split.amountCents, 0),
      ).toBe(totalCents);
    },
  );

  it('rejects invalid totals and empty participants', () => {
    expect(() => splitEqually(0, ['user-a'])).toThrow(RangeError);
    expect(() => splitEqually(1.5, ['user-a'])).toThrow(RangeError);
    expect(() => splitEqually(1, [])).toThrow(RangeError);
  });
});
