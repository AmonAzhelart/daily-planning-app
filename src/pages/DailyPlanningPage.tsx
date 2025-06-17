import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// MUI Imports
import {
    Container, Typography, Paper, Box, Button, Chip, IconButton, AppBar,
    Toolbar, Tooltip, alpha, useTheme, Grid, Skeleton, Alert,
    Stack, Fade, Drawer
} from '@mui/material';

// MUI Icon Imports
import {
    Event as EventIcon, Add as AddIcon, FiberManualRecord as FiberManualRecordIcon,
    ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Create as CreateIcon,
    Edit as EditIcon, ArrowForward as ArrowForwardIcon, Lock as LockIcon,
    LockOpen as LockOpenIcon, Close as CloseIcon
} from '@mui/icons-material';

import { useDailyPlanningApi, DPTesta, DPStatus, UserInfo } from '../customHook/api';

// --- Import del form e del nuovo tipo per il Ref ---
import DailyPlanningForm, { DailyPlanningFormRef } from '../components/DailyPlanning/DailyPlanningForm';
import { useAuth } from '../context/AuthContenxt';

// #region Type Definitions
interface DailyPlanningSummary {
  id: number;
  giorno: string;
  stato: DPStatus;
  revisione: number;
  isLocked: boolean;
  createdby: string;
  created_at: string;
  modifiedby: string;
  modified_at: string;
}

interface CalendarDayData {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
}
// #endregion

// #region Helper Functions
const getStatusColors = (status: DPStatus, theme: any): { main: string, background: string } => {
    const styles: { [key in DPStatus]?: { main: string, background: string } } = {
        'NUOVO': { main: theme.palette.info.dark, background: theme.palette.info.light },
        'APERTO': { main: theme.palette.warning.dark, background: theme.palette.warning.light },
        'MODIFICATO': { main: theme.palette.secondary.dark, background: theme.palette.secondary.light },
        'CHIUSO': { main: theme.palette.success.dark, background: theme.palette.success.light },
    };
    return styles[status] || styles['APERTO']!;
};

const toLocalISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const generateCalendarDays = (dateInMonth: Date): CalendarDayData[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = dateInMonth.getFullYear();
    const month = dateInMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days: CalendarDayData[] = [];

    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysToPad = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = daysToPad; i > 0; i--) {
        const date = new Date(firstDayOfMonth);
        date.setDate(date.getDate() - i);
        days.push({ date, isCurrentMonth: false, isToday: date.getTime() === today.getTime() });
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const date = new Date(year, month, i);
        days.push({ date, isCurrentMonth: true, isToday: date.getTime() === today.getTime() });
    }
    
    const totalCells = 42;
    let lastDate = days[days.length-1].date;
    while(days.length < totalCells) {
        lastDate = new Date(lastDate);
        lastDate.setDate(lastDate.getDate() + 1);
        days.push({ date: lastDate, isCurrentMonth: false, isToday: false });
    }

    return days;
};
// #endregion

// #region Sub-components
const CalendarDay: React.FC<{
    day: CalendarDayData;
    planning: DailyPlanningSummary | undefined;
    onNavigate: (id: number) => void;
    onCreate: (date: string) => void;
    onToggleLock: (id: number, status: DPStatus) => void;
    currentUserRole: UserInfo['role']['name'];
}> = ({ day, planning, onNavigate, onCreate, onToggleLock, currentUserRole }) => {
    const theme = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const statusColor = planning ? getStatusColors(planning.stato, theme).main : 'transparent';

    const { isPast, isToday, isFutureFocusDay } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(day.date);
    cellDate.setHours(0, 0, 0, 0);
    const timeDiff = cellDate.getTime() - today.getTime();
    const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
    return {
        isPast: dayDiff < 1,
        isToday: dayDiff === 0,
        isFutureFocusDay: dayDiff > 0 && dayDiff <= 3,
    };
    }, [day.date]);

    const todayStr = toLocalISOString(new Date());
    const canUnlock = planning?.isLocked && currentUserRole === 'SPECIALIST' && planning.giorno > todayStr;
    const canBeClicked = day.isCurrentMonth && (planning || !isPast) && (currentUserRole === 'MAGAZZINIERE' || currentUserRole === 'SPECIALIST');
    const canBeClickedToAdd = day.isCurrentMonth && !isPast && currentUserRole === 'MAGAZZINIERE';
    


    const handleClick = () => {
        if (planning) {
            onNavigate(planning.id);
        } else if (day.isCurrentMonth && !isPast && canBeClickedToAdd) {
            onCreate(toLocalISOString(day.date));
        }
    };

    const handleLockClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (planning) {
            onToggleLock(planning.id, planning.stato);
        }
    }

    
    return (
        <Box
            onClick={canBeClicked ? handleClick : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                minHeight: { xs: 120, md: 140 },
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
                cursor: canBeClicked ? 'pointer' : 'default',
                opacity: (isPast || isToday) && day.isCurrentMonth ? 0.65 : day.isCurrentMonth ? 1 : 0.4,
                border: `1px solid ${theme.palette.divider}`,
                borderTop: isFutureFocusDay ? `3px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                backgroundColor: isFutureFocusDay
                    ? alpha(theme.palette.primary.main, 0.08)
                    : (day.isCurrentMonth ? 'background.paper' : alpha(theme.palette.grey[500], 0.05)),
                '&:hover': canBeClicked && canBeClickedToAdd
                    ? {
                        backgroundColor: isFutureFocusDay
                            ? alpha(theme.palette.primary.main, 0.12)
                            : alpha(theme.palette.primary.main, 0.04),
                        ...(isFutureFocusDay && {
                            borderTopColor: theme.palette.primary.dark,
                        }),
                      }
                    : {},
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center">
           {planning && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Tooltip title={planning.isLocked ? (canUnlock ? "Clicca per sbloccare" : "Planning bloccato") : "Planning aperto"}>
                    <span>
                        <IconButton size="small" onClick={handleLockClick} disabled={planning.isLocked && !canUnlock} sx={{ p: 0.5, color: planning.isLocked ? 'text.secondary' : 'success.main' }}>
                            {planning.isLocked ? <LockIcon sx={{fontSize: '1rem'}}/> : <LockOpenIcon sx={{fontSize: '1rem'}}/>}
                        </IconButton>
                    </span>
                </Tooltip>
                <Chip label={`Rev. ${planning.revisione ? planning.revisione>1 ? planning.revisione-1 :0 : 0}`} size="small" sx={{ fontSize: '0.65rem', height: '18px' }}/>
              </Stack>
           )}
           <Box flexGrow={1} />
           <Typography variant="body2" fontWeight={isToday ? 'bold' : 'normal'} color={isToday ? 'primary.main' : 'text.primary'} sx={{ backgroundColor: isToday ? alpha(theme.palette.primary.main, 0.1) : 'transparent', borderRadius: '50%', width: 24, height: 24, lineHeight: '24px', textAlign: 'center' }}>
             {day.date.getDate()}
           </Typography>
            </Box>

            <Box flexGrow={1} display="flex" flexDirection="column" justifyContent="space-between" mt={0.5}>
                {planning ? (
                <>
                  <Box flexGrow={1} display="flex" flexDirection="column" justifyContent="center" >
                      <Stack direction="row" alignItems="center" spacing={1}>
                          <FiberManualRecordIcon sx={{ fontSize: '0.8rem', color: statusColor }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: statusColor }}>
                            {planning.stato}
                          </Typography>
                      </Stack>
                      {canBeClicked && (
                      <Fade in={isHovered}>
                          <Button size="small" variant="text" endIcon={<ArrowForwardIcon />} onClick={handleClick} sx={{ alignSelf: 'flex-start', mt: 1, p: 0, textTransform: 'none' }}>
                            Gestisci
                          </Button>
                      </Fade>
                        )}
                  </Box>
                  <Stack spacing={0.5} sx={{ width: '100%' }}>
                      <Tooltip title={`Creato il: ${new Date(planning.created_at).toLocaleString('it-IT')}`}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                              <CreateIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {planning.createdby}
                              </Typography>
                          </Stack>
                      </Tooltip>
                       <Tooltip title={`Modificato il: ${new Date(planning.modified_at).toLocaleString('it-IT')}`}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                              <EditIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {planning.modifiedby}
                              </Typography>
                          </Stack>
                      </Tooltip>
                  </Stack>
                </>
                ) : day.isCurrentMonth && !isPast && (currentUserRole == "MAGAZZINIERE" ) && (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'text.disabled', '&:hover .add-icon': { transform: 'scale(1.2)', opacity: 1, color: 'primary.main' } }}>
                        <AddIcon className="add-icon" sx={{ opacity: 0.2, transition: 'all 0.2s ease-in-out' }}/>
                    </Box>
                ) }
            </Box>
        </Box>
    );
};
// #endregion

const DailyPlanningPage: React.FC = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const currentUserRole = user?.role?.name ?? '';
    const { getAllDPTesta, updateDPTesta } = useDailyPlanningApi();

    const [displayDate, setDisplayDate] = useState(new Date());
    const [planningsMap, setPlanningsMap] = useState<Map<string, DailyPlanningSummary>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- State per la sidebar ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedPlanningId, setSelectedPlanningId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // NEW: Ref per accedere al componente del form
    const formRef = useRef<DailyPlanningFormRef>(null);

    const calendarDays = useMemo(() => generateCalendarDays(displayDate), [displayDate]);
    const weekDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

    useEffect(() => {
        const fetchPlannings = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedData = await getAllDPTesta();
                const newMap = new Map<string, DailyPlanningSummary>();
                fetchedData.forEach((dp: DPTesta) => {
                    const summary: DailyPlanningSummary = {
                        id: dp.id,
                        giorno: dp.giorno,
                        stato: dp.stato,
                        revisione: dp.revisione,
                        isLocked: dp.stato === 'CHIUSO' || dp.stato === 'MODIFICATO',
                        createdby: dp.createdby,
                        created_at: dp.created,
                        modifiedby: dp.modifiedby,
                        modified_at: dp.modified,
                    };
                    const dateKey = toLocalISOString(new Date(dp.giorno));
                    newMap.set(dateKey, summary);
                });
                setPlanningsMap(newMap);
            } catch (e: any) {
                setError("Impossibile caricare i planning. Riprova più tardi.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlannings();
    }, [getAllDPTesta, displayDate, refreshKey]);

    // #region Handlers
    const handleOpenPlanning = useCallback((id: number) => {
        setSelectedPlanningId(id);
        setSelectedDate(null);
        setIsSidebarOpen(true);
    }, []);

    const handleCreateNewDP = useCallback((date: string) => {
        setSelectedPlanningId(null);
        setSelectedDate(date);
        setIsSidebarOpen(true);
    }, []);
    
    // MODIFIED: La chiusura della sidebar ora salva la bozza
    const handleCloseSidebar = useCallback(async () => {
        if (formRef.current) {
            await formRef.current.triggerSaveDraft();
        }

        setIsSidebarOpen(false);
        setTimeout(() => {
            setSelectedPlanningId(null);
            setSelectedDate(null);
        }, 300); // Ritardo per permettere all'animazione di chiusura di completarsi
        setRefreshKey(k => k + 1); // Aggiorna la vista del calendario
    }, []);

    const handleToggleLock = useCallback(async (dpId: number, currentStatus: DPStatus) => {
        if (currentStatus !== 'CHIUSO' && currentStatus !== 'MODIFICATO') return;
        if (currentUserRole !== 'SPECIALIST') {
            alert("Solo gli Specialisti possono sbloccare un planning.");
            return;
        }
        try {
            await updateDPTesta(dpId, { stato: 'APERTO', modifiedby: currentUserRole });
            setRefreshKey(k => k + 1);
        } catch (err: any) {
            alert(`Errore durante lo sblocco del planning: ${err.message}`);
        }
    }, [currentUserRole, updateDPTesta]);

    const changeMonth = (offset: number) => {
        setDisplayDate(current => {
            const newDate = new Date(current);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    // #endregion

    return (
        <>
            <Box sx={{ bgcolor: theme.palette.grey[100], minHeight: '100vh' }}>
                <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary', boxShadow: '0px 1px 3px rgba(0,0,0,0.05)', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Container maxWidth="xl">
                        <Toolbar disableGutters sx={{ px: { xs: 1, sm: 2 } }}>
                            <EventIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: { xs: 28, sm: 32 } }} />
                            <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {displayDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                            </Typography>
                            <Box sx={{ flexGrow: 1 }} />
                            <Tooltip title="Mese Precedente">
                                <IconButton onClick={() => changeMonth(-1)}><ChevronLeftIcon /></IconButton>
                            </Tooltip>
                            <Button variant="outlined" size="small" onClick={() => setDisplayDate(new Date())} sx={{ mx: 1 }}>Oggi</Button>
                            <Tooltip title="Mese Successivo">
                                <IconButton onClick={() => changeMonth(1)}><ChevronRightIcon /></IconButton>
                            </Tooltip>
                        </Toolbar>
                    </Container>
                </AppBar>

                <Container maxWidth="xl" sx={{ py: 4, px: {xs: 1, sm: 2, md: 3} }}>
                    <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                            {weekDays.map(day => (
                                <Box key={day} sx={{ textAlign: 'center', p: 1, borderRight: `1px solid ${theme.palette.divider}`,'&:last-child': { borderRight: 'none' } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>{day}</Typography>
                                </Box>
                            ))}
                        </Box>
                        {isLoading ? (
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                {[...Array(42)].map((_, i) => (
                                    <Skeleton key={i} variant="rectangular" height={140} sx={{ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`}}/>
                                ))}
                            </Box>
                        ) : error ? (
                            <Alert severity="error" variant="filled" sx={{ m: 2, borderRadius: 1.5 }}>{error}</Alert>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(7, 1fr)' }, '& > *:nth-of-type(7n)': { borderRight: 'none' }, '@media (max-width: 899.95px)': { '& > *:nth-of-type(7n)': { borderRight: `1px solid ${theme.palette.divider}` }, '& > *:nth-of-type(4n)': { borderRight: 'none' }, }, '@media (max-width: 599.95px)': { '& > *:nth-of-type(4n)': { borderRight: `1px solid ${theme.palette.divider}` }, '& > *': { borderRight: 'none' }, }, }}>
                                {calendarDays.map((day) => {
                                    const dateKey = toLocalISOString(day.date);
                                    const planning = planningsMap.get(dateKey);
                                    return (
                                        <CalendarDay
                                            key={dateKey}
                                            day={day}
                                            planning={planning}
                                            onNavigate={handleOpenPlanning}
                                            onCreate={handleCreateNewDP}
                                            onToggleLock={handleToggleLock}
                                            currentUserRole={currentUserRole}
                                        />
                                    );
                                })}
                            </Box>
                        )}
                    </Paper>
                </Container>
            </Box>

            {/* --- Drawer per DailyPlanningForm --- */}
            <Drawer
                anchor="right"
                open={isSidebarOpen}
                onClose={handleCloseSidebar} // onClose ora gestisce il salvataggio
                PaperProps={{
                    sx: {
                        width: { xs: '100vw', sm: '90vw', md: '75vw', lg: '65vw' },
                        maxWidth: { lg: 1100 },
                        boxShadow: -5,
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: 'background.default'
                    }
                }}
            >
                <AppBar position="sticky" elevation={0} sx={{boxShadow: 'none', borderBottom: 1, borderColor: 'divider'}}>
                     <Toolbar sx={{ justifyContent: 'space-between' }}>
                         <Typography variant="h6" component="h2" fontWeight="bold">
                            {selectedPlanningId ? 'Modifica Planning' : 'Nuovo Planning'}
                         </Typography>
                         <IconButton onClick={handleCloseSidebar} edge="end">
                             <CloseIcon />
                         </IconButton>
                     </Toolbar>
                </AppBar>

                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    {isSidebarOpen && (
                         <DailyPlanningForm
                            // NEW: Passaggio del ref al componente figlio
                            ref={formRef}
                            key={selectedPlanningId || selectedDate}
                            planningId={selectedPlanningId}
                            targetDate={selectedDate}
                            onClose={handleCloseSidebar}
                            title={'Daily Planning'}
                          />
                    )}
                </Box>
            </Drawer>
        </>
    );
};

export default DailyPlanningPage;
