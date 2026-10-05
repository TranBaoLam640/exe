export function depositProgress(order, refunds = []) {
  const refund = refunds.find((item) => item.type === 'deposit' && !['cancelled', 'rejected'].includes(item.status));
  const hasProof = Boolean(refund?.proofPhotoIds?.length);
  const complete = order.status === 'returned' && refund?.status === 'completed' && hasProof;
  return {
    refund,
    complete,
    step: order.status !== 'returned' ? 0 : !refund ? 1 : !complete ? 2 : 3,
  };
}
