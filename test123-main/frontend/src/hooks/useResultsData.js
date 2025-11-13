// Hook to read tournament data from localStorage
import { useState, useEffect } from 'react';
import { saveMockDataToLocalStorage } from '../utils/mockData';

export function useResultsData() {
  const [data, setData] = useState({
    playersById: {},
    divisions: [],
    groups: [],
    matches: [],
    playoffConfigs: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    try {
      // Try to read from localStorage
      const playersStr = localStorage.getItem('tt-admin-players');
      const divisionsStr = localStorage.getItem('tt-admin-divisions');
      const groupsStr = localStorage.getItem('tt-admin-groups');
      const matchesStr = localStorage.getItem('tt-admin-matches');
      const configsStr = localStorage.getItem('tt-admin-playoff-configs');

      // If no data exists, save mock data for testing
      if (!playersStr || !divisionsStr || !groupsStr || !matchesStr) {
        saveMockDataToLocalStorage();
        // Re-read after saving
        const newPlayersStr = localStorage.getItem('tt-admin-players');
        const newDivisionsStr = localStorage.getItem('tt-admin-divisions');
        const newGroupsStr = localStorage.getItem('tt-admin-groups');
        const newMatchesStr = localStorage.getItem('tt-admin-matches');
        const newConfigsStr = localStorage.getItem('tt-admin-playoff-configs');

        setData({
          playersById: newPlayersStr ? JSON.parse(newPlayersStr) : {},
          divisions: newDivisionsStr ? JSON.parse(newDivisionsStr) : [],
          groups: newGroupsStr ? JSON.parse(newGroupsStr) : [],
          matches: newMatchesStr ? JSON.parse(newMatchesStr) : [],
          playoffConfigs: newConfigsStr ? JSON.parse(newConfigsStr) : [],
          loading: false,
          error: null,
        });
      } else {
        // Parse existing data
        setData({
          playersById: JSON.parse(playersStr),
          divisions: JSON.parse(divisionsStr),
          groups: JSON.parse(groupsStr),
          matches: JSON.parse(matchesStr),
          playoffConfigs: configsStr ? JSON.parse(configsStr) : [],
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      setData({
        playersById: {},
        divisions: [],
        groups: [],
        matches: [],
        playoffConfigs: [],
        loading: false,
        error: 'Өгөгдөл олдсонгүй. Админ хэсгээс групп болон тоглолтуудыг тохируулна уу.',
      });
    }
  }, []);

  return data;
}
