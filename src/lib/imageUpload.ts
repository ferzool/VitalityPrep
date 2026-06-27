import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import { storage } from './firebase';

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function inferExtFromMime(mime: string | null | undefined): string {
  if (!mime) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

export async function uploadRecipeImage(localUri: string): Promise<string> {
  const id = randomId();

  // Data URL: upload directly as base64
  if (localUri.startsWith('data:')) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(localUri);
    if (!match) throw new Error('invalid data URL');
    const mime = match[1] ?? 'image/jpeg';
    const ext = inferExtFromMime(mime);
    const objectRef = ref(storage, `recipes/${id}.${ext}`);
    await uploadString(objectRef, localUri, 'data_url', {
      contentType: mime,
    });
    return getDownloadURL(objectRef);
  }

  // Fetch the local blob/file URL into a Blob, then upload
  const res = await fetch(localUri);
  if (!res.ok) throw new Error(`failed to read picked image (${res.status})`);
  const blob = await res.blob();
  const ext = inferExtFromMime(blob.type);
  const objectRef = ref(storage, `recipes/${id}.${ext}`);
  await uploadBytes(objectRef, blob, {
    contentType: blob.type || 'image/jpeg',
  });
  return getDownloadURL(objectRef);
}
