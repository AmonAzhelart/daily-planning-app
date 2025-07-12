import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDailyPlanningApi, TipoIntervento } from '../../customHook/api';

// MUI Imports
import {
    Box, Button, Typography, Alert, Paper, IconButton,
    Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Snackbar, List, ListItem, ListItemText, Tooltip, Skeleton, InputAdornment
} from '@mui/material';

// MUI Icon Imports
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';

// #region Sottocomponenti (Memoized per performance)

const InterventionListItem = React.memo(({ item, onEdit, onConfirmDelete }: { item: TipoIntervento; onEdit: (item: TipoIntervento) => void; onConfirmDelete: (item: TipoIntervento) => void; }) => {
    return (
        <>
            <ListItem
                secondaryAction={
                    <Stack direction="row" spacing={1}>
                        <IconButton edge="end" onClick={() => onEdit(item)}>
                            <EditIcon />
                        </IconButton>
                        <Tooltip title={item.is_used ? "Non eliminabile perché già in uso" : "Elimina"}>
                            <span> {/* Wrapper per Tooltip su bottone disabilitato */}
                                <IconButton edge="end" color="error" onClick={() => onConfirmDelete(item)} disabled={item.is_used}>
                                    <DeleteIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                }
            >
                <ListItemText primary={item.descrizione} />
            </ListItem>
        </>
    );
});

// #endregion

const InterventionTypeManager: React.FC = () => {
    // #region State and Hooks
    const api = useDailyPlanningApi();
    const [interventions, setInterventions] = useState<TipoIntervento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [currentIntervention, setCurrentIntervention] = useState<TipoIntervento | null>(null);
    const [formDescription, setFormDescription] = useState('');

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<TipoIntervento | null>(null);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    // #endregion

    // #region Data Fetching
    const fetchData = useCallback(async () => {
        try {
            const data = await api.getAllTipiIntervento();
            setInterventions(data);
        } catch (err: any) {
            setError(err.message || "Errore sconosciuto");
        } finally {
            setIsLoading(false);
        }
    }, [api]);

    useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, []);
    // #endregion

    // #region Filtering
    const filteredInterventions = useMemo(() => {
        if (!searchQuery) {
            return interventions;
        }
        return interventions.filter(item =>
            (item.descrizione ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [interventions, searchQuery]);
    // #endregion

    // #region Handlers (Memoized with useCallback for performance)
    const handleClose = useCallback(() => {
        setIsFormOpen(false);
        setIsConfirmOpen(false);
        setCurrentIntervention(null);
        setDeletingItem(null);
    }, []);

    const handleOpenForm = useCallback((mode: 'create' | 'edit', item: TipoIntervento | null = null) => {
        setFormMode(mode);
        setCurrentIntervention(item);
        setFormDescription(item?.descrizione ?? '');
        setIsFormOpen(true);
    }, []);

    const handleOpenConfirm = useCallback((item: TipoIntervento) => {
        setDeletingItem(item);
        setIsConfirmOpen(true);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!formDescription.trim()) {
            setSnackbar({ open: true, message: 'La descrizione non può essere vuota.', severity: 'error' });
            return;
        }

        try {
            if (formMode === 'create') {
                await api.createTipoIntervento({ descrizione: formDescription });
                setSnackbar({ open: true, message: 'Tipologia creata con successo!', severity: 'success' });
            } else if (currentIntervention) {
                await api.updateTipoIntervento(currentIntervention.id, { descrizione: formDescription });
                setSnackbar({ open: true, message: 'Tipologia aggiornata!', severity: 'success' });
            }
            await fetchData(); // Refresh data
            handleClose();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || 'Si è verificato un errore', severity: 'error' });
        }
    }, [api, currentIntervention, fetchData, formDescription, formMode, handleClose]);

    const handleDelete = useCallback(async () => {
        if (!deletingItem) return;
        try {
            await api.deleteTipoIntervento(deletingItem.id);
            setSnackbar({ open: true, message: 'Tipologia eliminata.', severity: 'success' });
            await fetchData(); // Refresh data
            handleClose();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || 'Errore durante l\'eliminazione.', severity: 'error' });
        }
    }, [api, deletingItem, fetchData, handleClose]);
    // #endregion

    // #region Render Logic
    if (isLoading) {
        return (
            <Stack spacing={1}>
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1, mb: 1 }} />
                {[...Array(5)].map((_, i) => <Skeleton key={i} variant="rectangular" height={50} sx={{ borderRadius: 1 }} />)}
            </Stack>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box overflow="auto">
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Cerca tipologia..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, mr: 2 }}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                    }}
                />
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm('create')} disableElevation>
                    Nuova Tipologia
                </Button>
            </Stack>
            <Paper variant="outlined">
                <List>
                    {filteredInterventions.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <InterventionListItem
                                item={item}
                                onEdit={handleOpenForm.bind(null, 'edit')}
                                onConfirmDelete={handleOpenConfirm}
                            />
                            {index < filteredInterventions.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            {/* Dialog per Creazione/Modifica */}
            <Dialog open={isFormOpen} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>{formMode === 'create' ? 'Nuova Tipologia di Intervento' : 'Modifica Tipologia'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Descrizione"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose}>Annulla</Button>
                    <Button onClick={handleSubmit} variant="contained">Salva</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog di Conferma Eliminazione */}
            <Dialog open={isConfirmOpen} onClose={handleClose}>
                <DialogTitle>Conferma Eliminazione</DialogTitle>
                <DialogContent>
                    <Typography>Sei sicuro di voler eliminare "{deletingItem?.descrizione}"?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose}>Annulla</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Elimina</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box >
    );
    // #endregion
};

export default InterventionTypeManager;
