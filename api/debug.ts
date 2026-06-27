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
      WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID ?? null,
      WEBAUTHN_ORIGIN: process.env.WEBAUTHN_ORIGIN ?? null,
    },
    imports: {
      firebaseAdmin: false,
      simplewebauthn: false,
    },
  };

  if (process.env.FIREBASE_ADMIN_KEY) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_ADMIN_KEY) as {
        project_id?: string;
      };
      (out.env as Record<string, unknown>).adminKeyValidJson = true;
      (out.env as Record<string, unknown>).adminKeyProjectId =
        parsed.project_id ?? null;
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

  res.status(200).json(out);
}
