import { Client } from "./client";

// Existing enum and interface
export enum DailyPlanningStatus {
  NUOVO = 'NUOVO',
  APERTO = 'APERTO',
  CHIUSO = 'CHIUSO',
  MODIFICATO = 'MODIFICATO',
}

export interface DailyPlanningSummary {
  id: string;
  title: string;
  date: string;
  status: DailyPlanningStatus;
  revision: number;
}

// New types for DP Creation Form (FASE 1)
export interface SelectedIntervention {
  interventionTypeId: string; // Reference to InterventionType id
  interventionTypeName: string; // Store name for display convenience
  quantity: number;
}

export interface DailyPlanningDetailRow {
  id: string; // Unique frontend ID for this row (e.g., uuid)
  zohoEventId?: string; // Original Zoho event ID, if applicable
  zohoSuggestion: string; // Readonly field from Zoho event
  selectedClient: Client | null;
  selectedInterventions: SelectedIntervention[];
  notes: string;
  timeSlot: 'AM' | 'PM' | ''; // AM/PM selection
  materialAvailable: boolean; // Checkbox S/N
}

// Represents the entire new DP being created
export interface NewDailyPlanningData {
  targetDate: string; // The date for which this DP is being created
  rows: DailyPlanningDetailRow[];
  // status will be NUOVO initially
}