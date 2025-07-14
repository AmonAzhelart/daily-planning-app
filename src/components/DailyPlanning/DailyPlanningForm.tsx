import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    Container, Typography, Paper, Box, Button, CircularProgress, Stack, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
    AppBar, Toolbar, CssBaseline, alpha, Fab, Dialog,
    DialogTitle, DialogContent, useMediaQuery, Card, CardActionArea,
    DialogActions, LinearProgress, Alert, AvatarGroup, Avatar,
    Chip
} from '@mui/material';
import {
    Add as AddIcon, Save as SaveIcon, LockOpen as LockOpenIcon, Lock as LockIcon,
    Event as EventIcon, Search as SearchIcon,
    Close as CloseIcon, PictureAsPdf as PictureAsPdfIcon,
    SyncLock as SyncLockIcon, Group as GroupIcon, CheckCircleOutline as CheckCircleOutlineIcon,
    Construction as ConstructionIcon, AccessTime as AccessTimeIcon, Category as CategoryIcon,
    FiberManualRecord as FiberManualRecordIcon
} from '@mui/icons-material';
import { keyframes, useTheme } from '@mui/system';
import {
    useDailyPlanningApi,
    DPTesta, DPDetail, DPTestaCreate, DPTestaUpdate,
    TipoIntervento, ClienteResponseAPI, OauthUserResponse,
    DPStatus, FasciaOraria,
} from '../../customHook/api';
import { useAuth } from '../../context/AuthContenxt';
import { DownloadIcon } from 'lucide-react';
import CollapsibleTableRow from './CollapsibleTableRow';

// --- Tipi Esportati ---
export interface DailyPlanningFormProps {
    planningId: number | null;
    targetDate: string | null;
    onClose: () => void;
    title: string;
}
export interface DailyPlanningFormRef {
    triggerSaveDraft: () => Promise<void>;
    handleCloseRequest: () => void;
}
export type UserRole = 'MAGAZZINIERE' | 'SPECIALIST';
export interface Risorsa { id: string; nome: string; sigla: string; }
export interface Client { id: number | null; ragioneSociale: string; nomeBreve?: string; }
export interface InterventionType { id: number; name: string; }
export interface SelectedIntervention { id?: number; interventionTypeId: number; interventionTypeName: string; quantity: number; }
export interface DailyPlanningDetailRow {
    id: string | number;
    isNew?: boolean;
    zohoEventId: string | null;
    zohoOriginalTitle: string;
    zohoEventColor?: string;
    descrizionemanuale: string;
    selectedClient: Client | null;
    risorseAssegnate: Risorsa[];
    selectedInterventions: SelectedIntervention[];
    notes: string;
    timeSlot: FasciaOraria | '';
    materialAvailable: boolean;
}
export type { DPStatus, FasciaOraria };

// --- Helper ---
const deriveSigla = (firstName: string | null, lastName: string | null): string => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}` || '?';
};

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 ${alpha('#ed6c02', 0.6)}; }
  70% { box-shadow: 0 0 0 7px ${alpha('#ed6c02', 0)}; }
  100% { box-shadow: 0 0 0 0 ${alpha('#ed6c02', 0)}; }
`;

// --- Componente Principale ---
const DailyPlanningForm = forwardRef<DailyPlanningFormRef, DailyPlanningFormProps>(({ planningId, targetDate, onClose, title }, ref) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));

    const { user } = useAuth();
    const hasHighPriority = (user?.role?.priority ?? 99) <= 4;
    const currentUserRole = user?.role?.name || 'Utente';

    const api = useDailyPlanningApi();
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const [zohoAuthUrl, setZohoAuthUrl] = useState<string | null>(null);
    const [dpRows, setDpRows] = useState<DailyPlanningDetailRow[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
    const [risorse, setRisorse] = useState<Risorsa[]>([]);
    const [dpTesta, setDpTesta] = useState<DPTesta | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentRowInModal, setCurrentRowInModal] = useState<DailyPlanningDetailRow | null>(null);
    const [infoDialogOpen, setInfoDialogOpen] = useState(false);
    const [infoDialogContent, setInfoDialogContent] = useState({ title: '', message: '' });
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

    const showRisorsaColumn = useMemo(() => {
        return hasHighPriority && dpTesta?.stato && dpTesta.stato !== 'NUOVO';
    }, [hasHighPriority, dpTesta]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (isDirty) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    const loadPlanningData = useCallback(async (idOverride?: number) => {
        setIsLoadingInitialData(true);
        setPageError(null);
        setZohoAuthUrl(null);

        const idToLoad = idOverride ?? planningId;
        let currentDpTesta: DPTesta | null = null;

        if (idToLoad) {
            try {
                currentDpTesta = await api.getDPTesta(Number(idToLoad));
                setDpTesta(currentDpTesta);
            } catch (err) {
                setPageError(`Planning con ID ${idToLoad} non trovato.`);
                setIsLoadingInitialData(false);
                return;
            }
        }

        const dateForProcessing = currentDpTesta?.giorno || targetDate;
        if (!dateForProcessing) {
            setIsLoadingInitialData(false);
            return;
        }

        try {
            const [clientsData, interventionTypesData, resourcesData] = await Promise.all([
                api.getClients(),
                api.getInterventionTypes(),
                api.getResources(),
            ]);
            const mappedClients: Client[] = clientsData.map(c => ({ id: c.id_sede, ragioneSociale: c.cliente, nomeBreve: c.sede === '(la stessa)' ? c.cliente : c.sede }));
            const mappedInterventionTypes: InterventionType[] = interventionTypesData.map(it => ({ id: it.id, name: it.descrizione || 'N/A' }));
            const mappedRisorse: Risorsa[] = resourcesData.map(r => ({ id: r.username, nome: `${r.first_name || ''} ${r.last_name || ''}`.trim(), sigla: deriveSigla(r.first_name, r.last_name) }));
            setClients(mappedClients);
            setInterventionTypes(mappedInterventionTypes);
            setRisorse(mappedRisorse);

            let zohoEventsFromApi: any[] = [];
            try {
                zohoEventsFromApi = await api.get_zoho_events(dateForProcessing);
            } catch (zohoErr: any) {
                if (zohoErr.message === "Unauthorized") { throw zohoErr; }
                console.warn("Could not fetch Zoho events, continuing without them:", zohoErr.message);
            }
            const zohoEventsCache = new Map<string, any>(zohoEventsFromApi.map(event => [event.caluid, event]));

            const mapSingleDetailToRow = async (detail: DPDetail): Promise<DailyPlanningDetailRow> => {
                const client = detail.id_sede == null ? null : mappedClients.find(c => c.id === detail.id_sede) ?? null;
                const detailRisorse = detail.agpspm_users.map(user => mappedRisorse.find(r => r.id === user.username)).filter((r): r is Risorsa => r !== undefined);
                const detailInterventions = await api.getDPDetailTIsByDetail(detail.id);
                const mappedInterventions: SelectedIntervention[] = detailInterventions.map(dti => {
                    const type = mappedInterventionTypes.find(it => it.id === dti.id_tipi_interventi);
                    return { id: dti.id, interventionTypeId: dti.id_tipi_interventi, interventionTypeName: type ? type.name : 'Sconosciuto', quantity: dti.qta };
                });
                const matchingZohoEvent = detail.caluid ? zohoEventsCache.get(detail.caluid) : undefined;
                const originalTitle = matchingZohoEvent?.title || matchingZohoEvent?.description || detail.descrizionemanuale || `Attività ID: ${detail.id}`;
                return {
                    id: detail.id, isNew: false, zohoEventId: detail.caluid,
                    zohoOriginalTitle: originalTitle, zohoEventColor: matchingZohoEvent?.color,
                    descrizionemanuale: detail.descrizionemanuale || originalTitle,
                    selectedClient: client, risorseAssegnate: detailRisorse,
                    selectedInterventions: mappedInterventions, notes: detail.note || '',
                    timeSlot: detail.fasciaoraria, materialAvailable: detail.materialedisponibile === 'SI',
                };
            };

            if (currentDpTesta) {
                const currentDpDetails = await api.getDPDetailsByTesta(Number(idToLoad));
                let processedRows: DailyPlanningDetailRow[];
                if (currentDpTesta.stato === 'NUOVO') {
                    const dbDetailsMapByCaluid = new Map(currentDpDetails.filter(d => d.caluid).map(detail => [detail.caluid, detail]));
                    const allDetailsPromises = zohoEventsFromApi.map(zohoEvent => {
                        const existingDetail = dbDetailsMapByCaluid.get(zohoEvent.caluid);
                        if (existingDetail) {
                            return mapSingleDetailToRow(existingDetail);
                        } else {
                            const originalTitle = zohoEvent.title || zohoEvent.description || 'Nuova Attività Zoho';
                            return Promise.resolve({
                                id: uuidv4(), isNew: true, zohoEventId: zohoEvent.caluid,
                                zohoOriginalTitle: originalTitle, zohoEventColor: zohoEvent.color,
                                descrizionemanuale: originalTitle, selectedClient: null, risorseAssegnate: [],
                                selectedInterventions: [], notes: zohoEvent.note || '', timeSlot: zohoEvent.fasciaoraria || '',
                                materialAvailable: zohoEvent.materialedisponibile === 'SI',
                            });
                        }
                    });
                    const zohoEventCaluids = new Set(zohoEventsFromApi.map(e => e.caluid));
                    const manualDetails = currentDpDetails.filter(d => !d.caluid || !zohoEventCaluids.has(d.caluid));
                    manualDetails.forEach(manualDetail => allDetailsPromises.push(mapSingleDetailToRow(manualDetail)));
                    const initialRows = await Promise.all(allDetailsPromises);
                    const zohoEventOrder = new Map(zohoEventsFromApi.map((event, index) => [event.caluid, index]));
                    const getSlotSortValue = (slot: FasciaOraria | '') => (slot === 'AM' ? 1 : slot === 'PM' ? 2 : 3);
                    initialRows.sort((a, b) => {
                        const slotComparison = getSlotSortValue(a.timeSlot) - getSlotSortValue(b.timeSlot);
                        if (slotComparison !== 0) return slotComparison;
                        const aIsManual = !a.zohoEventId, bIsManual = !b.zohoEventId;
                        if (aIsManual && !bIsManual) return -1;
                        if (!aIsManual && bIsManual) return 1;
                        if (!aIsManual && !bIsManual && a.zohoEventId && b.zohoEventId) {
                            const aIndex = zohoEventOrder.get(a.zohoEventId), bIndex = zohoEventOrder.get(b.zohoEventId);
                            if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
                        }
                        return 0;
                    });
                    processedRows = initialRows;
                    if (initialRows.some(r => r.isNew)) setIsDirty(true);
                } else {
                    processedRows = await Promise.all(currentDpDetails.map(mapSingleDetailToRow));
                }
                setDpRows(processedRows);
            } else {
                const newZohoRows: DailyPlanningDetailRow[] = zohoEventsFromApi.map(zohoEvent => {
                    const originalTitle = zohoEvent.title || zohoEvent.description || 'Nuova Attività Zoho';
                    return {
                        id: uuidv4(), isNew: true, zohoEventId: zohoEvent.caluid,
                        zohoOriginalTitle: originalTitle, zohoEventColor: zohoEvent.color,
                        descrizionemanuale: originalTitle, selectedClient: null,
                        risorseAssegnate: [], selectedInterventions: [],
                        notes: zohoEvent.note || '', timeSlot: zohoEvent.fasciaoraria || '',
                        materialAvailable: zohoEvent.materialedisponibile === 'SI',
                    };
                });
                setDpRows(newZohoRows);
                if (newZohoRows.length > 0) setIsDirty(true);
            }

            if (currentDpTesta) {
                const { stato } = currentDpTesta;
                let readOnly = false;
                const planningDate = new Date(currentDpTesta.giorno);
                planningDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (planningDate < today) readOnly = true;
                else if (stato === 'CHIUSO' || stato === 'MODIFICATO') readOnly = true;
                else if (!hasHighPriority && stato !== 'NUOVO') readOnly = true;
                setIsReadOnly(readOnly);
            } else {
                setIsReadOnly(false);
            }
            setIsDirty(false);
        } catch (err: any) {
            console.error("Errore caricamento dati:", err.message);
            if (err.message === "Unauthorized") {
                setPageError("La sessione di Zoho Calendar è scaduta. È necessaria una nuova autenticazione.");
                try {
                    const authResponse = await api.zoho_oauth_initiate();
                    if (authResponse?.auth_url) setZohoAuthUrl(authResponse.auth_url);
                    else setPageError("Impossibile ottenere l'URL di autenticazione da Zoho.");
                } catch (authError) {
                    setPageError("Errore critico durante il tentativo di ri-autenticazione con Zoho.");
                }
            } else {
                setPageError(`Errore caricamento: ${err.message || 'Sconosciuto'}`);
            }
        } finally {
            setIsLoadingInitialData(false);
        }
    }, [planningId, targetDate, hasHighPriority, api]);

    useEffect(() => { loadPlanningData(); }, []);

    const handleRowChange = useCallback((updatedRow: DailyPlanningDetailRow) => {
        if (isReadOnly) return;
        setDpRows(prevRows => prevRows.map(row => (row.id === updatedRow.id ? updatedRow : row)));
        setIsDirty(true);
    }, [isReadOnly]);

    const addNewRow = () => {
        if (isReadOnly) return;
        const newRow: DailyPlanningDetailRow = {
            id: uuidv4(), isNew: true, zohoEventId: null, zohoOriginalTitle: '',
            descrizionemanuale: '', selectedClient: null, risorseAssegnate: [],
            selectedInterventions: [], notes: '', timeSlot: '', materialAvailable: false,
        };
        setDpRows(prevRows => [newRow, ...prevRows]);
        setIsDirty(true);
        if (isMobile) handleCardClick(newRow);
    };

    const deleteRow = useCallback(async (rowIdToDelete: string | number) => {
        if (isReadOnly) return;
        const rowToDelete = dpRows.find(r => r.id === rowIdToDelete);
        setDpRows(prevRows => prevRows.filter(row => row.id !== rowIdToDelete));
        if (rowToDelete && !rowToDelete.isNew) {
            try {
                await api.deleteDPDetail(Number(rowIdToDelete));
                setIsDirty(true);
            } catch (err: any) {
                setPageError(`Errore durante l'eliminazione della riga: ${err.message}`);
                setDpRows(currentRows => [...currentRows, rowToDelete]);
            }
        } else {
            setIsDirty(true);
        }
    }, [api, dpRows, isReadOnly]);

    const handleSaveAll = useCallback(async (isClosingAction: boolean): Promise<boolean> => {
        if (isReadOnly) {
            setPageError("Il planning è in modalità sola lettura.");
            return false;
        }
        setIsSaving(true);
        setPageError(null);
        let testaToProcess: DPTesta | null = dpTesta;
        try {
            if (!testaToProcess) {
                if (!targetDate) throw new Error("La data è obbligatoria per creare un nuovo planning.");
                const newDpTestaData: DPTestaCreate = {
                    giorno: targetDate, createdby: `${user?.first_name} ${user?.last_name}`,
                    modifiedby: `${user?.first_name} ${user?.last_name}`, stato: 'NUOVO', revisione: 0,
                };
                testaToProcess = await api.createDPTesta(newDpTestaData);
                setDpTesta(testaToProcess);
            }
            if (!testaToProcess) throw new Error("Impossibile creare o recuperare la testata del planning.");

            let nextState = testaToProcess.stato;
            let infoMessage = "Bozza del planning salvata con successo!";
            if (isClosingAction) {
                if (testaToProcess.stato === 'NUOVO') {
                    nextState = 'APERTO';
                    infoMessage = "Planning aggiornato allo stato 'APERTO' e pronto per la gestione.";
                } else if (hasHighPriority && testaToProcess.stato === 'APERTO') {
                    const isModified = (testaToProcess.revisione ?? 0) > 0;
                    nextState = isModified ? 'MODIFICATO' : 'CHIUSO';
                    infoMessage = `Planning finalizzato. Stato: ${nextState}.`;
                }
            }
            const updatePayload: DPTestaUpdate = {
                stato: nextState, modifiedby: `${user?.first_name} ${user?.last_name}`,
                details: dpRows.map(row => ({
                    id: typeof row.id === 'string' ? undefined : Number(row.id),
                    caluid: row.zohoEventId || null, id_sede: row.selectedClient?.id || null,
                    agpspm_users: row.risorseAssegnate.map(r => r.id),
                    descrizionemanuale: row.descrizionemanuale, note: row.notes,
                    fasciaoraria: (row.timeSlot === 'AM' || row.timeSlot === 'PM') ? row.timeSlot : 'AM',
                    materialedisponibile: row.materialAvailable ? 'SI' : 'NO',
                    interventions: row.selectedInterventions.map(si => ({ id_tipi_interventi: si.interventionTypeId, qta: si.quantity }))
                }))
            };
            await api.updateDPTesta(testaToProcess.id, updatePayload);
            await loadPlanningData(testaToProcess.id);
            setIsDirty(false);
            setInfoDialogContent({ title: "Operazione completata", message: infoMessage });
            setInfoDialogOpen(true);
            return true;
        } catch (err: any) {
            console.error("Errore durante il salvataggio:", err);
            setPageError(`Errore salvataggio: ${err.message || 'Errore sconosciuto'}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [dpTesta, dpRows, api, hasHighPriority, targetDate, user, isReadOnly, loadPlanningData]);

    const handleSaveDraft = useCallback(async () => { await handleSaveAll(false); }, [handleSaveAll]);
    const handleCloseRequest = useCallback(() => {
        if (isDirty && !isReadOnly) setConfirmCloseOpen(true);
        else onClose();
    }, [isDirty, isReadOnly, onClose]);

    useImperativeHandle(ref, () => ({ triggerSaveDraft: handleSaveDraft, handleCloseRequest: handleCloseRequest }), [handleSaveDraft, handleCloseRequest]);

    const handleSaveAndClose = async () => {
        setConfirmCloseOpen(false);
        const success = await handleSaveAll(false);
        if (success) onClose();
    };
    const handleCloseWithoutSaving = () => {
        setConfirmCloseOpen(false);
        onClose();
    };

    const handleReopenPlanning = useCallback(async () => {
        if (!dpTesta || !hasHighPriority || (dpTesta.stato !== 'CHIUSO' && dpTesta.stato !== 'MODIFICATO')) return;
        setIsSaving(true);
        try {
            await api.updateDPTesta(dpTesta.id, { stato: 'APERTO', modifiedby: `${user?.first_name} ${user?.last_name}` });
            await loadPlanningData(dpTesta.id);
            setInfoDialogContent({ title: "Planning Riaperto", message: "Il planning è stato sbloccato ed è ora modificabile." });
            setInfoDialogOpen(true);
        } catch (err: any) {
            setPageError(`Impossibile riaprire il planning: ${err.message || 'Errore sconosciuto'}`);
        } finally {
            setIsSaving(false);
        }
    }, [api, dpTesta, hasHighPriority, user, loadPlanningData]);

    const handleCardClick = (row: DailyPlanningDetailRow) => {
        setCurrentRowInModal(row);
        setModalOpen(true);
    };
    const handleCloseModal = () => {
        if (currentRowInModal) handleRowChange(currentRowInModal);
        setModalOpen(false);
        setCurrentRowInModal(null);
    };
    const handleUpdateFromModal = (updatedRow: DailyPlanningDetailRow) => setCurrentRowInModal(updatedRow);
    const handleDeleteFromModal = (rowId: string | number) => {
        deleteRow(rowId);
        setModalOpen(false);
        setCurrentRowInModal(null);
    };

    const handleZohoLogin = () => {
        if (!zohoAuthUrl) return;
        const popup = window.open(zohoAuthUrl, 'ZohoAuthPopup', 'width=600,height=700');
        setIsLoadingInitialData(true);
        setPageError(null);
        setZohoAuthUrl(null);
        const timer = setInterval(() => {
            if (!popup || popup.closed) {
                clearInterval(timer);
                loadPlanningData();
            }
        }, 1000);
    };

    const isCardRowComplete = (row: DailyPlanningDetailRow) => {
        if (hasHighPriority) {
            return !!(row.risorseAssegnate.length > 0 && row.selectedClient && row.selectedInterventions.length > 0 && row.timeSlot);
        }
        return !!(row.selectedClient && row.selectedInterventions.length > 0 && row.timeSlot);
    };

    const getStatusColor = (row: DailyPlanningDetailRow) => isCardRowComplete(row) ? theme.palette.success.main : theme.palette.warning.main;

    const getCloseButtonTooltip = () => {
        const state = dpTesta?.stato;
        if (state === 'APERTO') return "Chiudi e finalizza planning";
        if (!hasHighPriority) return "Invia per approvazione";
        return "Conferma e Apri il planning per la gestione";
    };

    if (zohoAuthUrl) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3, height: '100%' }}>
                <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center', maxWidth: 480, m: 2, borderRadius: 2 }}>
                    <SyncLockIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">Autenticazione Richiesta</Typography>
                    <Typography sx={{ my: 2, color: 'text.secondary' }}>
                        {pageError || "Per sincronizzare i dati, è necessario autenticarsi nuovamente con Zoho Calendar."}
                    </Typography>
                    <Button variant="contained" onClick={handleZohoLogin} startIcon={<LockOpenIcon />}>Effettua il login su Zoho</Button>
                </Paper>
            </Box>
        );
    }

    if (isLoadingInitialData) {
        return <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3, height: '100%' }}><CircularProgress size={50} thickness={4} /><Typography variant="h6" sx={{ mt: 2.5, color: 'text.secondary' }}>Caricamento Dati...</Typography></Box>;
    }

    if (pageError) {
        return <Box sx={{ p: 3 }}><Alert severity="error" variant="filled" onClose={() => setPageError(null)}>{pageError}</Alert></Box>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
            <CssBaseline />
            <AppBar position="sticky" sx={{ boxShadow: (theme.shadows as unknown as string[])[1] ?? "0px 2px 4px -1px rgba(0,0,0,0.2)" }}>
                <Container maxWidth={false} disableGutters>
                    <Toolbar sx={{ py: 1, px: 1.5 }}>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold', fontSize: '1.15rem' }}>{title}</Typography>
                            <Typography variant="caption" >
                                {new Date(dpTesta?.giorno || targetDate || Date.now()).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            {isDirty && !isReadOnly && <Chip label="Non Salvato" size="small" variant="outlined" sx={{ color: 'warning.light', borderColor: 'warning.light', animation: `${pulseAnimation} 2s infinite` }} />}
                            {isReadOnly && hasHighPriority && (dpTesta?.stato === 'CHIUSO' || dpTesta?.stato === 'MODIFICATO') && (
                                <Button variant="contained" color="secondary" size={isMobile ? "small" : "medium"} startIcon={<LockOpenIcon />} onClick={handleReopenPlanning} disabled={isSaving}>Riapri</Button>
                            )}
                            {!isReadOnly && (
                                <>
                                    <IconButton type="button" onClick={() => handleSaveAll(false)} color="inherit" disabled={!isDirty || isSaving}><SaveIcon /></IconButton>
                                    <IconButton type="button" onClick={() => handleSaveAll(true)} color="inherit" disabled={isSaving}><LockIcon /></IconButton>
                                </>
                            )}
                            {hasHighPriority && dpTesta && (dpTesta.stato === "CHIUSO" || dpTesta.stato === "MODIFICATO") && (
                                <Button variant="contained" color="secondary" size={isMobile ? "small" : "medium"} startIcon={isSaving ? <CircularProgress size={22} color="inherit" /> : <DownloadIcon />} onClick={async () => {
                                    if (!dpTesta) return;
                                    setIsSaving(true);
                                    try {
                                        const blob = await api.getDPPdfReport(dpTesta.id);
                                        const url = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        let name = new Date(dpTesta.giorno).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                        let revisione = dpTesta.revisione ? `-Rev${dpTesta.revisione > 0 ? dpTesta.revisione - 1 : 0}` : '';
                                        link.download = `DP_${name.replace(/\//g, '-')}${revisione}.pdf`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        window.URL.revokeObjectURL(url);
                                    } catch (err) {
                                        setPageError("Errore durante il download del PDF.");
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }} disabled={isSaving}>
                                    {isMobile ? '' : 'Scarica'}
                                </Button>
                            )}
                        </Stack>
                    </Toolbar>
                </Container>
                {isSaving && <LinearProgress color="secondary" />}
            </AppBar>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {isMobile ? (
                    <Container maxWidth="xl" sx={{ py: 2, px: { xs: 1.5, sm: 2 }, mb: 8 }}>
                        {dpRows.length === 0 ? (
                            <Paper elevation={0} sx={{ textAlign: 'center', py: 6, px: 2, mt: 3 }}>
                                <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">Nessuna attività per oggi.</Typography>
                            </Paper>
                        ) : (
                            <Stack spacing={1.5}>
                                {dpRows.map((row) => (
                                    <Card key={row.id} elevation={2} sx={{ borderRadius: '12px', borderLeft: `5px solid ${getStatusColor(row)}` }}>
                                        <CardActionArea onClick={() => handleCardClick(row)} sx={{ p: 1.5 }}>
                                            {/* Card Content */}
                                        </CardActionArea>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                        {currentRowInModal && (
                            <Dialog open={modalOpen} onClose={handleCloseModal} fullScreen>
                                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                                    Modifica Attività <IconButton onClick={handleCloseModal} sx={{ color: 'white', position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                                </DialogTitle>
                                <DialogContent>
                                    <CollapsibleTableRow
                                        key={currentRowInModal.id} rowData={currentRowInModal} onRowChange={handleUpdateFromModal}
                                        onDeleteRow={() => handleDeleteFromModal(currentRowInModal.id)}
                                        allClients={clients} allInterventionTypes={interventionTypes} allRisorse={risorse}
                                        hasHighPriority={hasHighPriority} userRole={currentUserRole} isMobileModalMode={true}
                                        viewMode="mobile" isReadOnly={isReadOnly} dpStatus={dpTesta?.stato}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                    </Container>
                ) : (
                    <Container maxWidth={false} sx={{ py: 3, px: 2, mb: 8 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.common.black, 0.1)}` }}>
                            <TableContainer>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: 40, p: 1 }} />
                                            {showRisorsaColumn && <TableCell sx={{ width: '25%', minWidth: 150 }}>Risorse</TableCell>}
                                            <TableCell sx={{ width: 'auto', minWidth: 200 }}>Descrizione Attività</TableCell>
                                            <TableCell sx={{ width: '35%', minWidth: 200 }}>Cliente</TableCell>
                                            <TableCell align="center" sx={{ width: '10%', minWidth: 120 }}>Interventi</TableCell>
                                            <TableCell align="right" sx={{ width: 40, p: 1 }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {dpRows.length > 0 ? dpRows.map((row) => (
                                            <CollapsibleTableRow
                                                key={row.id} rowData={row} onRowChange={handleRowChange} onDeleteRow={deleteRow}
                                                allClients={clients} allInterventionTypes={interventionTypes} allRisorse={risorse}
                                                hasHighPriority={hasHighPriority} userRole={currentUserRole}
                                                viewMode={isTablet ? 'tablet' : 'desktop'} isReadOnly={isReadOnly} dpStatus={dpTesta?.stato}
                                            />
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={showRisorsaColumn ? 6 : 5} sx={{ textAlign: 'center', py: 8 }}>
                                                    <SearchIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 2 }} />
                                                    <Typography variant="h6" color="text.secondary">Nessuna attività pianificata.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Container>
                )}
            </Box>
            {!isReadOnly && (
                <Fab color="primary" aria-label="add" onClick={addNewRow} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
                    <AddIcon />
                </Fab>
            )}
            <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)}>
                <DialogTitle>{infoDialogContent.title}</DialogTitle>
                <DialogContent><Typography>{infoDialogContent.message}</Typography></DialogContent>
                <DialogActions><Button onClick={() => setInfoDialogOpen(false)} autoFocus>OK</Button></DialogActions>
            </Dialog>
            <Dialog open={confirmCloseOpen} onClose={() => setConfirmCloseOpen(false)}>
                <DialogTitle>Salvare le modifiche?</DialogTitle>
                <DialogContent><Typography>Ci sono modifiche non salvate. Se chiudi ora, andranno perse.</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmCloseOpen(false)}>Annulla</Button>
                    <Button onClick={handleCloseWithoutSaving} color="error">Chiudi senza salvare</Button>
                    <Button onClick={handleSaveAndClose} variant="contained" autoFocus>Salva e Chiudi</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

export default DailyPlanningForm;
