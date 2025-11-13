import React from 'react';

export const PlayoffView = ({ matches, playersById, divisionId, playoffConfig }) => {
  const playoffMatches = matches.filter(
    m => m.stage === 'PLAYOFF' && m.divisionId === divisionId && m.finished
  );

  if (playoffMatches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Шууд хасагдах шатны өгөгдөл олдсонгүй.</p>
      </div>
    );
  }

  // Organize matches by round
  const quarters = playoffMatches.filter(m => m.roundName === 'Quarterfinal').sort((a, b) => a.slotIndex - b.slotIndex);
  const semis = playoffMatches.filter(m => m.roundName === 'Semifinal').sort((a, b) => a.slotIndex - b.slotIndex);
  const bronze = playoffMatches.find(m => m.roundName === 'Bronze');
  const final = playoffMatches.find(m => m.roundName === 'Final');

  const getWinnerName = (match) => {
    if (!match) return '';
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
    const winnerId = homeScore > awayScore ? match.homeId : match.awayId;
    return winnerId && playersById[winnerId] ? playersById[winnerId].name : 'Unknown';
  };

  const getPlayerName = (playerId) => {
    if (!playerId || playerId === '') return 'Lucky draw';
    return playersById[playerId]?.name || 'Unknown';
  };

  // Render a single match
  const renderMatch = (match, label) => {
    if (!match) return null;
    
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
    const homeWon = homeScore > awayScore;
    const awayWon = awayScore > homeScore;

    return (
      <div className="relative">
        {label && (
          <div className="text-gray-400 text-sm mb-2 text-center font-medium">{label}</div>
        )}
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
          {/* Home player */}
          <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-700 ${
            homeWon ? 'bg-slate-700' : 'bg-slate-800'
          }`}>
            <div className={`flex-1 ${homeWon ? 'text-white font-semibold' : 'text-gray-300'}`}>
              {getPlayerName(match.homeId)}
            </div>
            <div className={`ml-4 min-w-[40px] text-right ${homeWon ? 'text-white font-bold text-lg' : 'text-gray-400'}`}>
              {homeScore}
            </div>
          </div>
          {/* Away player */}
          <div className={`flex items-center justify-between px-4 py-3 ${
            awayWon ? 'bg-slate-700' : 'bg-slate-800'
          }`}>
            <div className={`flex-1 ${awayWon ? 'text-white font-semibold' : 'text-gray-300'}`}>
              {getPlayerName(match.awayId)}
            </div>
            <div className={`ml-4 min-w-[40px] text-right ${awayWon ? 'text-white font-bold text-lg' : 'text-gray-400'}`}>
              {awayScore}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-8">
      <div className="min-w-[1200px]">
        {/* Bracket Container */}
        <div className="grid grid-cols-12 gap-4 items-center">
          
          {/* QUARTERFINALS (Left) */}
          <div className="col-span-3 space-y-16">
            <div className="text-center text-white font-bold text-lg mb-6 pb-2 border-b border-slate-600">
              Шөвгийн 8
            </div>
            {quarters.map((q, idx) => (
              <div key={q.id} className="relative">
                {renderMatch(q, `Quarterfinal ${idx + 1}`)}
                {/* Connection line to right */}
                <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-slate-600"></div>
              </div>
            ))}
          </div>

          {/* Connection lines from Quarters to Semis */}
          <div className="col-span-1 relative h-full">
            {/* Top vertical line connecting Q1 and Q2 to Semi 1 */}
            <div className="absolute left-0 top-[12%] bottom-[62%] w-0.5 bg-slate-600"></div>
            <div className="absolute left-0 top-[12%] w-4 h-0.5 bg-slate-600"></div>
            <div className="absolute left-0 top-[37%] w-4 h-0.5 bg-slate-600"></div>
            
            {/* Bottom vertical line connecting Q3 and Q4 to Semi 2 */}
            <div className="absolute left-0 top-[63%] bottom-[12%] w-0.5 bg-slate-600"></div>
            <div className="absolute left-0 top-[63%] w-4 h-0.5 bg-slate-600"></div>
            <div className="absolute left-0 top-[88%] w-4 h-0.5 bg-slate-600"></div>
          </div>

          {/* SEMIFINALS */}
          <div className="col-span-3 space-y-32">
            <div className="text-center text-white font-bold text-lg mb-6 pb-2 border-b border-slate-600">
              Хагас шөвгийн тоглолт
            </div>
            {semis.map((s, idx) => (
              <div key={s.id} className="relative" style={{ marginTop: idx === 0 ? '80px' : '0' }}>
                {renderMatch(s, `Semifinal ${idx + 1}`)}
                {/* Connection line to right */}
                <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-slate-600"></div>
              </div>
            ))}
          </div>

          {/* Connection lines from Semis to Final */}
          <div className="col-span-1 relative h-full">
            {/* Vertical line connecting both semis to final */}
            <div className="absolute left-0 top-[25%] bottom-[50%] w-0.5 bg-slate-600"></div>
            <div className="absolute left-0 top-[25%] w-4 h-0.5 bg-slate-600"></div>
            <div className="absolute left-0 top-[75%] w-4 h-0.5 bg-slate-600"></div>
          </div>

          {/* FINAL and BRONZE */}
          <div className="col-span-4 space-y-12">
            <div className="text-center text-white font-bold text-lg mb-6 pb-2 border-b border-slate-600">
              Хүрэл тоглолт
            </div>
            
            {/* Final match */}
            <div style={{ marginTop: '160px' }}>
              {renderMatch(final, 'Final')}
            </div>

            {/* 3rd place match */}
            {bronze && (
              <div className="mt-24">
                <div className="text-gray-400 text-base mb-4 text-center font-medium border-t border-slate-600 pt-8">
                  3-р байр
                </div>
                {renderMatch(bronze, null)}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
