import React, { useState, useCallback } from 'react';

// MUI Imports
import {
    Container,
    Typography,
    Box,
    AppBar,
    Toolbar,
    Tabs,
    Tab,
    useTheme,
    useMediaQuery
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';

// Componenti e Hook personalizzati
import StatisticsSidebar from '../components/Statistics/StatisticsSidebar';
import { StatsBarChart } from '../components/Statistics/StatsBarChart';
import { useDailyPlanningApi } from '../customHook/api';

// Tipi per la gestione dello stato
export type StatType = 'topClients' | 'topResources';

const StatisticsPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedStat, setSelectedStat] = useState<StatType>('topClients');
    const api = useDailyPlanningApi(); // Inizializza l'hook per le API

    // Gestore per il cambio di statistica (usato dalle Tabs su mobile)
    const handleStatChange = (event: React.SyntheticEvent, newValue: StatType) => {
        setSelectedStat(newValue);
    };

    // Per le risorse, abbiamo bisogno di combinare nome e cognome.
    // Creiamo una funzione di fetch che trasforma i dati prima di passarli al grafico.
    // Usiamo `useCallback` per evitare che la funzione venga ricreata a ogni render.
    const fetchAndPrepareResourceData = useCallback(async () => {
        const resources = await api.getTop10Risorse();
        return resources.map(resource => ({
            ...resource,
            // Aggiungiamo un nuovo campo 'fullName' per usarlo come etichetta
            fullName: `${resource.first_name} ${resource.last_name}`,
        }));
    }, [api]);


    // Funzione che renderizza il grafico corretto in base allo stato
    const renderStatComponent = () => {
        switch (selectedStat) {
            case 'topClients':
                return (
                    <StatsBarChart
                        title="Top 10 Clienti per Numero di Interventi"
                        fetchData={api.getTop10Clienti}
                        categoryKey="ragione_sociale"
                        valueKey="missioni"
                        tooltipLabel="Totale interventi"
                    />
                );
            case 'topResources':
                return (
                    <StatsBarChart
                        title="Top 10 Risorse più Impegnate"
                        fetchData={fetchAndPrepareResourceData} // Usa la nostra nuova funzione
                        categoryKey="fullName"                  // Usa il campo 'fullName' per le etichette
                        valueKey="missioni"                     // Il valore rimane 'missioni'
                        tooltipLabel="Missioni totali"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ bgcolor: theme.palette.grey[100], minHeight: '100%' }}>
            {/* AppBar superiore */}
            <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary', boxShadow: 'none', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <LeaderboardIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 30 }} />
                        <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
                            Report & Statistiche
                        </Typography>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Contenuto della pagina */}
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>

                    {/* Menu laterale (visibile solo su desktop) */}
                    {!isMobile && (
                        <Box sx={{ flex: '0 0 280px' }}>
                            <StatisticsSidebar selectedStat={selectedStat} setSelectedStat={setSelectedStat} />
                        </Box>
                    )}

                    {/* Area principale del contenuto */}
                    <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

                        {/* Tabs (visibili solo su mobile/tablet) */}
                        {isMobile && (
                            <Tabs
                                value={selectedStat}
                                onChange={handleStatChange}
                                variant="fullWidth"
                                sx={{ bgcolor: 'white', borderRadius: 2 }}
                            >
                                <Tab icon={<ApartmentIcon />} iconPosition="start" label="Top Clienti" value="topClients" />
                                <Tab icon={<PeopleIcon />} iconPosition="start" label="Top Risorse" value="topResources" />
                            </Tabs>
                        )}

                        {/* Renderizza il componente del grafico selezionato */}
                        {renderStatComponent()}
                    </Box>

                </Box>
            </Container>
        </Box>
    );
};

export default StatisticsPage;