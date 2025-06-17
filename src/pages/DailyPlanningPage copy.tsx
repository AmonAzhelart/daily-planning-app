import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  Tooltip,
  alpha,
  useTheme,
  Stack,
  Menu,
  MenuItem,
  useMediaQuery,
  Divider, 
  CircularProgress,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ViewListIcon from '@mui/icons-material/ViewList'; // Icon for subheader
import { useNavigate } from 'react-router-dom';

// Redux imports
// Assicurati di avere 'react-redux' installato nel tuo progetto React:
// npm install react-redux @reduxjs/toolkit
import { useSelector } from 'react-redux';
import { RootState } from '../store/store'; // Adjust path as needed

// Importa il custom hook e i suoi tipi dal file dedicato
// Assicurati che il percorso sia corretto in base alla tua struttura di progetto
import { useDailyPlanningApi, DPTesta, DPStatus } from '../customHook/api'; 
import { useAuth } from '../context/AuthContenxt';

// Definizione del tipo DailyPlanningSummary, ora allineata con DPTesta dal backend
interface DailyPlanningSummary {
  id: number; 
  giorno: string; 
  stato: DPStatus;
  revisione: number; 
  isLocked: boolean; // Specifica per il frontend, derivata dallo stato del backend
}

const ITEMS_PER_PAGE_MOBILE_INITIAL = 4;
const ITEMS_PER_LOAD_MOBILE = 4;
const SUBHEADER_HEIGHT = 50; // Altezza approssimativa del subheader

// Funzione di utilità per ottenere lo stile del chip di stato
const getStatusChipStyle = (status: DPStatus, theme: any, isMobileCard?: boolean) => {
  const isChiuso = status === 'CHIUSO' || status === 'MODIFICATO';
  return {
    backgroundColor: alpha(isChiuso ? theme.palette.success.main : theme.palette.warning.main, 0.15),
    color: isChiuso ? theme.palette.success.dark : theme.palette.warning.dark,
    fontWeight: 600,
    borderRadius: '16px',
    padding: isMobileCard ? '3px 8px' : '4px 10px',
    height: 'auto',
    '& .MuiChip-icon': { 
        color: isChiuso ? theme.palette.success.dark : theme.palette.warning.dark,
        marginLeft: '5px',
        marginRight: '-3px',
        fontSize: isMobileCard? '0.8rem' : '0.9rem',
    },
    textTransform: 'uppercase',
    fontSize: isMobileCard? '0.65rem' : '0.7rem',
    letterSpacing: '0.4px',
  };
};

const DailyPlanningPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [visibleItemsCount, setVisibleItemsCount] = useState(ITEMS_PER_PAGE_MOBILE_INITIAL);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true); // Stato per il caricamento iniziale
  const [apiError, setApiError] = useState<string | null>(null); // Stato per gli errori API

  const navigate = useNavigate();
  //const currentUserRole = useSelector((state: RootState) => state.user.userInfo?.role.name); 
  const { user } = useAuth();
  const currentUserRole = user?.role?.name ?? '';
  const [plannings, setPlannings] = useState<DailyPlanningSummary[]>([]);
  const [anchorElCreateDp, setAnchorElCreateDp] = React.useState<null | HTMLElement>(null);
  const openCreateDpMenu = Boolean(anchorElCreateDp);

  const loadMoreSentinelRef = useRef<HTMLDivElement>(null); 

  // Destruttura le funzioni e gli stati di caricamento/errore dal custom hook
  const { loading, error, getAllDPTesta, createDPTesta, updateDPTesta } = useDailyPlanningApi();

  const handleClickCreateDpMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElCreateDp(event.currentTarget);
  };
  const handleCloseCreateDpMenu = () => {
    setAnchorElCreateDp(null);
  };

  // Recupera i planning dal backend al mount del componente
  useEffect(() => {
    const fetchPlannings = async () => {
      setLoadingInitialData(true);
      setApiError(null);
      try {
        // getAllDPTesta recupera tutte le testate dei planning
        const fetchedPlanningsBackend: DPTesta[] = await getAllDPTesta();
        
        // Mappa i dati del backend al tipo DailyPlanningSummary del frontend
        const processedPlannings: DailyPlanningSummary[] = fetchedPlanningsBackend.map(
          (dp: DPTesta) => ({
            id: dp.id,
            giorno: dp.giorno,
            stato: dp.stato,
            revisione: dp.revisione,
            isLocked: dp.stato === 'CHIUSO' || dp.stato === 'MODIFICATO', // Determina isLocked dallo stato del backend
          })
        ).sort((a, b) => new Date(b.giorno).getTime() - new Date(a.giorno).getTime() || (a.isLocked ? 1 : -1) - (b.isLocked ? 1 : -1) );
        
        setPlannings(processedPlannings);
      } catch (err: any) {
        console.error("Errore nel recupero dei daily plannings:", err);
        setApiError(err.message || "Impossibile recuperare i daily plannings.");
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchPlannings();
  }, [getAllDPTesta]); // Dipendenza: riesegui se getAllDPTesta cambia


  useEffect(() => {
    if (isMobile) {
      setVisibleItemsCount(ITEMS_PER_PAGE_MOBILE_INITIAL);
    } else {
      setRowsPerPage(5); 
    }
  }, [isMobile]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || visibleItemsCount >= plannings.length) return; 

    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleItemsCount(prevCount => Math.min(prevCount + ITEMS_PER_LOAD_MOBILE, plannings.length));
      setIsLoadingMore(false);
    }, 700); 
  }, [isLoadingMore, visibleItemsCount, plannings.length]);


  useEffect(() => {
    if (!isMobile || !loadMoreSentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 1.0 } 
    );

    observer.observe(loadMoreSentinelRef.current);

    return () => { 
      if (loadMoreSentinelRef.current) {
        observer.unobserve(loadMoreSentinelRef.current);
      }
    };
  }, [isMobile, handleLoadMore]); 


  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateNewDP = async (dateOffset: number) => {
    handleCloseCreateDpMenu();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dateOffset);
    const dateString = targetDate.toISOString().split('T')[0];

    try {
        const newDpTesta = await createDPTesta({
            giorno: dateString,
            stato: 'NUOVO', // Il nuovo planning inizia come NUOVO
            revisione: 1,
            createdby: currentUserRole, // Usa il ruolo o l'ID dell'utente corrente
            modifiedby: currentUserRole,
        });
        navigate(`/daily-planning/form?id=${newDpTesta.id}`); // Naviga al form usando il nuovo ID
    } catch (err: any) {
        console.error("Errore nella creazione del nuovo DP:", err);
        setApiError(err.message || "Impossibile creare un nuovo daily planning.");
        alert(`Errore nella creazione del DP: ${err.message}`);
    }
  };

  const handleOpenDP = (dpId: number) => navigate(`/daily-planning/form?id=${dpId}`); // L'ID è un numero ora

  const handleToggleLock = async (dpId: number, currentStatus: DPStatus, currentRevision: number) => {
    setApiError(null);
    let newStatus: DPStatus;
    let newRevision: number;

    if (currentStatus === 'CHIUSO' || currentStatus === 'MODIFICATO') {
      // Tentativo di sbloccare
      if (currentUserRole !== 'SPECIALIST') {
        alert("Solo gli Specialisti possono sbloccare un planning chiuso.");
        return;
      }
      newStatus = 'APERTO';
      newRevision = currentRevision + 1; // Incrementa la revisione al cambio di stato
    } else {
      // Tentativo di chiudere
      newStatus = 'CHIUSO';
      newRevision = currentRevision + 1; // Incrementa la revisione al cambio di stato
    }

    try {
      await updateDPTesta(dpId, {
        stato: newStatus,
        revisione: newRevision,
        modifiedby: currentUserRole, // Assumendo che il ruolo dell'utente corrente sia il modificatore
      });

      // Aggiorna lo stato locale per riflettere il cambiamento
      setPlannings(prevPlannings =>
        prevPlannings.map(dp =>
          dp.id === dpId
            ? { ...dp, stato: newStatus, revisione: newRevision, isLocked: (newStatus === 'CHIUSO' ) as boolean }
            : dp
        ).sort((a, b) => new Date(b.giorno).getTime() - new Date(a.giorno).getTime() || (a.isLocked ? 1 : -1) - (b.isLocked ? 1 : -1) )
      );
    } catch (err: any) {
      console.error("Errore nel cambio stato di blocco del DP:", err);
      setApiError(err.message || "Impossibile aggiornare lo stato del DP.");
      alert(`Errore nell'aggiornamento dello stato del DP: ${err.message}`);
    }
  };
  
  const canEdit = (dp: DailyPlanningSummary) => dp.stato === 'APERTO' || (dp.stato === 'CHIUSO' && currentUserRole === 'SPECIALIST');

  const createDpButtons = (
    <Stack direction="row" spacing={isSmallMobile ? 0.5 : 1} alignItems="center">
      {isSmallMobile ? (
        <>
          <Button id="create-dp-button-mobile" aria-controls={openCreateDpMenu ? 'create-dp-menu-mobile' : undefined} aria-haspopup="true" aria-expanded={openCreateDpMenu ? 'true' : undefined} variant="contained" size="medium" onClick={handleClickCreateDpMenu} sx={{minWidth: 'auto', padding: '6px 10px'}}>
            <AddCircleOutlineIcon sx={{fontSize: '1.25rem'}}/>
            <Typography variant="button" sx={{ml: 0.5, display: {xs: 'none', sm: 'inline'}}}>Nuovo</Typography>
          </Button>
          <Menu id="create-dp-menu-mobile" anchorEl={anchorElCreateDp} open={openCreateDpMenu} onClose={handleCloseCreateDpMenu} MenuListProps={{'aria-labelledby': 'create-dp-button-mobile'}}>
            <MenuItem onClick={() => handleCreateNewDP(1)}>Domani</MenuItem>
            <MenuItem onClick={() => handleCreateNewDP(2)}>Dopodomani</MenuItem>
            <MenuItem onClick={() => handleCreateNewDP(3)}>Giorno+3</MenuItem>
          </Menu>
        </>
      ) : (
        <>
          <Button variant="contained" size="medium" startIcon={<AddCircleOutlineIcon />} onClick={() => handleCreateNewDP(1)}>Domani</Button>
          <Button variant="contained" size="medium" startIcon={<AddCircleOutlineIcon />} onClick={() => handleCreateNewDP(2)}>Dopodomani</Button>
          <Button variant="contained" size="medium" startIcon={<AddCircleOutlineIcon />} onClick={() => handleCreateNewDP(3)}>Giorno+3</Button>
        </>
      )}
    </Stack>
  );

  const renderPlanningItemCard = (dp: DailyPlanningSummary) => {
    const userCanEditThisDP = canEdit(dp);
    const isDisabledLockAction = (dp.stato === 'CHIUSO' || dp.stato === 'MODIFICATO') && currentUserRole !== 'SPECIALIST';
    return (
        <Paper 
            key={dp.id} 
            elevation={1}
            sx={{ 
                p: 1.5, 
                mb: 1.5, 
                borderRadius: '10px', 
                borderLeft: `4px solid ${dp.isLocked ? theme.palette.success.main : theme.palette.warning.main}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': { boxShadow: theme.shadows[4] },
                backgroundColor: dp.isLocked ? alpha(theme.palette.grey[500], 0.015) : theme.palette.background.paper,
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Chip
                        icon={<FiberManualRecordIcon/>}
                        label={dp.stato}
                        size="small"
                        sx={getStatusChipStyle(dp.stato, theme, true)}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{fontSize: '0.7rem'}}>
                        Rev: {dp.revisione}
                    </Typography>
                </Box>
                
                <Typography variant="subtitle1" component="div" fontWeight="500" color="text.primary" sx={{lineHeight: 1.3}}>
                    {new Date(dp.giorno).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Typography>

                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{width: '100%', mt: 1}}>
                    <Tooltip title={dp.isLocked ? "Sblocca" : "Chiudi"} placement="top">
                        <span>
                            <IconButton
                                size="small"
                                onClick={() => handleToggleLock(dp.id, dp.stato, dp.revisione)}
                                disabled={isDisabledLockAction || loading} // Disable if API call is in progress
                                sx={{ 
                                    color: isDisabledLockAction ? theme.palette.action.disabled : (dp.isLocked ? theme.palette.success.dark : theme.palette.warning.dark),
                                    border: `1px solid ${alpha(isDisabledLockAction ? theme.palette.action.disabled : (dp.isLocked ? theme.palette.success.main : theme.palette.warning.main), 0.3)}`,
                                    borderRadius: '6px',
                                    padding: '4px',
                                    '&:hover': { backgroundColor: alpha(dp.isLocked ? theme.palette.success.main : theme.palette.warning.main, 0.08) },
                                }}
                            >
                                {dp.isLocked ? <LockIcon sx={{fontSize: '1.1rem'}} /> : <LockOpenIcon sx={{fontSize: '1.1rem'}} />}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        size="small"
                        color={userCanEditThisDP ? "primary" : "inherit"}
                        startIcon={userCanEditThisDP ? <OpenInNewIcon sx={{fontSize: '1.1rem'}}/> : <VisibilityIcon sx={{fontSize: '1.1rem'}}/>}
                        onClick={() => handleOpenDP(dp.id)}
                        sx={{
                            minWidth: 80,
                            fontWeight: 500,
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            borderColor: userCanEditThisDP ? theme.palette.primary.light : theme.palette.grey[400],
                            color: userCanEditThisDP ? theme.palette.primary.main : theme.palette.text.secondary,
                             '&:hover': {
                                backgroundColor: alpha(userCanEditThisDP ? theme.palette.primary.main : theme.palette.grey[500], 0.04),
                            }
                        }}
                    >
                        {userCanEditThisDP ? "Apri" : "Vedi"}
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );
  };


  return (
    <>
      <AppBar position="sticky" sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[2], 
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.appBar, // Ensure AppBar is above other content
      }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 1.5, px: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <EventIcon sx={{ mr: 1.5, fontSize: {xs: '2rem', sm: '2.25rem'}, color: 'primary.main' }} />
              <Typography variant={isSmallMobile ? "h6" : "h5"} component="h1" sx={{ fontWeight: 700 }}>
                Daily Planning 
              </Typography>
            </Box>
                {!isMobile && createDpButtons}
            
          </Toolbar>
        </Container>
      </AppBar>

      {/* Sticky Subheader */}
      {isMobile && (
      <Paper 
        elevation={1} 
        square 
        sx={{ 
            position: 'sticky', 
            top: isSmallMobile? 56 : 64, // Adjust based on AppBar height (56px mobile, 64px desktop default)
            zIndex: theme.zIndex.appBar -1, // Below main AppBar
            backgroundColor: alpha(theme.palette.background.default, 0.95),
            backdropFilter: 'blur(8px)',
            py: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            height: `${SUBHEADER_HEIGHT}px`,
            display: 'flex',
            alignItems: 'center'
        }}
      >
      
          
        <Container maxWidth="xl" sx={{px: { xs: 1.5, sm: 2 } }}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                  <ViewListIcon sx={{mr:1, color: theme.palette.text.secondary, fontSize: isSmallMobile ? '1.25rem' : '1.5rem'}}/>
                  <Typography variant={isSmallMobile? "subtitle1" : "h6"} fontWeight={isSmallMobile? 500 : 600} color="text.secondary">
                      Elenco Daily Plannings
                  </Typography>
                </Box>
                {createDpButtons}
            </Box>
        </Container>
        
      </Paper>
      )}


      <Container 
        maxWidth="xl" 
        sx={{ 
            py: {xs: 2, sm: 3}, 
            // paddingTop adjusted to account for AppBar + Subheader
            // This ensures content starts below the sticky subheader.
            // No direct 'top' or 'marginTop' needed here if Container is not positioned absolutely/fixed.
        }}
      >
        {(loadingInitialData || loading) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="h6" color="text.secondary" sx={{ ml: 2 }}>
                    {loadingInitialData ? "Caricamento planning..." : "Operazione in corso..."}
                </Typography>
            </Box>
        )}
        {apiError && (
            <Paper elevation={0} sx={{ p: 2, mt: 2, backgroundColor: theme.palette.error.light, color: theme.palette.error.contrastText, borderRadius: 2 }}>
                <Typography variant="body1" fontWeight="bold">Errore:</Typography>
                <Typography variant="body2">{apiError}</Typography>
            </Paper>
        )}

        {!loadingInitialData && !apiError && plannings.length === 0 ? (
             <Paper elevation={0} sx={{ textAlign: 'center', p: {xs: 3, sm: 5}, borderRadius: 2, backgroundColor: alpha(theme.palette.grey[200], 0.3), mt: 2 }}>
                <EventIcon sx={{ fontSize: {xs: 54, sm: 72}, color: theme.palette.grey[400], mb: 2.5 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom sx={{fontWeight: 500}}>
                    Nessun planning trovato
                </Typography>
                <Typography variant="body1" color="text.disabled" sx={{ mb: 3.5, maxWidth: 400, margin: 'auto' }}>
                    Sembra non ci siano daily plannings. Inizia creandone uno per domani.
                </Typography>
                <Button variant="contained" size="large" startIcon={<AddCircleOutlineIcon />} onClick={() => handleCreateNewDP(1)}>
                    Crea DP Domani
                </Button>
            </Paper>
        ) : (
        <>
            {isMobile ? (
                <Box>
                    {plannings.slice(0, visibleItemsCount).map((dp) => renderPlanningItemCard(dp))}
                    {visibleItemsCount < plannings.length && (
                        <Box ref={loadMoreSentinelRef} sx={{ height: 10, textAlign: 'center', mt:1 }}>
                           {isLoadingMore && <CircularProgress size={24} />}
                        </Box>
                    )}
                </Box>
            ) : ( 
                <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }} aria-label="daily plannings table">
                        <TableHead>
                            <TableRow sx={{ '& th': { 
                                fontWeight: '600', 
                                color: theme.palette.text.secondary, 
                                backgroundColor: alpha(theme.palette.grey[500], 0.04),
                                py: 1.25, 
                                borderBottom: `2px solid ${theme.palette.divider}`, 
                                fontSize: '0.875rem',
                                px: 2 
                            }}}>
                            <TableCell sx={{ pl: 3, width: '15%' }}>Stato</TableCell>
                            <TableCell sx={{ width: '40%' }}>Data Planning</TableCell>
                            <TableCell align="right" sx={{ width: '15%' }}>Revisione</TableCell>
                            <TableCell align="center" sx={{minWidth: 180, pr: 3, width: '30%'}}>Azioni</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(rowsPerPage > 0
                            ? plannings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            : plannings
                            ).map((dp) => {
                            const userCanEditThisDP = canEdit(dp);
                            const isDisabledLockAction = (dp.stato === 'CHIUSO' || dp.stato === 'MODIFICATO') && currentUserRole !== 'SPECIALIST';

                            return (
                                <TableRow hover key={dp.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background-color 0.15s ease-in-out', backgroundColor: (dp.stato === 'CHIUSO' || dp.stato === 'MODIFICATO') ? alpha(theme.palette.grey[500], 0.02) : 'transparent' }}>
                                <TableCell sx={{ pl: 3, py: 1.5 }}>
                                    <Chip icon={<FiberManualRecordIcon/>} label={dp.stato} size="small" sx={getStatusChipStyle(dp.stato, theme)}/>
                                </TableCell>
                                <TableCell component="th" scope="row" sx={{ py: 1.5 }}>
                                    <Typography variant="subtitle1" component="div" fontWeight="500" color="text.primary">
                                    {new Date(dp.giorno).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 1.5 }}>
                                    <Typography variant="body1" color="text.secondary">{dp.revisione}</Typography>
                                </TableCell>
                                <TableCell align="center" sx={{ py: 1, pr: 3 }}>
                                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                    <Tooltip title={dp.isLocked ? "Sblocca Planning" : "Chiudi Planning"} placement="top">
                                        <span>
                                        <IconButton 
                                            size="medium" 
                                            onClick={() => handleToggleLock(dp.id, dp.stato, dp.revisione)} 
                                            disabled={isDisabledLockAction || loading} // Disabilita se la chiamata API è in corso
                                            sx={{ 
                                                color: isDisabledLockAction ? theme.palette.action.disabled : (dp.isLocked ? theme.palette.success.dark : theme.palette.warning.dark), 
                                                '&:hover': { backgroundColor: alpha(dp.isLocked ? theme.palette.success.main : theme.palette.warning.main, 0.1)}
                                            }}
                                        >
                                            {dp.isLocked ? <LockIcon /> : <LockOpenIcon />}
                                        </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Button variant="outlined" size="medium" color={userCanEditThisDP ? "primary" : "inherit"} startIcon={userCanEditThisDP ? <OpenInNewIcon /> : <VisibilityIcon />} onClick={() => handleOpenDP(dp.id)} sx={{ minWidth: 100, fontWeight: 500, textTransform: 'none', borderColor: userCanEditThisDP ? theme.palette.primary.light : theme.palette.grey[400], color: userCanEditThisDP ? theme.palette.primary.main : theme.palette.text.secondary, '&:hover': {backgroundColor: alpha(userCanEditThisDP ? theme.palette.primary.main : theme.palette.grey[500], 0.04), borderColor: userCanEditThisDP ? theme.palette.primary.main : theme.palette.grey[500]}}}>
                                        {userCanEditThisDP ? "Apri" : "Vedi"}
                                    </Button>
                                    </Stack>
                                </TableCell>
                                </TableRow>
                            );
                            })}
                            {page > 0 && !isMobile && plannings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length === 0 && (
                                <TableRow style={{ height: 73 * rowsPerPage }}><TableCell colSpan={4} /></TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {!isMobile && plannings.length > 0 && (
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, { label: 'Tutti', value: -1 }]}
                    component="div"
                    count={plannings.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Righe:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} di ${count}`}
                    sx={{ 
                        mt: 2,
                        borderTop: `1px solid ${theme.palette.divider}`, 
                        backgroundColor: alpha(theme.palette.grey[500], 0.02),
                        '.MuiTablePagination-toolbar': { px: 2 },
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.8rem'},
                        '.MuiTablePagination-actions': { ml: 2}
                    }}
                />
            )}
        </>
        )}
      </Container>
    </>
  );
}

export default DailyPlanningPage;
