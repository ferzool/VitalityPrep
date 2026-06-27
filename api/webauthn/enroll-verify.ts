import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import {
  assertEnrollSecret,
  bufferToBase64Url,
  clearChallengeCookie,
  consumeChallenge,
  EnrollSecretError,
  getOrigin,
  getRpId,
  listCredentials,
  MAX_CREDENTIALS,
  readChallengeCookie,
  saveCredential,
  type StoredCredential,
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
    try {
      assertEnrollSecret(req);
    } catch (e) {
      if (e instanceof EnrollSecretError) {
        res.status(403).json({ error: e.message });
        return;
      }
      throw e;
    }
    const challengeId = readChallengeCookie(req);
    if (!challengeId) {
      res.status(400).json({ error: 'missing challenge' });
      return;
    }
    const stored = await consumeChallenge(challengeId);
    clearChallengeCookie(res);
    if (!stored || stored.kind !== 'enroll' || !stored.userId) {
      res.status(400).json({ error: 'invalid challenge' });
      return;
    }
    const { attestation } = (req.body ?? {}) as {
      attestation?: RegistrationResponseJSON;
    };
    if (!attestation) {
      res.status(400).json({ error: 'attestation required' });
      return;
    }
    const credentials = await listCredentials();
    if (credentials.length >= MAX_CREDENTIALS) {
      res.status(403).json({ error: 'enrollment closed' });
      return;
    }
    const verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge: stored.challenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpId(req),
      requireUserVerification: false,
    });
    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: 'verification failed' });
      return;
    }
    const { credential } = verification.registrationInfo;
    const credentialId = credential.id;
    const credentialPublicKey = bufferToBase64Url(credential.publicKey);
    const stored2: StoredCredential = {
      id: credentialId,
      publicKey: credentialPublicKey,
      counter: credential.counter,
      transports: attestation.response.transports,
      userId: stored.userId,
      displayName: stored.displayName ?? 'user',
      createdAt: Date.now(),
    };
    await saveCredential(stored2);
    const customToken = await getAdminAuth().createCustomToken(stored.userId, {
      displayName: stored.displayName,
    });
    res.status(200).json({
      customToken,
      userId: stored.userId,
      displayName: stored.displayName,
    });
  } catch (err) {
    console.error('enroll-verify error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
