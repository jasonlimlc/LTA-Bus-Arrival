import type { Request, Response } from 'express';

const LTA_BUS_ARRIVAL_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

/**
 * Serverless proxy endpoint for Singapore LTA DataMall Bus Arrival v3.
 *
 * GET /api/busarrival?BusStopCode=83139
 * Optional query: &ServiceNo=15
 *
 * Headers forwarded:
 * - AccountKey: Provided via process.env.LTA_ACCOUNT_KEY or request header 'AccountKey'
 * - accept: application/json
 */
export default async function handler(req: Request | any, res: Response | any) {
  // CORS Headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');
  }

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status ? res.status(204).end() : new Response(null, { status: 204 });
  }

  if (req.method !== 'GET') {
    const errorJson = { error: 'Method Not Allowed', message: 'Only GET requests are supported' };
    return res.status ? res.status(405).json(errorJson) : new Response(JSON.stringify(errorJson), { status: 405 });
  }

  // Extract BusStopCode from query params (supporting Express req.query or standard URL)
  let busStopCode: string | undefined;
  let serviceNo: string | undefined;

  if (req.query) {
    busStopCode = (req.query.BusStopCode || req.query.busStopCode || req.query.busstopcode) as string;
    serviceNo = (req.query.ServiceNo || req.query.serviceNo || req.query.serviceno) as string;
  } else if (req.url) {
    const parsedUrl = new URL(req.url, 'http://localhost');
    busStopCode = parsedUrl.searchParams.get('BusStopCode') || parsedUrl.searchParams.get('busStopCode') || undefined;
    serviceNo = parsedUrl.searchParams.get('ServiceNo') || parsedUrl.searchParams.get('serviceNo') || undefined;
  }

  if (!busStopCode) {
    const err = {
      error: 'Missing required query parameter',
      parameter: 'BusStopCode',
      example: '/api/busarrival?BusStopCode=83139',
    };
    return res.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400 });
  }

  // Retrieve AccountKey without hardcoding: checks environment variables or client headers
  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_API_KEY ||
    (req.headers ? (req.headers['accountkey'] || req.headers['x-account-key'] || req.headers['AccountKey']) : undefined);

  if (!accountKey || accountKey.trim().length === 0) {
    const keyMissingErr = {
      error: 'LTA AccountKey not configured',
      message:
        'Please set LTA_ACCOUNT_KEY in your environment variables (.env / Secrets) or pass it via the "AccountKey" request header. No keys are hardcoded.',
      docs: 'https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
    };
    return res.status ? res.status(401).json(keyMissingErr) : new Response(JSON.stringify(keyMissingErr), { status: 401 });
  }

  try {
    // Construct LTA DataMall v3 target URL
    const targetUrl = new URL(LTA_BUS_ARRIVAL_URL);
    targetUrl.searchParams.set('BusStopCode', busStopCode.trim());
    if (serviceNo && serviceNo.trim()) {
      targetUrl.searchParams.set('ServiceNo', serviceNo.trim());
    }

    const ltaResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json',
      },
    });

    const contentType = ltaResponse.headers.get('content-type') || '';
    if (!ltaResponse.ok) {
      const errorText = await ltaResponse.text();
      const upstreamErr = {
        error: 'LTA DataMall upstream returned an error',
        status: ltaResponse.status,
        statusText: ltaResponse.statusText,
        upstreamBody: errorText,
      };
      return res.status ? res.status(ltaResponse.status).json(upstreamErr) : new Response(JSON.stringify(upstreamErr), { status: ltaResponse.status });
    }

    let data: any;
    if (contentType.includes('application/json')) {
      data = await ltaResponse.json();
    } else {
      const rawText = await ltaResponse.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }
    }

    if (res.status && res.json) {
      return res.status(200).json(data);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const networkErr = {
      error: 'Failed to connect to LTA DataMall service',
      details: error.message || 'Unknown network error',
      target: LTA_BUS_ARRIVAL_URL,
    };
    return res.status ? res.status(502).json(networkErr) : new Response(JSON.stringify(networkErr), { status: 502 });
  }
}
