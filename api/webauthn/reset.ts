import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertEnrollSecret,
  EnrollSecretError,
} from '../_lib/webauthnHelpers.js';
import { getAdminDb } from '../_lib/firebaseAdmin.js';
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
    const db = getAdminDb();
    const snap = await db.collection('_webauthn_credentials').get();
    const userIds = new Set(
      snap.docs.map((document) => (document.data() as { userId: string }).userId),
    );
    await Promise.all(
      Array.from(userIds).map((userId) =>
        getAdminAuth().revokeRefreshTokens(userId),
      ),
    );
    const challenges = await db.collection('_webauthn_challenges').get();
    const writer = db.bulkWriter();
    snap.docs.forEach((d) => writer.delete(d.ref));
    challenges.docs.forEach((d) => writer.delete(d.ref));
    await writer.close();
    res.status(200).json({ deleted: snap.size });
  } catch (err) {
    console.error('reset error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
