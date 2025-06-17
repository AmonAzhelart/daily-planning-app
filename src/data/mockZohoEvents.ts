import { ZohoEvent } from '../types/zohoCalendar';

// Define your "green" color or identifier. Zoho might use a specific color code or a field.
export const ZOHO_GREEN_COLOR = '#4CAF50'; // Example green

export const mockZohoEvents_2025_03_04: ZohoEvent[] = [ // Example for March 4th, 2025
  {
    id: 'zohoEvt001',
    subject: 'Sogesalars +bendarella(dario 24/02)+ptg+ritiro mifs',
    description: 'Detailed notes about Sogesalars task. Potentially long and with abbreviations.',
    startTime: '2025-03-04T09:00:00Z',
    endTime: '2025-03-04T10:00:00Z',
    isAllDay: false,
    backgroundColor: ZOHO_GREEN_COLOR, // This is a "green" event
  },
  {
    id: 'zohoEvt002',
    subject: 'V.michelino ptax2',
    description: 'Urgent meeting with V. Michelino regarding ptax2 components.',
    startTime: '2025-03-04T11:00:00Z',
    endTime: '2025-03-04T11:30:00Z',
    isAllDay: false,
    backgroundColor: ZOHO_GREEN_COLOR, // This is a "green" event
  },
  {
    id: 'zohoEvt003',
    subject: 'Internal Review Meeting',
    description: 'Project status update.',
    startTime: '2025-03-04T14:00:00Z',
    endTime: '2025-03-04T15:00:00Z',
    isAllDay: false,
    backgroundColor: '#FFC107', // Not green
  },
  {
    id: 'zohoEvt004',
    subject: 'S.marco stb',
    description: 'Follow up on S.marco stb items.',
    startTime: '2025-03-04T16:00:00Z',
    endTime: '2025-03-04T16:30:00Z',
    isAllDay: false,
    backgroundColor: ZOHO_GREEN_COLOR, // This is a "green" event
  },
  {
    id: 'zohoEvt005',
    subject: 'Team Lunch',
    description: 'Casual team lunch.',
    startTime: '2025-03-04T12:30:00Z',
    endTime: '2025-03-04T13:30:00Z',
    isAllDay: false,
    backgroundColor: '#2196F3', // Not green
  },
];

// You can add more mock data for different dates if needed
// export const mockZohoEvents_2025_03_05: ZohoEvent[] = [ ... ];