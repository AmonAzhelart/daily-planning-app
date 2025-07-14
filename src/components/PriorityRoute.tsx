import React, { JSX } from 'react';
import { useAuth } from '../context/AuthContenxt';
import UnauthorizedPage from '../pages/UnauthorizedPage';

interface PriorityRouteProps {
    children: JSX.Element;
    requiredPriority: number;
}

const PriorityRoute: React.FC<PriorityRouteProps> = ({ children, requiredPriority }) => {
    const { user } = useAuth(); // Ottiene l'utente dal contesto

    // Se l'utente ha una priorità maggiore di quella richiesta (es. 3 > 2),
    // significa che non ha i permessi. Mostra la pagina di non autorizzato.
    if (user && user.role.priority > requiredPriority) {
        return <UnauthorizedPage />;
    }

    // Altrimenti, l'utente è autorizzato e può vedere il contenuto della pagina.
    return children;
};

export default PriorityRoute;