import type { Metadata, Viewport } from "next";
import KitScripts from "@/components/KitScripts";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "BeaconDock: self-hosted uptime monitoring",
  description:
    "A browser console for the BeaconDock API: monitors, checks and incidents for your own HTTP endpoints.",
};

export const viewport: Viewport = {
  themeColor: "#18191b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-type="software" data-mode="dark" data-radius="sharp" data-ground="sand" data-buttons="arrow" data-motion suppressHydrationWarning>
      <head>
        <meta name="site-kind" content="software" />
        <meta name="page-type" content="software" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="BeaconDock: self-hosted uptime monitoring" />
        <meta property="og:description" content="A browser console for the BeaconDock API: monitors, checks and incidents for your own HTTP endpoints." />
        <meta property="og:image" content="/share.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* the dealt kit (start.mjs css, graphite-safety-orange + host), loaded as plain files */}
        <link rel="stylesheet" href="/assets/system.css" />
        <link rel="stylesheet" href="/assets/ui/cards.css" />
        <link rel="stylesheet" href="/assets/motion/motion.css" />
        <link rel="stylesheet" href="/assets/backgrounds/backgrounds.css" />
        <link rel="stylesheet" href="/assets/layout/layout.css" />
        <link rel="stylesheet" href="/assets/icons/icon.css" />
        <link rel="stylesheet" href="/assets/ui/base.css" />
        <link rel="stylesheet" href="/assets/ui/window/fragment.css" />
        <link rel="stylesheet" href="/assets/moments/marquee-row/moment.css" />
        {/* the console's own css: tailwind + page rules, compiled to a static file (npm run css) */}
        <link rel="stylesheet" href="/assets/app.css" />
        <style>{`:root {
  --p-bg: #18191b; --p-surface: #222427; --p-ink: #eff0f1; --p-muted: #9c9ea3;
  --p-accent: #ff4a1f; --p-accent-ink: #18191b; --p-action: #ff4a1f; --p-action-ink: #18191b;
  --p-inv-bg: #eff0f1; --p-inv-surface: #dedfe0; --p-inv-ink: #18191b; --p-inv-muted: #5b5c5e;
  --p-inv-accent: #18191b; --p-inv-accent-ink: #eff0f1; --p-inv-action: #18191b; --p-inv-action-ink: #eff0f1;
  --font-display: "Host Grotesk", system-ui, sans-serif;
  --font-text: "Host Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 500;
  --display-tracking: -0.035em;
  --display-tracking-xl: -0.04em;
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
        <link rel="modulepreload" href="/assets/moments/marquee-row/moment.js" />
      </head>
      <body suppressHydrationWarning>
        {/* type: software · deal: hero triptych, nav nav-mega, close close-word, footer footer-columns,
            rhythm surface-pairs, buttons arrow, mark dots, grounds topglow+field+halo, moment marquee-row */}
        <SiteNav />
        <main id="top">{children}</main>
        <SiteFooter />
        <KitScripts />
      </body>
    </html>
  );
}
