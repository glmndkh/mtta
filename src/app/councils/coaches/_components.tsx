"use client";

import type { Coach } from "./_data";

import type { PropsWithChildren, ReactNode } from "react";

const pattern =
  "radial-gradient(circle at 20% 20%, rgba(0, 193, 106, 0.12), transparent 45%)," +
  "radial-gradient(circle at 80% 0%, rgba(0, 193, 106, 0.18), transparent 55%)";

export type HeroProps = {
  title: string;
  subtitle: string;
  breadcrumbs: string[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export function Hero({
  title,
  subtitle,
  breadcrumbs,
  primaryCta,
  secondaryCta
}: HeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#10161E]/80 p-8 text-white shadow-xl backdrop-blur-lg transition hover:border-[#00C16A]/40"
      style={{
        backgroundImage: `${pattern}`,
        backgroundColor: "#0B0F17"
      }}
    >
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6">
        <nav className="text-sm text-white/60" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb} className="flex items-center gap-2">
                <span className="font-medium">{crumb}</span>
                {index < breadcrumbs.length - 1 && (
                  <span aria-hidden className="text-white/30">
                    /
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-3xl text-lg text-white/70 sm:text-xl">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            className="inline-flex items-center justify-center rounded-full bg-[#00C16A] px-6 py-3 text-base font-semibold text-[#0B0F17] shadow-lg transition hover:bg-[#19d37d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C16A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]"
            href={primaryCta.href}
          >
            {primaryCta.label}
          </a>
          <a
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-base font-semibold text-white transition hover:border-[#00C16A]/60 hover:text-[#00C16A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C16A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]"
            href={secondaryCta.href}
          >
            {secondaryCta.label}
          </a>
        </div>
      </div>
      <div
        aria-hidden
        className="absolute -bottom-10 -left-24 h-72 w-72 rounded-full bg-[#00C16A]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -top-24 -right-10 h-72 w-72 rounded-full bg-[#00C16A]/20 blur-3xl"
      />
    </section>
  );
}

export function Section({
  title,
  eyebrow,
  description,
  children,
  className = "",
  id
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`space-y-6 rounded-3xl border border-white/5 bg-[#10161E]/60 p-8 text-white shadow-lg backdrop-blur ${className}`}
    >
      <header className="space-y-2">
        {eyebrow && (
          <p className="inline-flex items-center rounded-full border border-[#00C16A] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#00C16A]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
        {description && <p className="max-w-3xl text-base text-white/70">{description}</p>}
      </header>
      <div className="space-y-4 text-white/80">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#10161E] p-6 text-white shadow-lg transition hover:border-[#00C16A]/60 hover:shadow-[#00C16A]/20">
      <span className="text-sm uppercase tracking-[0.2em] text-[#00C16A]/80">
        {label}
      </span>
      <strong className="text-3xl font-semibold text-white">{value}</strong>
      <p className="text-sm text-white/60">{hint}</p>
    </div>
  );
}

export function MemberCard({ coach }: { coach: Coach }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-white/5 bg-[#10161E] p-6 text-white shadow-md transition hover:-translate-y-0.5 hover:border-[#00C16A] hover:shadow-[#00C16A]/30 focus-within:-translate-y-0.5 focus-within:border-[#00C16A]">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full border border-[#00C16A]/30 bg-[#0B0F17]">
          <img
            src={coach.photo}
            alt={`${coach.name} - дасгалжуулагчийн зураг`}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{coach.name}</h3>
          <p className="text-sm text-[#00C16A]">{coach.level}</p>
          <p className="text-xs text-white/60">
            {coach.club} · {coach.city}
          </p>
        </div>
      </div>
      <ul className="mt-auto flex flex-wrap gap-2 text-sm text-white/70">
        {coach.specialties.map((item) => (
          <li
            key={item}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80"
          >
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function Step({
  index,
  title,
  description
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/5 bg-[#10161E] p-6 text-white shadow-md transition hover:border-[#00C16A]/60">
      <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-[#00C16A] bg-[#00C16A]/10 text-base font-semibold text-[#00C16A]">
        {index}
      </span>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-white/70">{description}</p>
      </div>
    </div>
  );
}

export function GradientCard({ children }: PropsWithChildren) {
  return (
    <div className="animate-in fade-in-50 rounded-2xl border border-white/5 bg-gradient-to-b from-[#121922] to-[#0B0F17] p-6 shadow-lg">
      {children}
    </div>
  );
}
