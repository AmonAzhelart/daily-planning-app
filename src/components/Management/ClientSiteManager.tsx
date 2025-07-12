import React, { useState, useEffect, useCallback } from 'react';
// Assicurati che il percorso del custom hook sia corretto
import { useDailyPlanningApi } from '../../customHook/api';

// MUI Imports
import {
    Box, Button, Typography, Alert, Paper, IconButton,
    Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Snackbar, useTheme, useMediaQuery, List, ListItemText,
    Menu, MenuItem, ListItemIcon,
    Skeleton, Slide, Accordion, AccordionSummary, AccordionDetails,
    ListItem, InputAdornment
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

// MUI Icon Imports
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Business as BusinessIcon, Place as PlaceIcon, MoreVert as MoreVertIcon,
    ExpandMore as ExpandMoreIcon, Search as SearchIcon
} from '@mui/icons-material';

// #region Type Definitions
interface Sede {
    id: number;
    id_cliente: number;
    descrizione: string;
}

interface Cliente {
    id: number;
    ragione_sociale: string;
    sedi: Sede[];
}

interface SnackbarState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
}
// #endregion

// #region Sottocomponenti di UI (Memoized per performance)

const FormDialog = React.memo(({ open, onClose, mode, onSubmit, initialValues }: { open: boolean; onClose: () => void; mode: 'createClient' | 'editClient' | 'createSede' | 'editSede'; onSubmit: (values: any) => void; initialValues: any; }) => {
    const [formValues, setFormValues] = useState(initialValues);

    useEffect(() => {
        setFormValues(initialValues);
    }, [initialValues]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormValues((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        onSubmit(formValues);
    };

    const titleMap = {
        createClient: 'Crea Nuovo Cliente',
        editClient: 'Modifica Cliente',
        createSede: 'Aggiungi Nuova Sede',
        editSede: 'Modifica Sede',
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: 4 } }}
            BackdropProps={{ sx: { backdropFilter: 'blur(3px)', backgroundColor: 'rgba(0,0,0,0.2)' } }}
        >
            <DialogTitle sx={{ fontWeight: 'bold' }}>{titleMap[mode]}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField autoFocus name="name" label={mode.includes('Client') ? 'Ragione Sociale' : 'Descrizione Sede'} type="text" fullWidth variant="outlined" value={formValues.name} onChange={handleChange} required />
                    {mode === 'createClient' && (
                        <TextField name="siteName" label="Descrizione Prima Sede" helperText="Un cliente deve avere almeno una sede." type="text" fullWidth variant="outlined" value={formValues.siteName} onChange={handleChange} required />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Annulla</Button>
                <Button onClick={handleSubmit} variant="contained" disableElevation>Salva</Button>
            </DialogActions>
        </Dialog>
    );
});

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    item: { type: 'client' | 'site'; item: Cliente | Sede } | null;
}

const ConfirmDialog = React.memo(({ open, onClose, onConfirm, item }: ConfirmDialogProps) => {
    if (!item) return null;
    const itemName = item.type === 'client' ? (item.item as Cliente).ragione_sociale : (item.item as Sede).descrizione;
    return (
        <Dialog open={open} onClose={onClose} BackdropProps={{ sx: { backdropFilter: 'blur(3px)' } }} PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogContent>
                <Typography>Sei sicuro di voler eliminare "{itemName}"?</Typography>
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>L'azione non è reversibile.</Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Annulla</Button>
                <Button onClick={onConfirm} color="error" variant="contained" disableElevation>Elimina</Button>
            </DialogActions>
        </Dialog>
    );
});

const AccordionSkeleton = () => (
    <Stack spacing={1}>
        {[...Array(3)].map((_, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton variant="text" width="40%" height={24} />
                </Stack>
            </Paper>
        ))}
    </Stack>
);

// OTTIMIZZAZIONE: Componente Accordion singolo e memoizzato
const ClientAccordion = React.memo(({ client, onOpenForm, onOpenConfirm, isMobile }: { client: Cliente; onOpenForm: Function; onOpenConfirm: Function; isMobile: boolean; }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Accordion sx={{ '&.Mui-expanded': { margin: '8px 0' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%" spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1.5} overflow="hidden" sx={{ minWidth: 0 }}>
                        <BusinessIcon color="primary" />
                        <Typography fontWeight="bold" >{client.ragione_sociale}</Typography>
                    </Stack>

                    {isMobile ? (
                        <IconButton size="small" onClick={handleMenuClick}><MoreVertIcon /></IconButton>
                    ) : (
                        <Box sx={{ flexShrink: 0 }}>
                            <Button size="small" variant="text" sx={{ mr: 1 }} onClick={(e) => { e.stopPropagation(); onOpenForm('createSede', null, client); }}>Aggiungi Sede</Button>
                            <IconButton size="small" sx={{ mr: 0.5 }} onClick={(e) => { e.stopPropagation(); onOpenForm('editClient', client); }}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onOpenConfirm('client', client); }}><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                    )}
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                        <MenuItem onClick={() => { onOpenForm('createSede', null, client); handleMenuClose(); }}><ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>Aggiungi Sede</MenuItem>
                        <MenuItem onClick={() => { onOpenForm('editClient', client); handleMenuClose(); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Modifica Cliente</MenuItem>
                        <MenuItem onClick={() => { onOpenConfirm('client', client); handleMenuClose(); }} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Elimina Cliente</MenuItem>
                    </Menu>
                </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: 'action.hover', p: 1 }}>
                <List dense>
                    {client.sedi?.length > 0 ? client.sedi.map((sede) => (
                        <ListItem
                            key={sede.id}
                            secondaryAction={
                                <Stack direction="row" spacing={0.5}>
                                    <IconButton size="small" edge="end" onClick={() => onOpenForm('editSede', sede)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" edge="end" color="error" onClick={() => onOpenConfirm('site', sede)}><DeleteIcon fontSize="small" /></IconButton>
                                </Stack>
                            }
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}><PlaceIcon sx={{ color: 'text.secondary' }} fontSize="small" /></ListItemIcon>
                            <ListItemText primary={sede.descrizione} />
                        </ListItem>
                    )) : (
                        <ListItem><ListItemText secondary="Nessuna sede trovata." /></ListItem>
                    )}
                </List>
            </AccordionDetails>
        </Accordion>
    );
});

// #endregion

const ClientSiteManager: React.FC = () => {
    // #region State Management
    const api = useDailyPlanningApi();
    const [clients, setClients] = useState<Cliente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- NUOVO STATE PER LA RICERCA ---
    const [searchTerm, setSearchTerm] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'createClient' | 'editClient' | 'createSede' | 'editSede'>('createClient');
    const [formInitialValues, setFormInitialValues] = useState({ id: 0, name: '', siteName: '' });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ type: 'client' | 'site', item: Cliente | Sede } | null>(null);

    const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

    const theme = useTheme();
    //  --- MODIFICA CHIAVE QUI ---
    // Ho cambiato il breakpoint da 'sm' a 'md'.
    // Ora anche i tablet useranno la visualizzazione compatta, evitando problemi di spazio.
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    // #endregion

    // #region Data Fetching & Handlers
    const fetchData = useCallback(async () => {
        // Rimuoviamo il reset dello stato di loading per non mostrare lo skeleton ad ogni submit
        try {
            const data = await api.getClientsWithSedi() as Cliente[];
            setClients(data);
        } catch (err: any) {
            setError(err.message || "Errore sconosciuto.");
        } finally {
            // Lo stato di loading viene settato a false solo dopo il primo fetch
            if (isLoading) setIsLoading(false);
        }
    }, [api, isLoading]); // Aggiungiamo isLoading come dipendenza

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenForm = useCallback((mode: 'createClient' | 'editClient' | 'createSede' | 'editSede', item: Cliente | Sede | null = null, parentClient: Cliente | null = null) => {
        setFormMode(mode);
        if ((mode === 'editClient' || mode === 'editSede') && item) {
            setFormInitialValues({ id: item.id, name: 'ragione_sociale' in item ? item.ragione_sociale : item.descrizione, siteName: '' });
        } else if (mode === 'createSede' && parentClient) {
            setFormInitialValues({ id: parentClient.id, name: '', siteName: '' });
        } else {
            setFormInitialValues({ id: 0, name: '', siteName: '' });
        }
        setIsFormOpen(true);
    }, []);

    const handleFormSubmit = useCallback(async (values: any) => {
        try {
            let message = '';
            switch (formMode) {
                case 'createClient':
                    if (!values.name || !values.siteName) {
                        setSnackbar({ open: true, message: "Tutti i campi sono obbligatori.", severity: 'warning' });
                        return;
                    }
                    await api.createClient({ ragione_sociale: values.name, sedi: [{ descrizione: values.siteName }] });
                    message = 'Cliente creato con successo!';
                    break;
                case 'editClient':
                    await api.updateClient(values.id, { ragione_sociale: values.name });
                    message = 'Cliente aggiornato!';
                    break;
                case 'createSede':
                    await api.createSede({ id_cliente: values.id, descrizione: values.name });
                    message = 'Sede aggiunta!';
                    break;
                case 'editSede':
                    await api.updateSede(values.id, { descrizione: values.name });
                    message = 'Sede aggiornata!';
                    break;
            }
            setSnackbar({ open: true, message, severity: 'success' });
            await fetchData();
            setIsFormOpen(false);
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || "Si è verificato un errore.", severity: 'error' });
        }
    }, [api, fetchData, formMode]);

    const handleOpenConfirm = useCallback((type: 'client' | 'site', item: Cliente | Sede) => {
        setDeletingItem({ type, item });
        setIsConfirmOpen(true);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!deletingItem) return;
        try {
            let message = '';
            if (deletingItem.type === 'client') {
                await api.deleteClient(deletingItem.item.id);
                message = 'Cliente eliminato.';
            } else {
                await api.deleteSede(deletingItem.item.id);
                message = 'Sede eliminata.';
            }
            setSnackbar({ open: true, message, severity: 'info' });
            await fetchData();
            setIsConfirmOpen(false);
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || "Errore durante l'eliminazione.", severity: 'error' });
        }
    }, [api, deletingItem, fetchData]);
    // #endregion

    // --- LOGICA DI FILTRAGGIO ---
    const filteredClients = clients.filter(client => {
        const searchTermLower = searchTerm.toLowerCase();
        const clientNameMatch = client.ragione_sociale.toLowerCase().includes(searchTermLower);
        const siteMatch = client.sedi.some(sede => sede.descrizione.toLowerCase().includes(searchTermLower));
        return clientNameMatch || siteMatch;
    });

    // #region Render Logic
    if (isLoading) {
        return <Box sx={{ p: 2 }}><AccordionSkeleton /></Box>;
    }

    if (error) {
        return <Alert severity="error" variant="filled" sx={{ m: 2 }}>{error}</Alert>;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {/* --- BARRA DI CONTROLLO CON RICERCA E PULSANTE --- */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
                sx={{ mb: 2 }}
            >
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Cerca cliente o sede..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenForm('createClient')}
                    disableElevation
                    sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}
                >
                    Nuovo Cliente
                </Button>
            </Stack>

            <Stack spacing={1}>
                {/* --- RENDER DELLA LISTA FILTRATA --- */}

                {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                        <ClientAccordion
                            key={client.id}
                            client={client}
                            onOpenForm={handleOpenForm}
                            onOpenConfirm={handleOpenConfirm}
                            isMobile={isMobile}
                        />
                    ))
                ) : (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1">Nessun risultato trovato</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Prova a modificare i termini di ricerca o a{' '}
                            <Button variant="text" size="small" onClick={() => handleOpenForm('createClient')}>
                                creare un nuovo cliente
                            </Button>.
                        </Typography>
                    </Paper>
                )}
            </Stack>

            <FormDialog open={isFormOpen} onClose={() => setIsFormOpen(false)} mode={formMode} onSubmit={handleFormSubmit} initialValues={formInitialValues} />
            <ConfirmDialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} item={deletingItem} />

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
    // #endregion
};

export default ClientSiteManager;