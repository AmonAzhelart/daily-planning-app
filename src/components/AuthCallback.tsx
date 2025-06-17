import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContenxt';
import { CircularProgress, Box, Typography } from '@mui/material';

const AuthCallback: React.FC = () => {
  const { checkUserStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const completeSignIn = async () => {
      // Il cookie è stato impostato dal backend. Ora verifichiamo lo stato
      // per aggiornare il nostro frontend.
      await checkUserStatus();
      // Una volta che lo stato è aggiornato, navighiamo alla pagina principale.
      navigate('/');
    };

    completeSignIn();
  }, [checkUserStatus, navigate]);  

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Finalizzazione autenticazione...</Typography>
    </Box>
  );
};

export default AuthCallback;
