import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface UserData {
  id: string
  displayName: string
  odcreatedAt: Date
}

interface AuthContextType {
  user: FirebaseUser | null
  userData: UserData | null
  loading: boolean
  registerUser: (displayName: string) => Promise<{ success: boolean; error?: string }>
  checkUsernameAvailable: (displayName: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Check if user has profile data
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserData({
            id: firebaseUser.uid,
            displayName: data.displayName,
            odcreatedAt: data.createdAt?.toDate() || new Date()
          })
        } else {
          setUserData(null)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const checkUsernameAvailable = async (displayName: string): Promise<boolean> => {
    const normalizedName = displayName.toLowerCase().trim()
    const q = query(
      collection(db, 'users'),
      where('displayNameLower', '==', normalizedName)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.empty
  }

  const registerUser = async (displayName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sign in anonymously if not already signed in
      let currentUser = auth.currentUser
      if (!currentUser) {
        const result = await signInAnonymously(auth)
        currentUser = result.user
      }

      // Check if username is available
      const isAvailable = await checkUsernameAvailable(displayName)
      if (!isAvailable) {
        return { success: false, error: 'Questo ID utente è già in uso' }
      }

      // Create user document
      const userDocRef = doc(db, 'users', currentUser.uid)
      const now = new Date()

      await setDoc(userDocRef, {
        displayName: displayName.trim(),
        displayNameLower: displayName.toLowerCase().trim(),
        createdAt: now
      })

      setUserData({
        id: currentUser.uid,
        displayName: displayName.trim(),
        odcreatedAt: now
      })

      return { success: true }
    } catch (error) {
      console.error('Error registering user:', error)
      return { success: false, error: 'Errore durante la registrazione' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, registerUser, checkUsernameAvailable }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
