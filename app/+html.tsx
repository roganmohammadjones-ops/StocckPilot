import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Root HTML shell for StockPilot NG on the web.
 * Ensures consistent rendering, viewport behavior, font smoothing,
 * and touch responsiveness across all web browsers (Chrome, Safari, Firefox, Edge, Samsung Internet).
 */
export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />

        <title>{"StockPilot NG — Nigeria's Commercial Operating System"}</title>
        <meta
          name="description"
          content="StockPilot NG — The Operating System for Nigerian Commerce & High-Velocity Trade across Idumota, Alaba, Kano Dawanau, and Onitsha Main Market."
        />

        {/* Brand Theme Color for Chrome Android, Safari & Mobile Browsers */}
        <meta name="theme-color" content="#021811" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#021811" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#021811" />

        {/* iOS Web App / PWA Enhancements */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StockPilot" />
        <meta name="application-name" content="StockPilot NG" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* Social / WhatsApp / Telegram Open Graph Card */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="StockPilot NG — Nigerian Commerce Operating System" />
        <meta
          property="og:description"
          content="Offline-first FMCG inventory, POS sales till, and B2B wholesale marketplace."
        />
        <meta property="og:site_name" content="StockPilot NG" />

        {/* Disable default body scrolling so React Native ScrollView acts naturally across all browsers */}
        <ScrollViewStyleReset />

        {/* Cross-Browser CSS Normalize & Optimization */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Modern cross-browser font rendering & text selection */
              html, body {
                background-color: #021811;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                overscroll-behavior-y: none;
                overscroll-behavior-x: none;
              }

              /* Smooth, subtle custom scrollbars for Firefox, Chrome, Edge, Safari */
              * {
                scrollbar-width: thin;
                scrollbar-color: #166534 transparent;
              }
              *::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              *::-webkit-scrollbar-track {
                background: transparent;
              }
              *::-webkit-scrollbar-thumb {
                background-color: #166534;
                border-radius: 9999px;
              }
              *::-webkit-scrollbar-thumb:hover {
                background-color: #22c55e;
              }

              /* Consistent pointer cursor on clickable elements for desktop browsers */
              [role="button"], button, [data-focusable="true"], a {
                cursor: pointer;
              }

              /* Prevent iOS Safari input zoom and border irregularities */
              input, textarea, select {
                font-size: 16px;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
