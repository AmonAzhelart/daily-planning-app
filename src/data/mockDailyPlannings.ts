import { DailyPlanningSummary, DailyPlanningStatus } from '../types/dailyPlanning';

export const mockDailyPlannings: DailyPlanningSummary[] = [
  {
    id: 'dp001',
    title: 'DP per Sabato 01/03/2025',
    date: '2025-03-01',
    status: DailyPlanningStatus.CHIUSO,
    revision: 2, // Example of a modified DP [cite: 31]
  },
  {
    id: 'dp002',
    title: 'DP per Domenica 02/03/2025',
    date: '2025-03-02',
    status: DailyPlanningStatus.APERTO, // Specialist might be working on this [cite: 26]
    revision: 1,
  },
  {
    id: 'dp003',
    title: 'DP per Lunedì 03/03/2025',
    date: '2025-03-03',
    status: DailyPlanningStatus.NUOVO, // MAGAZZINIERE might be working on this [cite: 14]
    revision: 1,
  },
  {
    id: 'dp004',
    title: 'DP per Martedì 04/03/2025',
    date: '2025-03-04',
    status: DailyPlanningStatus.NUOVO,
    revision: 1,
  },
  {
    id: 'dp005',
    title: 'DP per Mercoledì 05/03/2025',
    date: '2025-03-05',
    status: DailyPlanningStatus.APERTO,
    revision: 1,
  },
  {
    id: 'dp006',
    title: 'DP per Giovedì 06/03/2025',
    date: '2025-03-06',
    status: DailyPlanningStatus.CHIUSO,
    revision: 1,
  },
  {
    id: 'dp007',
    title: 'DP per Venerdì 07/03/2025',
    date: '2025-03-07',
    status: DailyPlanningStatus.MODIFICATO, // Example of a modified DP [cite: 30]
    revision: 3,
  },
  // Add more items to test pagination (e.g., 15-20 more)
  { id: 'dp008', title: 'DP per Sabato 08/03/2025', date: '2025-03-08', status: DailyPlanningStatus.NUOVO, revision: 1 },
  { id: 'dp009', title: 'DP per Domenica 09/03/2025', date: '2025-03-09', status: DailyPlanningStatus.APERTO, revision: 1 },
  { id: 'dp010', title: 'DP per Lunedì 10/03/2025', date: '2025-03-10', status: DailyPlanningStatus.CHIUSO, revision: 1 },
  { id: 'dp011', title: 'DP per Martedì 11/03/2025', date: '2025-03-11', status: DailyPlanningStatus.NUOVO, revision: 1 },
  { id: 'dp012', title: 'DP per Mercoledì 12/03/2025', date: '2025-03-12', status: DailyPlanningStatus.APERTO, revision: 1 },
  { id: 'dp013', title: 'DP per Giovedì 13/03/2025', date: '2025-03-13', status: DailyPlanningStatus.MODIFICATO, revision: 2 },
  { id: 'dp014', title: 'DP per Venerdì 14/03/2025', date: '2025-03-14', status: DailyPlanningStatus.CHIUSO, revision: 1 },
  { id: 'dp015', title: 'DP per Sabato 15/03/2025', date: '2025-03-15', status: DailyPlanningStatus.NUOVO, revision: 1 },
  { id: 'dp016', title: 'DP per Domenica 16/03/2025', date: '2025-03-16', status: DailyPlanningStatus.APERTO, revision: 1 },
  { id: 'dp017', title: 'DP per Lunedì 17/03/2025', date: '2025-03-17', status: DailyPlanningStatus.CHIUSO, revision: 1 },
  { id: 'dp018', title: 'DP per Martedì 18/03/2025', date: '2025-03-18', status: DailyPlanningStatus.NUOVO, revision: 1 },
  { id: 'dp019', title: 'DP per Mercoledì 19/03/2025', date: '2025-03-19', status: DailyPlanningStatus.APERTO, revision: 1 },
  { id: 'dp020', title: 'DP per Giovedì 20/03/2025', date: '2025-03-20', status: DailyPlanningStatus.MODIFICATO, revision: 2 },
];