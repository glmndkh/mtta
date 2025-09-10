export interface RawKnockoutMatch {
  id: string;
  round: number | string;
  [key: string]: any;
}

/**
 * Normalizes knockout match rounds so that legacy string values like
 * "Хагас финал" are converted to sequential numeric rounds starting from 1.
 * This ensures newer bracket components that expect numeric rounds continue
 * to work with older stored data.
 */
export function normalizeKnockoutMatches(matches: RawKnockoutMatch[]): RawKnockoutMatch[] {
  if (!Array.isArray(matches) || matches.length === 0) return [];

  const thirdPlace = matches.filter(
    m => m.round === '3-р байрын тоглолт' || m.id === 'third_place_playoff'
  );
  const others = matches.filter(
    m => !(m.round === '3-р байрын тоглолт' || m.id === 'third_place_playoff')
  );

  const roundOrder = [
    '1/64 финал',
    '1/32 финал',
    '1/16 финал',
    '1/8 финал',
    'Дөрөвний финал',
    'Хагас финал',
    'Финал'
  ];

  const roundNames = Array.from(
    new Set(
      others
        .map(m => (typeof m.round === 'string' ? m.round : ''))
        .filter(Boolean)
    )
  );
  const sortedRoundNames = roundNames.sort(
    (a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b)
  );

  const roundMap = new Map<string, number>();
  sortedRoundNames.forEach((name, idx) => roundMap.set(name, idx + 1));

  const normalized = others.map(m => ({
    ...m,
    round: typeof m.round === 'number' ? m.round : roundMap.get(m.round as string) || 0
  }));

  const totalRounds = roundMap.size === 0 ? 1 : roundMap.size;
  const normalizedThird = thirdPlace.map(m => ({
    ...m,
    round: typeof m.round === 'number' ? m.round : totalRounds
  }));

  return [...normalized, ...normalizedThird];
}
