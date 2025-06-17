import { useState, useCallback } from 'react';

// CORREZIONE: Usa 'localhost' per coerenza con l'origine del frontend.
// Questo risolve il problema dei cookie non inviati.
// const API_BASE_URL = 'http://localhost:8000'; 
const API_BASE_URL = 'http://localhost:8000'; 


// --- Definizioni dei tipi (dalla tua versione originale) ---
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

export interface DPDetail {
  id: number;
  id_testata: number;
  caluid: string | null;
  id_sede: number | null;
  id_agpspm: string | null;
  note: string | null;
  fasciaoraria: FasciaOraria;
  materialedisponibile: MaterialeDisponibile;
  created: string;
  createdby: string;
  modified: string;
  modifiedby: string;
  descrizionemanuale?: string | null;
}

export interface DPDetailCreate {
  id_testata: number;
  caluid?: string | null;
  id_sede?: number | null;
  id_agpspm?: string | null;
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
  id_agpspm?: string | null;
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
        // Questa opzione è FONDAMENTALE per inviare i cookie di sessione
        // al backend quando si fanno chiamate cross-origin.
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
    try {
      return await apiCall<T>(...args);
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Funzioni specifiche per le API (dalla tua versione originale) ---
  const createDPTesta = useCallback((data: DPTestaCreate) => wrappedApiCall<DPTesta>('/api/dp_testata', 'POST', data), [wrappedApiCall]);
  const getDPTesta = useCallback((id: number) => wrappedApiCall<DPTesta>(`/api/dp_testata/${id}`, 'GET'), [wrappedApiCall]);
  const getAllDPTesta = useCallback(() => wrappedApiCall<DPTesta[]>('/api/dp_testata', 'GET'), [wrappedApiCall]);
  const updateDPTesta = useCallback((id: number, data: DPTestaUpdate) => wrappedApiCall<DPTesta>(`/api/dp_testata/${id}`, 'PUT', data), [wrappedApiCall]);
  const deleteDPTesta = useCallback((id: number) => wrappedApiCall<{ message: string }>(`/api/dp_testata/${id}`, 'DELETE'), [wrappedApiCall]);

  const createDPDetail = useCallback((data: DPDetailCreate) => wrappedApiCall<DPDetail>('/api/dp_detail', 'POST', data), [wrappedApiCall]);
  const getDPDetailsByTesta = useCallback((idTestata: number) => wrappedApiCall<DPDetail[]>(`/api/dp_detail/by_dp_testa/${idTestata}`, 'GET'), [wrappedApiCall]);
  const updateDPDetail = useCallback((id: number, data: DPDetailUpdate) => wrappedApiCall<DPDetail>(`/api/dp_detail/${id}`, 'PUT', data), [wrappedApiCall]);
  const deleteDPDetail = useCallback((id: number) => wrappedApiCall<{ message: string }>(`/api/dp_detail/${id}`, 'DELETE'), [wrappedApiCall]);

  const createDPDetailTI = useCallback((data: DPDetailTICreate) => wrappedApiCall<DPDetailTI>('/api/dp_detail_ti', 'POST', data), [wrappedApiCall]);
  const getDPDetailTIsByDetail = useCallback((idDettaglio: number) => wrappedApiCall<DPDetailTI[]>(`/api/dp_detail_ti/by_dp_detail/${idDettaglio}`, 'GET'), [wrappedApiCall]);
  const deleteDPDetailTI = useCallback((id: number) => wrappedApiCall<{ message: string }>(`/api/dp_detail_ti/${id}`, 'DELETE'), [wrappedApiCall]);

  const getClients = useCallback(() => wrappedApiCall<ClienteResponseAPI[]>('/api/clients', 'GET'), [wrappedApiCall]);
  const getInterventionTypes = useCallback(() => wrappedApiCall<TipoIntervento[]>('/api/intervention_types', 'GET'), [wrappedApiCall]);
  const getResources = useCallback(() => wrappedApiCall<OauthUser[]>('/api/resources', 'GET'), [wrappedApiCall]);
  const get_zoho_events = useCallback((targetDate:string) => wrappedApiCall<any[]>(`/api/get_zoho_events?calendar_uid=b3be700c24914243ab0190bf9bddd75c&start_date=${targetDate}&end_date=${targetDate}`, 'POST'), [wrappedApiCall]);
  const exportDPPdf = useCallback((dpTestaId: number) => wrappedApiCall<{ message: string }>(`/api/export_dp_pdf/${dpTestaId}`, 'POST'), [wrappedApiCall]);
  const logOperation = useCallback((data: { operation: string; description: string; user?: string }) => wrappedApiCall<{ message: string }>('/api/log_operation', 'POST', data), [wrappedApiCall]);
  
  const getTopResourcesReport = useCallback(() => wrappedApiCall<{ message: string; data: any[] }>('/api/reports/top_resources', 'GET'), [wrappedApiCall]);
  const getInterventionsByPeriodReport = useCallback((startDate: string, endDate: string, clientName?: string, resourceAssigned?: string, interventionType?: string) => {
      const queryParams: Record<string, string> = { start_date: startDate, end_date: endDate };
      if (clientName) queryParams.client_name = clientName;
      if (resourceAssigned) queryParams.resource_assigned = resourceAssigned;
      if (interventionType) queryParams.intervention_type = interventionType;
      return wrappedApiCall('/api/reports/interventions_by_period', 'GET', null, queryParams);
    }, [wrappedApiCall]);

  const getDPPdfReport = useCallback(async (dpTestaId: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/api/dp_testata/get-pdf-report/${dpTestaId}`;
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

  const getUserInfo = useCallback((username: string) => wrappedApiCall<UserInfo>(`/auth/user/${username}`, 'GET'), [wrappedApiCall]);

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
    exportDPPdf,
    logOperation,
    getTopResourcesReport,
    getInterventionsByPeriodReport,
    getUserInfo,
    getDPPdfReport
  };
};
