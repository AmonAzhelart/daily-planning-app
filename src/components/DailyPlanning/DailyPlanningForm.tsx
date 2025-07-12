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
    Alert,
    AvatarGroup,
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
    CloudQueue as CloudQueueIcon, Close as CloseIcon, PictureAsPdf as PictureAsPdfIcon,
    SyncLock as SyncLockIcon, Group as GroupIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import {
    useDailyPlanningApi,
    DPTesta, DPDetail, DPTestaCreate, DPTestaUpdate,
    TipoIntervento, ClienteResponseAPI, OauthUserResponse,
    DPStatus, FasciaOraria,
} from '../../customHook/api';
import { useAuth } from '../../context/AuthContenxt';
import { DownloadIcon } from 'lucide-react';


// --- Interfaccia delle Props ---
interface DailyPlanningFormProps {
    planningId: number | null;
    targetDate: string | null;
    onClose: () => void;
    title: string;
}

// --- Interfaccia per il ref esposto ---
export interface DailyPlanningFormRef {
    triggerSaveDraft: () => Promise<void>;
    handleCloseRequest: () => void;
}


// --- Tipi Specifici per il Frontend ---
export type UserRole = 'MAGAZZINIERE' | 'SPECIALIST';

interface Risorsa {
    id: string; // Corrisponde a OauthUserResponse.username
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
    zohoEventColor?: string; // NUOVO: Colore evento Zoho
    descrizionemanuale: string;
    selectedClient: Client | null;
    risorseAssegnate: Risorsa[]; // MODIFICATO: da singola a multipla
    selectedInterventions: SelectedIntervention[];
    notes: string;
    timeSlot: FasciaOraria | '';
    materialAvailable: boolean;
}

// --- Helper per derivare la sigla della risorsa ---
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
    isReadOnly: boolean;
    dpStatus: DPStatus | undefined | null;
}

const CollapsibleTableRow: React.FC<CollapsibleTableRowProps> = React.memo(({
    rowData: initialRowData, onRowChange, onDeleteRow, allClients, allInterventionTypes, allRisorse, userRole, isMobileModalMode, viewMode, isReadOnly, dpStatus
}) => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [localRowData, setLocalRowData] = useState<DailyPlanningDetailRow>(initialRowData);
    const debouncedRowData = useDebounce(localRowData, 400);
    const mounted = useRef(false);

    // State for popovers
    const [risorsePopoverAnchorEl, setRisorsePopoverAnchorEl] = useState<null | HTMLElement>(null);
    const [interventiPopoverAnchorEl, setInterventiPopoverAnchorEl] = useState<null | HTMLElement>(null);

    const showRisorsa = useMemo(() => {
        return userRole === 'SPECIALIST' && dpStatus && dpStatus !== 'NUOVO';
    }, [userRole, dpStatus]);

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
    }, [initialRowData.selectedClient]);

    // Popover Handlers
    const handleRisorsePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setRisorsePopoverAnchorEl(event.currentTarget);
    };
    const handleRisorsePopoverClose = () => {
        setRisorsePopoverAnchorEl(null);
    };

    const handleInterventiPopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        event.preventDefault();
        if (localRowData.selectedInterventions.length > 0) {
            setInterventiPopoverAnchorEl(event.currentTarget);
        }
    };
    const handleInterventiPopoverClose = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        event.preventDefault();
        setInterventiPopoverAnchorEl(null);
    };

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
            return localRowData.risorseAssegnate.length > 0 && localRowData.selectedClient && localRowData.selectedInterventions.length > 0 && localRowData.timeSlot;
        }
        return localRowData.selectedClient && localRowData.selectedInterventions.length > 0 && localRowData.timeSlot;
    }, [localRowData, userRole]);

    const handleClientChange = (event: any, newValue: Client | null) => handleFieldChange('selectedClient', newValue);
    const handleRisorseChange = (event: any, newValue: Risorsa[]) => handleFieldChange('risorseAssegnate', newValue);

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
                    <Box mt={2} p={1.5} bgcolor={alpha(theme.palette.grey[500], 0.1)} borderRadius={1}
                        // MODIFICA: Aggiunto bordo laterale colorato
                        sx={{ borderLeft: `4px solid ${localRowData.zohoEventColor || theme.palette.divider}` }}
                    >
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
                    {showRisorsa && (
                        <Autocomplete
                            multiple
                            limitTags={3}
                            fullWidth
                            disabled={isReadOnly}
                            options={allRisorse}
                            getOptionLabel={(option) => `${option.nome} (${option.sigla})`}
                            value={localRowData.risorseAssegnate}
                            onChange={handleRisorseChange}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Risorse Assegnate"
                                    variant="outlined"
                                    size="small"
                                />
                            )}
                            renderOption={(props, option, { selected }) => (
                                <ListItem {...props} key={option.id}>
                                    <ListItemText primary={`${option.nome} (${option.sigla})`} />
                                </ListItem>
                            )}
                            noOptionsText="Nessuna risorsa trovata"
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
                                <Typography variant="body2" color="text.secondary">Materiale da prelevare in ufficio</Typography>
                            </Stack>
                        }
                        sx={{ justifyContent: 'space-between', ml: 0, mr: 0.5, color: 'text.secondary' }}
                    />
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

    const openRisorsePopover = Boolean(risorsePopoverAnchorEl);
    const openInterventiPopover = Boolean(interventiPopoverAnchorEl);
    const risorseToShow = localRowData.risorseAssegnate.slice(0, 2);
    const remainingRisorseCount = localRowData.risorseAssegnate.length - risorseToShow.length;

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

                {showRisorsa && (
                    <TableCell sx={{ fontWeight: 500 }}>
                        {localRowData.risorseAssegnate.length > 0 ? (
                            <>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                                    {risorseToShow.map(risorsa => (
                                        <Tooltip key={risorsa.id} title={`Risorsa: ${risorsa.nome}`}>
                                            <Chip
                                                avatar={<Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem' }}>{risorsa.sigla}</Avatar>}
                                                label={risorsa.sigla}
                                                size="small"
                                                sx={{
                                                    bgcolor: theme.palette.secondary.dark,
                                                    color: theme.palette.common.white,
                                                    m: '2px'
                                                }}
                                            />
                                        </Tooltip>
                                    ))}
                                    {remainingRisorseCount > 0 && (
                                        <Tooltip title="Mostra tutte le risorse">
                                            <Chip
                                                label={`+${remainingRisorseCount}`}
                                                size="small"
                                                onClick={handleRisorsePopoverOpen}
                                                sx={{ m: '2px', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                                            />
                                        </Tooltip>
                                    )}
                                </Stack>
                                <Popover
                                    open={openRisorsePopover}
                                    anchorEl={risorsePopoverAnchorEl}
                                    onClose={handleRisorsePopoverClose}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                >
                                    <Paper sx={{ p: 1, maxWidth: 320 }}>
                                        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>Elenco Risorse</Typography>
                                        <List dense>
                                            {localRowData.risorseAssegnate.map(risorsa => (
                                                <ListItem key={risorsa.id}>
                                                    <ListItemIcon>
                                                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'secondary.main' }}>
                                                            {risorsa.sigla}
                                                        </Avatar>
                                                    </ListItemIcon>
                                                    <ListItemText primary={risorsa.nome} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                </Popover>
                            </>
                        ) : (
                            <Chip label="N/D" size="small" variant="outlined" />
                        )}
                    </TableCell>
                )}

                <TableCell sx={{ wordBreak: 'break-word' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {localRowData.zohoEventId && (
                            <Tooltip title={`Evento Zoho - Colore: ${localRowData.zohoEventColor || 'Default'}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CloudQueueIcon color="action" sx={{ fontSize: '1rem', opacity: 0.7 }} />
                                    {/* MODIFICA: Aggiunto indicatore colore */}
                                    <FiberManualRecordIcon sx={{ fontSize: '0.8rem', color: localRowData.zohoEventColor || '#01a0b9' }} />
                                </Box>
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
                    <Tooltip title={localRowData.selectedInterventions.length > 0 ? "Mostra elenco interventi" : ""}>
                        <Chip
                            icon={<BuildIcon sx={{ fontSize: '1rem', ml: '3px' }} />}
                            label={`${localRowData.selectedInterventions.length} Interv.`}
                            size="small"
                            onClick={handleInterventiPopoverOpen}
                            disabled={localRowData.selectedInterventions.length === 0}
                            color={localRowData.selectedInterventions.length > 0 ? "primary" : "default"}
                            variant={localRowData.selectedInterventions.length > 0 ? "filled" : "outlined"}
                            sx={{
                                ...(localRowData.selectedInterventions.length > 0 && {
                                    backgroundColor: 'primary.dark',
                                    color: 'common.white',
                                    cursor: 'pointer'
                                }),
                                ...(localRowData.selectedInterventions.length === 0 && {
                                    borderColor: alpha(theme.palette.common.black, 0.23)
                                })
                            }}
                        />
                    </Tooltip>
                    <Popover
                        open={openInterventiPopover}
                        anchorEl={interventiPopoverAnchorEl}
                        onClose={handleInterventiPopoverClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Paper sx={{ p: 1.5, maxWidth: 350, minWidth: 250 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, px: 1, fontWeight: 'bold' }}>Elenco Interventi</Typography>
                            <List dense>
                                {localRowData.selectedInterventions.map(iv => (
                                    <ListItem key={iv.interventionTypeId} divider>
                                        <ListItemText
                                            primary={iv.interventionTypeName}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                        />
                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                            {`Q.tà: ${iv.quantity}`}
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Popover>
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
                    colSpan={showRisorsa ? 6 : 5}
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
const DailyPlanningForm = forwardRef<DailyPlanningFormRef, DailyPlanningFormProps>(({ planningId, targetDate, onClose, title }, ref) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));

    const { user } = useAuth();
    const userInfo = user;
    const currentUserRole = user?.role?.name || 'SPECIALIST';

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
        return currentUserRole === 'SPECIALIST' && dpTesta?.stato && dpTesta.stato !== 'NUOVO';
    }, [currentUserRole, dpTesta]);

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
                if (zohoErr.message === "Unauthorized") {
                    throw zohoErr;
                }
                console.warn("Could not fetch Zoho events, continuing without them:", zohoErr.message);
            }
            const zohoEventsCache = new Map<string, any>(zohoEventsFromApi.map(event => [event.caluid, event]));

            const mapSingleDetailToRow = async (detail: DPDetail): Promise<DailyPlanningDetailRow> => {
                const client = detail.id_sede == null ? null : mappedClients.find(c => c.id === detail.id_sede) ?? null;
                const detailRisorse = detail.agpspm_users
                    .map(user => mappedRisorse.find(r => r.id === user.username))
                    .filter((r): r is Risorsa => r !== undefined);

                const detailInterventions = await api.getDPDetailTIsByDetail(detail.id);
                const mappedInterventions: SelectedIntervention[] = detailInterventions.map(dti => {
                    const type = mappedInterventionTypes.find(it => it.id === dti.id_tipi_interventi);
                    return { id: dti.id, interventionTypeId: dti.id_tipi_interventi, interventionTypeName: type ? type.name : 'Sconosciuto', quantity: dti.qta };
                });

                const matchingZohoEvent = detail.caluid ? zohoEventsCache.get(detail.caluid) : undefined;
                const originalTitle = matchingZohoEvent?.title || matchingZohoEvent?.description || detail.descrizionemanuale || `Attività ID: ${detail.id}`;

                return {
                    id: detail.id, isNew: false, zohoEventId: detail.caluid,
                    zohoOriginalTitle: originalTitle,
                    zohoEventColor: matchingZohoEvent?.color, // MODIFICA: Passa il colore
                    descrizionemanuale: detail.descrizionemanuale || originalTitle,
                    selectedClient: client,
                    risorseAssegnate: detailRisorse,
                    selectedInterventions: mappedInterventions, notes: detail.note || '',
                    timeSlot: detail.fasciaoraria, materialAvailable: detail.materialedisponibile === 'SI',
                };
            };

            const mapDbDetailsToRows = (details: DPDetail[]): Promise<DailyPlanningDetailRow[]> => {
                return Promise.all(details.map(mapSingleDetailToRow));
            };


            if (currentDpTesta) {
                const currentDpDetails = await api.getDPDetailsByTesta(Number(idToLoad));
                let processedRows: DailyPlanningDetailRow[] = [];

                if (currentDpTesta.stato === 'NUOVO') {
                    // Costruisci una mappa dei dettagli esistenti per un accesso rapido
                    const dbDetailsMapByCaluid = new Map(currentDpDetails.filter(d => d.caluid).map(detail => [detail.caluid, detail]));

                    // Mappa tutti gli eventi Zoho e i dettagli manuali in un unico array iniziale
                    const allDetailsPromises = zohoEventsFromApi.map(zohoEvent => {
                        const existingDetail = dbDetailsMapByCaluid.get(zohoEvent.caluid);
                        if (existingDetail) {
                            return mapSingleDetailToRow(existingDetail);
                        } else {
                            const originalTitle = zohoEvent.title || zohoEvent.description || 'Nuova Attività Zoho';
                            return Promise.resolve({
                                id: uuidv4(), isNew: true, zohoEventId: zohoEvent.caluid,
                                zohoOriginalTitle: originalTitle,
                                zohoEventColor: zohoEvent.color, // MODIFICA: Passa il colore
                                descrizionemanuale: originalTitle,
                                selectedClient: null, risorseAssegnate: [], selectedInterventions: [],
                                notes: zohoEvent.note || '', timeSlot: zohoEvent.fasciaoraria || '',
                                materialAvailable: zohoEvent.materialedisponibile === 'SI',
                            });
                        }
                    });

                    const zohoEventCaluids = new Set(zohoEventsFromApi.map(e => e.caluid));
                    const manualDetails = currentDpDetails.filter(d => !d.caluid || !zohoEventCaluids.has(d.caluid));
                    manualDetails.forEach(manualDetail => allDetailsPromises.push(mapSingleDetailToRow(manualDetail)));

                    const initialRows = await Promise.all(allDetailsPromises);

                    // --- LOGICA DI ORDINAMENTO AVANZATA ---
                    const zohoEventOrder = new Map(zohoEventsFromApi.map((event, index) => [event.caluid, index]));

                    const getSlotSortValue = (slot: FasciaOraria | '') => {
                        if (slot === 'AM') return 1;
                        if (slot === 'PM') return 2;
                        return 3; // Le attività senza fascia oraria vanno alla fine
                    };

                    initialRows.sort((a, b) => {
                        // 1. Ordina per fascia oraria (AM -> PM -> Senza fascia)
                        const slotComparison = getSlotSortValue(a.timeSlot) - getSlotSortValue(b.timeSlot);
                        if (slotComparison !== 0) return slotComparison;

                        // 2. All'interno della stessa fascia, metti le manuali prima
                        const aIsManual = !a.zohoEventId;
                        const bIsManual = !b.zohoEventId;
                        if (aIsManual && !bIsManual) return -1;
                        if (!aIsManual && bIsManual) return 1;

                        // 3. Se entrambe sono da Zoho, usa l'ordine originale di Zoho
                        if (!aIsManual && !bIsManual && a.zohoEventId && b.zohoEventId) {
                            const aIndex = zohoEventOrder.get(a.zohoEventId);
                            const bIndex = zohoEventOrder.get(b.zohoEventId);
                            if (aIndex !== undefined && bIndex !== undefined) {
                                return aIndex - bIndex;
                            }
                        }

                        // 4. Per le manuali o in caso di fallback, non cambiare l'ordine relativo
                        return 0;
                    });

                    processedRows = initialRows;

                    if (initialRows.some(r => r.isNew)) {
                        setIsDirty(true);
                    }
                } else {
                    // Per stati diversi da 'NUOVO', l'ordine del DB è la fonte di verità.
                    processedRows = await mapDbDetailsToRows(currentDpDetails);
                }
                setDpRows(processedRows);

            } else {
                // Logica per un planning completamente nuovo (nessun planningId).
                const newZohoRows: DailyPlanningDetailRow[] = zohoEventsFromApi.map(zohoEvent => {
                    const originalTitle = zohoEvent.title || zohoEvent.description || 'Nuova Attività Zoho';
                    return {
                        id: uuidv4(), isNew: true, zohoEventId: zohoEvent.caluid,
                        zohoOriginalTitle: originalTitle,
                        zohoEventColor: zohoEvent.color, // MODIFICA: Passa il colore
                        descrizionemanuale: originalTitle,
                        selectedClient: null,
                        risorseAssegnate: [],
                        selectedInterventions: [],
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

                if (planningDate < today) {
                    readOnly = true;
                }
                else if (stato === 'CHIUSO' || stato === 'MODIFICATO') {
                    readOnly = true;
                }
                else if (currentUserRole === 'MAGAZZINIERE' && stato !== 'NUOVO') {
                    readOnly = true;
                }
                setIsReadOnly(readOnly);
            } else {
                setIsReadOnly(false);
            }

            setIsDirty(false);

        } catch (err: any) {
            console.error("Errore caricamento dati:", err.message);
            if (err.message === "Unauthorized") {
                console.warn("Sessione Zoho scaduta o non autenticata.");
                setPageError("La sessione di Zoho Calendar è scaduta. È necessaria una nuova autenticazione.");
                try {
                    const authResponse = await api.zoho_oauth_initiate();
                    if (authResponse && authResponse.auth_url) {
                        setZohoAuthUrl(authResponse.auth_url);
                    } else {
                        setPageError("Impossibile ottenere l'URL di autenticazione da Zoho. Contattare l'assistenza.");
                    }
                } catch (authError) {
                    console.error("Errore durante l'avvio dell'autenticazione Zoho:", authError);
                    setPageError("Si è verificato un errore critico durante il tentativo di ri-autenticazione con Zoho.");
                }
            } else {
                setPageError(`Errore caricamento: ${err.message || 'Sconosciuto'}`);
            }
        } finally {
            setIsLoadingInitialData(false);
        }
    }, [planningId, targetDate, currentUserRole, api]);


    useEffect(() => {
        loadPlanningData();
    }, []);


    const handleRowChange = useCallback((updatedRow: DailyPlanningDetailRow) => {
        if (isReadOnly) return;
        setDpRows(prevRows => {
            const newRows = prevRows.map(row => (row.id === updatedRow.id ? updatedRow : row));
            // Qui potresti dover ri-ordinare se la fascia oraria cambia
            // Per semplicità, per ora manteniamo l'ordine dopo la modifica
            return newRows;
        });
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
            risorseAssegnate: [],
            selectedInterventions: [],
            notes: '',
            timeSlot: '',
            materialAvailable: false,
        };
        // Inserisce la nuova riga in cima per visibilità immediata
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
                // Ripristina la riga in caso di errore
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
                if (!targetDate) {
                    throw new Error("La data è obbligatoria per creare un nuovo planning.");
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
            let infoMessage = "Bozza del planning salvata con successo!";

            if (isClosingAction) {
                if ((currentUserRole === 'MAGAZZINIERE' || currentUserRole === 'SPECIALIST') && testaToProcess.stato === 'NUOVO') {
                    nextState = 'APERTO';
                    infoMessage = "Planning aggiornato allo stato 'APERTO' e pronto per la gestione.";
                }
                else if (currentUserRole === 'SPECIALIST' && testaToProcess.stato === 'APERTO') {
                    const isModified = testaToProcess.revisione ? testaToProcess.revisione > 0 : false;
                    if (!isModified) {
                        nextState = 'CHIUSO';
                        infoMessage = `Planning chiuso per la prima volta. Stato: CHIUSO`;
                    } else {
                        nextState = 'MODIFICATO';
                        infoMessage = `Planning chiuso dopo modifiche. Stato: MODIFICATO, Rev: ${testaToProcess.revisione || 1}.`;
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
                    agpspm_users: row.risorseAssegnate.map(r => r.id),
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
    }, [dpTesta, dpRows, api, currentUserRole, targetDate, userInfo, isReadOnly, loadPlanningData]);

    const handleSaveDraft = useCallback(async () => {
        await handleSaveAll(false);
    }, [handleSaveAll]);

    const handleCloseRequest = useCallback(() => {
        if (isDirty && !isReadOnly) {
            setConfirmCloseOpen(true);
        } else {
            onClose();
        }
    }, [isDirty, isReadOnly, onClose]);

    useImperativeHandle(ref, () => ({
        triggerSaveDraft: handleSaveDraft,
        handleCloseRequest: handleCloseRequest,
    }), [handleSaveDraft, handleCloseRequest]);

    const handleSaveAndClose = async () => {
        setConfirmCloseOpen(false);
        const success = await handleSaveAll(false);
        if (success) {
            onClose();
        }
    };

    const handleCloseWithoutSaving = () => {
        setConfirmCloseOpen(false);
        onClose();
    };

    const handleReopenPlanning = useCallback(async () => {
        if (!dpTesta || currentUserRole !== 'SPECIALIST' || (dpTesta.stato !== 'CHIUSO' && dpTesta.stato !== 'MODIFICATO')) return;

        setIsSaving(true);
        try {
            await api.updateDPTesta(dpTesta.id, {
                stato: 'APERTO',
                modifiedby: `${userInfo?.first_name} ${userInfo?.last_name}`,
            });

            await loadPlanningData(dpTesta.id);
            setInfoDialogContent({ title: "Planning Riaperto", message: "Il planning è stato sbloccato ed è ora modificabile." });
            setInfoDialogOpen(true);
        } catch (err: any) {
            console.error("Errore durante la riapertura:", err);
            setPageError(`Impossibile riaprire il planning: ${err.message || 'Errore sconosciuto'}`);
        } finally {
            setIsSaving(false);
        }

    }, [api, dpTesta, currentUserRole, userInfo, loadPlanningData]);


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

    const handleZohoLogin = () => {
        if (!zohoAuthUrl) return;
        const popup = window.open(zohoAuthUrl, 'ZohoAuthPopup', 'width=600,height=700,left=200,top=100');
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
        if (currentUserRole === 'SPECIALIST') {
            return !!(row.risorseAssegnate.length > 0 && row.selectedClient && row.selectedInterventions.length > 0 && row.timeSlot);
        }
        return !!(row.selectedClient && row.selectedInterventions.length > 0 && row.timeSlot);
    };

    const getStatusColor = (row: DailyPlanningDetailRow) => {
        return isCardRowComplete(row) ? theme.palette.success.main : theme.palette.warning.main;
    }

    const getCloseButtonTooltip = () => {
        const state = dpTesta?.stato;
        if (state === 'APERTO') return "Chiudi e finalizza planning";
        if (currentUserRole === 'MAGAZZINIERE') return "Invia allo SPECIALIST";
        if (currentUserRole === 'SPECIALIST') return "Conferma e Apri il planning per la gestione";
        return "Blocca planning";
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

    const renderAppBar = () => (
        <AppBar position="sticky" sx={{ boxShadow: theme.shadows[1] }}>
            <Container maxWidth={false} disableGutters>
                <Toolbar sx={{ py: 1, px: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1, flexWrap: 'wrap' }}>
                        {isReadOnly && (
                            <Tooltip title="Questo planning è bloccato e non può essere modificato.">
                                <Chip icon={<LockIcon />} label="Bloccato" color="error" size="small" variant="filled" />
                            </Tooltip>
                        )}
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold', fontSize: '1.15rem' }}>{title}</Typography>
                            <Typography variant="caption" >
                                {new Date(dpTesta?.giorno || targetDate || Date.now()).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                        {isDirty && !isReadOnly && (
                            <Chip
                                label="Non Salvato" size="small" variant="outlined"
                                sx={{ color: 'warning.light', borderColor: 'warning.light', animation: `${pulseAnimation} 2s infinite`, fontWeight: 'medium', height: 24 }}
                            />
                        )}

                        {isReadOnly && currentUserRole === 'SPECIALIST' && (dpTesta?.stato === 'CHIUSO' || dpTesta?.stato === 'MODIFICATO') && (
                            <Tooltip title="Riapri il planning per renderlo modificabile">
                                <span>
                                    <Button variant="contained" color="secondary" size={isMobile ? "small" : "medium"} startIcon={<LockOpenIcon />} onClick={handleReopenPlanning} disabled={isSaving}>
                                        Riapri
                                    </Button>
                                </span>
                            </Tooltip>
                        )}

                        {!isReadOnly && (
                            <>
                                <Tooltip title="Salva bozza">
                                    <span>
                                        <IconButton type="button" onClick={() => handleSaveAll(false)} color="inherit" size={isMobile ? "small" : "medium"} disabled={!isDirty || isSaving}><SaveIcon /></IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title={getCloseButtonTooltip()}>
                                    <span>
                                        <IconButton type="button" onClick={() => handleSaveAll(true)} color="inherit" size={isMobile ? "small" : "medium"} disabled={isSaving}><LockIcon /></IconButton>
                                    </span>
                                </Tooltip>
                            </>
                        )}

                        {currentUserRole === "SPECIALIST" && dpTesta && (dpTesta.stato === "CHIUSO" || dpTesta.stato === "MODIFICATO") && (
                            <Tooltip title="Scarica il Daily Planning in formato PDF">
                                <span>
                                    <Button
                                        variant="contained" color="secondary" size={isMobile ? "small" : "medium"}
                                        startIcon={isSaving ? <CircularProgress size={22} color="inherit" /> : <DownloadIcon />}
                                        onClick={async () => {
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
                                                setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
                                            } catch (err) {
                                                setPageError("Errore durante il download del PDF.");
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        disabled={isSaving}
                                    >
                                        {isMobile ? '' : 'Scarica'}
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                    </Stack>
                </Toolbar>
            </Container>
            {isSaving && <LinearProgress color="secondary" />}
        </AppBar>
    );

    const renderInfoDialog = () => (
        <Dialog open={infoDialogOpen} onClose={handleInfoDialogClose}>
            <DialogTitle>{infoDialogContent.title}</DialogTitle>
            <DialogContent><Typography>{infoDialogContent.message}</Typography></DialogContent>
            <DialogActions><Button onClick={handleInfoDialogClose} autoFocus>OK</Button></DialogActions>
        </Dialog>
    );

    const renderConfirmCloseDialog = () => (
        <Dialog open={confirmCloseOpen} onClose={() => setConfirmCloseOpen(false)}>
            <DialogTitle>Salvare le modifiche?</DialogTitle>
            <DialogContent><Typography>Ci sono delle modifiche non salvate. Se chiudi ora, le perderai.</Typography></DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmCloseOpen(false)}>Annulla</Button>
                <Button onClick={handleCloseWithoutSaving} color="error">Chiudi senza salvare</Button>
                <Button onClick={handleSaveAndClose} variant="contained" autoFocus>Salva e Chiudi</Button>
            </DialogActions>
        </Dialog>
    );


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
            <CssBaseline />
            {renderAppBar()}
            {renderInfoDialog()}
            {renderConfirmCloseDialog()}

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
                                        <CardActionArea onClick={() => handleCardClick(row)} sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                                                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 36, height: 36, fontSize: '0.9rem', border: `2px solid ${getStatusColor(row)}` } }}>
                                                    {row.risorseAssegnate.length > 0 ? (
                                                        row.risorseAssegnate.map(r => (
                                                            <Avatar key={r.id} sx={{ bgcolor: theme.palette.secondary.main }}>{r.sigla}</Avatar>
                                                        ))
                                                    ) : (
                                                        <Avatar sx={{ bgcolor: getStatusColor(row) }}>
                                                            {row.selectedClient ? row.selectedClient.ragioneSociale[0].toUpperCase() : <GroupIcon />}
                                                        </Avatar>
                                                    )}
                                                </AvatarGroup>

                                                <Box flexGrow={1} sx={{ minWidth: 0, ml: row.risorseAssegnate.length > 0 ? 1 : 0 }}>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        {row.zohoEventId && (
                                                            <Tooltip title={`Evento Zoho - Colore: ${row.zohoEventColor || 'Default'}`}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <CloudQueueIcon color="action" sx={{ fontSize: '1rem', opacity: 0.7 }} />
                                                                    {/* MODIFICA: Aggiunto indicatore colore */}
                                                                    <FiberManualRecordIcon sx={{ fontSize: '0.7rem', color: row.zohoEventColor || 'action.disabled' }} />
                                                                </Box>
                                                            </Tooltip>
                                                        )}
                                                        <Typography
                                                            variant="subtitle1" component="div" gutterBottom
                                                            sx={{ fontWeight: 500, lineHeight: 1.3, fontSize: '0.95rem', whiteSpace: 'normal', wordBreak: 'break-word', m: 0 }}
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
                                                    label={`${row.selectedInterventions.length} Interv.`} size="small" variant="outlined"
                                                    sx={{ flex: 1, borderColor: alpha(theme.palette.text.primary, 0.2), color: alpha(theme.palette.text.primary, 0.7) }}
                                                />
                                                <Chip
                                                    icon={<AccessTimeIcon sx={{ fontSize: '0.9rem', ml: '2px' }} />}
                                                    label={row.timeSlot || "N/D"} size="small" variant="outlined"
                                                    sx={{ flex: 1, borderColor: alpha(theme.palette.text.primary, 0.2), color: alpha(theme.palette.text.primary, 0.7) }}
                                                />
                                                <Chip
                                                    icon={row.materialAvailable ? <CheckCircleOutlineIcon sx={{ fontSize: '0.9rem', ml: '2px' }} /> : <CategoryIcon sx={{ fontSize: '0.9rem', ml: '2px' }} />}
                                                    label={row.materialAvailable ? "Mat. OK" : "Ver. Mat."} size="small" color={row.materialAvailable ? "success" : "default"}
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

                        {currentRowInModal && (
                            <Dialog
                                open={modalOpen} onClose={handleCloseModal} fullScreen
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
                                        userRole={currentUserRole}
                                        isMobileModalMode={true}
                                        viewMode="mobile"
                                        isReadOnly={isReadOnly}
                                        dpStatus={dpTesta?.stato}
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
                                                key={row.id}
                                                rowData={row}
                                                onRowChange={handleRowChange}
                                                onDeleteRow={deleteRow}
                                                allClients={clients}
                                                allInterventionTypes={interventionTypes}
                                                allRisorse={risorse}
                                                userRole={currentUserRole}
                                                viewMode={isTablet ? 'tablet' : 'desktop'}
                                                isReadOnly={isReadOnly}
                                                dpStatus={dpTesta?.stato}
                                            />
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={showRisorsaColumn ? 6 : 5} sx={{ textAlign: 'center', py: 8 }}>
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