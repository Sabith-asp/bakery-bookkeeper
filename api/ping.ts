import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const backendUrl = process.env.RENDER_BACKEND_URL;

  if (!backendUrl) {
    return res.status(500).json({ error: 'RENDER_BACKEND_URL not configured' });
  }

  try {
    const response = await fetch(`${backendUrl}/health`, {
      signal: AbortSignal.timeout(15000),
    });
    return res.status(200).json({
      status: 'pinged',
      backend: response.ok ? 'awake' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(200).json({
      status: 'ping_failed',
      error: error instanceof Error ? error.message : 'unknown',
      timestamp: new Date().toISOString(),
    });
  }
}
