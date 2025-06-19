import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Assicurati che questo percorso sia corretto per la tua struttura di cartelle
import { apiCall, UserInfo } from '../customHook/api'; 

// Interfaccia per il valore esposto dal contesto
interface AuthContextType {
  user: UserInfo | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider che avvolgerà la nostra applicazione
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Funzione per controllare lo stato della sessione tramite il cookie
    const checkUserStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            // --- FIX: L'endpoint corretto è /auth/me, come definito nel router ---
            const userData = await apiCall<UserInfo>('/auth/me', 'GET');
            setUser(userData);
        } catch (error) {
            console.info("Nessuna sessione utente attiva.", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Controlla lo stato al primo avvio dell'app
    useEffect(() => {
        checkUserStatus();
    }, [checkUserStatus]);

    // Funzione di logout
    const logout = async () => {
        setIsLoading(true);
        try {
            await apiCall('api/auth/logout', 'POST');
        } catch (error) {
            console.error("Errore durante il logout:", error);
        } finally {
            setUser(null);
            setIsLoading(false);
            navigate('/login'); // Reindirizza sempre alla pagina di login dopo il logout
        }
    };

    const value = { user, isLoggedIn: !!user, isLoading, logout, checkUserStatus };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizzato per usare facilmente il contesto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
    }
    return context;
};
