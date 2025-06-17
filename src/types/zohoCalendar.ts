export interface ZohoEvent {
  id: string;
  subject: string; // Typically the main title of the event
  description?: string; // More details
  startTime: string; // ISO Date string
  endTime: string; // ISO Date string
  isAllDay: boolean;
  backgroundColor: string; // To simulate Zoho's event color, e.g., "#4CAF50" for green
  // Add any other relevant fields you might get from Zoho API
}