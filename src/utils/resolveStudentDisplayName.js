import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const ANONYMOUS_LABELS = new Set(['Anonymous', 'Anonymous Student', '']);

export async function resolveStudentDisplayName(feedbackData) {
  const stored = feedbackData.studentName?.trim();
  if (stored && !ANONYMOUS_LABELS.has(stored)) {
    return stored;
  }

  const uid = feedbackData.studentId || feedbackData.userId;
  if (!uid) {
    return stored || 'Anonymous Student';
  }

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      return (
        data.name ||
        data.displayName ||
        data.email?.split('@')[0] ||
        stored ||
        'Anonymous Student'
      );
    }
  } catch (err) {
    console.warn('Could not resolve student display name:', err);
  }

  return stored || 'Anonymous Student';
}
