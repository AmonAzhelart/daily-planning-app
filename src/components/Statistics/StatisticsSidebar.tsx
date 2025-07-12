import React from 'react';
import { Paper, Typography, List, ListItemText, ListItemIcon, ListItemButton } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import { StatType } from '../../pages/StatisticsPage'; // Importa il tipo

interface StatisticsSidebarProps {
    selectedStat: StatType;
    setSelectedStat: (stat: StatType) => void;
}

const StatisticsSidebar: React.FC<StatisticsSidebarProps> = ({ selectedStat, setSelectedStat }) => {
    return (
        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, px: 2 }}>
                Viste Disponibili
            </Typography>
            <List component="nav">
                <ListItemButton
                    selected={selectedStat === 'topClients'}
                    onClick={() => setSelectedStat('topClients')}
                    sx={{ borderRadius: 2, mb: 1 }}
                >
                    <ListItemIcon><ApartmentIcon /></ListItemIcon>
                    <ListItemText primary="Top 10 Clienti" secondary="Clienti con più interventi" />
                </ListItemButton>
                <ListItemButton
                    selected={selectedStat === 'topResources'}
                    onClick={() => setSelectedStat('topResources')}
                    sx={{ borderRadius: 2 }}
                >
                    <ListItemIcon><PeopleIcon /></ListItemIcon>
                    <ListItemText primary="Top 10 Risorse" secondary="Risorse più impegnate" />
                </ListItemButton>
            </List>
        </Paper>
    );
};

export default StatisticsSidebar;