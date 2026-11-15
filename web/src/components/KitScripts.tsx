"use client";

import { useEffect } from "react";

// The dealt kit's behaviour scripts. They inject real nodes (nav toggle,
// expand buttons, moment chrome, diagrams) so they must wait for React hydration.
export default function KitScripts() {
  useEffect(() => {
    const srcs = ["/assets/system.js", "/assets/motion/motion.js", "/assets/layout/layout.js"];
    if (document.querySelector("[data-diagram]")) {
      srcs.push("/assets/diagrams/mount.js");
    }
    for (const src of srcs) {
      const s = document.createElement("script");
      s.type = "module";
      s.src = src;
      document.body.appendChild(s);
    }
  }, []);
  return null;
}
