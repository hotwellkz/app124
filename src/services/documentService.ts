import { collection, query, where, orderBy, limit, getDocs, runTransaction, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const COUNTER_COLLECTION = 'documentCounters';
const DOCUMENT_NUMBER_KEY = 'current_document_number';

export const getNextDocumentNumber = async (type: 'income' | 'expense'): Promise<string> => {
  try {
    const savedNumber = localStorage.getItem(`${DOCUMENT_NUMBER_KEY}_${type}`);
    if (savedNumber) {
      return savedNumber;
    }

    return await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, COUNTER_COLLECTION, type);
      const counterDoc = await transaction.get(counterRef);
      
      let nextNumber = 1;
      
      if (counterDoc.exists()) {
        nextNumber = (counterDoc.data().lastNumber || 0) + 1;
      }

      transaction.set(counterRef, {
        lastNumber: nextNumber,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const formattedNumber = String(nextNumber).padStart(6, '0');
      localStorage.setItem(`${DOCUMENT_NUMBER_KEY}_${type}`, formattedNumber);

      return formattedNumber;
    });
  } catch (error) {
    console.error('Error generating document number:', error);
    throw error;
  }
};

export const clearSavedDocumentNumber = (type: 'income' | 'expense') => {
  localStorage.removeItem(`${DOCUMENT_NUMBER_KEY}_${type}`);
};