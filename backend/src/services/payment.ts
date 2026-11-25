import { ApiError } from '../errors';
export function checkoutUnavailable(): never {
  // TODO: validate an owned PENDING order, reserve stock, and create a provider
  // session using the stored EUR total and an idempotency key. Persist its reference.
  // A frontend success URL must NEVER change paymentStatus.
  throw new ApiError(501, 'Payments are not configured');
}
export function webhookUnavailable(): never {
  // TODO: verify provider signature against the RAW request bytes before parsing.
  // Deduplicate provider event IDs in PostgreSQL; verify order, currency, reference,
  // and amount. Atomically set PAID/PROCESSING only after verified successful payment.
  // Handle retries, failed payments, refunds, and reservation expiry separately.
  throw new ApiError(501, 'Payments are not configured');
}
