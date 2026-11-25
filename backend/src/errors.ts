import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ApiError) { res.status(error.status).json({ error: error.message }); return; }
  if (error instanceof ZodError) { res.status(400).json({ error: 'Invalid request', fields: error.issues.map(issue => issue.path.join('.')) }); return; }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const status = error.code === 'P2025' ? 404 : ['P2002', 'P2003', 'P2034'].includes(error.code) ? 409 : 500;
    res.status(status).json({ error: status === 404 ? 'Not found' : status === 409 ? 'Conflict with existing data; retry or check your request' : 'Internal server error' }); return;
  }
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500;
  if (status === 400 || status === 413) { res.status(status).json({ error: status === 413 ? 'Request body too large' : 'Invalid JSON' }); return; }
  // Do not log raw Prisma errors, request bodies, credentials, or session cookies.
  console.error('Unhandled API error', error instanceof Error ? error.name : 'UnknownError');
  res.status(500).json({ error: 'Internal server error' });
};
