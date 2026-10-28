import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { HttpError } from '../utils/http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

// Hosts with an ephemeral disk (Render, Koyeb…) store admin uploads in Cloudinary instead of uploads/.
const CLOUDINARY = process.env.CLOUDINARY_URL ? new URL(process.env.CLOUDINARY_URL) : null;
const CLOUDINARY_FOLDER = 'madhuri/products';

const storage = CLOUDINARY
  ? multer.memoryStorage()
  : multer.diskStorage({
    destination: path.join(UPLOAD_DIR, 'products'),
    filename: (_req, file, cb) => cb(null, `upload-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
  });

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, 'Only JPG, PNG or WEBP images are allowed'));
  },
}).array('images', 10);

/** Signed Cloudinary API call; params are signed as documented at cloudinary.com/documentation/authentication_signatures. */
async function cloudinary(action, params, file) {
  const signed = { ...params, timestamp: Math.floor(Date.now() / 1000) };
  const toSign = Object.keys(signed).sort().map((k) => `${k}=${signed[k]}`).join('&');
  const form = new FormData();
  for (const [k, v] of Object.entries(signed)) form.append(k, String(v));
  form.append('api_key', decodeURIComponent(CLOUDINARY.username));
  form.append('signature', crypto.createHash('sha1').update(toSign + decodeURIComponent(CLOUDINARY.password)).digest('hex'));
  if (file) form.append('file', new Blob([file.buffer], { type: file.mimetype }));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.hostname}/image/${action}`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new HttpError(502, `Image upload failed: ${data.error?.message || res.status}`);
  return data;
}

/** Returns the public URLs of the files received by uploadImages. */
export async function storeUploads(files) {
  if (!CLOUDINARY) return files.map((f) => `/uploads/products/${f.filename}`);
  const results = await Promise.all(files.map((f) => cloudinary('upload', { folder: CLOUDINARY_FOLDER }, f)));
  return results.map((r) => r.secure_url);
}

/** Deletes an admin-uploaded image; seed images and unknown URLs are left alone. */
export async function deleteUpload(url) {
  if (url.startsWith('/uploads/products/upload-')) {
    await fs.unlink(path.join(UPLOAD_DIR, url.replace('/uploads/', ''))).catch(() => {});
  } else if (CLOUDINARY && url.includes(`/${CLOUDINARY_FOLDER}/`)) {
    const publicId = url.slice(url.indexOf(CLOUDINARY_FOLDER)).replace(/\.[a-z]+$/i, '');
    await cloudinary('destroy', { public_id: publicId }).catch(() => {});
  }
}
