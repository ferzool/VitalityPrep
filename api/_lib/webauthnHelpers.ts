import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { getAdminDb } from './firebaseAdmin.js';

export const MAX_CREDENTIALS = 2;
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const CHALLENGE_COOKIE = 'wa_ch';

export const RP_NAME = 'Vitality Prep';

// Shared-secret gate for /admin/enroll. Only Iman and Niloo know the value.
// Set WEBAUTHN_ENROLL_SECRET as a Vercel env var. If unset, enrollment is
// blocked entirely (fail-closed) so a misconfig can never open the door.
export function assertEnrollSecret(req: VercelRequest): void {
  const expected = process.env.WEBAUTHN_ENROLL_SECRET ?? '';
  if (!expected) {
    throw new EnrollSecretError('enrollment disabled');
  }
  const provided = (
    (req.body as { enrollSecret?: unknown } | undefined)?.enrollSecret ?? ''
  ) as string;
  if (typeof provided !== 'string' || provided.length === 0) {
    throw new EnrollSecretError('enroll secret required');
  }
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  // timingSafeEqual requires equal length; pad to the longer side so we still
  // do a constant-time compare regardless of input length.
  const len = Math.max(a.length, b.length);
  const ap = new Uint8Array(len);
  const bp = new Uint8Array(len);
  ap.set(a);
  bp.set(b);
  if (!timingSafeEqual(ap, bp) || a.length !== b.length) {
    throw new EnrollSecretError('invalid enroll secret');
  }
}

export class EnrollSecretError extends Error {
  status = 403 as const;
  constructor(message: string) {
    super(message);
    this.name = 'EnrollSecretError';
  }
}

export class EnrollmentClosedError extends Error {
  constructor() {
    super('enrollment closed');
    this.name = 'EnrollmentClosedError';
  }
}

export function getRpId(req: VercelRequest): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  const host = (req.headers['x-forwarded-host'] ?? req.headers.host ?? '') as string;
  return host.split(':')[0] || 'localhost';
}

export function getOrigin(req: VercelRequest): string {
  if (process.env.WEBAUTHN_ORIGIN) return process.env.WEBAUTHN_ORIGIN;
  const proto = (req.headers['x-forwarded-proto'] ?? 'https') as string;
  const host = (req.headers['x-forwarded-host'] ?? req.headers.host ?? '') as string;
  return `${proto}://${host}`;
}

export interface StoredCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  userId: string;
  displayName: string;
  createdAt: number;
}

export interface StoredChallenge {
  challenge: string;
  expiresAt: number;
  kind: 'enroll' | 'login';
  displayName?: string;
  userId?: string;
}

export async function saveChallenge(
  challenge: string,
  kind: 'enroll' | 'login',
  extras?: { displayName?: string; userId?: string },
): Promise<string> {
  const id = randomUUID();
  const doc: StoredChallenge = {
    challenge,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    kind,
    ...(extras?.displayName ? { displayName: extras.displayName } : {}),
    ...(extras?.userId ? { userId: extras.userId } : {}),
  };
  await getAdminDb().collection('_webauthn_challenges').doc(id).set(doc);
  return id;
}

export async function consumeChallenge(
  id: string,
): Promise<StoredChallenge | null> {
  const db = getAdminDb();
  const ref = db.collection('_webauthn_challenges').doc(id);
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return null;
    const data = snap.data() as StoredChallenge;
    transaction.delete(ref);
    return data.expiresAt < Date.now() ? null : data;
  });
}

export async function listCredentials(): Promise<StoredCredential[]> {
  const snap = await getAdminDb().collection('_webauthn_credentials').get();
  return snap.docs.map((d) => d.data() as StoredCredential);
}

export async function saveCredentialIfCapacity(
  cred: StoredCredential,
): Promise<void> {
  const db = getAdminDb();
  const collection = db.collection('_webauthn_credentials');
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(collection);
    if (existing.size >= MAX_CREDENTIALS && !existing.docs.some((d) => d.id === cred.id)) {
      throw new EnrollmentClosedError();
    }
    transaction.set(collection.doc(cred.id), cred);
  });
}

export async function getCredential(
  id: string,
): Promise<StoredCredential | null> {
  const snap = await getAdminDb().collection('_webauthn_credentials').doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as StoredCredential;
}

export async function updateCounter(id: string, counter: number): Promise<void> {
  await getAdminDb()
    .collection('_webauthn_credentials')
    .doc(id)
    .update({ counter });
}

export function setChallengeCookie(res: VercelResponse, id: string): void {
  const cookie = `${CHALLENGE_COOKIE}=${id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=300`;
  res.setHeader('Set-Cookie', cookie);
}

export function readChallengeCookie(req: VercelRequest): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CHALLENGE_COOKIE}=`));
  if (!match) return null;
  return match.slice(CHALLENGE_COOKIE.length + 1);
}

export function clearChallengeCookie(res: VercelResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${CHALLENGE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
  );
}

export function bufferToBase64Url(buffer: Buffer | Uint8Array): string {
  return Buffer.from(Array.from(buffer)).toString('base64url');
}

export function base64UrlToBuffer(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(Buffer.from(value, 'base64url'));
}
