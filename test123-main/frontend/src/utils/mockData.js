// Mock data for testing the Tournament Results Page

// Mock Players
export const mockPlayers = {
  'p1': { id: 'p1', name: 'Болд Батаа', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'MALE', club: 'Улаанбаатар клуб' },
  'p2': { id: 'p2', name: 'Дорж Өнөр', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'MALE', club: 'Дархан клуб' },
  'p3': { id: 'p3', name: 'Сүхбат Энх', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'MALE', club: 'Эрдэнэт клуб' },
  'p4': { id: 'p4', name: 'Ганбат Төр', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'MALE', club: 'Улаанбаатар клуб' },
  'p5': { id: 'p5', name: 'Мөнх Алтан', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'MALE', club: 'Чойбалсан клуб' },
  'p6': { id: 'p6', name: 'Очир Бат', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'MALE', club: 'Дархан клуб' },
  'p7': { id: 'p7', name: 'Тэмүүжин Эрдэнэ', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'MALE', club: 'Эрдэнэт клуб' },
  'p8': { id: 'p8', name: 'Ариунболд Цэнд', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'MALE', club: 'Улаанбаатар клуб' },
  'p9': { id: 'p9', name: 'Алтанцэцэг Сарантуяа', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'FEMALE', club: 'Улаанбаатар клуб' },
  'p10': { id: 'p10', name: 'Болормаа Оюунцэцэг', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'FEMALE', club: 'Дархан клуб' },
};

// Mock Divisions
export const mockDivisions = [
  { id: 'd1', label: '13–15 нас, эрэгтэй', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'MALE' },
  { id: 'd2', label: '13–15 нас, эмэгтэй', category: 'SINGLES', ageGroup: '13–15 нас', genderType: 'FEMALE' },
];

// Mock Groups
export const mockGroups = [
  { id: 'g1', name: 'A', category: 'SINGLES', divisionId: 'd1', participantIds: ['p1', 'p2', 'p3', 'p4'] },
  { id: 'g2', name: 'B', category: 'SINGLES', divisionId: 'd1', participantIds: ['p5', 'p6', 'p7', 'p8'] },
];

// Mock Group Stage Matches
export const mockGroupMatches = [
  // Group A matches
  { id: 'm1', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g1', homeId: 'p1', awayId: 'p2', homeScore: 3, awayScore: 0, finished: true },
  { id: 'm2', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g1', homeId: 'p3', awayId: 'p4', homeScore: 3, awayScore: 1, finished: true },
  { id: 'm3', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g1', homeId: 'p1', awayId: 'p3', homeScore: 3, awayScore: 2, finished: true },
  { id: 'm4', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g1', homeId: 'p2', awayId: 'p4', homeScore: 3, awayScore: 0, finished: true },
  { id: 'm5', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g1', homeId: 'p1', awayId: 'p4', homeScore: 3, awayScore: 1, finished: true },
  { id: 'm6', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g1', homeId: 'p2', awayId: 'p3', homeScore: 1, awayScore: 3, finished: true },
  // Group B matches
  { id: 'm7', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g2', homeId: 'p5', awayId: 'p6', homeScore: 3, awayScore: 1, finished: true },
  { id: 'm8', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g2', homeId: 'p7', awayId: 'p8', homeScore: 3, awayScore: 0, finished: true },
  { id: 'm9', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g2', homeId: 'p5', awayId: 'p7', homeScore: 2, awayScore: 3, finished: true },
  { id: 'm10', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g2', homeId: 'p6', awayId: 'p8', homeScore: 3, awayScore: 2, finished: true },
  { id: 'm11', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g2', homeId: 'p5', awayId: 'p8', homeScore: 3, awayScore: 0, finished: true },
  { id: 'm12', stage: 'GROUP', category: 'SINGLES', divisionId: 'd1', groupId: 'g2', homeId: 'p6', awayId: 'p7', homeScore: 0, awayScore: 3, finished: true },
];

// Mock Playoff Matches (8-player bracket with bronze match)
export const mockPlayoffMatches = [
  // Quarterfinals
  { id: 'pq1', stage: 'PLAYOFF', category: 'SINGLES', divisionId: 'd1', roundName: 'Quarterfinal', slotIndex: 0, homeId: 'p1', awayId: 'p6', homeScore: 3, awayScore: 1, finished: true },
  { id: 'pq2', stage: 'PLAYOFF', category: 'SINGLES', divisionId: 'd1', roundName: 'Quarterfinal', slotIndex: 1, homeId: 'p3', awayId: 'p8', homeScore: 3, awayScore: 0, finished: true },
  { id: 'pq3', stage: 'PLAYOFF', category: 'SINGLES', divisionId: 'd1', roundName: 'Quarterfinal', slotIndex: 2, homeId: 'p7', awayId: 'p2', homeScore: 3, awayScore: 2, finished: true },
  { id: 'pq4', stage: 'PLAYOFF', category: 'SINGLES', divisionId: 'd1', roundName: 'Quarterfinal', slotIndex: 3, homeId: 'p5', awayId: 'p4', homeScore: 3, awayScore: 1, finished: true },
  // Semifinals
  { id: 'ps1', stage: 'PLAYOFF', category: 'SINGLES', divisionId: 'd1', roundName: 'Semifinal', slotIndex: 0, homeId: 'p1', awayId: 'p3', homeScore: 3, awayScore: 2, finished: true },
  { id: 'ps2', stage: 'PLAYOFF', category: 'SINGLES', divisionId: 'd1', roundName: 'Semifinal', slotIndex: 1, homeId: 'p7', awayId: 'p5', homeScore: 2, awayScore: 3, finished: true },
  // Bronze Match
  { id: 'pb', stage: 'PLAYOFF', category: 'SINGLES', divisionId: 'd1', roundName: 'Bronze', slotIndex: 0, homeId: 'p3', awayId: 'p7', homeScore: 3, awayScore: 1, finished: true },
  // Final
  { id: 'pf', stage: 'PLAYOFF', category: 'SINGLES', divisionId: 'd1', roundName: 'Final', slotIndex: 0, homeId: 'p1', awayId: 'p5', homeScore: 3, awayScore: 2, finished: true },
];

// Mock Playoff Config
export const mockPlayoffConfigs = [
  { divisionId: 'd1', playoffSize: 8, hasBronzeMatch: true },
  { divisionId: 'd2', playoffSize: 8, hasBronzeMatch: false },
];

// Function to save mock data to localStorage
export function saveMockDataToLocalStorage() {
  localStorage.setItem('tt-admin-players', JSON.stringify(mockPlayers));
  localStorage.setItem('tt-admin-divisions', JSON.stringify(mockDivisions));
  localStorage.setItem('tt-admin-groups', JSON.stringify(mockGroups));
  localStorage.setItem('tt-admin-matches', JSON.stringify([...mockGroupMatches, ...mockPlayoffMatches]));
  localStorage.setItem('tt-admin-playoff-configs', JSON.stringify(mockPlayoffConfigs));
}
