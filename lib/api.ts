export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options, credentials: 'include', cache: 'no-store',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !['/auth/login', '/auth/register'].includes(path)) window.dispatchEvent(new Event('triger-auth-expired'));
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.error || 'The store is temporarily unavailable. Please try again.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
export type User = { id: string; email: string; firstName: string; lastName: string; role: 'CUSTOMER' | 'ADMIN' };
export type ApiProduct = { id: string; name: string; slug: string; description: string; price: string; stock: number; imageUrl: string; isActive: boolean };
export type ApiCart = { items: { id: string; quantity: number; product: ApiProduct }[]; subtotal: string; currency: string };
export type ApiOrder = { id: string; total: string; currency: string; paymentStatus: 'PENDING'; status: string };
