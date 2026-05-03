export function formatAmount(value: string | number, maxFraction = 2): string {
  const n = typeof value === 'string' ? parseFloat(value || '0') : value;
  if (!isFinite(n)) return '0';
  return n.toLocaleString(undefined, {
    maximumFractionDigits: maxFraction,
    minimumFractionDigits: 0,
  });
}

export function formatRate(n: number): string {
  if (!isFinite(n)) return '—';
  if (n >= 100) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function formatUpdated(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mn = String(d.getMinutes()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${mn}`;
  } catch { return iso; }
}

export function applyKey(current: string, key: string): string {
  if (key === 'CE') return '0';
  if (key === 'BACK') {
    const n = current.length <= 1 ? '0' : current.slice(0, -1);
    return n === '-' || n === '' ? '0' : n;
  }
  if (key === '.') {
    if (current.includes('.')) return current;
    return current + '.';
  }
  if (current === '0') return key;
  // limit length
  if (current.replace('.', '').length >= 12) return current;
  return current + key;
}
