import React from 'react';
import { computeGroupStandings } from '../../utils/resultsHelper';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const GroupStageView = ({ groups, matches, playersById, divisionId }) => {
  const divisionGroups = groups.filter(g => g.divisionId === divisionId);
  const divisionMatches = matches.filter(m => m.stage === 'GROUP' && m.divisionId === divisionId);

  if (divisionGroups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Группийн шатны өгөгдөл олдсонгүй.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary info */}
      <div className="flex gap-6 text-sm text-gray-600 mb-6">
        <div>
          <span className="font-semibold">Нийт групп:</span> {divisionGroups.length}
        </div>
        <div>
          <span className="font-semibold">Нийт тоглолт:</span> {divisionMatches.length}
        </div>
      </div>

      {/* Render each group */}
      {divisionGroups.map(group => {
        const standings = computeGroupStandings(group, divisionMatches, playersById);
        
        return (
          <Card key={group.id} className="shadow-lg border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="text-2xl font-bold text-blue-900">
                {group.name} групп
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="py-3 px-4 text-left font-bold">Байр</th>
                      <th className="py-3 px-4 text-left font-bold">Тамирчин</th>
                      <th className="py-3 px-4 text-center font-bold">Тоглолт</th>
                      <th className="py-3 px-4 text-center font-bold">Хожил</th>
                      <th className="py-3 px-4 text-center font-bold">Хожигдол</th>
                      <th className="py-3 px-4 text-center font-bold text-blue-700">Оноо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, index) => (
                      <tr 
                        key={standing.playerId}
                        className={`border-b hover:bg-gray-50 transition-colors ${
                          index === 0 ? 'bg-yellow-50 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold text-lg">{index + 1}</td>
                        <td className="py-3 px-4">{standing.playerName}</td>
                        <td className="py-3 px-4 text-center">{standing.played}</td>
                        <td className="py-3 px-4 text-center text-green-600 font-semibold">{standing.won}</td>
                        <td className="py-3 px-4 text-center text-red-600 font-semibold">{standing.lost}</td>
                        <td className="py-3 px-4 text-center font-bold text-blue-700 text-lg">{standing.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
