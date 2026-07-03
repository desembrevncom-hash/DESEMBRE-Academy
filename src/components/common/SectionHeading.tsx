import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  center,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-3 ${center ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"}`}>
      <div>
        {eyebrow && (
          <div className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary-dark">
            {eyebrow}
          </div>
        )}
        <h2 className={`mt-3 text-2xl sm:text-3xl font-bold tracking-tight ${center ? "" : ""}`}>{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
