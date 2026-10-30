/**
 * Formats an amount into Indian Rupee format (e.g. ₹52 or ₹1,450)
 */
export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Formats estimated fulfilment time
 */
export function formatEstTime(mins?: number, mode: 'delivery' | 'pickup' = 'delivery'): string {
  if (!mins) {
    return mode === 'delivery' ? '~30 mins (Est.)' : '~15 mins (Est.)';
  }
  return `~${mins} mins (Est.)`;
}

/**
 * Formats a date string nicely
 */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
