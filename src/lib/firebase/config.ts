import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAICwewb9nIfENQH-gOJgkpQXZKBity9ck",
  authDomain: "accounting-c3c06.firebaseapp.com",
  projectId: "accounting-c3c06",
  storageBucket: "accounting-c3c06.appspot.com",
  messagingSenderId: "670119019137",
  appId: "1:670119019137:web:f5c57a1a6f5ef05c720380"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Enable offline persistence with unlimited cache size
enableIndexedDbPersistence(db, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence.');
  }
});

export default db;