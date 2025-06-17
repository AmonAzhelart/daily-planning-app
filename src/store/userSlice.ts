import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserInfo } from '../customHook/api';

// Definiamo le interfacce per la tipizzazione dei dati
// Corrispondono alla struttura del JSON che arriva dal backend
interface Role {
  id: number;
  name: string;
  description: string;
}

// Definiamo la struttura dello stato per questo slice
interface UserState {
  userInfo: UserInfo | null;
  loading: boolean;
  error: string | null;
}

// Lo stato iniziale, con l'utente non ancora caricato
const initialState: UserState = {
  userInfo: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Azione per impostare le informazioni dell'utente una volta ricevute
    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
      state.loading = false;
      state.error = null;
    },
    // Potresti aggiungere azioni per gestire il caricamento e gli errori
    setUserLoading: (state) => {
        state.loading = true;
    },
    setUserError: (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.error = action.payload;
    }
  },
});

// Esportiamo le azioni e il reducer
export const { setUserInfo, setUserLoading, setUserError } = userSlice.actions;
export default userSlice.reducer;
