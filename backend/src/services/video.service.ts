/**
 * @module services/video
 * @description Sora video generation helper (OpenAI /v1/videos)
 */

import { uploadBufferDirect } from './supabase-storage.service.js';
import { AppError } from '../middleware/error.middleware.js';

const openaiApiKey = process.env.OPENAI_API_KEY;
const soraEnabled = process.env.SOCIAL_SORA_ENABLED === 'true';

type VideoJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface VideoJob {
  id: string;
  status: VideoJobStatus;
  model: string;
  prompt: string;
  size?: string;
  seconds?: string;
  error?: { message?: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function createJob(prompt: string): Promise<VideoJob> {
  const form = new FormData();
  form.append('model', 'sora-2');
  form.append('prompt', prompt);
  form.append('size', '720x1280');
  form.append('seconds', '8');

  const res = await fetch('https://api.openai.com/v1/videos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new AppError(`Sora create failed: ${res.status} ${text}`, 500);
  }
  return (await res.json()) as VideoJob;
}

async function pollJob(jobId: string): Promise<VideoJob> {
  const res = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${openaiApiKey}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new AppError(`Sora poll failed: ${res.status} ${text}`, 500);
  }
  return (await res.json()) as VideoJob;
}

async function downloadContent(jobId: string): Promise<Buffer> {
  const res = await fetch(`https://api.openai.com/v1/videos/${jobId}/content`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${openaiApiKey}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new AppError(`Sora download failed: ${res.status} ${text}`, 500);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Create a Sora video job and wait until completion (best effort).
 */
export async function generateSoraVideo(prompt: string): Promise<{ url: string; jobId: string } | null> {
  if (!soraEnabled || !openaiApiKey) return null;

  let job: VideoJob;
  try {
    job = await createJob(prompt);
  } catch (err: any) {
    console.warn('Sora create failed', err?.message || err);
    return null;
  }
  const jobId = job.id;
  let status = job.status;
  let current = job;
  const start = Date.now();
  let attempts = 0;

  while (status !== 'completed' && status !== 'failed' && Date.now() - start < 240000) {
    await sleep(5000);
    attempts += 1;
    try {
      current = await pollJob(jobId);
      status = current.status;
    } catch (err: any) {
      console.warn(`Sora poll failed for job ${jobId}`, err?.message || err);
      if (attempts >= 3) return null;
    }
  }

  if (status !== 'completed') {
    console.warn(`Sora job ${jobId} ended with status ${status}`);
    return null;
  }

  let buffer: Buffer;
  try {
    buffer = await downloadContent(jobId);
  } catch (err: any) {
    console.warn(`Sora download failed for job ${jobId}`, err?.message || err);
    return null;
  }

  const publicUrl = await uploadBufferDirect(`video-${jobId}`, buffer, 'mp4', 'video/mp4');
  return { url: publicUrl, jobId };
}

export async function pollSoraJob(jobId: string): Promise<{ url: string; jobId: string } | null> {
  if (!soraEnabled || !openaiApiKey) return null;
  let status: VideoJobStatus = 'queued';
  let attempts = 0;
  const start = Date.now();
  while (status !== 'completed' && status !== 'failed' && Date.now() - start < 240000) {
    await sleep(5000);
    attempts += 1;
    try {
      const current = await pollJob(jobId);
      status = current.status;
    } catch (err: any) {
      console.warn(`Sora poll failed for job ${jobId}`, err?.message || err);
      if (attempts >= 3) return null;
    }
  }
  if (status !== 'completed') {
    console.warn(`Sora job ${jobId} ended with status ${status}`);
    return null;
  }
  let buffer: Buffer;
  try {
    buffer = await downloadContent(jobId);
  } catch (err: any) {
    console.warn(`Sora download failed for job ${jobId}`, err?.message || err);
    return null;
  }
  const publicUrl = await uploadBufferDirect(`video-${jobId}`, buffer, 'mp4', 'video/mp4');
  return { url: publicUrl, jobId };
}
