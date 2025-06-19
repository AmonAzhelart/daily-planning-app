import React from 'react';
import { Box, Button, Typography, Paper, Container } from '@mui/material';
import { useDailyPlanningApi } from '../customHook/api';




const LoginPage: React.FC = () => {
  const api = useDailyPlanningApi();
  const handleLoginRedirect = () => {

    const fetchUrl = async () => {
      try {
        const response = await api.getUrlMainApp();
        window.location.href = response.value; // Reindirizza l'utente all'URL principale dell'app

        console.log("URL principale dell'app:", response);
      } catch (error) {
        console.error("Errore nel recupero dell'URL principale:", error);
      }
    };

    fetchUrl();
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={6} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <Typography component="h1" variant="h5">
          Accesso Richiesto
        </Typography>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            Per continuare, è necessario effettuare l'autenticazione tramite il sistema principale.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleLoginRedirect}
          >
            Procedi al Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
