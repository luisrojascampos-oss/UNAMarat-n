"use client";

import { cn as clsx } from "@/lib/utils";

/** Emblema institucional CIEMHCAVI · UNA (SVG vectorial propio). */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Logotipo UNAMaratón Performance Hub CIEMHCAVI"
      className={clsx(className)}
    >
      {/* Escudo */}
      <path
        d="M24 2 L44 8 V26 C44 36 35 43.5 24 46 C13 43.5 4 36 4 26 V8 Z"
        fill="#970012"
      />
      <path
        d="M24 5.4 L41 10.5 V25.8 C41 34.3 33.3 40.9 24 43.2 C14.7 40.9 7 34.3 7 25.8 V10.5 Z"
        fill="none"
        stroke="#ffdad6"
        strokeWidth="1.1"
        opacity="0.75"
      />
      {/* Pista */}
      <path
        d="M10 30 Q24 24 38 30"
        fill="none"
        stroke="#ffdad6"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Corredor estilizado */}
      <g stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <circle cx="21.6" cy="13.4" r="2.5" fill="#ffffff" stroke="none" />
        <path d="M20.4 17.5 L25.2 20.8" />
        <path d="M25.2 20.8 L22.4 25.2 L26.8 28.6" />
        <path d="M25.2 20.8 L30.6 22.4 L34.4 20.2" />
        <path d="M22.4 25.2 L18.2 26.4" />
        <path d="M26.8 28.6 L31.8 32.2" />
        <path d="M26.8 28.6 L23.6 33.4 L26.4 37.2" />
      </g>
      {/* Marcas de velocidad */}
      <g stroke="#54fdc4" strokeWidth="1.4" strokeLinecap="round">
        <path d="M11 15.5 h4.5" />
        <path d="M12.5 19 h3" opacity="0.7" />
      </g>
    </svg>
  );
}
