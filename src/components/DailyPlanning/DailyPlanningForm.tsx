import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    Container, Typography, Paper, Box, Button, CircularProgress, Stack, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse,
    TextField, Autocomplete, List, ListItem, ListItemText, Divider, Chip, Tooltip,
    AppBar, Toolbar, CssBaseline, alpha, Fab, ToggleButton,
    ToggleButtonGroup, useTheme, ListItemIcon, Card, CardActionArea, Dialog,
    DialogTitle, DialogContent, useMediaQuery, Avatar, Switch, FormControlLabel, Popover,
    DialogActions,
    LinearProgress,
} from '@mui/material';
import {
    Add as AddIcon, Save as SaveIcon, LockOpen as LockOpenIcon, Lock as LockIcon,
    DeleteOutline as DeleteOutlineIcon, CheckCircleOutline as CheckCircleOutlineIcon,
    ErrorOutline as ErrorOutlineIcon, Edit as EditIcon, Search as SearchIcon,
    Clear as ClearIcon, Event as EventIcon, PlaylistAddCheck as PlaylistAddCheckIcon,
    Business as BusinessIcon, Build as BuildIcon, Notes as NotesIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowUp as KeyboardArrowUpIcon,
    WarningAmber as WarningAmberIcon, PersonPin as PersonPinIcon, Warehouse as WarehouseIcon,
    Engineering as EngineeringIcon, InfoOutlined as InfoOutlinedIcon,
    WbSunnyOutlined as WbSunnyOutlinedIcon, Brightness2Outlined as Brightness2OutlinedIcon,
    Apartment as ApartmentIcon, AccessTime as AccessTimeIcon, Construction as ConstructionIcon,
    Category as CategoryIcon,
    LabelImportantOutlined as LabelImportantOutlinedIcon, ScheduleSendOutlined as ScheduleSendOutlinedIcon,
    ListAltOutlined as ListAltOutlinedIcon, CommentOutlined as CommentOutlinedIcon,
    BadgeOutlined as BadgeOutlinedIcon, FiberManualRecord as FiberManualRecordIcon,
    CloudQueue as CloudQueueIcon, Close as CloseIcon, PictureAsPdf as PictureAsPdfIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useSelector } from 'react-redux';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { RootState } from '../../store/store';
import {
    useDailyPlanningApi,
    DPTesta, DPDetail, DPTestaCreate, DPTestaUpdate, DPDetailCreate, DPDetailUpdate,
    DPDetailTI, DPDetailTICreate, TipoIntervento, ClienteResponseAPI, OauthUser,
    DPStatus, FasciaOraria, MaterialeDisponibile,
    UserInfo
} from '../../customHook/api';
import { useAuth } from '../../context/AuthContenxt';
import { DownloadIcon } from 'lucide-react';


// --- Interfaccia delle Props AGGIORNATA ---
interface DailyPlanningFormProps {
    planningId: number | null;
    targetDate: string | null;
    onClose: () => void;
    title: string;
}

// --- NEW: Interfaccia per il ref esposto ---
export interface DailyPlanningFormRef {
    triggerSaveDraft: () => Promise<void>;
}


// --- Frontend Specific Types ---
export type UserRole = 'MAGAZZINIERE' | 'SPECIALIST';

interface Risorsa {
    id: string;
    nome: string;
    sigla: string;
}

interface Client {
    id: number | null;
    ragioneSociale: string;
    nomeBreve?: string;
}

interface InterventionType {
    id: number;
    name: string;
}

interface SelectedIntervention {
    id?: number;
    interventionTypeId: number;
    interventionTypeName: string;
    quantity: number;
}

export interface DailyPlanningDetailRow {
    id: string | number;
    isNew?: boolean;
    zohoEventId: string | null;
    zohoOriginalTitle: string;
    descrizionemanuale: string;
    selectedClient: Client | null;
    risorsaAssegnata: Risorsa | null;
    selectedInterventions: SelectedIntervention[];
    notes: string;
    timeSlot: FasciaOraria | '';
    materialAvailable: boolean;
}

// --- Helper for deriving Resource Acronym ---
const deriveSigla = (firstName: string | null, lastName: string | null): string => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}` || '?';
};

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 ${alpha('#ed6c02', 0.6)};
  }
  70% {
    box-shadow: 0 0 0 7px ${alpha('#ed6c02', 0)};
  }
  100% {
    box-shadow: 0 0 0 0 ${alpha('#ed6c02', 0)};
  }
`;

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}


const ListboxComponent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLElement>
>(function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData = React.Children.toArray(children);
    const itemCount = itemData.length;
    const itemSize = 42;
    const height = Math.min(8, itemCount) * itemSize;

    return (
        <div ref={ref}>
            <Box {...other}>
                <FixedSizeList
                    height={height}
                    width="100%"
                    itemSize={itemSize}
                    itemCount={itemCount}
                    overscanCount={5}
                >
                    {({ index, style }: ListChildComponentProps) => {
                        return React.cloneElement(itemData[index] as React.ReactElement<any>, { style });
                    }}
                </FixedSizeList>
            </Box>
        </div>
    );
});


// --- Componente CollapsibleTableRow ---
interface CollapsibleTableRowProps {
    rowData: DailyPlanningDetailRow;
    onRowChange: (updatedRow: DailyPlanningDetailRow) => void;
    onDeleteRow: (rowId: string | number) => void;
    allClients: Client[];
    allInterventionTypes: InterventionType[];
    allRisorse: Risorsa[];
    userRole: string;
    isMobileModalMode?: boolean;
    viewMode: 'mobile' | 'desktop' | 'tablet';
    onRisorsaAvatarClick?: (event: React.MouseEvent<HTMLButtonElement>, risorsa: Risorsa) => void;
    isReadOnly: boolean;
}

const CollapsibleTableRow: React.FC<CollapsibleTableRowProps> = React.memo(({
    rowData: initialRowData, onRowChange, onDeleteRow, allClients, allInterventionTypes, allRisorse, userRole, isMobileModalMode, viewMode, onRisorsaAvatarClick, isReadOnly
}) => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [localRowData, setLocalRowData] = useState<DailyPlanningDetailRow>(initialRowData);
    const debouncedRowData = useDebounce(localRowData, 400);
    const mounted = useRef(false);

    useEffect(() => {
        if (mounted.current) {
            if (JSON.stringify(debouncedRowData) !== JSON.stringify(initialRowData)) {
                onRowChange(debouncedRowData);
            }
        } else {
            mounted.current = true;
        }
    }, [debouncedRowData, onRowChange, initialRowData]);


    useEffect(() => {
        setLocalRowData(initialRowData);
    }, [initialRowData]);


    const [clientInputValue, setClientInputValue] = useState('');
    const [risorsaInputValue, setRisorsaInputValue] = useState('');
    const [interventionInputValue, setInterventionInputValue] = useState('');
    const [interventionSearchTerm, setInterventionSearchTerm] = useState<InterventionType | null>(null);

    useEffect(() => {
        setClientInputValue(
            initialRowData.selectedClient
                ? initialRowData.selectedClient.nomeBreve
                    ? `${initialRowData.selectedClient.ragioneSociale} - ${initialRowData.selectedClient.nomeBreve}`
                    : initialRowData.selectedClient.ragioneSociale
                : ''
        );
        setRisorsaInputValue(initialRowData.risorsaAssegnata?.nome || '');
    }, [initialRowData.selectedClient, initialRowData.risorsaAssegnata]);
    
    const handleToggleOpen = useCallback(() => {
        if (open && !isReadOnly) {
            onRowChange(localRowData);
        }
        setOpen(prev => !prev);
    }, [open, onRowChange, isReadOnly, localRowData]);

    const handleFieldChange = useCallback((field: keyof DailyPlanningDetailRow, value: any) => {
        setLocalRowData(prev => ({ ...prev, [field]: value }));
    }, []);

    const isRowComplete = useMemo(() => {
        if (userRole === 'SPECIALIST') {
            return localRowData.risorsaAssegnata && localRowData.selectedClient && localRowData.selectedInterventions.length > 0 && localRowData.timeSlot;
        }
        return localRowData.selectedClient && localRowData.selectedInterventions.length > 0 && localRowData.timeSlot;
    }, [localRowData, userRole]);

    const handleClientChange = (event: any, newValue: Client | null) => handleFieldChange('selectedClient', newValue);
    const handleRisorsaChange = (event: any, newValue: Risorsa | null) => handleFieldChange('risorsaAssegnata', newValue);

    const handleTimeSlotChange = (event: React.MouseEvent<HTMLElement>, newTimeSlot: FasciaOraria | null) => {
        if (newTimeSlot !== null) {
            handleFieldChange('timeSlot', newTimeSlot);
        }
    };

    const handleMaterialToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFieldChange('materialAvailable', event.target.checked);
    };

    const handleAddInterventionFromSearch = () => {
        if (!interventionSearchTerm) return;
        handleAddIntervention(interventionSearchTerm);
        setInterventionSearchTerm(null);
        setInterventionInputValue('');
    };

    const handleAddIntervention = (interventionType: InterventionType | null) => {
        if (!interventionType) return;
        const existing = localRowData.selectedInterventions.find(si => si.interventionTypeId === interventionType.id);
        if (existing) {
             const newInterventions = localRowData.selectedInterventions.map(si =>
                si.interventionTypeId === interventionType.id ? { ...si, quantity: si.quantity + 1 } : si
            );
            handleFieldChange('selectedInterventions', newInterventions);
        } else {
             const newInterventions = [
                ...localRowData.selectedInterventions,
                { id: undefined, interventionTypeId: interventionType.id, interventionTypeName: interventionType.name, quantity: 1 },
            ];
            handleFieldChange('selectedInterventions', newInterventions);
        }
    };

    const handleUpdateInterventionQuantity = (interventionTypeId: number, quantityStr: string) => {
        const quantity = parseInt(quantityStr, 10);
        const newQuantity = Math.max(1, isNaN(quantity) ? 1 : quantity);
        const newInterventions = localRowData.selectedInterventions.map(si =>
            si.interventionTypeId === interventionTypeId ? { ...si, quantity: newQuantity } : si
        );
        handleFieldChange('selectedInterventions', newInterventions);
    };

    const handleRemoveIntervention = (interventionTypeId: number) => {
        const newInterventions = localRowData.selectedInterventions.filter(si => si.interventionTypeId !== interventionTypeId);
        handleFieldChange('selectedInterventions', newInterventions);
    };

    const renderDetailForm = () => (
        <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                    <NotesIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Descrizione Attività</Typography>
                    {localRowData.zohoEventId && (
                        <Tooltip title="Attività sincronizzata da Zoho">
                            <Chip icon={<CloudQueueIcon fontSize="small" />} label="Zoho" size="small" variant="outlined" />
                        </Tooltip>
                    )}
                </Stack>
                
                <TextField
                    fullWidth
                    label="Descrizione (modificabile)"
                    value={localRowData.descrizionemanuale}
                    onChange={e => handleFieldChange('descrizionemanuale', e.target.value)}
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    disabled={isReadOnly}
                    placeholder={isReadOnly ? "Planning Bloccato" : "Inserisci o modifica la descrizione dell'attività..."}
                />

                {localRowData.zohoEventId && (
                    <Box mt={2} p={1.5} bgcolor={alpha(theme.palette.grey[500], 0.1)} borderRadius={1}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Titolo Originale da Zoho (non modificabile)
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                            {localRowData.zohoOriginalTitle || "Nessun titolo originale."}
                        </Typography>
                    </Box>
                )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <LabelImportantOutlinedIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Informazioni Principali</Typography>
                </Stack>
                <Stack spacing={2}>
                    {userRole === 'SPECIALIST' && (
                        <Autocomplete
                            fullWidth
                            disabled={isReadOnly}
                            options={allRisorse}
                            getOptionLabel={(option) => `${option.nome} (${option.sigla})`}
                            value={localRowData.risorsaAssegnata}
                            onChange={handleRisorsaChange}
                            inputValue={risorsaInputValue}
                            onInputChange={(e, val) => setRisorsaInputValue(val)}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            renderInput={(params) =>
                                <TextField {...params} label="Risorsa Assegnata" variant="outlined" size="small" />}
                            noOptionsText="Nessuna risorsa"
                        />
                    )}
                    <Autocomplete
                        fullWidth
                        disabled={isReadOnly}
                        options={allClients}
                        getOptionLabel={(option) =>
                            option.nomeBreve
                                ? `${option.ragioneSociale} - ${option.nomeBreve}`
                                : option.ragioneSociale
                        }
                        value={localRowData.selectedClient}
                        onChange={handleClientChange}
                        inputValue={clientInputValue}
                        onInputChange={(e, val) => setClientInputValue(val)}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        disableListWrap
                        ListboxComponent={ListboxComponent as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
                        renderInput={(params) => (
                            <TextField {...params} label="Cliente Assegnato" variant="outlined" size="small" />
                        )}
                        renderOption={(props, option) => (
                            <ListItem {...props} dense sx={{ borderRadius: 1, '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.1) } }}>
                                <ListItemIcon sx={{ minWidth: 36 }}><ApartmentIcon fontSize="small" /></ListItemIcon>
                                <ListItemText
                                    primary={
                                        option.nomeBreve
                                            ? `${option.ragioneSociale} - ${option.nomeBreve}`
                                            : option.ragioneSociale
                                    }
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItem>
                        )}
                        noOptionsText="Nessun cliente"
                    />
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <ScheduleSendOutlinedIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Dettagli Operativi</Typography>
                </Stack>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Fascia Oraria</Typography>
                        <ToggleButtonGroup
                            value={localRowData.timeSlot}
                            exclusive
                            onChange={handleTimeSlotChange}
                            aria-label="fascia oraria"
                            fullWidth
                            size="small"
                            disabled={isReadOnly}
                        >
                            <ToggleButton type="button" value="AM" aria-label="mattina" sx={{ flexGrow: 1 }}><WbSunnyOutlinedIcon sx={{ mr: 1, fontSize: '1.1rem' }} />AM</ToggleButton>
                            <ToggleButton type="button" value="PM" aria-label="pomeriggio" sx={{ flexGrow: 1 }}><Brightness2OutlinedIcon sx={{ mr: 1, fontSize: '1.1rem' }} />PM</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={localRowData.materialAvailable}
                                onChange={handleMaterialToggle}
                                color="primary"
                                disabled={isReadOnly}
                            />
                        }
                        labelPlacement="start"
                        label={
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <CategoryIcon fontSize="small" color={localRowData.materialAvailable ? "primary" : "action"} />
                                <Typography variant="body2" color="text.secondary">Materiale Disponibile</Typography>
                            </Stack>
                        }
                        sx={{ justifyContent: 'space-between', ml: 0, mr: 0.5, color: 'text.secondary' }}
                    />
                    {!localRowData.materialAvailable && (
                        <Chip
                            icon={<WarningAmberIcon fontSize="small" />}
                            label="Verificare disponibilità materiale"
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ alignSelf: 'flex-start' }}
                        />
                    )}
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                    <ListAltOutlinedIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Gestione Interventi</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                    <Autocomplete
                        fullWidth
                        disabled={isReadOnly}
                        options={allInterventionTypes}
                        getOptionLabel={(option) => option.name}
                        value={interventionSearchTerm}
                        onChange={(event, newValue) => {
                            setInterventionSearchTerm(newValue);
                        }}
                        inputValue={interventionInputValue}
                        onInputChange={(event, newInputValue) => {
                            setInterventionInputValue(newInputValue);
                        }}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        renderInput={(params) =>
                            <TextField {...params} placeholder="Cerca e aggiungi intervento" variant="outlined" size="small" />}
                        noOptionsText="Nessun intervento"
                        ListboxProps={{ style: { maxHeight: 160 } }}
                    />
                    <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        onClick={handleAddInterventionFromSearch}
                        disabled={!interventionSearchTerm || isReadOnly}
                        sx={{ minWidth: 'auto', p: '6px 12px', height: '40px' }}
                    >
                        <AddIcon fontSize="small" />
                    </Button>
                </Stack>

                {localRowData.selectedInterventions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1.5, fontStyle: 'italic', backgroundColor: alpha(theme.palette.grey[500], 0.05), borderRadius: 1 }}>
                        Nessun intervento assegnato.
                    </Typography>
                ) : (
                    <List dense disablePadding sx={{ maxHeight: 180, overflowY: 'auto', borderRadius: 1 }}>
                        {localRowData.selectedInterventions.map((intervention, index) => (
                            <ListItem
                                key={intervention.interventionTypeId}
                                disablePadding
                                sx={{
                                    py: 0.5, px: 1, display: 'flex', alignItems: 'center',
                                    borderBottom: index < localRowData.selectedInterventions.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                    '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.05) }
                                }}>
                                <TextField
                                    type="number" value={intervention.quantity}
                                    disabled={isReadOnly}
                                    onChange={(e) => handleUpdateInterventionQuantity(intervention.interventionTypeId, e.target.value)}
                                    sx={{ width: 55, mr: 1.5 }} InputProps={{ inputProps: { min: 1, style: { textAlign: 'center' } } }}
                                    size="small" variant="outlined"
                                />
                                <ListItemText
                                    primary={intervention.interventionTypeName}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        fontWeight: 400,
                                        whiteSpace: 'normal'
                                    }}
                                    sx={{ flexGrow: 1, mr: 0.5, py: 0.5, wordBreak: 'break-word' }}
                                />
                                <Tooltip title="Rimuovi">
                                    <span>
                                        <IconButton type="button" disabled={isReadOnly} onClick={() => handleRemoveIntervention(intervention.interventionTypeId)} size="small" sx={{ color: theme.palette.text.secondary, '&:hover': { color: 'error.main' } }}>
                                            <ClearIcon fontSize='small' />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                    <CommentOutlinedIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Note Addizionali</Typography>
                </Stack>
                <TextField
                    fullWidth
                    disabled={isReadOnly}
                    value={localRowData.notes} 
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    multiline minRows={3} maxRows={5} variant="outlined" size="small" placeholder={isReadOnly ? "Planning bloccato." : "Inserisci eventuali dettagli..."}
                />
            </Paper>

            {isMobileModalMode && (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1, mt: 1 }}>
                    <Button
                        type="button"
                        onClick={() => onDeleteRow(localRowData.id)}
                        color="error"
                        variant="text"
                        startIcon={<DeleteOutlineIcon />}
                        sx={{ width: 'auto', textTransform: 'none' }}
                        disabled={isReadOnly}
                    >
                        Elimina questa Attività
                    </Button>
                </Box>
            )}
        </Stack>
    );

    if (isMobileModalMode) {
        return <Box sx={{ pt: 0.5, pb: 1 }}>{renderDetailForm()}</Box>;
    }

    return (
        <React.Fragment>
            <TableRow
                hover
                onClick={handleToggleOpen}
                selected={open}
                sx={{
                    cursor: 'pointer',
                    '& > td': { borderBottomColor: open ? 'transparent' : undefined, verticalAlign: 'top', p: 1 },
                    '&:last-child > td': { borderBottomColor: open ? 'transparent' : undefined },
                    backgroundColor: isReadOnly ? alpha(theme.palette.grey[500], 0.08) : 'inherit',
                }}
            >
                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Tooltip title={isRowComplete ? "Riga completa" : "Riga da completare"}>
                            <FiberManualRecordIcon
                                sx={{
                                    fontSize: '1rem',
                                    color: isRowComplete ? theme.palette.success.main : theme.palette.warning.main,
                                }}
                            />
                        </Tooltip>
                        <IconButton type="button" size="small" aria-label="expand row">
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    </Stack>
                </TableCell>

                {userRole === 'SPECIALIST' && (
                    <TableCell sx={{ fontWeight: 500 }}>
                        {localRowData.risorsaAssegnata ? (
                            <Tooltip title={`Risorsa: ${localRowData.risorsaAssegnata.nome}`}>
                                <Chip
                                    avatar={
                                        <Avatar
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onRisorsaAvatarClick && localRowData.risorsaAssegnata) {
                                                    onRisorsaAvatarClick(e as unknown as React.MouseEvent<HTMLButtonElement>, localRowData.risorsaAssegnata);
                                                }
                                            }}
                                            sx={{
                                                width: 24, height: 24, fontSize: '0.75rem',
                                                bgcolor: theme.palette.secondary.dark,
                                                color: theme.palette.secondary.contrastText,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {localRowData.risorsaAssegnata.sigla}
                                        </Avatar>
                                    }
                                    label={localRowData.risorsaAssegnata.sigla}
                                    size="small"
                                    variant="filled"
                                    sx={{
                                        backgroundColor: theme.palette.secondary.dark,
                                        color: theme.palette.common.white,
                                    }}
                                />
                            </Tooltip>
                        ) : (
                            <Chip label="N/D" size="small" variant="outlined" />
                        )}
                    </TableCell>
                )}
                
                <TableCell sx={{ wordBreak: 'break-word' }}>
                     <Stack direction="row" alignItems="center" spacing={0.5}>
                        {localRowData.zohoEventId && (
                            <Tooltip title="Attività sincronizzata da Zoho">
                                <CloudQueueIcon
                                    color="action"
                                    sx={{ fontSize: '1rem', mr: 0.5, opacity: 0.7 }}
                                />
                            </Tooltip>
                        )}
                        <Tooltip title={`Titolo Originale: ${localRowData.zohoOriginalTitle || 'N/A'}`} placement="top-start">
                            <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                                {localRowData.descrizionemanuale || (localRowData.zohoEventId ? '(Descrizione da modificare)' : '(Nuova attività manuale)')}
                            </Typography>
                        </Tooltip>
                    </Stack>
                </TableCell>

                <TableCell sx={{ wordBreak: 'break-word' }}>
                    {localRowData.selectedClient ? (
                        <Chip
                            icon={<ApartmentIcon sx={{ fontSize: '1rem', ml: '3px' }} />}
                            label={
                                localRowData.selectedClient.nomeBreve
                                    ? `${localRowData.selectedClient.ragioneSociale} - ${localRowData.selectedClient.nomeBreve}`
                                    : localRowData.selectedClient.ragioneSociale
                            }
                            size="small"
                            variant="outlined"
                            color="info"
                            sx={{
                                maxWidth: '100%',
                                height: 'auto',
                                '& .MuiChip-label': {
                                    display: 'block',
                                    whiteSpace: 'normal',
                                },
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                borderColor: theme.palette.info.dark,
                                color: theme.palette.info.dark,
                            }}
                        />
                    ) : (
                        <Chip icon={<EditIcon />} label="Nessun Cliente" size="small" variant="outlined" color="warning" sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1), borderColor: theme.palette.warning.dark, color: theme.palette.warning.dark }} />
                    )}
                </TableCell>

                <TableCell align="center">
                    <Chip
                        icon={<BuildIcon sx={{ fontSize: '1rem', ml: '3px' }} />}
                        label={`${localRowData.selectedInterventions.length} Interv.`}
                        size="small"
                        color={localRowData.selectedInterventions.length > 0 ? "primary" : "default"}
                        variant={localRowData.selectedInterventions.length > 0 ? "filled" : "outlined"}
                        sx={localRowData.selectedInterventions.length > 0 ? { backgroundColor: 'primary.dark', color: 'common.white' } : { borderColor: alpha(theme.palette.common.black, 0.23) }}
                    />
                </TableCell>

                <TableCell align="right">
                    <Tooltip title="Elimina Riga">
                        <span>
                            <IconButton type="button" onClick={(e) => { e.stopPropagation(); onDeleteRow(localRowData.id); }} color="error" size="small" sx={{ '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.08) } }} disabled={isReadOnly}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </TableCell>
            </TableRow>
            <TableRow selected={open}>
                <TableCell
                    style={{ padding: 0, borderBottom: open ? `3px solid ${theme.palette.primary.main}` : 'none' }}
                    colSpan={userRole === 'SPECIALIST' ? 6 : 5}
                >
                    <Collapse in={open} timeout={300} unmountOnExit>
                        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ color: 'primary.dark', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    <PlaylistAddCheckIcon sx={{ mr: 1, fontSize: '1.5rem' }} /> Dettagli e Modifiche
                                </Typography>
                                <Chip label={userRole} size="small" icon={userRole === 'MAGAZZINIERE' ? <WarehouseIcon /> : <EngineeringIcon />} sx={{ backgroundColor: userRole === 'MAGAZZINIERE' ? 'info.main' : 'secondary.main', color: 'common.white' }} />
                            </Box>
                            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.common.black, 0.12)}` }}>
                                {renderDetailForm()}
                            </Paper>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
});


// --- Componente DailyPlanningForm ---
// NEW: Modificato per usare forwardRef
const DailyPlanningForm = forwardRef<DailyPlanningFormRef, DailyPlanningFormProps>(({ planningId, targetDate, onClose, title }, ref) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    const { user } = useAuth();
    const userInfo = user ;
    const currentUserRole = user?.role?.name ?? '';

    const api = useDailyPlanningApi();
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    const [dpRows, setDpRows] = useState<DailyPlanningDetailRow[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
    const [risorse, setRisorse] = useState<Risorsa[]>([]);
    const [dpTesta, setDpTesta] = useState<DPTesta | null>(null);

    const [isDirty, setIsDirty] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [currentRowInModal, setCurrentRowInModal] = useState<DailyPlanningDetailRow | null>(null);

    const [risorsaPopoverAnchorEl, setRisorsaPopoverAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [selectedRisorsaForPopover, setSelectedRisorsaForPopover] = useState<Risorsa | null>(null);

    const [infoDialogOpen, setInfoDialogOpen] = useState(false);
    const [infoDialogContent, setInfoDialogContent] = useState({ title: '', message: '' });
    
    
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


    const handleRisorsaAvatarClick = (event: React.MouseEvent<HTMLButtonElement>, risorsa: Risorsa) => {
        setRisorsaPopoverAnchorEl(event.currentTarget);
        setSelectedRisorsaForPopover(risorsa);
    };

    const handleRisorsaPopoverClose = () => {
        setRisorsaPopoverAnchorEl(null);
    };

    const risorsaPopoverOpen = Boolean(risorsaPopoverAnchorEl);
    const risorsaPopoverId = risorsaPopoverOpen ? 'risorsa-info-popover' : undefined;

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingInitialData(true);
            setPageError(null);
            setIsDirty(false);
            
            let currentDpTesta: DPTesta | null = null;
            
            if (planningId) {
                try {
                    currentDpTesta = await api.getDPTesta(Number(planningId));
                    setDpTesta(currentDpTesta);
                } catch (err) {
                    setPageError(`Planning con ID ${planningId} non trovato.`);
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

                const shouldSyncWithZoho = !currentDpTesta || currentDpTesta.stato === 'NUOVO';
                
                if (shouldSyncWithZoho) {
                    const zohoEventsFromApi = await api.get_zoho_events(dateForProcessing);
                    const zohoEventsMap = new Map<string, any>(zohoEventsFromApi.map(event => [event.caluid, event]));
                    
                    let processedRows: DailyPlanningDetailRow[] = [];
                    let wasModified = false;
                    
                    if (currentDpTesta) {
                        const currentDpDetails = await api.getDPDetailsByTesta(Number(planningId));
                        const deletionPromises: Promise<any>[] = [];

                        processedRows = (await Promise.all(currentDpDetails.map(async (detail) => {
                            const client = detail.id_sede == null ? null : mappedClients.find(c => c.id === detail.id_sede) ?? null;
                            const risorsa = mappedRisorse.find(r => r.id === detail.id_agpspm) || null;
                            const detailInterventions = await api.getDPDetailTIsByDetail(detail.id);
                            const mappedInterventions: SelectedIntervention[] = detailInterventions.map(dti => {
                                const type = mappedInterventionTypes.find(it => it.id === dti.id_tipi_interventi);
                                return { id: dti.id, interventionTypeId: dti.id_tipi_interventi, interventionTypeName: type ? type.name : 'Sconosciuto', quantity: dti.qta };
                            });

                            const rowBase = {
                                id: detail.id, isNew: false, selectedClient: client, risorsaAssegnata: risorsa,
                                selectedInterventions: mappedInterventions, notes: detail.note || '',
                                timeSlot: detail.fasciaoraria, materialAvailable: detail.materialedisponibile === 'SI',
                            };
                            
                            if (!detail.caluid) {
                                return { ...rowBase, zohoEventId: null, zohoOriginalTitle: '', descrizionemanuale: detail.descrizionemanuale || '' };
                            }

                            const matchingZohoEvent = zohoEventsMap.get(detail.caluid);
                            if (matchingZohoEvent) {
                                zohoEventsMap.delete(detail.caluid);
                                const originalTitle = matchingZohoEvent.title || matchingZohoEvent.description || 'Attività Zoho';
                                return { ...rowBase, zohoEventId: detail.caluid, zohoOriginalTitle: originalTitle, descrizionemanuale: detail.descrizionemanuale || originalTitle };
                            } else {
                                wasModified = true;
                                deletionPromises.push(api.deleteDPDetail(detail.id));
                                return null;
                            }
                        }))).filter(Boolean) as DailyPlanningDetailRow[];

                        if(deletionPromises.length > 0) await Promise.all(deletionPromises);
                    }

                    const newZohoRows: DailyPlanningDetailRow[] = Array.from(zohoEventsMap.values()).map(zohoEvent => {
                        const originalTitle = zohoEvent.title || zohoEvent.description || 'Nuova Attività Zoho';
                        return {
                            id: uuidv4(), isNew: true, zohoEventId: zohoEvent.caluid,
                            zohoOriginalTitle: originalTitle, descrizionemanuale: originalTitle,
                            selectedClient: null, risorsaAssegnata: null, selectedInterventions: [],
                            notes: zohoEvent.note || '', timeSlot: zohoEvent.fasciaoraria || '',
                            materialAvailable: zohoEvent.materialedisponibile === 'SI',
                        };
                    });
                    
                    setDpRows([...processedRows, ...newZohoRows]);
                    if (newZohoRows.length > 0 || wasModified) setIsDirty(true);

                } else {
                    const currentDpDetails = await api.getDPDetailsByTesta(Number(planningId));
                    const dbRows = await Promise.all(currentDpDetails.map(async (detail) => {
                        const client = detail.id_sede == null ? null : mappedClients.find(c => c.id === detail.id_sede) ?? null;
                        const risorsa = mappedRisorse.find(r => r.id === detail.id_agpspm) || null;
                        const detailInterventions = await api.getDPDetailTIsByDetail(detail.id);
                        const mappedInterventions: SelectedIntervention[] = detailInterventions.map(dti => {
                            const type = mappedInterventionTypes.find(it => it.id === dti.id_tipi_interventi);
                            return { id: dti.id, interventionTypeId: dti.id_tipi_interventi, interventionTypeName: type ? type.name : 'Sconosciuto', quantity: dti.qta };
                        });
                        const originalTitle = detail.descrizionemanuale || `Attività ID: ${detail.id}`;
                        
                        return {
                            id: detail.id, isNew: false, zohoEventId: detail.caluid,
                            zohoOriginalTitle: originalTitle,
                            descrizionemanuale: detail.descrizionemanuale || originalTitle,
                            selectedClient: client, risorsaAssegnata: risorsa,
                            selectedInterventions: mappedInterventions, notes: detail.note || '',
                            timeSlot: detail.fasciaoraria, materialAvailable: detail.materialedisponibile === 'SI',
                        };
                    }));
                    setDpRows(dbRows);
                }
                
                if (currentDpTesta) {
                    const { stato } = currentDpTesta;
                    let readOnly = false;
                    if (stato === 'CHIUSO' || stato === 'MODIFICATO') readOnly = true;
                    else if (currentUserRole === 'MAGAZZINIERE' && stato === 'APERTO') readOnly = true;
                    else if (currentUserRole === 'SPECIALIST' && stato === 'NUOVO') readOnly = true;
                    setIsReadOnly(readOnly);
                } else { 
                    setIsReadOnly(currentUserRole === 'SPECIALIST');
                }

            } catch (err: any) {
                console.error("Errore caricamento dati:", err);
                const errorMessage = err.response?.status === 401
                    ? "Sessione Zoho scaduta. Ricarica la pagina per riautorizzare."
                    : `Errore caricamento: ${err.message || 'Sconosciuto'}`;
                setPageError(errorMessage);
            } finally {
                setIsLoadingInitialData(false);
            }
        };

        fetchInitialData();
    }, [planningId, targetDate, currentUserRole]);


    const handleRowChange = useCallback((updatedRow: DailyPlanningDetailRow) => {
        if (isReadOnly) return;
        setDpRows(prevRows => prevRows.map(row => (row.id === updatedRow.id ? updatedRow : row)));
        setIsDirty(true);
    }, [isReadOnly]);


    const addNewRow = () => {
        if (isReadOnly) return;
        const newRow: DailyPlanningDetailRow = {
            id: uuidv4(),
            isNew: true,
            zohoEventId: null,
            zohoOriginalTitle: '',
            descrizionemanuale: '',
            selectedClient: null,
            risorsaAssegnata: null,
            selectedInterventions: [],
            notes: '',
            timeSlot: '',
            materialAvailable: false,
        };
        setDpRows(prevRows => [newRow, ...prevRows]);
        setIsDirty(true);
        if (isMobile) {
            handleCardClick(newRow);
        }
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

   const handleSaveAll = useCallback(async (isClosingAction: boolean) => {
        if (isReadOnly) return;
        
        setIsSaving(true);
        setPageError(null);
    
        let testaToProcess: DPTesta | null = dpTesta;
    
        try {
            if (!testaToProcess) {
                if (!targetDate) {
                    throw new Error("Target date is required to create a new planning.");
                }
                const newDpTestaData: DPTestaCreate = {
                    giorno: targetDate,
                    createdby: `${userInfo?.first_name} ${userInfo?.last_name}`,
                    modifiedby: `${userInfo?.first_name} ${userInfo?.last_name}`,
                    stato: 'NUOVO',
                    revisione: 0,
                };
                testaToProcess = await api.createDPTesta(newDpTestaData);
                setDpTesta(testaToProcess);
            }
    
            if (!testaToProcess) {
                throw new Error("Impossibile creare o recuperare la testata del planning.");
            }
    
            let nextState = testaToProcess.stato;
            let nextRevision = testaToProcess.revisione ? testaToProcess.revisione>1 ? testaToProcess.revisione-1 : 0 : 0;
            let modified = testaToProcess.revisione ? testaToProcess.revisione >0 : false;
            let infoMessage = "Planning salvato con successo!";
    
            if (isClosingAction) {
                if (currentUserRole === 'MAGAZZINIERE' && testaToProcess.stato === 'NUOVO') {
                    nextState = 'APERTO';
                    infoMessage = "Planning inviato allo SPECIALIST. Stato: APERTO.";
                } else if (currentUserRole === 'SPECIALIST' && testaToProcess.stato === 'APERTO') {
                    if (!modified) {
                        nextState = 'CHIUSO';
                        infoMessage = `Planning chiuso per la prima volta. Stato: CHIUSO`;
                    } else {
                        nextState = 'MODIFICATO';
                        nextRevision += 1;
                        infoMessage = `Planning chiuso dopo modifiche. Stato: MODIFICATO, Rev: ${nextRevision}.`;
                    }
                }
            }
            
            const updatePayload: DPTestaUpdate = {
                stato: nextState,
                modifiedby: `${userInfo?.first_name} ${userInfo?.last_name}`,
                details: dpRows.map(row => ({
                    id: typeof row.id === 'string' ? undefined : Number(row.id),
                    caluid: row.zohoEventId || null,
                    id_sede: row.selectedClient?.id || null,
                    id_agpspm: row.risorsaAssegnata?.id || null,
                    descrizionemanuale: row.descrizionemanuale,
                    note: row.notes,
                    fasciaoraria: (row.timeSlot === 'AM' || row.timeSlot === 'PM') ? row.timeSlot : 'AM',
                    materialedisponibile: row.materialAvailable ? 'SI' : 'NO',
                    interventions: row.selectedInterventions.map(si => ({
                        id_tipi_interventi: si.interventionTypeId,
                        qta: si.quantity
                    }))
                }))
            };
    
            const finalUpdatedTesta = await api.updateDPTesta(testaToProcess.id, updatePayload);
    
            const finalDetails = await api.getDPDetailsByTesta(finalUpdatedTesta.id);
            const finalRows = await Promise.all(finalDetails.map(async (detail) => {
                const client = clients.find(c => c.id === detail.id_sede) ?? null;
                const risorsa = risorse.find(r => r.id === detail.id_agpspm) || null;
                const detailInterventions = await api.getDPDetailTIsByDetail(detail.id);
                const mappedInterventions: SelectedIntervention[] = detailInterventions.map(dti => {
                    const type = interventionTypes.find(it => it.id === dti.id_tipi_interventi);
                    return { id: dti.id, interventionTypeId: dti.id_tipi_interventi, interventionTypeName: type ? type.name : 'Sconosciuto', quantity: dti.qta };
                });
    
                const originalTitle = detail.descrizionemanuale || `Attività ID: ${detail.id}`;
                        
                return {
                    id: detail.id, isNew: false, zohoEventId: detail.caluid,
                    zohoOriginalTitle: originalTitle, descrizionemanuale: detail.descrizionemanuale || originalTitle,
                    selectedClient: client, risorsaAssegnata: risorsa, selectedInterventions: mappedInterventions,
                    notes: detail.note || '', timeSlot: detail.fasciaoraria, materialAvailable: detail.materialedisponibile === 'SI',
                };
            }));
            
            setDpTesta(finalUpdatedTesta);
            setDpRows(finalRows);
            setIsDirty(false);
    
            let readOnly = false;
            if (finalUpdatedTesta.stato === 'CHIUSO' || finalUpdatedTesta.stato === 'MODIFICATO') {
                readOnly = true;
            } else if (currentUserRole === 'MAGAZZINIERE' && finalUpdatedTesta.stato === 'APERTO') {
                readOnly = true;
            } else if (currentUserRole === 'SPECIALIST' && finalUpdatedTesta.stato === 'NUOVO') {
                readOnly = true;
            }
            setIsReadOnly(readOnly);
    
            setInfoDialogContent({ title: "Operazione completata", message: infoMessage });
            setInfoDialogOpen(true);
    
        } catch (err: any) {
            console.error("Errore durante il salvataggio:", err);
            setPageError(`Errore salvataggio: ${err.message || 'Errore sconosciuto'}`);
        } finally {
            setIsSaving(false);
        }
    }, [dpTesta, dpRows, api, currentUserRole, targetDate, userInfo, isReadOnly, clients, risorse, interventionTypes]);
    
    // NEW: Funzione per salvare la bozza silenziosamente
    const handleSaveDraft = useCallback(async () => {
        if (!isDirty || isReadOnly || isSaving) {
            return;
        }

        setIsSaving(true);
        setPageError(null);
        
        let testaToProcess: DPTesta | null = dpTesta;

        try {
            if (!testaToProcess) {
                if (!targetDate) throw new Error("Target date is required for a new planning.");
                const newDpTestaData: DPTestaCreate = {
                    giorno: targetDate,
                    createdby: `${userInfo?.first_name} ${userInfo?.last_name}`,
                    modifiedby: `${userInfo?.first_name} ${userInfo?.last_name}`,
                    stato: 'NUOVO',
                    revisione: 0,
                };
                testaToProcess = await api.createDPTesta(newDpTestaData);
                setDpTesta(testaToProcess);
            }

            if (!testaToProcess) {
                throw new Error("Impossibile creare o trovare la testata del planning.");
            }
            
            const updatePayload: DPTestaUpdate = {
                stato: testaToProcess.stato, // NON cambia lo stato
                modifiedby: `${userInfo?.first_name} ${userInfo?.last_name}`,
                details: dpRows.map(row => ({
                    id: typeof row.id === 'string' ? undefined : Number(row.id),
                    caluid: row.zohoEventId || null,
                    id_sede: row.selectedClient?.id || null,
                    id_agpspm: row.risorsaAssegnata?.id || null,
                    descrizionemanuale: row.descrizionemanuale,
                    note: row.notes,
                    fasciaoraria: (row.timeSlot === 'AM' || row.timeSlot === 'PM') ? row.timeSlot : 'AM',
                    materialedisponibile: row.materialAvailable ? 'SI' : 'NO',
                    interventions: row.selectedInterventions.map(si => ({
                        id_tipi_interventi: si.interventionTypeId,
                        qta: si.quantity
                    }))
                }))
            };

            const finalUpdatedTesta = await api.updateDPTesta(testaToProcess.id, updatePayload);

            const finalDetails = await api.getDPDetailsByTesta(finalUpdatedTesta.id);
            const finalRows = await Promise.all(finalDetails.map(async (detail) => {
                 const client = clients.find(c => c.id === detail.id_sede) ?? null;
                const risorsa = risorse.find(r => r.id === detail.id_agpspm) || null;
                const detailInterventions = await api.getDPDetailTIsByDetail(detail.id);
                const mappedInterventions: SelectedIntervention[] = detailInterventions.map(dti => {
                    const type = interventionTypes.find(it => it.id === dti.id_tipi_interventi);
                    return { id: dti.id, interventionTypeId: dti.id_tipi_interventi, interventionTypeName: type ? type.name : 'Sconosciuto', quantity: dti.qta };
                });
                const originalTitle = detail.descrizionemanuale || `Attività ID: ${detail.id}`;
                return {
                    id: detail.id, isNew: false, zohoEventId: detail.caluid,
                    zohoOriginalTitle: originalTitle, descrizionemanuale: detail.descrizionemanuale || originalTitle,
                    selectedClient: client, risorsaAssegnata: risorsa, selectedInterventions: mappedInterventions,
                    notes: detail.note || '', timeSlot: detail.fasciaoraria, materialAvailable: detail.materialedisponibile === 'SI',
                };
            }));
            
            setDpTesta(finalUpdatedTesta);
            setDpRows(finalRows);
            setIsDirty(false);

        } catch (err: any) {
            console.error("Errore durante il salvataggio della bozza:", err);
            // Non mostrare errore all'utente per un salvataggio in background
        } finally {
            setIsSaving(false);
        }
    }, [isDirty, isReadOnly, isSaving, dpTesta, dpRows, api, userInfo, targetDate, clients, risorse, interventionTypes]);

    // NEW: Espone la funzione `handleSaveDraft` al componente genitore tramite ref.
    useImperativeHandle(ref, () => ({
        triggerSaveDraft: handleSaveDraft,
    }), [handleSaveDraft]);

    const handleReopenPlanning = useCallback(async () => {
        if (!dpTesta || currentUserRole !== 'SPECIALIST' || (dpTesta.stato !== 'CHIUSO' && dpTesta.stato !== 'MODIFICATO')) return;

        setIsSaving(true);
        try {
            await api.updateDPTesta(dpTesta.id, { 
                stato: 'APERTO', 
                modifiedby: currentUserRole,
            });

            setDpTesta(prev => prev ? { ...prev, stato: 'APERTO', modifiedby: currentUserRole } : null);
            setIsReadOnly(false);
            setIsDirty(true);

            setInfoDialogContent({ title: "Planning Riaperto", message: "Il planning è stato sbloccato ed è ora modificabile. Salva le modifiche per confermare." });
            setInfoDialogOpen(true);

        } catch (err: any) {
            console.error("Errore durante la riapertura:", err);
            setPageError(`Impossibile riaprire il planning: ${err.message || 'Errore sconosciuto'}`);
        } finally {
            setIsSaving(false);
        }

    }, [api, dpTesta, currentUserRole]);


    const handleCardClick = (row: DailyPlanningDetailRow) => {
        setCurrentRowInModal(row);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        if (currentRowInModal) {
            handleRowChange(currentRowInModal);
        }
        setModalOpen(false);
        setCurrentRowInModal(null);
    };
    
    const handleInfoDialogClose = () => {
        setInfoDialogOpen(false);
    };

    const handleUpdateFromModal = (updatedRow: DailyPlanningDetailRow) => {
        setCurrentRowInModal(updatedRow);
    };

    const handleDeleteFromModal = (rowId: string | number) => {
        deleteRow(rowId);
        setModalOpen(false);
        setCurrentRowInModal(null);
    };
    
    const isCardRowComplete = (row: DailyPlanningDetailRow) => {
        if (currentUserRole === 'SPECIALIST') {
            return row.risorsaAssegnata && row.selectedClient && row.selectedInterventions.length > 0 && row.timeSlot;
        }
        return row.selectedClient && row.selectedInterventions.length > 0 && row.timeSlot;
    };

    const getAvatarLetter = (row: DailyPlanningDetailRow) => {
        if (currentUserRole === 'SPECIALIST' && row.risorsaAssegnata) {
            return row.risorsaAssegnata.sigla || row.risorsaAssegnata.nome[0].toUpperCase();
        }
        if (row.selectedClient && row.selectedClient.nomeBreve) return row.selectedClient.nomeBreve[0].toUpperCase();
        if (row.selectedClient) return row.selectedClient.ragioneSociale[0].toUpperCase();
        return row.descrizionemanuale?.[0]?.toUpperCase() || '?';
    }
    const getStatusColor = (row: DailyPlanningDetailRow) => {
        return isCardRowComplete(row) ? theme.palette.success.main : theme.palette.warning.main;
    }

    if (isLoadingInitialData) {
        return <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p:3, height: '100%' }}><CircularProgress size={50} thickness={4} /><Typography variant="h6" sx={{ mt: 2.5, color: 'text.secondary' }}>Caricamento Dati...</Typography></Box>;
    }

    

    const renderAppBar = () => (
        <AppBar position="sticky" sx={{ boxShadow: theme.shadows[1] }}>
            <Container maxWidth={false} disableGutters>
                <Toolbar sx={{ py: 1, px: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1, flexWrap: 'wrap' }}>
                        {isReadOnly && dpTesta?.stato !== 'APERTO' && (
                            <Tooltip title="Questo planning è chiuso e non può essere modificato.">
                                <Chip
                                    icon={<LockIcon />}
                                    label="Bloccato"
                                    color="secondary"
                                    size="small"
                                    variant="filled"
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        color: 'common.white',
                                        ".MuiChip-icon": { margin: 0 }
                                    }}
                                />
                            </Tooltip>
                        )}
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold', fontSize: '1.15rem' }}>
                                {title}
                            </Typography>
                            <Typography variant="caption" >
                                {new Date(dpTesta?.giorno || targetDate || Date.now()).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                        {isDirty && !isReadOnly && (
                            <Chip 
                                label="Non Salvato" 
                                size="small"
                                variant="outlined"
                                sx={{
                                    color: 'warning.light',
                                    borderColor: 'warning.light',
                                    animation: `${pulseAnimation} 2s infinite`,
                                    fontWeight: 'medium',
                                    height: 24,
                                }}
                            />
                        )}
                        
                        {dpTesta?.giorno && (() => {
                            // Compare only the date part (ignore time)
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const target = new Date(dpTesta?.giorno);
                            console.log("Target Date:", target);
                            console.log("Today Date:", today);
                            target.setHours(0, 0, 0, 0);
                            return target.getTime() > today.getTime();
                        })() && isReadOnly && currentUserRole === 'SPECIALIST' && (dpTesta?.stato === 'CHIUSO' || dpTesta?.stato === 'MODIFICATO') && (
                            <Tooltip title="Riapri il planning per renderlo modificabile">
                                <span>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size={isMobile ? "small" : "medium"}
                                        startIcon={<LockOpenIcon />}
                                        onClick={handleReopenPlanning}
                                        disabled={isSaving}
                                    >
                                        Riapri
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                        {!isReadOnly && (
                            <>
                            <Tooltip title={ currentUserRole === 'MAGAZZINIERE' ? "Salva le modifiche" : "Salva senza cambiare stato" }>
                                <span><IconButton type="button" onClick={() => handleSaveAll(false)} color="inherit" size={isMobile ? "small" : "medium"} disabled={!isDirty || isSaving}><SaveIcon /></IconButton></span>
                            </Tooltip>
                            <Tooltip title={ dpTesta?.stato === 'NUOVO' ? "Invia allo SPECIALIST" : "Chiudi e finalizza planning"}>
                                <span><IconButton type="button" onClick={() => handleSaveAll(true)} color="inherit" size={isMobile ? "small" : "medium"} disabled={!isDirty || isSaving}><LockIcon /></IconButton></span>
                            </Tooltip>
                            </>
                        )}
                        {
                            currentUserRole === "SPECIALIST" && (
                                <>
                                    <Tooltip title="Scarica il Daily Planning in formato PDF">
                                        <span>
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                size={isMobile ? "small" : "medium"}
                                                startIcon={isSaving ? <CircularProgress size={22} color="inherit" /> : <DownloadIcon />}
                                                onClick={async () => {
                                                    setIsSaving(true);
                                                    try {
                                                        const blob = await api.getDPPdfReport(dpTesta?.id || 0);
                                                        if (blob instanceof Blob) {
                                                            console.log("Dimensione del file ricevuto:", blob.size, "bytes");
                                                            console.log("Tipo MIME del file ricevuto:", blob.type);
                                                            const url = window.URL.createObjectURL(blob);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            let name = new Date(dpTesta?.giorno || targetDate || Date.now()).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                                            let revisione = dpTesta?.revisione ? `-Rev${dpTesta.revisione>0 ? dpTesta.revisione -1 : 0}` : '';
                                                            link.download = `${name}${revisione}.pdf`;
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            setTimeout(() => {
                                                                document.body.removeChild(link);
                                                                window.URL.revokeObjectURL(url);
                                                            }, 100);
                                                        }
                                                    } catch (err) {
                                                        setPageError("Errore durante il download del PDF.");
                                                    } finally {
                                                        setIsSaving(false);
                                                    }
                                                }}
                                                disabled={isSaving}
                                            >
                                                Scarica
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </>
                            )
                        }
                    </Stack>
                </Toolbar>
            </Container>
            {isSaving && <LinearProgress color="secondary" />}
        </AppBar>
    );
    
    const renderInfoDialog = () => (
        <Dialog open={infoDialogOpen} onClose={handleInfoDialogClose}>
            <DialogTitle>{infoDialogContent.title}</DialogTitle>
            <DialogContent>
                <Typography>{infoDialogContent.message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleInfoDialogClose} autoFocus>OK</Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
            <CssBaseline />
            {renderAppBar()}
            {renderInfoDialog()}

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {isMobile ? (
                    <Container maxWidth="xl" sx={{ py: 2, px: { xs: 1.5, sm: 2 }, mb: 8 }}>
                        {dpRows.length === 0 ? (
                            <Paper elevation={0} sx={{ textAlign: 'center', py: 6, px: 2, backgroundColor: alpha(theme.palette.grey[500], 0.05), borderRadius: 2.5, mt: 3 }}>
                                <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Nessuna attività per oggi.</Typography>
                                <Typography variant="body2" sx={{ color: 'text.disabled', mb: 2.5 }}>Aggiungi la prima attività!</Typography>
                                {!isReadOnly && (
                                  <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={addNewRow}>Aggiungi Nuova Attività</Button>
                                )}
                            </Paper>
                        ) : (
                            <Stack spacing={1.5}>
                                {dpRows.map((row) => (
                                    <Card
                                        key={row.id}
                                        elevation={2}
                                        sx={{
                                            borderRadius: '12px',
                                            borderLeft: `5px solid ${getStatusColor(row)}`,
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': { boxShadow: isReadOnly ? undefined : theme.shadows[6], transform: isReadOnly ? undefined : 'translateY(-2px)' },
                                            overflow: 'visible',
                                            backgroundColor: isReadOnly ? alpha(theme.palette.grey[500], 0.08) : 'inherit',
                                        }}
                                    >
                                        <CardActionArea onClick={() => handleCardClick(row)} sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} disabled={isReadOnly}>
                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                                                {currentUserRole === 'SPECIALIST' && row.risorsaAssegnata && (
                                                    <Tooltip title={`Info: ${row.risorsaAssegnata.nome}`}>
                                                        <IconButton
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRisorsaAvatarClick(e as unknown as React.MouseEvent<HTMLButtonElement>, row.risorsaAssegnata!);
                                                            }}
                                                            sx={{ p: 0 }}
                                                        >
                                                            <Avatar
                                                                sx={{
                                                                    bgcolor: theme.palette.secondary.main,
                                                                    color: theme.palette.secondary.contrastText,
                                                                    width: 36, height: 36, fontSize: '0.9rem',
                                                                    border: `2px solid ${getStatusColor(row)}`
                                                                }}
                                                            >
                                                                {row.risorsaAssegnata.sigla}
                                                            </Avatar>
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {(currentUserRole !== 'SPECIALIST' || !row.risorsaAssegnata) && (
                                                    <Avatar sx={{ bgcolor: getStatusColor(row), width: 36, height: 36, fontSize: '0.9rem' }}>
                                                        {getAvatarLetter(row)}
                                                    </Avatar>
                                                )}
                                                <Box flexGrow={1} sx={{ minWidth: 0 }}>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        {row.zohoEventId && (
                                                            <Tooltip title="Attività sincronizzata da Zoho">
                                                                <CloudQueueIcon color="action" sx={{ fontSize: '1rem', opacity: 0.7 }} />
                                                            </Tooltip>
                                                        )}
                                                        <Typography
                                                            variant="subtitle1"
                                                            component="div"
                                                            gutterBottom
                                                            sx={{
                                                                fontWeight: 500,
                                                                lineHeight: 1.3,
                                                                fontSize: '0.95rem',
                                                                whiteSpace: 'normal',
                                                                wordBreak: 'break-word',
                                                                m:0
                                                            }}
                                                        >
                                                            {row.descrizionemanuale || "Nessuna descrizione"}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                                                        {row.selectedClient ? (row.selectedClient.nomeBreve || row.selectedClient.ragioneSociale) : "Cliente non specificato"}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Divider sx={{ my: 1, width: '100%' }} />
                                            <Stack direction="row" justifyContent="space-around" alignItems="center" spacing={0.5} sx={{ fontSize: '0.7rem', width: '100%' }}>
                                                <Chip
                                                    icon={<ConstructionIcon sx={{ fontSize: '0.9rem', ml: '2px' }} />}
                                                    label={`${row.selectedInterventions.length} Interv.`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ flex: 1, borderColor: alpha(theme.palette.text.primary, 0.2), color: alpha(theme.palette.text.primary, 0.7) }}
                                                />
                                                <Chip
                                                    icon={<AccessTimeIcon sx={{ fontSize: '0.9rem', ml: '2px' }} />}
                                                    label={row.timeSlot || "N/D"}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ flex: 1, borderColor: alpha(theme.palette.text.primary, 0.2), color: alpha(theme.palette.text.primary, 0.7) }}
                                                />
                                                <Chip
                                                    icon={row.materialAvailable ? <CheckCircleOutlineIcon sx={{ fontSize: '0.9rem', ml: '2px' }} /> : <CategoryIcon sx={{ fontSize: '0.9rem', ml: '2px' }} />}
                                                    label={row.materialAvailable ? "Mat. OK" : "Ver. Mat."}
                                                    size="small"
                                                    color={row.materialAvailable ? "success" : "default"}
                                                    variant={row.materialAvailable ? "filled" : "outlined"}
                                                    sx={row.materialAvailable ?
                                                        { flex: 1, color: 'common.white', backgroundColor: theme.palette.success.dark } :
                                                        { flex: 1, borderColor: alpha(theme.palette.text.primary, 0.2), color: alpha(theme.palette.text.primary, 0.7) }}
                                                />
                                            </Stack>
                                        </CardActionArea>
                                    </Card>
                                ))}
                            </Stack>
                        )}

                        {selectedRisorsaForPopover && (
                            <Popover
                                id={risorsaPopoverId}
                                open={risorsaPopoverOpen}
                                anchorEl={risorsaPopoverAnchorEl}
                                onClose={handleRisorsaPopoverClose}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                PaperProps={{ elevation: 3, sx: { borderRadius: 1.5, p: 1.5, mt: 0.5, minWidth: 200 } }}
                            >
                                <Stack spacing={0.5}>
                                    <Typography variant="subtitle2" fontWeight="bold">{selectedRisorsaForPopover.nome}</Typography>
                                    <Chip icon={<BadgeOutlinedIcon fontSize="small" />} label={`Sigla: ${selectedRisorsaForPopover.sigla}`} size="small" variant="outlined" />
                                </Stack>
                            </Popover>
                        )}

                        {currentRowInModal && (
                            <Dialog
                                open={modalOpen}
                                onClose={handleCloseModal}
                                fullScreen
                                PaperProps={{ sx: { m: 0, borderRadius: 0, height: '100%', maxHeight: '100%', overflowY: 'hidden' } }}
                            >
                                <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText', p: 1.5, fontSize: '1.1rem', boxShadow: theme.shadows[1] }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        Modifica Attività
                                        <IconButton type="button" onClick={handleCloseModal} sx={{ color: 'primary.contrastText' }} size="small"><ClearIcon /></IconButton>
                                    </Stack>
                                </DialogTitle>
                                <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, overflowX: 'hidden', overflowY: 'auto' }}>
                                    <CollapsibleTableRow
                                        key={currentRowInModal.id}
                                        rowData={currentRowInModal}
                                        onRowChange={handleUpdateFromModal}
                                        onDeleteRow={() => handleDeleteFromModal(currentRowInModal.id)}
                                        allClients={clients}
                                        allInterventionTypes={interventionTypes}
                                        allRisorse={risorse}
                                        userRole={currentUserRole ?? 'SPECIALIST'}
                                        isMobileModalMode={true}
                                        viewMode="mobile"
                                        isReadOnly={isReadOnly}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                        {!isReadOnly && (
                          <Fab component="button" type="button" color="secondary" aria-label="add" onClick={addNewRow} sx={{ position: 'fixed', bottom: 16, right: 16, boxShadow: theme.shadows[6] }}>
                                <AddIcon />
                            </Fab>
                        )}
                    </Container>
                ) : (
                    <Container maxWidth={false} sx={{ py: 3, px: 2, mb: 8 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.common.black, 0.1)}` }}>
                            <TableContainer>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: 40, p:1 }} />
                                            {currentUserRole === 'SPECIALIST' && <TableCell sx={{ width: '10%', minWidth: 90 }}>Risorsa</TableCell>}
                                            <TableCell sx={{ width: 'auto', minWidth: 200 }}>Descrizione Attività</TableCell>
                                            <TableCell sx={{ width: '35%', minWidth: 200 }}>Cliente</TableCell>
                                            <TableCell align="center" sx={{ width: '15%', minWidth: 120 }}>Interventi</TableCell>
                                            <TableCell align="right" sx={{ width: 40, p:1 }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {dpRows.length > 0 ? dpRows.map((row) => (
                                            <CollapsibleTableRow
                                                key={row.id}
                                                rowData={row}
                                                onRowChange={handleRowChange}
                                                onDeleteRow={deleteRow}
                                                allClients={clients}
                                                allInterventionTypes={interventionTypes}
                                                allRisorse={risorse}
                                                userRole={currentUserRole ?? 'SPECIALIST'}
                                                viewMode={isTablet ? 'tablet' : 'desktop'}
                                                onRisorsaAvatarClick={handleRisorsaAvatarClick}
                                                isReadOnly={isReadOnly}
                                            />
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={currentUserRole === 'SPECIALIST' ? 6 : 5} sx={{ textAlign: 'center', py: 8 }}>
                                                    <SearchIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 2 }} />
                                                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Nessuna attività pianificata.</Typography>
                                                    {!isReadOnly && (
                                                        <Typography variant="body1" sx={{ color: 'text.disabled' }}>
                                                            Aggiungi una nuova attività usando il pulsante in basso.
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                        {selectedRisorsaForPopover && (
                            <Popover
                                id={risorsaPopoverId}
                                open={risorsaPopoverOpen}
                                anchorEl={risorsaPopoverAnchorEl}
                                onClose={handleRisorsaPopoverClose}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                PaperProps={{ elevation: 3, sx: { borderRadius: 1.5, p: 1.5, mt: 0.5, minWidth: 200 } }}
                            >
                                <Stack spacing={0.5}>
                                    <Typography variant="subtitle2" fontWeight="bold">{selectedRisorsaForPopover.nome}</Typography>
                                    <Chip icon={<BadgeOutlinedIcon fontSize="small" />} label={`Sigla: ${selectedRisorsaForPopover.sigla}`} size="small" variant="outlined" />
                                </Stack>
                            </Popover>
                        )}
                        {!isReadOnly && (
                            <Fab component="button" type="button" color="primary" aria-label="add" onClick={addNewRow} sx={{ position: 'fixed', bottom: { xs: 24, sm: 32 }, right: { xs: 24, sm: 32 }, transform: 'scale(1.1)' }}>
                                <AddIcon />
                            </Fab>
                        )}
                    </Container>
                )}
            </Box>
        </Box>
    );
});

export default DailyPlanningForm;
