import type { Metadata, Viewport } from "next";
import KitScripts from "@/components/KitScripts";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "BeaconDock: uptime monitor for HTTP APIs",
  description:
    "Self-hosted HTTP monitoring over a Rails API, Solid Queue workers, terminal dashboard, and browser console.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-type="software"
      data-mode="light"
      data-radius="sharp"
      data-ground="painting"
      data-buttons="arrow"
      data-motion
      suppressHydrationWarning
    >
      <head>
        <meta name="site-kind" content="software" />
        <meta name="page-type" content="software" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="BeaconDock: uptime monitor for HTTP APIs" />
        <meta
          property="og:description"
          content="Self-hosted HTTP monitoring over a Rails API, Solid Queue workers, terminal dashboard, and browser console."
        />
        <meta property="og:image" content="/share.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gabarito:wght@400..700&family=Figtree:wght@400..600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* the dealt kit (start.mjs css, white-link-blue + gabarito, sharp), loaded as plain files */}
        <link rel="stylesheet" href="/assets/system.css" />
        <link rel="stylesheet" href="/assets/ui/cards.css" />
        <link rel="stylesheet" href="/assets/motion/motion.css" />
        <link rel="stylesheet" href="/assets/backgrounds/backgrounds.css" />
        <link rel="stylesheet" href="/assets/layout/layout.css" />
        <link rel="stylesheet" href="/assets/icons/icon.css" />
        <link rel="stylesheet" href="/assets/ui/base.css" />
        <link rel="stylesheet" href="/assets/ui/window/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/pipeline-board/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/notify/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/toggles/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/stat/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/terminal-run/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/code/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/search/fragment.css" />
        <link rel="stylesheet" href="/assets/diagrams/diagram.css" />
        {/* the console's own css: tailwind + page rules, compiled to a static file (npm run css) */}
        <link rel="stylesheet" href="/assets/app.css" />
        <style>{`:root {
  --p-bg: #ffffff; --p-surface: #f4f4f4; --p-ink: #111111; --p-muted: #6b6b6b;
  --p-accent: #1a4be0; --p-accent-ink: #ffffff; --p-action: #1a4be0; --p-action-ink: #ffffff;
  --p-muted: #4f4f4f;
  --p-inv-bg: #111111; --p-inv-surface: #1e1e1e; --p-inv-ink: #ffffff; --p-inv-muted: #9a9a9a;
  --p-inv-accent: #ffffff; --p-inv-accent-ink: #111111; --p-inv-action: #ffffff; --p-inv-action-ink: #111111;
  --font-display: "Gabarito", system-ui, sans-serif;
  --font-text: "Figtree", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 400;
  --display-tracking: -0.03em;
  --display-tracking-xl: -0.04em;
  --ly-scale: 0.98;
}`}</style>
        {/* the hero's entrance: words wait for motion.js instead of flashing */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)`,
          }}
        />
        <script src="/assets/backgrounds/backgrounds.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)`,
          }}
        />
        <link rel="modulepreload" href="/assets/moments/moments.js" />
        <link rel="modulepreload" href="/assets/moments/lib.js" />
        <link rel="modulepreload" href="/assets/moments/iris-opens/moment.js" />
        <link rel="modulepreload" href="/assets/moments/liquid-type/moment.js" />
      </head>
      <body suppressHydrationWarning>
        {/* type: software · deal: hero centred, nav nav-cards, close close-type, footer footer-dark,
            rhythm space+surface, buttons arrow, mark stack, palette white-link-blue, type gabarito,
            radius sharp, ground painting, effect painterly-landscape, card gradient-mesh,
            moments iris-opens + liquid-type */}
        <SiteNav />
        <main id="top">{children}</main>
        <SiteFooter />
        <KitScripts />
        <SmoothScroll />
      </body>
    </html>
  );
}
