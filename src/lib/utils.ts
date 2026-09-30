export function cleanPhone(raw: string): { phoneClean: string; isValid: boolean } {
  if (!raw) return { phoneClean: '', isValid: false };
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10) {
    return { phoneClean: `+91${digits}`, isValid: true };
  } else if (digits.length === 12 && digits.startsWith('91')) {
    return { phoneClean: `+${digits}`, isValid: true };
  } else if (digits.length === 11 && digits.startsWith('0')) {
    return { phoneClean: `+91${digits.slice(1)}`, isValid: true };
  }

  return { phoneClean: digits ? `+${digits}` : '', isValid: false };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateReorderDueDate(orderDateStr?: string, days = 25): string {
  const base = orderDateStr ? new Date(orderDateStr) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

export function formatTimeAgo(isoString: string): string {
  if (!isoString) return 'Just now';
  const now = new Date().getTime();
  const past = new Date(isoString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
