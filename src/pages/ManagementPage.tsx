import React, { useState } from 'react';
import { useAuth } from '../context/AuthContenxt';

// MUI Imports
import { Container, Typography, Paper, Box, AppBar, Toolbar, Alert, Tabs, Tab } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import BuildIcon from '@mui/icons-material/Build'; // Icona per gli interventi

// Import dei componenti di gestione
import ClientSiteManager from '../components/Management/ClientSiteManager';
import InterventionTypeManager from '../components/Management/InterventionTypeManager'; // NUOVO IMPORT

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const ManagementPage: React.FC = () => {
    const { user } = useAuth();
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    // Controllo permessi (se necessario)
    // if (user?.role?.name !== 'ADMIN' && user?.role?.name !== 'SUPERADMIN') { ... }

    return (
        <>
            <Box sx={{ minHeight: '100%' }}>
                <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary', boxShadow: '0px 1px 3px rgba(0,0,0,0.05)' }}>
                    <Container maxWidth="xl">
                        <Toolbar disableGutters>
                            <BusinessIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 32 }} />
                            <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
                                Gestione Anagrafiche
                            </Typography>
                        </Toolbar>
                    </Container>
                </AppBar>

                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={currentTab} onChange={handleTabChange} aria-label="management tabs">
                                <Tab label="Clienti e Sedi" icon={<BusinessIcon />} iconPosition="start" />
                                <Tab label="Tipi Intervento" icon={<BuildIcon />} iconPosition="start" />
                            </Tabs>
                        </Box>

                        {/* Pannello per Clienti e Sedi */}
                        <TabPanel value={currentTab} index={0}>
                            <Typography variant="h5" component="h2" gutterBottom>
                                Anagrafica Clienti e Sedi
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                In questa sezione puoi gestire i clienti e le loro sedi operative.
                            </Typography>
                            <ClientSiteManager />
                        </TabPanel>

                        {/* Pannello per Tipi Intervento */}
                        <TabPanel value={currentTab} index={1}>
                            <Typography variant="h5" component="h2" gutterBottom>
                                Anagrafica Tipologie di Intervento
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Gestisci le tipologie di intervento. Se una tipologia è già stata usata, non potrà essere eliminata.
                            </Typography>
                            <InterventionTypeManager />
                        </TabPanel>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default ManagementPage;
