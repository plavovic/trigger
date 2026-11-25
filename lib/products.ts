import type { ApiProduct } from './api';

export type Product = {
  id: string; number: string; name: string; description: string;
  price: string; image: string; accent?: 'red' | 'purple';
};
export const fallbackProducts: Product[] = [
  { id: 'product01', number: '01', name: 'Workhorse', description: 'A dependable everyday bait for confident sessions.', price: '€12,90', image: '/product01.png' },
  { id: 'product02', number: '02', name: 'The One', description: 'A distinctive profile designed to trigger a response.', price: '€12,90', image: '/product02.png', accent: 'red' },
  { id: 'product03', number: '03', name: 'Purple Kraken', description: 'A deep, characterful bait for pressured waters.', price: '€12,90', image: '/product03.png', accent: 'purple' },
  { id: 'product4', number: '04', name: 'Trigger 04', description: 'Precision bait made for consistent performance.', price: '€12,90', image: '/product4.png' },
  { id: 'product5', number: '05', name: 'Trigger 05', description: 'A refined profile for focused sessions.', price: '€12,90', image: '/product5.png', accent: 'purple' },
  { id: 'product6', number: '06', name: 'Trigger 06', description: 'Built to keep the response switched on.', price: '€12,90', image: '/product6.png', accent: 'red' },
];
// Preserve the original numbering and card colors. Commerce data comes from the API.
const presentation: Record<string, { number: string; accent?: 'red' | 'purple' }> = {
  product01: { number: '01' }, product02: { number: '02', accent: 'red' },
  product03: { number: '03', accent: 'purple' }, product4: { number: '04' },
  product5: { number: '05', accent: 'purple' }, product6: { number: '06', accent: 'red' },
};
export function displayProduct(item: ApiProduct, index: number): Product {
  return {
    id: item.id, name: item.name, description: item.description, image: item.imageUrl,
    number: presentation[item.id]?.number ?? String(index + 1).padStart(2, '0'),
    accent: presentation[item.id]?.accent,
    // Numeric conversion is display-only. Backend arithmetic uses Prisma.Decimal.
    price: formatEur(item.price),
  };
}
export function formatEur(amount: string): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number(amount));
}
