import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Language = 'en' | 'it'

type TranslationDictionary = {
  [key: string]: string | TranslationDictionary
}

type InterpolationValues = Record<string, string | number>

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, values?: InterpolationValues) => string
}

const translations: Record<Language, TranslationDictionary> = {
  en: {
    common: {
      add: 'Add',
      cancel: 'Cancel',
      close: 'Close',
      continue: 'Continue',
      create: 'Create',
      delete: 'Delete',
      language: 'Language',
      loading: 'Loading...',
      save: 'Save',
      saving: 'Saving...',
      search: 'Search',
      signOut: 'Sign out',
      points: 'points',
      wins: 'Wins',
      losses: 'Losses',
      victory: 'Victory',
      defeat: 'Defeat',
      members: '{{count}} members',
    },
    nav: {
      friends: 'Friends',
      groups: 'Groups',
      tournaments: 'Tournaments',
      desktopHint: 'Navigate between sections',
    },
    pwa: {
      updateTitle: 'Update Available',
      updateDescription: 'A new version of Cue Score is available. Reload now to get the latest features and improvements.',
      updateNow: 'Reload Now',
      updateLater: 'Later',
    },
    home: {
      friendRequests: 'Friend Requests ({{count}})',
      addFriend: 'Add Friend',
      searchFriendTitle: 'Search Friend',
      searchFriendDescription: 'Search by username or email to send a friend request.',
      searchPlaceholder: 'Username or email...',
      friendLabel: 'Friend',
      requestSent: 'Request sent',
      noUsersFound: 'No users found',
      friendsTitle: 'Your Friends ({{count}})',
      noFriends: 'No friends yet. Search for someone to get started!',
      rejectSuccess: 'Friend request rejected!',
      rejectError: 'Error rejecting friend request: {{message}}',
      acceptSuccess: 'Friend request accepted!',
      acceptError: 'Error accepting friend request: {{message}}',
      noUserDataError: 'Error: No user data',
      requestMissingError: 'Error: Request no longer exists',
      requestNotPendingError: 'Error: Request is not pending',
    },
    groups: {
      title: 'Groups',
      createGroup: 'Create Group',
      createGroupTitle: 'Create a New Group',
      createGroupDescription:
        'Choose a name for your group. You can add members later.',
      groupNamePlaceholder: 'Group name...',
      creating: 'Creating...',
      noGroupsTitle: 'You are not part of any group yet.',
      noGroupsDescription: 'Create a group to start playing with your friends!',
      infoTitle: 'How Groups Work',
      infoTeamsTitle: 'Team Matches',
      infoTeamsDescription:
        'In groups you can log matches with teams from 1 to N-1 players. Choose each team and record the winner.',
      infoPointsTitle: 'Point System',
      infoPointsDescription:
        'Points earned equal the number of opponents defeated.',
      infoPointsExample1: '3v3 win: each winner earns 3 points',
      infoPointsExample2: '4v2 win by 4: each winner earns 2 points',
      infoPointsExample3: '4v2 win by 2: each winner earns 4 points',
      infoPointsExample4: '1v1 win: the winner earns 1 point',
      infoRankingsTitle: 'Rankings',
      infoRankingsDescription:
        'Each group has rankings for day, week, month, and year. The app remembers your preferred view per group.',
      createError: 'Error creating group. Please try again.',
    },
    tournaments: {
      title: 'Tournaments',
      placeholder:
        'Tournaments will appear here when they become available.',
    },
    login: {
      chooseUsernameTitle: 'Choose your username',
      chooseUsernameDescription: 'This will be visible to your friends',
      usernameLabel: 'Username',
      usernamePlaceholder: 'e.g. john_doe',
      usernameHint: '3-20 characters, letters, numbers and underscores only',
      usernameTooShort: 'Username must be at least 3 characters',
      usernameTooLong: 'Username cannot exceed 20 characters',
      usernameInvalid:
        'Username can only contain letters, numbers and underscores',
      usernameSaveError: 'Failed to set username',
      signInError: 'Failed to sign in',
      title: 'CUE SCORE',
      subtitle: 'Track match scores with your friends',
      signingIn: 'Signing in...',
      signInWithGoogle: 'Sign in with Google',
    },
    friend: {
      addMatch: 'Add Match',
      matchDateLabel: 'Match date',
      whoWon: 'Who won?',
      statsTitle: 'Stats',
      matchesTitle: 'Match history',
      noMatches: 'No matches recorded with {{name}}.',
      today: 'Today',
      week: 'Week',
      month: 'Month',
      year: 'Year',
      thisWeek: 'This week',
      thisMonth: 'This month',
      thisYear: 'This year',
      allTime: 'All time (all matches)',
      winsLabel: 'Wins',
      lossesLabel: 'Losses',
      resultVictory: 'Victory',
      resultDefeat: 'Defeat',
      totalMatches: '{{count}} total matches',
      versus: 'vs {{name}}',
      newMatchTitle: 'New match',
      newMatchDescription: 'Record the result of a match with {{name}}',
      saveMatch: 'Save match',
      deleteMatchTitle: 'Delete match',
      deleteMatchDescription:
        'Are you sure you want to delete the match on {{date}}? This action cannot be undone.',
      friendsOnlyMode: 'Friends',
      combinedMode: '+ Groups',
      combinedModeHint: 'Including {{count}} 1v1 group matches',
    },
    group: {
      addMatch: 'Add Match',
      addMember: 'Add Member',
      rankingsTitle: 'Rankings',
      membersTitle: 'Members ({{count}})',
      matchesTitle: 'Matches',
      noRankings: 'No matches yet for this period.',
      noMatches: 'No matches yet. Add the first one!',
      day: 'Day',
      week: 'Week',
      month: 'Month',
      year: 'Year',
      teamA: 'Team A',
      teamB: 'Team B',
      winner: 'Winner',
      matchDateLabel: 'Match date',
      playersTeamA: 'Players in team A',
      playersTeamB: 'Players in team B',
      exampleTitle: 'Examples:',
      deleteMatchTitle: 'Delete this match?',
      deleteMatchDescription:
        'This action cannot be undone. The match will be permanently deleted.',
      deleteGroupTitle: 'Delete group "{{name}}"?',
      deleteGroupDescription:
        'This action is irreversible. All group data will be permanently deleted:',
      deleteGroupMembers: '{{count}} members',
      deleteGroupMatches: '{{count}} matches',
      deleteGroupStats: 'All stats and rankings',
      deleteGroupAction: 'Delete permanently',
      deletingGroup: 'Deleting...',
      deleteGroupError: 'Error deleting the group.',
      deleteMatchError: 'Error deleting the match.',
      deleteGroupUnauthorized: 'Only the admin can delete the group.',
      addMemberTitle: 'Add members',
      addMemberSearchPlaceholder: 'Search by username...',
      addMemberDescription: 'Search for a user to add them to the group.',
      addMemberNoResults: 'No users found.',
      addMemberError: 'Error adding member.',
      searching: 'Searching...',
      addingMember: 'Adding...',
      infoTitle: 'Point system',
      infoDescription:
        'Points earned in a match equal the number of opponents defeated by your team.',
      infoExample1: '3v3 match: winners earn 3 points each',
      infoExample2: '4v2 match won by 4: winners earn 2 points',
      infoExample3: '4v2 match won by 2: winners earn 4 points',
      infoExample4: '1v1 match: winner earns 1 point',
      infoExample5: '5v1 match won by 1: winner earns 5 points',
      saveMatch: 'Save match',
      saveMatchError: 'Error saving the match.',
      recordMatchDescription: 'Select the members for each team and the winner.',
      addMemberButton: 'Add member',
      removeMember: 'Remove',
      viewMembers: 'View members',
      matchesWon: '{{won}}/{{total}} matches won',
      adminLabel: 'Admin',
      pointsAwarded: '+{{points}} points for winners',
      sortByPoints: 'By Score',
      sortByWinRate: 'By Win %',
      winRate: 'win rate',
      unregisteredLabel: 'Guest',
      linkUser: 'Link',
      registeredUser: 'Registered',
      unregisteredUser: 'Guest',
      unregisteredDescription: 'Create a guest player who doesn\'t have an account. You can link them to a registered user later.',
      unregisteredNamePlaceholder: 'Enter name...',
      createUnregistered: 'Add Guest',
      unregisteredNameExists: 'A guest with this name already exists in this group.',
      createUnregisteredError: 'Error creating guest player.',
      linkUserTitle: 'Link to Registered User',
      linkUserDescription: 'Link "{{name}}" to a registered user. Their stats will be merged and the guest entry will be kept for historical records.',
      linkUserError: 'Error linking user.',
      linking: 'Linking...',
      link: 'Link',
    },
  },
  it: {
    common: {
      add: 'Aggiungi',
      cancel: 'Annulla',
      close: 'Chiudi',
      continue: 'Continua',
      create: 'Crea',
      delete: 'Elimina',
      language: 'Lingua',
      loading: 'Caricamento...',
      save: 'Salva',
      saving: 'Salvataggio...',
      search: 'Cerca',
      signOut: 'Esci',
      points: 'punti',
      wins: 'Vittorie',
      losses: 'Sconfitte',
      victory: 'Vittoria',
      defeat: 'Sconfitta',
      members: '{{count}} membri',
    },
    nav: {
      friends: 'Amici',
      groups: 'Gruppi',
      tournaments: 'Tornei',
      desktopHint: 'Naviga tra le sezioni',
    },
    pwa: {
      updateTitle: 'Aggiornamento Disponibile',
      updateDescription: 'Una nuova versione di Cue Score è disponibile. Ricarica ora per ottenere le ultime funzionalità e miglioramenti.',
      updateNow: 'Ricarica Ora',
      updateLater: 'Più Tardi',
    },
    home: {
      friendRequests: 'Richieste di amicizia ({{count}})',
      addFriend: 'Aggiungi amico',
      searchFriendTitle: 'Cerca amico',
      searchFriendDescription:
        'Cerca per nome utente o email per inviare una richiesta di amicizia.',
      searchPlaceholder: 'Nome utente o email...',
      friendLabel: 'Amico',
      requestSent: 'Richiesta inviata',
      noUsersFound: 'Nessun utente trovato',
      friendsTitle: 'I tuoi amici ({{count}})',
      noFriends: 'Nessun amico ancora. Cerca qualcuno per iniziare!',
      rejectSuccess: 'Richiesta di amicizia rifiutata!',
      rejectError: 'Errore nel rifiuto della richiesta: {{message}}',
      acceptSuccess: 'Richiesta di amicizia accettata!',
      acceptError: 'Errore nell\'accettazione della richiesta: {{message}}',
      noUserDataError: 'Errore: nessun dato utente',
      requestMissingError: 'Errore: la richiesta non esiste più',
      requestNotPendingError: 'Errore: la richiesta non è più in attesa',
    },
    groups: {
      title: 'Gruppi',
      createGroup: 'Crea gruppo',
      createGroupTitle: 'Crea un nuovo gruppo',
      createGroupDescription:
        'Scegli un nome per il tuo gruppo. Potrai aggiungere membri in seguito.',
      groupNamePlaceholder: 'Nome del gruppo...',
      creating: 'Creazione...',
      noGroupsTitle: 'Non fai ancora parte di nessun gruppo.',
      noGroupsDescription:
        'Crea un gruppo per iniziare a giocare con i tuoi amici!',
      infoTitle: 'Come funzionano i gruppi',
      infoTeamsTitle: 'Partite a squadre',
      infoTeamsDescription:
        'Nei gruppi puoi registrare partite con squadre da 1 a N-1 giocatori. Scegli i membri di ogni squadra e registra il vincitore.',
      infoPointsTitle: 'Sistema punti',
      infoPointsDescription:
        'I punti guadagnati equivalgono al numero di avversari sconfitti.',
      infoPointsExample1: '3v3 vinta: ogni vincitore guadagna 3 punti',
      infoPointsExample2: '4v2 vinta dai 4: ogni vincitore guadagna 2 punti',
      infoPointsExample3: '4v2 vinta dai 2: ogni vincitore guadagna 4 punti',
      infoPointsExample4: '1v1 vinta: il vincitore guadagna 1 punto',
      infoRankingsTitle: 'Classifiche',
      infoRankingsDescription:
        'Ogni gruppo ha classifiche per giorno, settimana, mese e anno. L\'app ricorda la tua vista preferita per ogni gruppo.',
      createError: 'Errore nella creazione del gruppo. Riprova.',
    },
    tournaments: {
      title: 'Tornei',
      placeholder:
        'I tornei compariranno qui quando saranno disponibili.',
    },
    login: {
      chooseUsernameTitle: 'Scegli il tuo nome utente',
      chooseUsernameDescription: 'Sarà visibile ai tuoi amici',
      usernameLabel: 'Nome utente',
      usernamePlaceholder: 'es. mario_rossi',
      usernameHint:
        '3-20 caratteri, solo lettere, numeri e underscore',
      usernameTooShort: 'Il nome utente deve essere di almeno 3 caratteri',
      usernameTooLong: 'Il nome utente non può superare 20 caratteri',
      usernameInvalid:
        'Il nome utente può contenere solo lettere, numeri e underscore',
      usernameSaveError: 'Impossibile salvare il nome utente',
      signInError: 'Accesso non riuscito',
      title: 'CUE SCORE',
      subtitle: 'Tieni traccia dei punteggi con i tuoi amici',
      signingIn: 'Accesso in corso...',
      signInWithGoogle: 'Accedi con Google',
    },
    friend: {
      addMatch: 'Aggiungi partita',
      matchDateLabel: 'Data partita',
      whoWon: 'Chi ha vinto?',
      statsTitle: 'Statistiche',
      matchesTitle: 'Storico partite',
      noMatches: 'Nessuna partita registrata con {{name}}.',
      today: 'Oggi',
      week: 'Sett.',
      month: 'Mese',
      year: 'Anno',
      thisWeek: 'Questa settimana',
      thisMonth: 'Questo mese',
      thisYear: 'Quest\'anno',
      allTime: 'Totale (tutte le partite)',
      winsLabel: 'Vittorie',
      lossesLabel: 'Sconfitte',
      resultVictory: 'Vittoria',
      resultDefeat: 'Sconfitta',
      totalMatches: '{{count}} partite totali',
      versus: 'contro {{name}}',
      newMatchTitle: 'Nuova partita',
      newMatchDescription: 'Registra il risultato di una partita con {{name}}',
      saveMatch: 'Salva partita',
      deleteMatchTitle: 'Elimina partita',
      deleteMatchDescription:
        'Sei sicuro di voler eliminare la partita del {{date}}? Questa azione non può essere annullata.',
      friendsOnlyMode: 'Amici',
      combinedMode: '+ Gruppi',
      combinedModeHint: 'Include {{count}} partite 1v1 nei gruppi',
    },
    group: {
      addMatch: 'Aggiungi partita',
      addMember: 'Aggiungi membro',
      rankingsTitle: 'Classifiche',
      membersTitle: 'Membri ({{count}})',
      matchesTitle: 'Partite',
      noRankings: 'Nessuna partita in questo periodo.',
      noMatches: 'Nessuna partita ancora. Aggiungi la prima!',
      day: 'Giorno',
      week: 'Settimana',
      month: 'Mese',
      year: 'Anno',
      teamA: 'Squadra A',
      teamB: 'Squadra B',
      winner: 'Vincitore',
      matchDateLabel: 'Data partita',
      playersTeamA: 'Giocatori squadra A',
      playersTeamB: 'Giocatori squadra B',
      exampleTitle: 'Esempi:',
      deleteMatchTitle: 'Eliminare questa partita?',
      deleteMatchDescription:
        'Questa azione non può essere annullata. La partita verrà eliminata definitivamente.',
      deleteGroupTitle: 'Eliminare il gruppo "{{name}}"?',
      deleteGroupDescription:
        'Questa azione è irreversibile. Tutti i dati del gruppo verranno eliminati definitivamente:',
      deleteGroupMembers: '{{count}} membri',
      deleteGroupMatches: '{{count}} partite',
      deleteGroupStats: 'Tutte le statistiche e classifiche',
      deleteGroupAction: 'Elimina definitivamente',
      deletingGroup: 'Eliminazione...',
      deleteGroupError: 'Errore durante l\'eliminazione del gruppo.',
      deleteMatchError: 'Errore durante la cancellazione della partita.',
      deleteGroupUnauthorized: 'Solo l\'admin può eliminare il gruppo.',
      addMemberTitle: 'Aggiungi membri',
      addMemberSearchPlaceholder: 'Cerca per nome utente...',
      addMemberDescription: 'Cerca un utente per aggiungerlo al gruppo.',
      addMemberNoResults: 'Nessun utente trovato.',
      addMemberError: 'Errore durante l\'aggiunta del membro.',
      searching: 'Ricerca...',
      addingMember: 'Aggiunta...',
      infoTitle: 'Sistema punti',
      infoDescription:
        'I punti guadagnati in una partita equivalgono al numero di avversari sconfitti dalla tua squadra.',
      infoExample1: 'Partita 3v3: vincitori guadagnano 3 punti ciascuno',
      infoExample2: 'Partita 4v2 vinta dai 4: vincitori guadagnano 2 punti',
      infoExample3: 'Partita 4v2 vinta dai 2: vincitori guadagnano 4 punti',
      infoExample4: 'Partita 1v1: vincitore guadagna 1 punto',
      infoExample5: 'Partita 5v1 vinta dall\'1: guadagna 5 punti',
      saveMatch: 'Salva partita',
      saveMatchError: 'Errore durante il salvataggio della partita.',
      recordMatchDescription: 'Seleziona i membri per ogni squadra e il vincitore.',
      addMemberButton: 'Aggiungi membro',
      removeMember: 'Rimuovi',
      viewMembers: 'Vedi membri',
      matchesWon: '{{won}}/{{total}} partite vinte',
      adminLabel: 'Admin',
      pointsAwarded: '+{{points}} punti per i vincitori',
      sortByPoints: 'Per Punti',
      sortByWinRate: 'Per % Vinte',
      winRate: '% vittorie',
      unregisteredLabel: 'Ospite',
      linkUser: 'Collega',
      registeredUser: 'Registrato',
      unregisteredUser: 'Ospite',
      unregisteredDescription: 'Crea un giocatore ospite che non ha un account. Potrai collegarlo a un utente registrato in seguito.',
      unregisteredNamePlaceholder: 'Inserisci nome...',
      createUnregistered: 'Aggiungi Ospite',
      unregisteredNameExists: 'Esiste già un ospite con questo nome in questo gruppo.',
      createUnregisteredError: 'Errore durante la creazione dell\'ospite.',
      linkUserTitle: 'Collega a Utente Registrato',
      linkUserDescription: 'Collega "{{name}}" a un utente registrato. Le statistiche verranno unite e l\'ospite verrà mantenuto per lo storico.',
      linkUserError: 'Errore durante il collegamento.',
      linking: 'Collegamento...',
      link: 'Collega',
    },
  },
}

const I18nContext = createContext<I18nContextValue>({
  language: 'en',
  setLanguage: (_language: Language) => {},
  t: (_key: string, _values?: InterpolationValues) => '',
})

const translateKey = (
  dictionary: TranslationDictionary,
  key: string
): string | TranslationDictionary | undefined => {
  return key.split('.').reduce<TranslationDictionary | string | undefined>(
    (result, segment) => {
      if (result && typeof result === 'object' && segment in result) {
        return result[segment]
      }
      return undefined
    },
    dictionary
  )
}

const interpolate = (value: string, values?: InterpolationValues) => {
  if (!values) return value
  return Object.entries(values).reduce((result, [key, replacement]) => {
    return result.replace(new RegExp(`{{${key}}}`, 'g'), String(replacement))
  }, value)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en'
    const stored = window.localStorage.getItem('language')
    return stored === 'it' ? 'it' : 'en'
  })

  useEffect(() => {
    window.localStorage.setItem('language', language)
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string, values?: InterpolationValues) => {
        const translation =
          translateKey(translations[language], key) ??
          translateKey(translations.en, key)
        if (typeof translation !== 'string') {
          return key
        }
        return interpolate(translation, values)
      },
    }),
    [language]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
