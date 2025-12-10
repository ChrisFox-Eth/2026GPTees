/**
 * @module services/suno
 * @description Minimal Suno API wrapper (generate music task)
 */

import https from 'https';

const sunoEnabled = (process.env.SOCIAL_SUNO_ENABLED || '').toLowerCase() === 'true';
const sunoApiKey = process.env.SUNO_API_KEY;
const sunoApiUrl = process.env.SUNO_API_URL || 'https://api.kie.ai/api/v1/generate';
const sunoCallbackUrl = process.env.SUNO_CALLBACK_URL || 'https://d6b53d1b9630.ngrok-free.app/api/webhooks/suno';

export async function generateSunoTrack(prompt: string): Promise<{ taskId: string } | null> {
  if (!sunoEnabled || !sunoApiKey) {
    console.warn('Suno disabled or missing API key');
    return null;
  }

  const payload = JSON.stringify({
    prompt,
    customMode: false,
    instrumental: false,
    model: 'V5',
    callBackUrl: sunoCallbackUrl,
    style: 'Ad-friendly background',
    title: 'GPTees Reel Bed',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      sunoApiUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sunoApiKey}`,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8');
            if (res.statusCode && res.statusCode >= 400) {
              console.warn(`Suno HTTP ${res.statusCode}: ${body}`);
              resolve(null);
              return;
            }
            const parsed = JSON.parse(body || '{}');
            const taskId = parsed?.data?.taskId || parsed?.taskId;
            if (!taskId) {
              console.warn(`Suno response missing taskId. Body: ${body}`);
            }
            resolve(taskId ? { taskId } : null);
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
