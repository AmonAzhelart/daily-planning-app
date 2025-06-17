import React from 'react';
import { Box, Button, Typography, Paper, Container } from '@mui/material';

const LoginPage: React.FC = () => {
  const handleLoginRedirect = () => {
    // Reindirizza l'utente all'endpoint di "ponte" del backend.
    // Il backend gestirà la sessione e reindirizzerà di nuovo al frontend.
    window.location.href = 'http://127.0.0.1:8080/login?sid=test-session-id';
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
