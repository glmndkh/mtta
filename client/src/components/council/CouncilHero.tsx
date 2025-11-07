interface CouncilHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  overlayClassName?: string;
}

export function CouncilHero({
  title,
  subtitle,
  backgroundImage =
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
  overlayClassName,
}: CouncilHeroProps) {
  return (
    <section className="relative h-[60vh] min-h-[360px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-b from-emerald-950/85 via-emerald-900/75 to-emerald-950/90 ${
          overlayClassName ?? ""
        }`}
        aria-hidden="true"
      />
      <div className="relative h-full flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-emerald-50 tracking-wide">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-emerald-200 text-base sm:text-lg leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
