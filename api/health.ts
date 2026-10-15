import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: {
    nodeVersion: string;
    ltaKeyConfigured: boolean;
  };
}

/**
 * Serverless health check endpoint.
 * GET /api/health
 */
export default async function handler(req: Request | any, res: Response | any) {
  // CORS Headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');
  }

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(204).end() : new Response(null, { status: 204 });
  }

  const ltaKey = process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY || process.env.LTA_API_KEY;
  const isKeyConfigured = Boolean(ltaKey && ltaKey.trim().length > 0);

  const payload: HealthResponse = {
    status: 'ok',
    service: 'LTA Datamall Bus Arrival API Proxy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: {
      nodeVersion: process.version || 'unknown',
      ltaKeyConfigured: isKeyConfigured,
    },
  };

  if (res.status && res.json) {
    return res.status(200).json(payload);
  }

  // Standard Web API / Fetch Response fallback for edge runtimes
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
