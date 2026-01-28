import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
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
  email: string
  createdAt: Date
}

interface AuthContextType {
  user: FirebaseUser | null
  userData: UserData | null
  loading: boolean
  needsUsername: boolean
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  setUsername: (displayName: string) => Promise<{ success: boolean; error?: string }>
  checkUsernameAvailable: (displayName: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsUsername, setNeedsUsername] = useState(false)

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
            email: data.email || firebaseUser.email || '',
            createdAt: data.createdAt?.toDate() || new Date()
          })
          setNeedsUsername(false)
        } else {
          // User is logged in but hasn't set username yet
          setUserData(null)
          setNeedsUsername(true)
        }
      } else {
        setUserData(null)
        setNeedsUsername(false)
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

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      return { success: true }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      return { success: false, error: 'Failed to sign in with Google' }
    }
  }

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth)
    setUserData(null)
    setNeedsUsername(false)
  }

  const setUsername = async (displayName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        return { success: false, error: 'Not authenticated' }
      }

      // Check if username is available
      const isAvailable = await checkUsernameAvailable(displayName)
      if (!isAvailable) {
        return { success: false, error: 'This username is already taken' }
      }

      // Create user document
      const userDocRef = doc(db, 'users', currentUser.uid)
      const now = new Date()

      await setDoc(userDocRef, {
        displayName: displayName.trim(),
        displayNameLower: displayName.toLowerCase().trim(),
        email: currentUser.email || '',
        emailLower: (currentUser.email || '').toLowerCase(),
        createdAt: now
      })

      setUserData({
        id: currentUser.uid,
        displayName: displayName.trim(),
        email: currentUser.email || '',
        createdAt: now
      })
      setNeedsUsername(false)

      return { success: true }
    } catch (error) {
      console.error('Error setting username:', error)
      return { success: false, error: 'Failed to set username' }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      needsUsername,
      signInWithGoogle,
      signOut,
      setUsername,
      checkUsernameAvailable
    }}>
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
