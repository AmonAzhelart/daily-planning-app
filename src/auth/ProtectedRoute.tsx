import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContenxt';
import UnauthorizedPage from '../pages/UnauthorizedPage';

interface ProtectedRouteProps {
    requiredPriority: number;
    children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPriority, children }) => {
    const { user } = useAuth();

    // 1. Se l'utente non è loggato, reindirizza alla pagina di login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Se la priorità dell'utente è maggiore di quella richiesta, mostra la pagina di errore
    // (priorità più bassa = permessi più alti, es: 1 > 2)
    if (user.role.priority > requiredPriority) {
        return <UnauthorizedPage />;
    }

    // 3. Se l'utente è autorizzato, mostra il componente richiesto
    return children;
};

export default ProtectedRoute;