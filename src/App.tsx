import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Importa i componenti e le pagine con percorsi assoluti dalla root 'src'

import './App.css';
import AuthCallback from './components/AuthCallback';
import MainLayout from './components/MainLayout';
import { useAuth, AuthProvider } from './context/AuthContenxt';
import DailyPlanningPage from './pages/DailyPlanningPage';
import LoginPage from './pages/LoginPage';

// Componente per proteggere le rotte che richiedono autenticazione
const ProtectedRoute: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuth();

  // Se stiamo ancora verificando lo stato, mostriamo un loader
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Se l'utente non è loggato, lo reindirizziamo alla pagina di login
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

// Componente che definisce la logica delle rotte
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rotte pubbliche */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Rotte protette */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DailyPlanningPage />} />
          {/* Aggiungi qui le altre tue pagine protette */}
          {/* <Route path="/gestione-clienti" element={<GestioneClientiPage />} />
          <Route path="/gestione-interventi" element={<GestioneInterventiPage />} />
          */}
        </Route>
      </Route>

      {/* Se nessuna rotta corrisponde, reindirizza alla root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Componente principale dell'applicazione
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
