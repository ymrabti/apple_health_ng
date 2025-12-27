export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${year}-${month}-${day}`;
}
