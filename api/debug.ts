import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const out: Record<string, unknown> = {
    node: process.version,
    host: req.headers.host,
    forwardedHost: req.headers['x-forwarded-host'],
    env: {
      hasAdminKey: Boolean(process.env.FIREBASE_ADMIN_KEY),
      adminKeyLen: process.env.FIREBASE_ADMIN_KEY?.length ?? 0,
      adminKeyValidJson: false,
      adminKeyProjectId: null as string | null,
      privateKeyHasRealNewlines: false,
      WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID ?? null,
      WEBAUTHN_ORIGIN: process.env.WEBAUTHN_ORIGIN ?? null,
    },
    imports: {
      firebaseAdmin: false,
      simplewebauthn: false,
    },
    firestore: {
      initApp: false,
      getDb: false,
      query: false,
    },
    auth: {
      mintToken: false,
    },
  };

  if (process.env.FIREBASE_ADMIN_KEY) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_ADMIN_KEY) as {
        project_id?: string;
        private_key?: string;
      };
      (out.env as Record<string, unknown>).adminKeyValidJson = true;
      (out.env as Record<string, unknown>).adminKeyProjectId =
        parsed.project_id ?? null;
      (out.env as Record<string, unknown>).privateKeyHasRealNewlines =
        (parsed.private_key ?? '').includes('\n');
    } catch (e) {
      (out.env as Record<string, unknown>).adminKeyParseError = (e as Error)
        .message;
    }
  }

  try {
    await import('firebase-admin/app');
    out.imports = { ...(out.imports as object), firebaseAdmin: true };
  } catch (e) {
    out.imports = {
      ...(out.imports as object),
      firebaseAdminError: (e as Error).message,
    };
  }

  try {
    await import('@simplewebauthn/server');
    out.imports = { ...(out.imports as object), simplewebauthn: true };
  } catch (e) {
    out.imports = {
      ...(out.imports as object),
      simplewebauthnError: (e as Error).message,
    };
  }

  try {
    const { getAdminDb, getAdminAuth } = await import(
      './_lib/firebaseAdmin.js'
    );
    out.firestore = { ...(out.firestore as object), initApp: true };

    const db = getAdminDb();
    out.firestore = { ...(out.firestore as object), getDb: true };

    try {
      const snap = await db.collection('_webauthn_credentials').limit(1).get();
      out.firestore = {
        ...(out.firestore as object),
        query: true,
        docCount: snap.size,
      };
    } catch (qe) {
      out.firestore = {
        ...(out.firestore as object),
        queryError: (qe as Error).message,
        queryCode: (qe as { code?: string }).code ?? null,
      };
    }

    try {
      const tok = await getAdminAuth().createCustomToken('debug-test-user');
      out.auth = { mintToken: true, tokenLen: tok.length };
    } catch (te) {
      out.auth = {
        mintToken: false,
        tokenError: (te as Error).message,
        tokenCode: (te as { code?: string }).code ?? null,
      };
    }
  } catch (e) {
    out.firestore = {
      ...(out.firestore as object),
      initError: (e as Error).message,
      stack: (e as Error).stack?.split('\n').slice(0, 3).join(' | '),
    };
  }

  res.status(200).json(out);
}
