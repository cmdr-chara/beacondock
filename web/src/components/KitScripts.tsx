"use client";

import { useEffect } from "react";

// The dealt kit's behaviour scripts. They inject real nodes (nav toggle,
// expand buttons, moment chrome) so they must wait for React hydration —
// a module script in the head would run before it and have its nodes wiped.
export default function KitScripts() {
  useEffect(() => {
    for (const src of ["/assets/system.js", "/assets/motion/motion.js", "/assets/layout/layout.js"]) {
      const s = document.createElement("script");
      s.type = "module";
      s.src = src;
      document.body.appendChild(s);
    }
  }, []);
  return null;
}
