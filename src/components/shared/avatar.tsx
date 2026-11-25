"use client";

import { cn as clsx } from "@/lib/utils";
import { initials } from "@/lib/sports-science";

const TONES: Record<string, string> = {
  primary: "bg-primary-fixed text-on-primary-fixed",
  secondary: "bg-secondary-fixed text-on-secondary-fixed",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
  dim: "bg-surface-container-high text-on-surface",
  error: "bg-error-container text-on-error-container",
};

/** Avatar con iniciales del atleta (estilo micro-tarjeta del diseño). */
export function Avatar({
  firstName,
  lastName,
  tone = "primary",
  className,
  square = false,
}: {
  firstName: string;
  lastName: string;
  tone?: keyof typeof TONES | string;
  className?: string;
  square?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center font-display font-semibold shadow-sm",
        square ? "h-12 w-12 rounded-lg" : "h-10 w-10 rounded-full",
        TONES[tone] ?? TONES.primary,
        className
      )}
      aria-hidden="true"
    >
      {initials(firstName, lastName)}
    </div>
  );
}
