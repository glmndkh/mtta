import React from 'react';
import { computeMedalistsForDivision, computeFinalPlacements } from '../../utils/resultsHelper';
import { Card, CardContent } from '../ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

export const FinalStandingsView = ({ matches, groups, playersById, division, playoffConfig }) => {
  const medalists = computeMedalistsForDivision(division, matches, playersById, playoffConfig);
  const placements = computeFinalPlacements(division, matches, groups, playersById, playoffConfig);

  if (!medalists.gold && !medalists.silver && medalists.bronze.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Эцсийн үр дүнгийн өгөгдөл олдсонгүй.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Podium Section */}
      <Card className="shadow-2xl border-2 border-yellow-400">
        <div className="bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-100 p-6 border-b-2 border-yellow-400">
          <h2 className="text-3xl font-bold text-center text-yellow-900 flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8" />
            Медальт байрууд
            <Trophy className="w-8 h-8" />
          </h2>
        </div>
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
            {/* Silver - Position 2 */}
            {medalists.silver && (
              <div className="flex flex-col items-center order-2 md:order-1">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-2xl mb-4 transform hover:scale-110 transition-transform">
                  <Medal className="w-16 h-16 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700 mb-1">2</div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">{medalists.silver.name}</div>
                  {medalists.silver.club && (
                    <div className="text-sm text-gray-600">{medalists.silver.club}</div>
                  )}
                  <div className="mt-2 px-4 py-1 bg-gradient-to-r from-gray-300 to-gray-400 text-white rounded-full text-sm font-bold">
                    Мөнгөн медаль
                  </div>
                </div>
              </div>
            )}

            {/* Gold - Position 1 */}
            {medalists.gold && (
              <div className="flex flex-col items-center order-1 md:order-2">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-2xl mb-4 transform hover:scale-110 transition-transform ring-4 ring-yellow-400">
                  <Trophy className="w-20 h-20 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">1</div>
                  <div className="text-xl font-bold text-gray-900 mb-1">{medalists.gold.name}</div>
                  {medalists.gold.club && (
                    <div className="text-sm text-gray-600">{medalists.gold.club}</div>
                  )}
                  <div className="mt-2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full text-sm font-bold">
                    Алтан медаль
                  </div>
                </div>
              </div>
            )}

            {/* Bronze - Position 3 */}
            {medalists.bronze.length > 0 && (
              <div className="flex flex-col items-center order-3">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl mb-4 transform hover:scale-110 transition-transform">
                  <Award className="w-16 h-16 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-700 mb-1">3</div>
                  {medalists.bronze.map((bronze, idx) => (
                    <div key={bronze.id} className={idx > 0 ? 'mt-2' : ''}>
                      <div className="text-lg font-semibold text-gray-900 mb-1">{bronze.name}</div>
                      {bronze.club && (
                        <div className="text-sm text-gray-600">{bronze.club}</div>
                      )}
                    </div>
                  ))}
                  <div className="mt-2 px-4 py-1 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full text-sm font-bold">
                    Хүрэл медаль
                  </div>
                  {medalists.bronze.length === 2 && (
                    <div className="text-xs text-gray-500 mt-1">(Хоёр хүрэл медаль)</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Placement Table */}
      <Card className="shadow-lg border-2">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
          <h3 className="text-2xl font-bold text-blue-900">Бүх байрлал</h3>
        </div>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="py-3 px-4 text-left font-bold">Байр</th>
                  <th className="py-3 px-4 text-left font-bold">Тамирчин</th>
                  <th className="py-3 px-4 text-left font-bold">Клуб</th>
                  <th className="py-3 px-4 text-left font-bold">Тайлбар</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((placement, index) => {
                  let bgColor = '';
                  if (placement.position === 1) bgColor = 'bg-gradient-to-r from-yellow-100 to-yellow-200';
                  else if (placement.position === 2) bgColor = 'bg-gradient-to-r from-gray-100 to-gray-200';
                  else if (placement.position === 3) bgColor = 'bg-gradient-to-r from-orange-100 to-orange-200';

                  return (
                    <tr 
                      key={`${placement.player.id}-${index}`}
                      className={`border-b hover:bg-gray-50 transition-colors ${bgColor}`}
                    >
                      <td className="py-3 px-4 text-center font-bold text-lg">{placement.position}</td>
                      <td className="py-3 px-4 font-semibold">{placement.player.name}</td>
                      <td className="py-3 px-4 text-gray-600">{placement.player.club || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{placement.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
