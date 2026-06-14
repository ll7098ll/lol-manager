export function formatCurrency(amount: number): string {
  if (amount === 0) return '0원';
  
  if (amount >= 10000) {
    const uk = Math.floor(amount / 10000);
    const man = amount % 10000;
    if (man === 0) return `${uk.toLocaleString()}억 원`;
    return `${uk.toLocaleString()}억 ${man.toLocaleString()}만 원`;
  }
  
  return `${amount.toLocaleString()}만 원`;
}
