import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import {
  getRpId,
  listCredentials,
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
    const credentials = await listCredentials();
    if (credentials.length === 0) {
      res.status(404).json({ error: 'no credentials enrolled' });
      return;
    }
    const options = await generateAuthenticationOptions({
      rpID: getRpId(req),
      userVerification: 'preferred',
      allowCredentials: credentials.map((c) => ({
        id: c.id,
        transports: c.transports as
          | ('ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb')[]
          | undefined,
      })),
    });
    const challengeId = await saveChallenge(options.challenge, 'login');
    setChallengeCookie(res, challengeId);
    res.status(200).json(options);
  } catch (err) {
    console.error('login-options error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
