import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'

let testEnv: RulesTestEnvironment

const PROJECT_ID = 'test-project'

// User IDs for testing
const USER_A = 'user-a'
const USER_B = 'user-b'
const USER_C = 'user-c'

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

// ==========================================
// USERS COLLECTION TESTS
// ==========================================
describe('Users Collection', () => {
  it('authenticated users can read any user', async () => {
    // Setup: create a user document as admin
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'users', USER_B), {
        displayName: 'User B',
        email: 'userb@test.com',
      })
    })

    // Test: User A can read User B's document
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()
    await assertSucceeds(getDoc(doc(userADb, 'users', USER_B)))
  })

  it('unauthenticated users cannot read users', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'users', USER_A), {
        displayName: 'User A',
      })
    })

    const unauthContext = testEnv.unauthenticatedContext()
    const unauthDb = unauthContext.firestore()
    await assertFails(getDoc(doc(unauthDb, 'users', USER_A)))
  })

  it('users can create their own document', async () => {
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()

    await assertSucceeds(
      setDoc(doc(userADb, 'users', USER_A), {
        displayName: 'User A',
        email: 'usera@test.com',
      })
    )
  })

  it('users cannot create documents for other users', async () => {
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()

    await assertFails(
      setDoc(doc(userADb, 'users', USER_B), {
        displayName: 'User B',
        email: 'userb@test.com',
      })
    )
  })
})

// ==========================================
// FRIEND REQUESTS COLLECTION TESTS
// ==========================================
describe('Friend Requests Collection', () => {
  it('sender can read their sent request', async () => {
    // Setup: create a friend request as admin
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friendRequests', 'request-1'), {
        fromUserId: USER_A,
        fromUserName: 'User A',
        toUserId: USER_B,
        toUserName: 'User B',
        status: 'pending',
      })
    })

    // Test: User A (sender) can read the request
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()
    await assertSucceeds(getDoc(doc(userADb, 'friendRequests', 'request-1')))
  })

  it('receiver can read received request', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friendRequests', 'request-1'), {
        fromUserId: USER_A,
        fromUserName: 'User A',
        toUserId: USER_B,
        toUserName: 'User B',
        status: 'pending',
      })
    })

    // Test: User B (receiver) can read the request
    const userBContext = testEnv.authenticatedContext(USER_B)
    const userBDb = userBContext.firestore()
    await assertSucceeds(getDoc(doc(userBDb, 'friendRequests', 'request-1')))
  })

  it('third party cannot read friend request', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friendRequests', 'request-1'), {
        fromUserId: USER_A,
        fromUserName: 'User A',
        toUserId: USER_B,
        toUserName: 'User B',
        status: 'pending',
      })
    })

    // Test: User C cannot read the request
    const userCContext = testEnv.authenticatedContext(USER_C)
    const userCDb = userCContext.firestore()
    await assertFails(getDoc(doc(userCDb, 'friendRequests', 'request-1')))
  })

  it('user can create friend request where they are the sender', async () => {
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()

    await assertSucceeds(
      addDoc(collection(userADb, 'friendRequests'), {
        fromUserId: USER_A,
        fromUserName: 'User A',
        toUserId: USER_B,
        toUserName: 'User B',
        status: 'pending',
      })
    )
  })

  it('user cannot create friend request pretending to be someone else', async () => {
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()

    await assertFails(
      addDoc(collection(userADb, 'friendRequests'), {
        fromUserId: USER_B, // Pretending to be User B
        fromUserName: 'User B',
        toUserId: USER_C,
        toUserName: 'User C',
        status: 'pending',
      })
    )
  })

  it('sender can delete their sent request', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friendRequests', 'request-1'), {
        fromUserId: USER_A,
        fromUserName: 'User A',
        toUserId: USER_B,
        toUserName: 'User B',
        status: 'pending',
      })
    })

    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()
    await assertSucceeds(deleteDoc(doc(userADb, 'friendRequests', 'request-1')))
  })

  it('receiver can delete (reject) received request', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friendRequests', 'request-1'), {
        fromUserId: USER_A,
        fromUserName: 'User A',
        toUserId: USER_B,
        toUserName: 'User B',
        status: 'pending',
      })
    })

    const userBContext = testEnv.authenticatedContext(USER_B)
    const userBDb = userBContext.firestore()
    await assertSucceeds(deleteDoc(doc(userBDb, 'friendRequests', 'request-1')))
  })

  it('third party cannot delete friend request', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friendRequests', 'request-1'), {
        fromUserId: USER_A,
        fromUserName: 'User A',
        toUserId: USER_B,
        toUserName: 'User B',
        status: 'pending',
      })
    })

    const userCContext = testEnv.authenticatedContext(USER_C)
    const userCDb = userCContext.firestore()
    await assertFails(deleteDoc(doc(userCDb, 'friendRequests', 'request-1')))
  })
})

// ==========================================
// FRIENDS COLLECTION TESTS
// ==========================================
describe('Friends Collection', () => {
  it('user can read their own friend entries', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friends', 'friend-1'), {
        userId: USER_A,
        userName: 'User A',
        friendId: USER_B,
        friendName: 'User B',
      })
    })

    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()
    await assertSucceeds(getDoc(doc(userADb, 'friends', 'friend-1')))
  })

  it('user cannot read other users friend entries', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friends', 'friend-1'), {
        userId: USER_A,
        userName: 'User A',
        friendId: USER_B,
        friendName: 'User B',
      })
    })

    // User B tries to read User A's friend entry
    const userBContext = testEnv.authenticatedContext(USER_B)
    const userBDb = userBContext.firestore()
    await assertFails(getDoc(doc(userBDb, 'friends', 'friend-1')))
  })

  it('user can create friend entry for themselves (userId == auth.uid)', async () => {
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()

    await assertSucceeds(
      addDoc(collection(userADb, 'friends'), {
        userId: USER_A,
        userName: 'User A',
        friendId: USER_B,
        friendName: 'User B',
        addedAt: new Date(),
      })
    )
  })

  it('user can create friend entry for sender when accepting request (friendId == auth.uid)', async () => {
    // This is the KEY TEST for the bug fix!
    // When User B accepts User A's request, User B creates User A's friend entry
    // where userId is User A and friendId is User B
    const userBContext = testEnv.authenticatedContext(USER_B)
    const userBDb = userBContext.firestore()

    await assertSucceeds(
      addDoc(collection(userBDb, 'friends'), {
        userId: USER_A,      // User A (the request sender)
        userName: 'User A',
        friendId: USER_B,    // User B (the one accepting) - this is auth.uid
        friendName: 'User B',
        addedAt: new Date(),
      })
    )
  })

  it('user cannot create friend entry for unrelated users', async () => {
    // User A tries to create a friend entry between User B and User C
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()

    await assertFails(
      addDoc(collection(userADb, 'friends'), {
        userId: USER_B,      // Not User A
        userName: 'User B',
        friendId: USER_C,    // Not User A
        friendName: 'User C',
        addedAt: new Date(),
      })
    )
  })

  it('user can delete their own friend entry', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friends', 'friend-1'), {
        userId: USER_A,
        userName: 'User A',
        friendId: USER_B,
        friendName: 'User B',
      })
    })

    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()
    await assertSucceeds(deleteDoc(doc(userADb, 'friends', 'friend-1')))
  })

  it('user cannot delete friend entry they do not own', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'friends', 'friend-1'), {
        userId: USER_A,
        userName: 'User A',
        friendId: USER_B,
        friendName: 'User B',
      })
    })

    // User B tries to delete User A's friend entry
    const userBContext = testEnv.authenticatedContext(USER_B)
    const userBDb = userBContext.firestore()
    await assertFails(deleteDoc(doc(userBDb, 'friends', 'friend-1')))
  })
})

// ==========================================
// MATCHES COLLECTION TESTS
// ==========================================
describe('Matches Collection', () => {
  it('player can read match they participated in', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'matches', 'match-1'), {
        player1Id: USER_A,
        player1Name: 'User A',
        player2Id: USER_B,
        player2Name: 'User B',
        players: [USER_A, USER_B],
        winnerId: USER_A,
        winnerName: 'User A',
        createdBy: USER_A,
      })
    })

    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()
    await assertSucceeds(getDoc(doc(userADb, 'matches', 'match-1')))
  })

  it('non-player cannot read match', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'matches', 'match-1'), {
        player1Id: USER_A,
        player1Name: 'User A',
        player2Id: USER_B,
        player2Name: 'User B',
        players: [USER_A, USER_B],
        winnerId: USER_A,
        winnerName: 'User A',
        createdBy: USER_A,
      })
    })

    const userCContext = testEnv.authenticatedContext(USER_C)
    const userCDb = userCContext.firestore()
    await assertFails(getDoc(doc(userCDb, 'matches', 'match-1')))
  })

  it('user can create match where they are a player', async () => {
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()

    await assertSucceeds(
      addDoc(collection(userADb, 'matches'), {
        player1Id: USER_A,
        player1Name: 'User A',
        player2Id: USER_B,
        player2Name: 'User B',
        players: [USER_A, USER_B],
        winnerId: USER_A,
        winnerName: 'User A',
        date: new Date(),
        createdAt: new Date(),
        createdBy: USER_A,
      })
    )
  })

  it('user cannot create match where they are not a player', async () => {
    const userCContext = testEnv.authenticatedContext(USER_C)
    const userCDb = userCContext.firestore()

    await assertFails(
      addDoc(collection(userCDb, 'matches'), {
        player1Id: USER_A,
        player1Name: 'User A',
        player2Id: USER_B,
        player2Name: 'User B',
        players: [USER_A, USER_B], // User C is not in players
        winnerId: USER_A,
        winnerName: 'User A',
        date: new Date(),
        createdAt: new Date(),
        createdBy: USER_C,
      })
    )
  })

  it('creator can delete match', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'matches', 'match-1'), {
        player1Id: USER_A,
        player1Name: 'User A',
        player2Id: USER_B,
        player2Name: 'User B',
        players: [USER_A, USER_B],
        winnerId: USER_A,
        winnerName: 'User A',
        createdBy: USER_A,
      })
    })

    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()
    await assertSucceeds(deleteDoc(doc(userADb, 'matches', 'match-1')))
  })

  it('non-creator player cannot delete match', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'matches', 'match-1'), {
        player1Id: USER_A,
        player1Name: 'User A',
        player2Id: USER_B,
        player2Name: 'User B',
        players: [USER_A, USER_B],
        winnerId: USER_A,
        winnerName: 'User A',
        createdBy: USER_A,
      })
    })

    // User B (player but not creator) tries to delete
    const userBContext = testEnv.authenticatedContext(USER_B)
    const userBDb = userBContext.firestore()
    await assertFails(deleteDoc(doc(userBDb, 'matches', 'match-1')))
  })
})

// ==========================================
// INTEGRATION TESTS - FRIEND REQUEST FLOW
// ==========================================
describe('Friend Request Flow Integration', () => {
  it('complete friend request flow: send, accept, become friends', async () => {
    // Step 1: User A sends friend request to User B
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()

    const requestRef = await assertSucceeds(
      addDoc(collection(userADb, 'friendRequests'), {
        fromUserId: USER_A,
        fromUserName: 'User A',
        toUserId: USER_B,
        toUserName: 'User B',
        status: 'pending',
        createdAt: new Date(),
      })
    )

    // Step 2: User B reads the request
    const userBContext = testEnv.authenticatedContext(USER_B)
    const userBDb = userBContext.firestore()

    await assertSucceeds(getDoc(doc(userBDb, 'friendRequests', requestRef.id)))

    // Step 3: User B accepts - creates their own friend entry
    await assertSucceeds(
      addDoc(collection(userBDb, 'friends'), {
        userId: USER_B,
        userName: 'User B',
        friendId: USER_A,
        friendName: 'User A',
        addedAt: new Date(),
      })
    )

    // Step 4: User B creates User A's friend entry (the critical part!)
    await assertSucceeds(
      addDoc(collection(userBDb, 'friends'), {
        userId: USER_A,      // This is the sender
        userName: 'User A',
        friendId: USER_B,    // This is auth.uid
        friendName: 'User B',
        addedAt: new Date(),
      })
    )

    // Step 5: User B deletes the friend request
    await assertSucceeds(deleteDoc(doc(userBDb, 'friendRequests', requestRef.id)))
  })

  it('complete friend request flow: send, reject', async () => {
    // Step 1: User A sends friend request to User B
    const userAContext = testEnv.authenticatedContext(USER_A)
    const userADb = userAContext.firestore()

    const requestRef = await assertSucceeds(
      addDoc(collection(userADb, 'friendRequests'), {
        fromUserId: USER_A,
        fromUserName: 'User A',
        toUserId: USER_B,
        toUserName: 'User B',
        status: 'pending',
        createdAt: new Date(),
      })
    )

    // Step 2: User B rejects by deleting the request
    const userBContext = testEnv.authenticatedContext(USER_B)
    const userBDb = userBContext.firestore()

    await assertSucceeds(deleteDoc(doc(userBDb, 'friendRequests', requestRef.id)))
  })
})
