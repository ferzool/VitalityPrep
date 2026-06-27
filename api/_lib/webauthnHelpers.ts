import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { getAdminDb } from './firebaseAdmin.js';

export const MAX_CREDENTIALS = 2;
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const CHALLENGE_COOKIE = 'wa_ch';

export const RP_NAME = 'Vitality Prep';

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
  const ref = getAdminDb().collection('_webauthn_challenges').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as StoredChallenge;
  await ref.delete().catch(() => {});
  if (data.expiresAt < Date.now()) return null;
  return data;
}

export async function listCredentials(): Promise<StoredCredential[]> {
  const snap = await getAdminDb().collection('_webauthn_credentials').get();
  return snap.docs.map((d) => d.data() as StoredCredential);
}

export async function saveCredential(cred: StoredCredential): Promise<void> {
  await getAdminDb().collection('_webauthn_credentials').doc(cred.id).set(cred);
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
  return Buffer.from(buffer).toString('base64url');
}

export function base64UrlToBuffer(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}
