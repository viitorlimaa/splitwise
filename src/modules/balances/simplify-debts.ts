export type Balance = { userId: string; balanceCents: number };
export type Transfer = {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
};

export function simplifyDebts(balances: Balance[]): Transfer[] {
  if (
    balances.some((balance) => !Number.isInteger(balance.balanceCents)) ||
    balances.reduce((sum, balance) => sum + balance.balanceCents, 0) !== 0
  ) {
    throw new RangeError('Balances must be integers that sum to zero');
  }

  const debtors = balances
    .filter((balance) => balance.balanceCents < 0)
    .map(({ userId, balanceCents }) => ({
      userId,
      remainingCents: -balanceCents,
    }));
  const creditors = balances
    .filter((balance) => balance.balanceCents > 0)
    .map(({ userId, balanceCents }) => ({
      userId,
      remainingCents: balanceCents,
    }));
  const transfers: Transfer[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(
      (a, b) =>
        b.remainingCents - a.remainingCents ||
        (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0),
    );
    creditors.sort(
      (a, b) =>
        b.remainingCents - a.remainingCents ||
        (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0),
    );

    const debtor = debtors[0];
    const creditor = creditors[0];
    const amountCents = Math.min(
      debtor.remainingCents,
      creditor.remainingCents,
    );

    transfers.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amountCents,
    });

    debtor.remainingCents -= amountCents;
    creditor.remainingCents -= amountCents;

    if (debtor.remainingCents === 0) {
      debtors.shift();
    }
    if (creditor.remainingCents === 0) {
      creditors.shift();
    }
  }

  return transfers;
}
