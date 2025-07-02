import { useState, useCallback } from 'react';

// --- CORREZIONE CHIAVE ---
// Usiamo un percorso relativo. Tutte le chiamate API verranno inviate
// allo stesso dominio del frontend (es. /api/...) e intercettate da Nginx.
//const API_BASE_URL = '/api'; 
const API_BASE_URL = 'http://localhost:8000'; 


// --- Definizioni dei tipi (invariate) ---
export type DPStatus = 'NUOVO' | 'APERTO' | 'CHIUSO' | 'MODIFICATO';
export type FasciaOraria = 'AM' | 'PM';
export type MaterialeDisponibile = 'SI' | 'NO';

export interface DPTesta {
id: number;
giorno: string;
stato: DPStatus;
revisione: number;
createdby: string;
modifiedby: string;
created: string;
modified: string;
}

export interface DPTestaCreate {
giorno: string;
stato?: DPStatus;
revisione?: number;
createdby?: string;
modifiedby?: string;
}

export interface DPTestaUpdate {
stato?: DPStatus;
revisione?: number;
modifiedby?: string;
details?: DPDetailUpdate[];
}

export interface OauthUserResponse {
    username: string;
    first_name: string | null;
    last_name: string | null;
    role: Role | null;
}

export interface DPDetail {
    id: number;
    id_testata: number;
    caluid: string | null;
    id_sede: number | null;
    note: string | null;
    fasciaoraria: FasciaOraria;
    materialedisponibile: MaterialeDisponibile;
    created: string;
    createdby: string;
    modified: string;
    modifiedby: string;
    descrizionemanuale?: string | null;
    agpspm_users: OauthUserResponse[]; // MODIFICATO: Array di oggetti utente
}

export interface DPDetailCreate {
    id_testata: number;
    caluid?: string | null;
    id_sede?: number | null;
    agpspm_users?: string[]; // MODIFICATO: Array di username
    note?: string | null;
    fasciaoraria: FasciaOraria;
    materialedisponibile: MaterialeDisponibile;
    createdby?: string;
    modifiedby?: string;
    descrizionemanuale?: string | null;
}

export interface DPDetailUpdate {
    caluid?: string | null;
    id_sede?: number | null;
    agpspm_users?: string[]; // MODIFICATO: Array di username
    note?: string | null;
    fasciaoraria?: FasciaOraria;
    materialedisponibile?: MaterialeDisponibile;
    modifiedby?: string;
    descrizionemanuale?: string | null;
}

export interface DPDetailTI {
id: number;
id_dettaglio: number;
id_tipi_interventi: number;
qta: number;
}

export interface DPDetailTICreate {
id_dettaglio: number;
id_tipi_interventi: number;
qta?: number;
}

export interface TipoIntervento {
id: number;
descrizione: string | null;
}

export interface ClienteResponseAPI {
id_sede: number | null;
cliente: string;
sede: string;
}

export interface OauthUser {
username: string;
first_name: string | null;
last_name: string | null;
role: number;
active: number;
super: number;
gestione_congressi: number;
hide_is_search: number;
parent_id: string | null;
}

export interface Role {
id: number;
name: string;
description: string | null;
}

export interface UserInfo {
username: string;
first_name: string | null;
last_name: string | null;
role: Role;
}

/**
* Funzione interna stand-alone per eseguire chiamate API generiche.
*/
export const apiCall = async <T>(endpoint: string, method: string, body: Object | null = null, queryParams: Object | null = null, extraOptions: RequestInit = {}): Promise<T> => {
 let url = `${API_BASE_URL}${endpoint}`;
 if (queryParams) {
  const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
  url = `${url}?${queryString}`;
 }

 const options: RequestInit = {
  method,
  headers: {
   'Content-Type': 'application/json',
  },
  credentials: 'include', 
  ...extraOptions,
 };

 if (body) {
  options.body = JSON.stringify(body);
 }

 try {
  const response = await fetch(url, options);
  if (!response.ok) {
   if (response.status === 401) {
    throw new Error('Unauthorized');
   }
   const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
   throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) {
   return {} as T;
  }
  return await response.json();
 } catch (err) {
  throw err;
 }
};

/**
* useDailyPlanningApi - Custom Hook per l'interazione con le API.
*/
export const useDailyPlanningApi = () => {
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

const wrappedApiCall = useCallback(async <T>(...args: Parameters<typeof apiCall>): Promise<T> => {
 setLoading(true);
 setError(null);

   return await apiCall<T>(...args);

}, []);

// --- Funzioni specifiche per le API ---
  // CORREZIONE: Tutti gli endpoint sono ora percorsi relativi che saranno
  // correttamente prefissati con /api dalla funzione apiCall.
  // Aggiunta la barra "/" finale per evitare i redirect 307.
const createDPTesta = useCallback((data: DPTestaCreate) => wrappedApiCall<DPTesta>('/dp_testata/', 'POST', data), [wrappedApiCall]);
const getDPTesta = useCallback((id: number) => wrappedApiCall<DPTesta>(`/dp_testata/${id}`, 'GET'), [wrappedApiCall]);
const getAllDPTesta = useCallback(() => wrappedApiCall<DPTesta[]>('/dp_testata/', 'GET'), [wrappedApiCall]);
const updateDPTesta = useCallback((id: number, data: DPTestaUpdate) => wrappedApiCall<DPTesta>(`/dp_testata/${id}`, 'PUT', data), [wrappedApiCall]);
const deleteDPTesta = useCallback((id: number) => wrappedApiCall<{ message: string }>(`/dp_testata/${id}`, 'DELETE'), [wrappedApiCall]);

const createDPDetail = useCallback((data: DPDetailCreate) => wrappedApiCall<DPDetail>('/dp_detail/', 'POST', data), [wrappedApiCall]);
const getDPDetailsByTesta = useCallback((idTestata: number) => wrappedApiCall<DPDetail[]>(`/dp_detail/by_dp_testa/${idTestata}`, 'GET'), [wrappedApiCall]);
const updateDPDetail = useCallback((id: number, data: DPDetailUpdate) => wrappedApiCall<DPDetail>(`/dp_detail/${id}`, 'PUT', data), [wrappedApiCall]);
const deleteDPDetail = useCallback((id: number) => wrappedApiCall<{ message: string }>(`/dp_detail/${id}`, 'DELETE'), [wrappedApiCall]);

const createDPDetailTI = useCallback((data: DPDetailTICreate) => wrappedApiCall<DPDetailTI>('/dp_detail_ti/', 'POST', data), [wrappedApiCall]);
const getDPDetailTIsByDetail = useCallback((idDettaglio: number) => wrappedApiCall<DPDetailTI[]>(`/dp_detail_ti/by_dp_detail/${idDettaglio}`, 'GET'), [wrappedApiCall]);
const deleteDPDetailTI = useCallback((id: number) => wrappedApiCall<{ message: string }>(`/dp_detail_ti/${id}`, 'DELETE'), [wrappedApiCall]);

const getClients = useCallback(() => wrappedApiCall<ClienteResponseAPI[]>('/clients/', 'GET'), [wrappedApiCall]);
const getInterventionTypes = useCallback(() => wrappedApiCall<TipoIntervento[]>('/intervention_types/', 'GET'), [wrappedApiCall]);
const getResources = useCallback(() => wrappedApiCall<OauthUser[]>('/resources/', 'GET'), [wrappedApiCall]);
const get_zoho_events = useCallback((targetDate:string) => wrappedApiCall<any[]>(`/get_zoho_events?calendar_uid=b3be700c24914243ab0190bf9bddd75c&start_date=${targetDate}&end_date=${targetDate}`, 'POST'), [wrappedApiCall]);
const zoho_oauth_initiate = useCallback(() => wrappedApiCall<any>(`/zoho_oauth_initiate`, 'GET'), [wrappedApiCall]);

const exportDPPdf = useCallback((dpTestaId: number) => wrappedApiCall<{ message: string }>(`/export_dp_pdf/${dpTestaId}`, 'POST'), [wrappedApiCall]);
const logOperation = useCallback((data: { operation: string; description: string; user?: string }) => wrappedApiCall<{ message: string }>('/log_operation/', 'POST', data), [wrappedApiCall]);

const getTopResourcesReport = useCallback(() => wrappedApiCall<{ message: string; data: any[] }>('/reports/top_resources/', 'GET'), [wrappedApiCall]);
const getInterventionsByPeriodReport = useCallback((startDate: string, endDate: string, clientName?: string, resourceAssigned?: string, interventionType?: string) => {
 const queryParams: Record<string, string> = { start_date: startDate, end_date: endDate };
 if (clientName) queryParams.client_name = clientName;
 if (resourceAssigned) queryParams.resource_assigned = resourceAssigned;
 if (interventionType) queryParams.intervention_type = interventionType;
 return wrappedApiCall('/reports/interventions_by_period/', 'GET', null, queryParams);
 }, [wrappedApiCall]);

const getDPPdfReport = useCallback(async (dpTestaId: number) => {
 setLoading(true);
 setError(null);
 try {
 const url = `${API_BASE_URL}/dp_testata/get-pdf-report/${dpTestaId}`;
 const response = await fetch(url, {
  method: 'GET',
  credentials: 'include',
 });
 if (!response.ok) {
  const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
  throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
 }
 return await response.blob();
 } catch (err: any) {
 setError(err.message);
 throw err;
 } finally {
 setLoading(false);
 }
}, []);

  // La chiamata a /auth/me funziona correttamente perché il tuo AuthProvider
  // chiama l'endpoint esatto '/auth/me' e non causa redirect.
const getUserInfo = useCallback((username: string) => wrappedApiCall<UserInfo>(`/auth/user/${username}`, 'GET'), [wrappedApiCall]);

const getUrlMainApp = useCallback(() => wrappedApiCall<any>(`/dp_utility/get_url_mainApp`, 'GET'), [wrappedApiCall]);
const logout = useCallback(() => wrappedApiCall<any>(`/auth/logout`, 'POST'), [wrappedApiCall]);

return {
 loading,
 error,
 createDPTesta,
 getDPTesta,
 getAllDPTesta,
 updateDPTesta,
 deleteDPTesta,
 createDPDetail,
 getDPDetailsByTesta,
 updateDPDetail,
 deleteDPDetail,
 createDPDetailTI,
 getDPDetailTIsByDetail,
 deleteDPDetailTI,
 getClients,
 getInterventionTypes,
 getResources,
 get_zoho_events,
 zoho_oauth_initiate,
 exportDPPdf,
 logOperation,
 getTopResourcesReport,
 getInterventionsByPeriodReport,
 getUserInfo,
 getDPPdfReport,
 getUrlMainApp,
 logout
};
};
