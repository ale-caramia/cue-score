# Cue Score

A PWA for tracking match scores between friends with a neobrutal design.

## Features

- **Authentication**: Registration with unique user ID
- **Friendship System**: Search users, send friend requests, accept/reject
- **Match Recording**: Record matches with date and winner
- **Statistics**: View daily, weekly, monthly, and yearly stats
- **History**: View and delete past matches
- **PWA**: Installable on mobile devices, works offline

## Tech Stack

- React 19 + TypeScript
- Vite
- TailwindCSS
- shadcn/ui (custom components)
- Firebase (Auth + Firestore)
- vite-plugin-pwa

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd cue-score
npm install
```

### 2. Configure Firebase

1. Create a project on [Firebase Console](https://console.firebase.google.com/)
2. Enable **Anonymous Authentication**
3. Create a **Firestore** database
4. Copy the project credentials

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Configure Firestore rules

Copy the content of `firestore.rules` into your Firestore database rules.

### 5. Create Firestore indexes

Create the following composite indexes in Firestore:

**Collection: matches**
- Fields: `players` (Array contains), `date` (Descending)

### 6. Start the application

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── ui/              # UI components (Button, Card, Dialog, etc.)
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   ├── firebase.ts      # Firebase configuration
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Utility functions
├── pages/
│   ├── LoginPage.tsx    # Registration page
│   ├── HomePage.tsx     # Friends list and requests
│   └── FriendPage.tsx   # Stats and matches with a friend
├── App.tsx              # Router and main layout
├── main.tsx             # Entry point
└── index.css            # Global styles and Tailwind
```

## Design

The app uses a **neobrutal** style characterized by:

- Thick, sharp borders
- Offset "brutal" shadows
- Vibrant, contrasting colors
- Bold fonts
- "Pressed" interaction effects
