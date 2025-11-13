import React, { useState, useEffect } from 'react';
import { useResultsData } from '../../hooks/useResultsData';
import { DivisionSelector } from './DivisionSelector';
import { GroupStageView } from './GroupStageView';
import { PlayoffView } from './PlayoffView';
import { FinalStandingsView } from './FinalStandingsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { Trophy, Users, Award } from 'lucide-react';

export const ResultsPage = () => {
  const { playersById, divisions, groups, matches, playoffConfigs, loading, error } = useResultsData();
  
  const [selectedCategory, setSelectedCategory] = useState('SINGLES');
  const [selectedDivisionId, setSelectedDivisionId] = useState(null);
  const [activeTab, setActiveTab] = useState('group');

  // Auto-select first division when category changes
  useEffect(() => {
    const categoryDivisions = divisions.filter(d => d.category === selectedCategory);
    if (categoryDivisions.length > 0) {
      setSelectedDivisionId(categoryDivisions[0].id);
    } else {
      setSelectedDivisionId(null);
    }
  }, [selectedCategory, divisions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-xl text-gray-700">Өгөгдлийг уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="p-8 max-w-lg mx-4 bg-white shadow-xl">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Алдаа гарлаа</h2>
            <p className="text-gray-700">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  const selectedDivision = divisions.find(d => d.id === selectedDivisionId);
  const playoffConfig = playoffConfigs.find(pc => pc.divisionId === selectedDivisionId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Trophy className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold text-center">
              Тэмцээний үр дүн
            </h1>
            <Trophy className="w-12 h-12" />
          </div>
          <p className="text-center text-blue-100 text-lg">Админ хэсэг - Унших горим</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Selection */}
        <Card className="mb-8 shadow-xl border-2">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Тэмцээний ангилал
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setSelectedCategory('SINGLES')}
                className={`flex-1 min-w-[200px] px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                  selectedCategory === 'SINGLES'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400'
                }`}
              >
                Ганцаарчилсан тэмцээн
              </button>
              <button
                onClick={() => setSelectedCategory('DOUBLES')}
                className={`flex-1 min-w-[200px] px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                  selectedCategory === 'DOUBLES'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-400'
                }`}
              >
                Хосын тэмцээн
              </button>
              <button
                onClick={() => setSelectedCategory('TEAM')}
                className={`flex-1 min-w-[200px] px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                  selectedCategory === 'TEAM'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400'
                }`}
              >
                <Users className="inline-block w-5 h-5 mr-2" />
                Багийн тэмцээн
              </button>
            </div>
          </div>
        </Card>

        {/* Division Selector */}
        <DivisionSelector
          divisions={divisions}
          category={selectedCategory}
          selectedDivisionId={selectedDivisionId}
          onSelectDivision={setSelectedDivisionId}
        />

        {/* Content Tabs */}
        {selectedDivisionId && selectedDivision && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1 bg-white border-2 shadow-md">
              <TabsTrigger 
                value="group" 
                className="py-4 text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all"
              >
                Групп шат
              </TabsTrigger>
              <TabsTrigger 
                value="playoff" 
                className="py-4 text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
              >
                Шууд хасагдах шат
              </TabsTrigger>
              <TabsTrigger 
                value="standings" 
                className="py-4 text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-600 data-[state=active]:text-white transition-all"
              >
                Эцсийн байр, медаль
              </TabsTrigger>
            </TabsList>

            <TabsContent value="group">
              <GroupStageView
                groups={groups}
                matches={matches}
                playersById={playersById}
                divisionId={selectedDivisionId}
              />
            </TabsContent>

            <TabsContent value="playoff">
              <PlayoffView
                matches={matches}
                playersById={playersById}
                divisionId={selectedDivisionId}
                playoffConfig={playoffConfig}
              />
            </TabsContent>

            <TabsContent value="standings">
              <FinalStandingsView
                matches={matches}
                groups={groups}
                playersById={playersById}
                division={selectedDivision}
                playoffConfig={playoffConfig}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
