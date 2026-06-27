import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

const API_BASE = '/api/webauthn';

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.json();
      detail = errBody?.error ?? '';
    } catch {
      // ignore
    }
    throw new WebauthnError(detail || `${res.status}`);
  }
  return (await res.json()) as T;
}

export class WebauthnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebauthnError';
  }
}

export class WebauthnCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'WebauthnCancelled';
  }
}

export async function enrollPasskey(
  displayName: string,
  enrollSecret: string,
): Promise<{
  customToken: string;
  userId: string;
  displayName: string;
}> {
  const options = await postJson<Parameters<typeof startRegistration>[0]>(
    '/enroll-options',
    { displayName, enrollSecret },
  );
  let attestation;
  try {
    attestation = await startRegistration(options);
  } catch (err) {
    if ((err as Error)?.name === 'NotAllowedError') throw new WebauthnCancelled();
    throw err;
  }
  return postJson('/enroll-verify', {
    displayName,
    enrollSecret,
    attestation,
  });
}

export async function loginWithPasskey(): Promise<{
  customToken: string;
  userId: string;
  displayName: string;
}> {
  const options = await postJson<Parameters<typeof startAuthentication>[0]>(
    '/login-options',
  );
  let assertion;
  try {
    assertion = await startAuthentication(options);
  } catch (err) {
    if ((err as Error)?.name === 'NotAllowedError') throw new WebauthnCancelled();
    throw err;
  }
  return postJson('/login-verify', { assertion });
}

export async function resetAllPasskeys(
  enrollSecret: string,
): Promise<{ deleted: number }> {
  return postJson('/reset', { enrollSecret });
}

export function isWebauthnAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('PublicKeyCredential' in window)) return false;
  return true;
}
