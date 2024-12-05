import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from 'firebase/auth';
import { app } from './config';

export const auth = getAuth(app);

export const registerUser = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (displayName: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Пользователь не авторизован');

  try {
    await updateProfile(user, { displayName });
  } catch (error) {
    throw error;
  }
};

export const updateUserPassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Пользователь не авторизован');

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } catch (error) {
    throw error;
  }
};

export const deleteUserAccount = async (password: string) => {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Пользователь не авторизован');

  try {
    // Повторная аутентификация перед удалением
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    // Удаление пользователя
    await deleteUser(user);
  } catch (error) {
    throw error;
  }
};