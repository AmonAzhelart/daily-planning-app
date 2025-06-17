# --- FASE 1: BUILD ---
# Utilizza un'immagine Node.js ufficiale come base per la build.
# 'alpine' è una versione molto leggera, ideale per mantenere le immagini piccole.
FROM node:18-alpine AS build

# Imposta la directory di lavoro all'interno del container.
WORKDIR /app

# Copia i file di gestione delle dipendenze.
# Copiandoli prima, Docker può usare la cache se non cambiano, velocizzando le build future.
COPY package.json ./
COPY package-lock.json ./

# Installa tutte le dipendenze del progetto.
RUN npm install

# Copia tutto il resto del codice sorgente nella directory di lavoro.
COPY . .

# Esegui lo script di build definito nel package.json per creare l'app di produzione.
# Questo comando solitamente crea una cartella 'build' con tutti i file statici.
RUN npm run build


# --- FASE 2: SERVE ---
# Utilizza un'immagine Nginx ufficiale e leggera per servire i file.
FROM nginx:stable-alpine

# Copia i file statici generati dalla fase di 'build' nella directory pubblica di Nginx.
# --from=build si riferisce alla fase precedente.
COPY --from=build /app/build /usr/share/nginx/html

# Rimuovi la configurazione di default di Nginx, la sostituiremo con la nostra.
RUN rm /etc/nginx/conf.d/default.conf

# Copia il nostro file di configurazione personalizzato per Nginx.
# Questo file deve trovarsi nella stessa cartella del Dockerfile.
COPY nginx.conf /etc/nginx/conf.d

# Esponi la porta 80, la porta standard per il traffico HTTP.
EXPOSE 80

# Il comando per avviare il server Nginx quando il container viene eseguito.
CMD ["nginx", "-g", "daemon off;"]
