import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { randomUUID } from 'node:crypto';
import {
  assertEnrollSecret,
  EnrollSecretError,
  getRpId,
  listCredentials,
  MAX_CREDENTIALS,
  RP_NAME,
  saveChallenge,
  setChallengeCookie,
} from '../_lib/webauthnHelpers.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    try {
      assertEnrollSecret(req);
    } catch (e) {
      if (e instanceof EnrollSecretError) {
        res.status(403).json({ error: e.message });
        return;
      }
      throw e;
    }
    const { displayName } = (req.body ?? {}) as { displayName?: string };
    const name = (displayName ?? '').trim();
    if (!name) {
      res.status(400).json({ error: 'displayName required' });
      return;
    }
    const credentials = await listCredentials();
    if (credentials.length >= MAX_CREDENTIALS) {
      res.status(403).json({ error: 'enrollment closed' });
      return;
    }
    const rpID = getRpId(req);
    const userId = randomUUID();
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userName: name,
      userID: Buffer.from(userId, 'utf8'),
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: credentials.map((c) => ({
        id: c.id,
        transports: c.transports as
          | ('ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb')[]
          | undefined,
      })),
    });
    const challengeId = await saveChallenge(options.challenge, 'enroll', {
      displayName: name,
      userId,
    });
    setChallengeCookie(res, challengeId);
    res.status(200).json(options);
  } catch (err) {
    console.error('enroll-options error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
