import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Importa i componenti e le pagine
import './App.css';
import AuthCallback from './components/AuthCallback';
import MainLayout from './components/MainLayout';
import PriorityRoute from './components/PriorityRoute'; // <-- NUOVO: Importa il guardiano di priorità
import { useAuth, AuthProvider } from './context/AuthContenxt';
import DailyPlanningPage from './pages/DailyPlanningPage';
import LoginPage from './pages/LoginPage';
import ManagementPage from './pages/ManagementPage';
import ReportsAndStatisticsPage from './pages/StatisticsPage';

// Componente per proteggere le rotte che richiedono solo l'autenticazione (login)
const ProtectedRoute: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Se l'utente è loggato, mostra il contenuto (che sarà il MainLayout), altrimenti vai al login
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

// Componente che definisce la logica delle rotte
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rotte pubbliche */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Rotte protette dal login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Questa rotta è accessibile a TUTTI gli utenti loggati */}
          <Route path="/daily-planning" element={<DailyPlanningPage />} />

          {/* **[CORREZIONE]** Queste rotte sono protette anche dalla priorità */}
          <Route
            path="/management"
            element={
              <PriorityRoute requiredPriority={2}>
                <ManagementPage />
              </PriorityRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <PriorityRoute requiredPriority={2}>
                <ReportsAndStatisticsPage />
              </PriorityRoute>
            }
          />
        </Route>
      </Route>

      {/* Se nessuna rotta corrisponde, reindirizza alla pagina di default */}
      <Route path="*" element={<Navigate to="/daily-planning" replace />} />
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