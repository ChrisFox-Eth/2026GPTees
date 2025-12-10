/**
 * @module services/ffmpeg
 * @description Stitch images into gif/mp4 and optionally mux audio
 */

import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { uploadBufferDirect } from './supabase-storage.service.js';

async function runFfmpeg(args: string[], inputFiles: { name: string; buffer: Buffer }[]) {
  const tmpdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'gptees-'));
  try {
    for (const file of inputFiles) {
      await fs.promises.writeFile(path.join(tmpdir, file.name), file.buffer);
    }
    const proc = spawn('ffmpeg', args, { cwd: tmpdir });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    proc.stdout.on('data', (d) => stdout.push(d));
    proc.stderr.on('data', (d) => stderr.push(d));
    await new Promise<void>((resolve, reject) => {
      proc.on('error', (err) => reject(err));
      proc.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited ${code}: ${Buffer.concat(stderr).toString()}`));
      });
    });
    return { tmpdir };
  } finally {
    // caller will clean up if needed
  }
}

const buildNormalizeFilter = (fps: number) =>
  `scale=720:-2:force_original_aspect_ratio=decrease,pad=720:1280:(720-iw)/2:(1280-ih)/2:black,fps=${fps},setsar=1`;

export async function stitchFramesToGif(frames: { name: string; buffer: Buffer }[], designId: string, fps = 4): Promise<string> {
  const args = ['-y'];
  frames.forEach((f) => {
    args.push('-i', f.name);
  });
  const norm = buildNormalizeFilter(fps);
  args.push(
    '-filter_complex',
    frames
      .map((_f, idx) => `[${idx}:v]${norm}[v${idx}]`)
      .join(';') +
      `;${frames.map((_f, idx) => `[v${idx}]`).join('')}concat=n=${frames.length}:v=1:a=0,format=rgb8,palettegen[p];` +
      `${frames.map((_f, idx) => `[v${idx}]`).join('')}concat=n=${frames.length}:v=1:a=0,format=rgb8 [tmp];` +
      `[tmp][p]paletteuse`
  );
  args.push('-loop', '0', 'out.gif');

  const { tmpdir } = await runFfmpeg(args, frames);
  const gifBuffer = await fs.promises.readFile(path.join(tmpdir, 'out.gif'));
  const url = await uploadBufferDirect(designId, gifBuffer, 'gif', 'image/gif');
  await fs.promises.rm(tmpdir, { recursive: true, force: true });
  return url;
}

export async function stitchFramesToMp4(
  frames: { name: string; buffer: Buffer }[],
  designId: string,
  audioUrl?: string | null,
  fps = 2
): Promise<string> {
  // Write the images, then let ffmpeg glob them in order (frame-0.png, frame-1.png,...)
  const args = ['-y', '-framerate', String(fps), '-start_number', '0', '-i', 'frame-%d.png'];
  if (audioUrl) {
    args.push('-i', audioUrl);
  }
  const norm = buildNormalizeFilter(fps);
  const vf = `${norm},format=yuv420p`;
  args.push('-vf', vf, '-c:v', 'libx264', '-movflags', 'faststart');
  if (audioUrl) {
    args.push('-c:a', 'aac', '-shortest');
  }
  args.push('out.mp4');

  const { tmpdir } = await runFfmpeg(args, frames);
  const mp4Buffer = await fs.promises.readFile(path.join(tmpdir, 'out.mp4'));
  if (!mp4Buffer || mp4Buffer.length < 1024) {
    await fs.promises.rm(tmpdir, { recursive: true, force: true });
    throw new Error('Stitched MP4 is empty or too small');
  }
  const url = await uploadBufferDirect(designId, mp4Buffer, 'mp4', 'video/mp4');
  await fs.promises.rm(tmpdir, { recursive: true, force: true });
  return url;
}
