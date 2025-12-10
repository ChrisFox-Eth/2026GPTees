/**
 * @module services/veo
 * @description Kie.ai Veo3.1 video generation helper
 */

import https from 'https';

const veoEnabled = (process.env.SOCIAL_VEO_ENABLED || '').toLowerCase() === 'true';
const veoApiKey = process.env.KIE_VEO_API_KEY;
const veoApiUrl = process.env.KIE_VEO_API_URL || 'https://api.kie.ai/api/v1/veo/generate';
const veoCallbackUrl = process.env.KIE_VEO_CALLBACK_URL || 'https://d6b53d1b9630.ngrok-free.app/api/webhooks/veo';

export async function generateVeoVideo(prompt: string): Promise<{ taskId: string } | null> {
  if (!veoEnabled || !veoApiKey) {
    console.warn('Veo disabled or missing API key');
    return null;
  }

  const payload = JSON.stringify({
    prompt,
    model: 'veo3',
    aspectRatio: '9:16',
    callBackUrl: veoCallbackUrl,
  });

  return new Promise((resolve) => {
    const req = https.request(
      veoApiUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${veoApiKey}`,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode && res.statusCode >= 400) {
            console.warn(`Veo HTTP ${res.statusCode}: ${body}`);
            resolve(null);
            return;
          }
          try {
            const parsed = JSON.parse(body || '{}');
            const taskId = parsed?.data?.taskId || parsed?.taskId;
            if (!taskId) {
              console.warn(`Veo response missing taskId. Body: ${body}`);
              resolve(null);
              return;
            }
            resolve({ taskId });
          } catch (err) {
            console.warn('Veo parse error', err);
            resolve(null);
          }
        });
      }
    );
    req.on('error', (err) => {
      console.warn('Veo request error', err);
      resolve(null);
    });
    req.write(payload);
    req.end();
  });
}
