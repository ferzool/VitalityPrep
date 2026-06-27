import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import {
  base64UrlToBuffer,
  clearChallengeCookie,
  consumeChallenge,
  getCredential,
  getOrigin,
  getRpId,
  readChallengeCookie,
  updateCounter,
} from '../_lib/webauthnHelpers.js';
import { getAdminAuth } from '../_lib/firebaseAdmin.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const challengeId = readChallengeCookie(req);
    if (!challengeId) {
      res.status(400).json({ error: 'missing challenge' });
      return;
    }
    const stored = await consumeChallenge(challengeId);
    clearChallengeCookie(res);
    if (!stored || stored.kind !== 'login') {
      res.status(400).json({ error: 'invalid challenge' });
      return;
    }
    const { assertion } = (req.body ?? {}) as {
      assertion?: AuthenticationResponseJSON;
    };
    if (!assertion) {
      res.status(400).json({ error: 'assertion required' });
      return;
    }
    const credential = await getCredential(assertion.id);
    if (!credential) {
      res.status(404).json({ error: 'unknown credential' });
      return;
    }
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: stored.challenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpId(req),
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(base64UrlToBuffer(credential.publicKey)),
        counter: credential.counter,
        transports: credential.transports as
          | ('ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb')[]
          | undefined,
      },
      requireUserVerification: false,
    });
    if (!verification.verified) {
      res.status(401).json({ error: 'verification failed' });
      return;
    }
    if (verification.authenticationInfo) {
      await updateCounter(
        credential.id,
        verification.authenticationInfo.newCounter,
      );
    }
    const customToken = await getAdminAuth().createCustomToken(
      credential.userId,
      { displayName: credential.displayName },
    );
    res.status(200).json({
      customToken,
      userId: credential.userId,
      displayName: credential.displayName,
    });
  } catch (err) {
    console.error('login-verify error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
