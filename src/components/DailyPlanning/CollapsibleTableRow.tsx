import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  Stack,
  TableCell,
  TableRow,
  IconButton,
  Collapse,
  TextField,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  ListItemIcon,
} from '@mui/material';
import {
  DeleteOutline as DeleteOutlineIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  Business as BusinessIcon,
  Build as BuildIcon,
  Notes as NotesIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  WarningAmber as WarningAmberIcon,
  PersonPin as PersonPinIcon,
  Warehouse as WarehouseIcon,
  Engineering as EngineeringIcon,
  InfoOutlined as InfoOutlinedIcon,
  WbSunnyOutlined as WbSunnyOutlinedIcon,
  Brightness2Outlined as Brightness2OutlinedIcon,
  Apartment as ApartmentIcon,
  AddCircleOutline as AddCircleOutlineIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// --- Tipi ---
export type UserRole = 'MAGAZZINIERE' | 'SPECIALIST';
interface Risorsa { id: string; nome: string; sigla: string; }
interface Client { id: string; ragioneSociale: string; }
interface InterventionType { id: string; name: string; }
interface SelectedIntervention { interventionTypeId: string; interventionTypeName: string; quantity: number; }
export interface DailyPlanningDetailRow {
  id: string;
  zohoEventId?: string;
  zohoSuggestion: string;
  zohoEventColor?: string; // NUOVO: Colore associato all'evento Zoho
  selectedClient: Client | null;
  risorsaAssegnata: Risorsa | null;
  selectedInterventions: SelectedIntervention[];
  notes: string;
  timeSlot: 'AM' | 'PM' | '';
  materialAvailable: boolean;
}

// --- Componente CollapsibleTableRow ---
interface CollapsibleTableRowProps {
  rowData: DailyPlanningDetailRow;
  onUpdateRow: (updatedRow: DailyPlanningDetailRow) => void;
  onDeleteRow: (rowId: string) => void;
  allClients: Client[];
  allInterventionTypes: InterventionType[];
  allRisorse: Risorsa[];
  userRole: UserRole;
  isMobileModalMode?: boolean;
}

const CollapsibleTableRow: React.FC<CollapsibleTableRowProps> = ({
  rowData: initialRowData, onUpdateRow, onDeleteRow, allClients, allInterventionTypes, allRisorse, userRole, isMobileModalMode
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [rowData, setRowData] = useState<DailyPlanningDetailRow>(initialRowData);
  const [clientInputValue, setClientInputValue] = useState('');
  const [risorsaInputValue, setRisorsaInputValue] = useState('');
  const [interventionInputValue, setInterventionInputValue] = useState('');
  const [interventionSearchTerm, setInterventionSearchTerm] = useState<InterventionType | null>(null);


  useEffect(() => {
    setRowData(initialRowData);
    setClientInputValue(initialRowData.selectedClient?.ragioneSociale || '');
    setRisorsaInputValue(initialRowData.risorsaAssegnata?.nome || '');
  }, [initialRowData]);

  const handleFieldChange = useCallback((field: keyof DailyPlanningDetailRow, value: any) => {
    const updatedRow = { ...rowData, [field]: value };
    setRowData(updatedRow);
    onUpdateRow(updatedRow);
  }, [rowData, onUpdateRow]);

  const isRowComplete = useMemo(() => {
    if (userRole === 'SPECIALIST') {
      return rowData.risorsaAssegnata && rowData.selectedClient && rowData.selectedInterventions.length > 0 && rowData.timeSlot;
    }
    return rowData.selectedClient && rowData.selectedInterventions.length > 0 && rowData.timeSlot;
  }, [rowData, userRole]);

  const handleClientChange = (event: any, newValue: Client | null) => handleFieldChange('selectedClient', newValue);
  const handleRisorsaChange = (event: any, newValue: Risorsa | null) => handleFieldChange('risorsaAssegnata', newValue);

  const handleTimeSlotChange = (event: React.MouseEvent<HTMLElement>, newTimeSlot: 'AM' | 'PM' | null) => {
    if (newTimeSlot !== null) {
      handleFieldChange('timeSlot', newTimeSlot as DailyPlanningDetailRow['timeSlot']);
    }
  };

  const handleMaterialToggle = () => {
    handleFieldChange('materialAvailable', !rowData.materialAvailable);
  };

  const handleAddInterventionFromSearch = () => {
    if (!interventionSearchTerm) return;
    handleAddIntervention(interventionSearchTerm);
    setInterventionSearchTerm(null);
    setInterventionInputValue('');
  };

  const handleAddIntervention = (interventionType: InterventionType | null) => {
    if (!interventionType) return;
    const existing = rowData.selectedInterventions.find(si => si.interventionTypeId === interventionType.id);
    if (existing) {
      handleFieldChange('selectedInterventions', rowData.selectedInterventions.map(si =>
        si.interventionTypeId === interventionType.id ? { ...si, quantity: si.quantity + 1 } : si
      ));
    } else {
      handleFieldChange('selectedInterventions', [
        ...rowData.selectedInterventions,
        { interventionTypeId: interventionType.id, interventionTypeName: interventionType.name, quantity: 1 },
      ]);
    }
  };

  const handleUpdateInterventionQuantity = (interventionTypeId: string, quantityStr: string) => {
    const quantity = parseInt(quantityStr, 10);
    const newQuantity = Math.max(1, isNaN(quantity) ? 1 : quantity);
    handleFieldChange('selectedInterventions', rowData.selectedInterventions.map(si =>
      si.interventionTypeId === interventionTypeId ? { ...si, quantity: newQuantity } : si
    ));
  };

  const handleRemoveIntervention = (interventionTypeId: string) => {
    handleFieldChange('selectedInterventions', rowData.selectedInterventions.filter(si => si.interventionTypeId !== interventionTypeId));
  };

  if (isMobileModalMode) {
    return (
      <Box sx={{ pt: 1, pb: 2 }}>
        <Stack spacing={3}>
          {userRole === 'MAGAZZINIERE' && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                // MODIFICA: Aggiunto bordo colorato
                borderLeft: rowData.zohoEventColor ? `5px solid ${rowData.zohoEventColor}` : `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Descrizione Evento (Zoho)</Typography>
              <Typography variant="body2">{rowData.zohoSuggestion || "N/A"}</Typography>
            </Paper>
          )}

          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <PlaylistAddCheckIcon sx={{ mr: 1, color: 'primary.main' }} /> Dettagli Principali
            </Typography>
            <Stack spacing={2}>
              {userRole === 'SPECIALIST' && (
                <Autocomplete
                  options={allRisorse}
                  getOptionLabel={(option) => `${option.nome} (${option.sigla})`}
                  value={rowData.risorsaAssegnata}
                  onChange={handleRisorsaChange}
                  inputValue={risorsaInputValue}
                  onInputChange={(e, val) => setRisorsaInputValue(val)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) =>
                    <TextField {...params} label="Risorsa Assegnata" variant="outlined" size="small"
                      InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><PersonPinIcon /></InputAdornment>) }}
                    />}
                  noOptionsText="Nessuna risorsa"
                />
              )}
              <Autocomplete
                options={allClients}
                getOptionLabel={(option) => option.ragioneSociale}
                value={rowData.selectedClient}
                onChange={handleClientChange}
                inputValue={clientInputValue}
                onInputChange={(e, val) => setClientInputValue(val)}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderInput={(params) => (
                  <TextField {...params} label="Cliente Assegnato" variant="outlined" size="small"
                    InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><BusinessIcon /></InputAdornment>) }}
                  />
                )}
                renderOption={(props, option) => (
                  <ListItem {...props} dense>
                    <ListItemIcon sx={{ minWidth: 32 }}><ApartmentIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={option.ragioneSociale} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                )}
                noOptionsText="Nessun cliente"
                ListboxProps={{ style: { maxHeight: 200 } }}
              />
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ width: '50%' }}>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Fascia Oraria</Typography>
                  <ToggleButtonGroup
                    value={rowData.timeSlot} exclusive onChange={handleTimeSlotChange} aria-label="fascia oraria" fullWidth size="small"
                  >
                    <ToggleButton value="AM" aria-label="mattina" sx={{ flexGrow: 1 }}><WbSunnyOutlinedIcon sx={{ mr: 0.5, fontSize: '1rem' }} />AM</ToggleButton>
                    <ToggleButton value="PM" aria-label="pomeriggio" sx={{ flexGrow: 1 }}><Brightness2OutlinedIcon sx={{ mr: 0.5, fontSize: '1rem' }} />PM</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Box sx={{ width: '50%' }}>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>Materiale</Typography>
                  <Tooltip title={rowData.materialAvailable ? "Materiale disponibile" : "Materiale da verificare"}>
                    <Chip
                      icon={rowData.materialAvailable ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />}
                      label={rowData.materialAvailable ? "OK" : "Verifica"}
                      clickable onClick={handleMaterialToggle}
                      color={rowData.materialAvailable ? "success" : "warning"}
                      variant="filled"
                      sx={{
                        color: 'common.white', fontWeight: 500, width: '100%', height: 40,
                        backgroundColor: rowData.materialAvailable ? theme.palette.success.dark : theme.palette.warning.main,
                        '& .MuiChip-icon': { color: 'common.white', ml: '8px' },
                        '& .MuiChip-label': { flexGrow: 1, textAlign: 'center', pr: '8px' }
                      }}
                    />
                  </Tooltip>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <NotesIcon sx={{ mr: 1, color: 'primary.main' }} /> Note Addizionali
            </Typography>
            <TextField
              label="Note" value={rowData.notes} onChange={(e) => handleFieldChange('notes', e.target.value)}
              multiline rows={3} fullWidth variant="outlined" size="small" placeholder="Dettagli, istruzioni, promemoria..."
            />
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <BuildIcon sx={{ mr: 1, color: 'primary.main' }} /> Gestione Interventi
            </Typography>
            <Stack direction="row" spacing={1} alignItems="flex-start" mb={2}>
              <Autocomplete
                fullWidth
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
                  <TextField {...params} label="Cerca intervento" variant="outlined" size="small"
                    InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
                  />}
                noOptionsText="Nessun intervento"
                ListboxProps={{ style: { maxHeight: 160 } }}
              />
              <Button
                variant="contained"
                onClick={handleAddInterventionFromSearch}
                disabled={!interventionSearchTerm}
                sx={{ height: '40px', whiteSpace: 'nowrap' }}
                startIcon={<AddCircleOutlineIcon />}
              >
                Aggiungi
              </Button>
            </Stack>

            {rowData.selectedInterventions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                Nessun intervento assegnato.
              </Typography>
            ) : (
              <List dense disablePadding sx={{ maxHeight: 200, overflowY: 'auto', backgroundColor: alpha(theme.palette.grey[500], 0.04), borderRadius: 1, p: 0.5 }}>
                {rowData.selectedInterventions.map((intervention) => (
                  <ListItem key={intervention.interventionTypeId} disableGutters sx={{ py: 0.5, px: 1, display: 'flex', alignItems: 'center', '&:not(:last-child)': { borderBottom: `1px solid ${theme.palette.divider}` } }}>
                    <TextField
                      type="number" value={intervention.quantity}
                      onChange={(e) => handleUpdateInterventionQuantity(intervention.interventionTypeId, e.target.value)}
                      sx={{ width: 60, mr: 1.5 }} InputProps={{ inputProps: { min: 1, style: { textAlign: 'center' } } }}
                      size="small" variant="outlined"
                    />
                    <ListItemText primary={intervention.interventionTypeName} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} sx={{ flexGrow: 1, mr: 1 }} />
                    <Tooltip title="Rimuovi Intervento">
                      <IconButton onClick={() => handleRemoveIntervention(intervention.interventionTypeId)} size="small" sx={{ opacity: 0.7, '&:hover': { opacity: 1, color: 'error.main' } }}>
                        <ClearIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, mt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button onClick={() => onDeleteRow(rowData.id)} color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} sx={{ width: '80%', maxWidth: '300px' }}>
              Elimina Attività
            </Button>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <React.Fragment>
      <TableRow
        hover
        onClick={() => setOpen(!open)}
        selected={open}
        sx={{
          cursor: 'pointer',
          '& > td': { borderBottom: open ? 'none' : `1px solid ${alpha(theme.palette.common.black, 0.07)}` },
          '&:last-child > td': { borderBottom: open ? 'none' : 0 }
        }}
      >
        <TableCell sx={{ width: 50 }}>
          <IconButton size="small" aria-label="expand row">{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
        </TableCell>

        {userRole === 'SPECIALIST' && (
          <TableCell sx={{ minWidth: 90, fontWeight: 500 }}>
            {rowData.risorsaAssegnata ? (
              <Chip icon={<PersonPinIcon />} label={rowData.risorsaAssegnata.sigla} size="small" color="secondary" variant="filled" sx={{ backgroundColor: 'secondary.dark', color: 'common.white' }} />
            ) : (
              <Chip label="N/D" size="small" variant="outlined" />
            )}
          </TableCell>
        )}

        <TableCell component="th" scope="row" sx={{ maxWidth: { xs: 150, sm: 230 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {rowData.zohoEventColor && (
              <Tooltip title="Colore Evento Zoho">
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: rowData.zohoEventColor,
                  flexShrink: 0,
                  border: `1px solid ${alpha(theme.palette.common.black, 0.1)}`
                }} />
              </Tooltip>
            )}
            <Tooltip title={rowData.zohoSuggestion} placement="top-start">
              <Typography variant="body2" noWrap fontWeight="500" color="text.primary">
                {rowData.zohoSuggestion}
              </Typography>
            </Tooltip>
          </Box>
        </TableCell>
        <TableCell sx={{ minWidth: 180 }}>
          {rowData.selectedClient ? (
            <Chip icon={<ApartmentIcon />} label={rowData.selectedClient.ragioneSociale} size="small" variant="outlined" color="info" sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1), borderColor: theme.palette.info.dark, color: theme.palette.info.dark }} />
          ) : (
            <Chip icon={<EditIcon />} label="Nessun Cliente" size="small" variant="outlined" color="warning" sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1), borderColor: theme.palette.warning.dark, color: theme.palette.warning.dark }} />
          )}
        </TableCell>
        <TableCell align="center" sx={{ minWidth: 110 }}>
          <Chip
            icon={<BuildIcon />}
            label={`${rowData.selectedInterventions.length} Interv.`}
            size="small"
            color={rowData.selectedInterventions.length > 0 ? "primary" : "default"}
            variant={rowData.selectedInterventions.length > 0 ? "filled" : "outlined"}
            sx={rowData.selectedInterventions.length > 0 ? { backgroundColor: 'primary.dark', color: 'common.white' } : { borderColor: alpha(theme.palette.common.black, 0.23) }}
          />
        </TableCell>
        <TableCell align="center" sx={{ minWidth: 130 }}>
          {isRowComplete ? (
            <Chip icon={<CheckCircleOutlineIcon />} label="Completa" color="success" size="small" variant='filled' sx={{ backgroundColor: 'success.dark', color: 'common.white' }} />
          ) : (
            <Chip icon={<ErrorOutlineIcon />} label="Da Completare" color="warning" size="small" variant='outlined' sx={{ borderColor: 'warning.dark', color: 'warning.dark', fontWeight: 500, backgroundColor: alpha(theme.palette.warning.main, 0.1) }} />
          )}
        </TableCell>
        <TableCell align="right" sx={{ width: 70 }}>
          <Tooltip title="Elimina Riga">
            <IconButton onClick={(e) => { e.stopPropagation(); onDeleteRow(rowData.id); }} color="error" size="small" sx={{ '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.08) } }}>
              <DeleteOutlineIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow selected={open}>
        <TableCell style={{ padding: 0, borderBottom: open ? `3px solid ${theme.palette.primary.main}` : 'none' }} colSpan={userRole === 'SPECIALIST' ? 7 : 6}>
          <Collapse in={open} timeout={300} unmountOnExit>
            <Box sx={{ p: { xs: 2, md: 2.5 }, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" sx={{ color: 'primary.dark', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                  <PlaylistAddCheckIcon sx={{ mr: 1.2, fontSize: '1.75rem' }} /> Dettagli Riga
                </Typography>
                <Chip label={userRole} size="small" icon={userRole === 'MAGAZZINIERE' ? <WarehouseIcon /> : <EngineeringIcon />} sx={{ backgroundColor: userRole === 'MAGAZZINIERE' ? 'info.main' : 'secondary.main', color: 'common.white' }} />
              </Box>

              <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.common.black, 0.12)}` }}>
                <Stack spacing={2.5}>
                  {userRole === 'MAGAZZINIERE' && (
                    <TextField
                      label="Descrizione Evento (Zoho)"
                      value={rowData.zohoSuggestion}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (<InputAdornment position="start"><InfoOutlinedIcon color="action" /></InputAdornment>)
                      }}
                      variant="filled"
                      multiline
                      fullWidth
                      helperText="Campo informativo da Zoho Calendar."
                      sx={{
                        borderLeft: rowData.zohoEventColor ? `4px solid ${rowData.zohoEventColor}` : 'none',
                        pl: 1,
                        '& .MuiFilledInput-root': {
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0
                        }
                      }}
                    />
                  )}
                  {userRole === 'SPECIALIST' && (
                    <Autocomplete
                      options={allRisorse}
                      getOptionLabel={(option) => `${option.nome} (${option.sigla})`}
                      value={rowData.risorsaAssegnata}
                      onChange={handleRisorsaChange}
                      inputValue={risorsaInputValue}
                      onInputChange={(e, val) => setRisorsaInputValue(val)}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      renderInput={(params) => <TextField {...params} label="Risorsa Assegnata (AG/PS/PM)" variant="outlined" InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><PersonPinIcon color="primary" /></InputAdornment>) }} />}
                      noOptionsText="Nessuna risorsa trovata"
                    />
                  )}

                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' } }}>
                    <Box sx={{ width: '100%', flexGrow: { md: 1 }, minWidth: { md: '300px' } }}>
                      <Autocomplete
                        options={allClients}
                        getOptionLabel={(option) => option.ragioneSociale}
                        value={rowData.selectedClient}
                        onChange={handleClientChange}
                        inputValue={clientInputValue}
                        onInputChange={(e, val) => setClientInputValue(val)}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        renderInput={(params) => (
                          <TextField {...params} label="Cliente Assegnato" variant="outlined"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (<InputAdornment position="start"><BusinessIcon color="action" /></InputAdornment>)
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <ListItem {...props} dense>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <ApartmentIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={option.ragioneSociale} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        )}
                        noOptionsText="Nessun cliente trovato"
                        ListboxProps={{ style: { maxHeight: 200 } }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, pt: { xs: 1, md: 0 } }}>
                      <ToggleButtonGroup
                        value={rowData.timeSlot}
                        exclusive
                        onChange={handleTimeSlotChange}
                        aria-label="fascia oraria"
                      >
                        <ToggleButton value="AM" aria-label="mattina">
                          <WbSunnyOutlinedIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> AM
                        </ToggleButton>
                        <ToggleButton value="PM" aria-label="pomeriggio">
                          <Brightness2OutlinedIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> PM
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, pt: { xs: 1, md: 0 } }}>
                      <Tooltip title={rowData.materialAvailable ? "Materiale disponibile (Clicca per cambiare)" : "Materiale mancante (Clicca per cambiare)"}>
                        <Chip
                          icon={rowData.materialAvailable ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />}
                          label={rowData.materialAvailable ? "Materiale OK" : "Verifica Materiale."}
                          clickable
                          onClick={handleMaterialToggle}
                          color={rowData.materialAvailable ? "success" : "warning"}
                          variant="filled"
                          sx={{
                            color: 'common.white',
                            fontWeight: 500,
                            backgroundColor: rowData.materialAvailable ? theme.palette.success.dark : theme.palette.warning.main,
                            '& .MuiChip-icon': { color: 'common.white' },
                            minWidth: 130,
                          }}
                        />
                      </Tooltip>
                    </Box>
                  </Box>

                  <TextField label="Note Addizionali" value={rowData.notes} onChange={(e) => handleFieldChange('notes', e.target.value)} multiline rows={3} fullWidth variant="outlined" placeholder="Aggiungi dettagli, istruzioni o promemoria..." InputProps={{ startAdornment: (<InputAdornment position="start"><NotesIcon color="action" /></InputAdornment>) }} />

                  <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 1.5, borderColor: alpha(theme.palette.common.black, 0.15) }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: '1.1rem' }}>
                      <BuildIcon sx={{ mr: 1, fontSize: '1.4rem', color: 'primary.main' }} /> Gestione Interventi
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="stretch" mb={2}>
                      <Autocomplete
                        fullWidth
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
                        renderInput={(params) => <TextField {...params} label="Cerca intervento" variant="outlined" InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }} />}
                        sx={{ flexGrow: 1 }}
                        noOptionsText="Nessun intervento trovato"
                        ListboxProps={{ style: { maxHeight: 160 } }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddInterventionFromSearch}
                        disabled={!interventionSearchTerm}
                        startIcon={<AddCircleOutlineIcon />}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        Aggiungi
                      </Button>
                    </Stack>
                    {rowData.selectedInterventions.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1.5, fontStyle: 'italic' }}>Nessun intervento assegnato.</Typography>
                    ) : (
                      <List dense disablePadding sx={{ maxHeight: 180, overflowY: 'auto', pr: 0.5, backgroundColor: alpha(theme.palette.grey[500], 0.04), borderRadius: 1 }}>
                        {rowData.selectedInterventions.map((intervention) => (
                          <React.Fragment key={intervention.interventionTypeId}>
                            <ListItem disableGutters sx={{ py: 0.8, px: 1, display: 'flex', alignItems: 'center', '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.6) }, borderRadius: 1 }}>
                              <TextField type="number" value={intervention.quantity} onChange={(e) => handleUpdateInterventionQuantity(intervention.interventionTypeId, e.target.value)} sx={{ width: 65, mr: 1.5 }} InputProps={{ inputProps: { min: 1, style: { textAlign: 'center' } } }} size="small" variant="outlined" />
                              <ListItemText primary={intervention.interventionTypeName} primaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'text.primary', noWrap: true }} sx={{ flexGrow: 1, mr: 1, overflow: 'hidden' }} />
                              <Tooltip title="Rimuovi Intervento">
                                <IconButton edge="end" onClick={() => handleRemoveIntervention(intervention.interventionTypeId)} size="small" color="inherit" sx={{ opacity: 0.65, '&:hover': { opacity: 1, color: 'error.dark', backgroundColor: alpha(theme.palette.error.main, 0.05) } }}> <ClearIcon fontSize='small' /> </IconButton>
                              </Tooltip>
                            </ListItem>
                            {rowData.selectedInterventions.indexOf(intervention) < rowData.selectedInterventions.length - 1 && <Divider component="li" light />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Paper>
                </Stack>
              </Paper>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default CollapsibleTableRow;