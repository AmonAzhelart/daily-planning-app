import React, { useEffect } from 'react';
import { Box, Button, Typography, Paper, Container } from '@mui/material';
import { useDailyPlanningApi } from '../customHook/api';


const LoginPage: React.FC = () => {
  const api = useDailyPlanningApi();

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const response = await api.getUrlMainApp();
        if (response && response.value) {
          window.location.href = response.value; // Reindirizza l'utente all'URL principale dell'app
          console.log("URL principale dell'app:", response.value);
        } else {
          console.error("Errore: URL principale non disponibile nella risposta.");
          // Optionally, display a message to the user or try again
        }
      } catch (error) {
        console.error("Errore nel recupero dell'URL principale:", error);
        // Optionally, display an error message to the user
      }
    };

    fetchUrl();
  }, [api]); // Re-run effect if 'api' instance changes (though it typically won't)

  return (
    <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={6} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <Typography component="h1" variant="h5">
          Reindirizzamento...
        </Typography>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            Stai per essere reindirizzato al sistema principale. Attendere prego.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
