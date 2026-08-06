import { z } from 'zod';

export const ThreatAnalysisSchema = z.object({
  client_ip: z.string().optional().default('127.0.0.1'),
  request_method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  request_path: z.string().min(1),
  payload: z.record(z.any()).optional().default({}),
  headers: z.record(z.string()).optional().default({})
});

export const PatchApplySchema = z.object({
  patch_id: z.string().uuid(),
  approved_by: z.string().optional()
});

export const PolicyUpdateSchema = z.object({
  quarantine_threshold: z.number().int().min(1).max(100).optional(),
  auto_patch_threshold: z.number().int().min(1).max(100).optional(),
  honeypot_redirect_enabled: z.boolean().optional(),
  webhook_url: z.string().url().optional().or(z.literal(''))
});
