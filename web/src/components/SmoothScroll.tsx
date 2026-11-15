"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Lenis inertia scroll: eased wheel scrolling + eased anchor travel.
// Native scroll stays real (position, scrollbar, IntersectionObservers all live),
// Lenis only changes how the wheel gets there. Reduced motion keeps native.
export default function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.25, smoothWheel: true });
    let raf = 0;
    const tick = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // same-document hash links travel through lenis (with nav clearance);
    // links that handled their own click (defaultPrevented, e.g. fleet rows)
    // are left alone — they update the URL without moving the page
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      history.pushState(null, "", url.pathname + url.search + url.hash);
      lenis.scrollTo(el, { offset: -84 });
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return null;
}
