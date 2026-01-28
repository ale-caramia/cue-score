# Cue Score

Una PWA per tracciare i punteggi delle partite tra amici con stile neobrutalista.

## Funzionalita

- **Autenticazione**: Registrazione con ID utente univoco
- **Sistema Amicizia**: Cerca utenti, invia richieste di amicizia, accetta/rifiuta
- **Registrazione Partite**: Registra partite con data e vincitore
- **Statistiche**: Visualizza statistiche giornaliere, settimanali, mensili e annuali
- **Cronologia**: Visualizza ed elimina partite passate
- **PWA**: Installabile su dispositivi mobili, funziona offline

## Stack Tecnologico

- React 19 + TypeScript
- Vite
- TailwindCSS
- shadcn/ui (componenti personalizzati)
- Firebase (Auth + Firestore)
- vite-plugin-pwa

## Setup

### 1. Clona il repository

```bash
git clone <repo-url>
cd cue-score
npm install
```

### 2. Configura Firebase

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com/)
2. Abilita **Anonymous Authentication**
3. Crea un database **Firestore**
4. Copia le credenziali del progetto

### 3. Configura le variabili d'ambiente

```bash
cp .env.example .env
```

Modifica `.env` con le tue credenziali Firebase:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Configura le regole Firestore

Copia il contenuto di `firestore.rules` nelle regole del tuo database Firestore.

### 5. Crea gli indici Firestore

Crea i seguenti indici compositi in Firestore:

**Collection: matches**
- Fields: `players` (Array contains), `date` (Descending)

### 6. Avvia l'applicazione

```bash
npm run dev
```

## Build per produzione

```bash
npm run build
npm run preview
```

## Struttura del Progetto

```
src/
├── components/
│   └── ui/           # Componenti UI (Button, Card, Dialog, etc.)
├── contexts/
│   └── AuthContext.tsx  # Context per autenticazione
├── lib/
│   ├── firebase.ts   # Configurazione Firebase
│   ├── types.ts      # TypeScript types
│   └── utils.ts      # Utility functions
├── pages/
│   ├── LoginPage.tsx    # Pagina di registrazione
│   ├── HomePage.tsx     # Lista amici e richieste
│   └── FriendPage.tsx   # Statistiche e partite con un amico
├── App.tsx           # Router e layout principale
├── main.tsx          # Entry point
└── index.css         # Stili globali e Tailwind
```

## Design

L'applicazione utilizza uno stile **neobrutalista** caratterizzato da:

- Bordi spessi e netti
- Ombre "brutal" offset
- Colori vivaci e contrastanti
- Font bold e grassetto
- Interazioni con effetto "pressed"
