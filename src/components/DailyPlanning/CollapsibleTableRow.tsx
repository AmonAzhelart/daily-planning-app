import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Typography, Paper, Box, Button, Stack, TableCell, TableRow, IconButton, Collapse,
  TextField, Autocomplete, List, ListItem, ListItemText, Divider, Chip, Tooltip,
  InputAdornment, ToggleButton, ToggleButtonGroup, useTheme, ListItemIcon, Popover, Avatar, FormControlLabel, Switch
} from '@mui/material';
import {
  DeleteOutline as DeleteOutlineIcon, CheckCircleOutline as CheckCircleOutlineIcon, ErrorOutline as ErrorOutlineIcon,
  Edit as EditIcon, Search as SearchIcon, Clear as ClearIcon, PlaylistAddCheck as PlaylistAddCheckIcon,
  Business as BusinessIcon, Build as BuildIcon, Notes as NotesIcon, KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon, PersonPin as PersonPinIcon,
  Warehouse as WarehouseIcon, Engineering as EngineeringIcon, InfoOutlined as InfoOutlinedIcon,
  WbSunnyOutlined as WbSunnyOutlinedIcon, Brightness2Outlined as Brightness2OutlinedIcon,
  Apartment as ApartmentIcon, AddCircleOutline as AddCircleOutlineIcon, CloudQueue as CloudQueueIcon,
  ScheduleSendOutlined as ScheduleSendOutlinedIcon, LabelImportantOutlined as LabelImportantOutlinedIcon,
  Category as CategoryIcon, CommentOutlined as CommentOutlinedIcon, FiberManualRecord as FiberManualRecordIcon, ListAltOutlined as ListAltOutlinedIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { DailyPlanningDetailRow, InterventionType, Client, Risorsa, DPStatus, FasciaOraria } from './DailyPlanningForm';

// Helper function to debounce value changes
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

// Virtualized list for Autocomplete
const ListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>(
  function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData = React.Children.toArray(children);
    const itemCount = itemData.length;
    const itemSize = 42;
    const height = Math.min(8, itemCount) * itemSize;

    return (
      <div ref={ref}>
        <Box {...other}>
          <FixedSizeList height={height} width="100%" itemSize={itemSize} itemCount={itemCount} overscanCount={5}>
            {({ index, style }: ListChildComponentProps) => (React.cloneElement(itemData[index] as React.ReactElement<any>, { style }))}
          </FixedSizeList>
        </Box>
      </div>
    );
  }
);

// Component props interface
interface CollapsibleTableRowProps {
  rowData: DailyPlanningDetailRow;
  onRowChange: (updatedRow: DailyPlanningDetailRow) => void;
  onDeleteRow: (rowId: string | number) => void;
  allClients: Client[];
  allInterventionTypes: InterventionType[];
  allRisorse: Risorsa[];
  hasHighPriority: boolean;
  userRole: string;
  isMobileModalMode?: boolean;
  viewMode: 'mobile' | 'desktop' | 'tablet';
  isReadOnly: boolean;
  dpStatus: DPStatus | undefined | null;
}

const CollapsibleTableRow: React.FC<CollapsibleTableRowProps> = React.memo(({
  rowData: initialRowData, onRowChange, onDeleteRow, allClients, allInterventionTypes, allRisorse, hasHighPriority, userRole, isMobileModalMode, viewMode, isReadOnly, dpStatus
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [localRowData, setLocalRowData] = useState<DailyPlanningDetailRow>(initialRowData);
  const debouncedRowData = useDebounce(localRowData, 400);
  const mounted = useRef(false);

  const [risorsePopoverAnchorEl, setRisorsePopoverAnchorEl] = useState<null | HTMLElement>(null);
  const [interventiPopoverAnchorEl, setInterventiPopoverAnchorEl] = useState<null | HTMLElement>(null);

  const showRisorsa = useMemo(() => {
    return hasHighPriority && dpStatus && dpStatus !== 'NUOVO';
  }, [hasHighPriority, dpStatus]);

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

  const handleRisorsePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setRisorsePopoverAnchorEl(event.currentTarget);
  };
  const handleRisorsePopoverClose = () => setRisorsePopoverAnchorEl(null);

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
    if (hasHighPriority) {
      return localRowData.risorseAssegnate.length > 0 && localRowData.selectedClient && localRowData.selectedInterventions.length > 0 && !!localRowData.timeSlot;
    }
    return localRowData.selectedClient && localRowData.selectedInterventions.length > 0 && !!localRowData.timeSlot;
  }, [localRowData, hasHighPriority]);

  const handleClientChange = (event: any, newValue: Client | null) => handleFieldChange('selectedClient', newValue);
  const handleRisorseChange = (event: any, newValue: Risorsa[]) => handleFieldChange('risorseAssegnate', newValue);

  const handleTimeSlotChange = (event: React.MouseEvent<HTMLElement>, newTimeSlot: FasciaOraria | null) => {
    if (newTimeSlot !== null) {
      handleFieldChange('timeSlot', newTimeSlot);
    }
  };

  const handleMaterialToggle = (event: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('materialAvailable', event.target.checked);

  const handleAddIntervention = (interventionType: InterventionType | null) => {
    if (!interventionType) return;
    const existing = localRowData.selectedInterventions.find(si => si.interventionTypeId === interventionType.id);
    const newInterventions = existing
      ? localRowData.selectedInterventions.map(si => si.interventionTypeId === interventionType.id ? { ...si, quantity: si.quantity + 1 } : si)
      : [...localRowData.selectedInterventions, { id: undefined, interventionTypeId: interventionType.id, interventionTypeName: interventionType.name, quantity: 1 }];
    handleFieldChange('selectedInterventions', newInterventions);
  };

  const handleAddInterventionFromSearch = () => {
    if (!interventionSearchTerm) return;
    handleAddIntervention(interventionSearchTerm);
    setInterventionSearchTerm(null);
    setInterventionInputValue('');
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

export default CollapsibleTableRow;

