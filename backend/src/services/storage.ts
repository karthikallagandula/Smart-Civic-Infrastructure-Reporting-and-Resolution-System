import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import env from '../config/env';

export type StorageMode = 'cloudinary' | 'local-demo';

let cloudinaryClient: any = null;

export function storageMode(): StorageMode {
  return env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
    ? 'cloudinary'
    : 'local-demo';
}

function getCloudinary(): any {
  if (cloudinaryClient) return cloudinaryClient;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { v2 } = require('cloudinary');
  v2.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
  cloudinaryClient = v2;
  return cloudinaryClient;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function saveImage(
  buffer: Buffer,
  mime: string,
  folder: string
): Promise<{ url: string; storage: StorageMode }> {
  if (storageMode() === 'cloudinary') {
    const url = await new Promise<string>((resolve, reject) => {
      const stream = getCloudinary().upload_stream(
        { folder: `civicconnect/${folder}`, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
        (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
    return { url, storage: 'cloudinary' };
  }

  const ext = EXT_BY_MIME[mime] || 'jpg';
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const dir = path.resolve(__dirname, '../../uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), buffer);
  return { url: `/uploads/${fileName}`, storage: 'local-demo' };
}
