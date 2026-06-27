import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertEnrollSecret,
  EnrollSecretError,
} from '../_lib/webauthnHelpers.js';
import { getAdminDb } from '../_lib/firebaseAdmin.js';

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
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    res.status(200).json({ deleted: snap.size });
  } catch (err) {
    console.error('reset error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
