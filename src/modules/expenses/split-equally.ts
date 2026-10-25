export function splitEqually(
  totalCents: number,
  participantIds: string[],
): { userId: string; amountCents: number }[] {
  if (
    !Number.isInteger(totalCents) ||
    totalCents <= 0 ||
    participantIds.length === 0
  ) {
    throw new RangeError(
      'A positive integer total and participants are required',
    );
  }

  const sortedParticipantIds = [...participantIds].sort();
  const baseShare = Math.floor(totalCents / sortedParticipantIds.length);
  const remainder = totalCents % sortedParticipantIds.length;

  return sortedParticipantIds.map((userId, index) => ({
    userId,
    amountCents: baseShare + (index < remainder ? 1 : 0),
  }));
}
