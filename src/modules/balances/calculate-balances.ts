export type ExpenseForBalance = {
  paidById: string;
  amountCents: number;
  splits: { userId: string; amountCents: number }[];
};

export function calculateBalances(
  memberIds: string[],
  expenses: ExpenseForBalance[],
): { userId: string; balanceCents: number }[] {
  const balances = new Map(memberIds.map((userId) => [userId, 0]));

  for (const expense of expenses) {
    balances.set(
      expense.paidById,
      (balances.get(expense.paidById) ?? 0) + expense.amountCents,
    );

    for (const split of expense.splits) {
      balances.set(
        split.userId,
        (balances.get(split.userId) ?? 0) - split.amountCents,
      );
    }
  }

  return [...balances.entries()]
    .map(([userId, balanceCents]) => ({ userId, balanceCents }))
    .sort((a, b) => (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0));
}
