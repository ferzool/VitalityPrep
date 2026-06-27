import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const APP_CSS = `
html, body, #root { background-color: #f9f7f3; }
body { min-height: 100dvh; margin: 0; }
* { -webkit-tap-highlight-color: transparent; }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#4d6054" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vitality Prep" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <title>Vitality Prep</title>
        <ScrollViewStyleReset />
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: APP_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
