import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  increment,
  addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { QRCodeRecord, ScanRecord, UserProfile, UserPlan } from './types';
import { PLANS } from './plans';

// High entropy shortCode generator
export function generateShortCode(length = 6): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let result = '';
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null;
  
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint8Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

// User Profile Operations
export async function getOrCreateUserProfile(user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data() as UserProfile;
    return {
      ...data,
      uid: user.uid,
    };
  }

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || 'usuario@meuqrcode.com.br',
    displayName: user.displayName || 'Usuário',
    photoURL: user.photoURL || null,
    plan: 'free',
    subscriptionStatus: 'active',
    dynamicQRLimit: PLANS.free.dynamicQRLimit,
    totalScansLimit: PLANS.free.scansLimit as number,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Error persisting user to firestore, using in-memory representation:', err);
  }

  return newProfile;
}

// QR Code CRUD Operations
export async function getUserQRCodes(userId: string): Promise<QRCodeRecord[]> {
  try {
    const q = query(
      collection(db, 'qrcodes'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as QRCodeRecord));
  } catch (err) {
    console.warn('Fallback getting user QR codes:', err);
    // If running in local client state or index not ready, fetch collection by userId
    try {
      const qSimple = query(collection(db, 'qrcodes'), where('userId', '==', userId));
      const snap = await getDocs(qSimple);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as QRCodeRecord));
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }
}

export async function getQRCodeByShortCode(shortCode: string): Promise<QRCodeRecord | null> {
  try {
    const q = query(collection(db, 'qrcodes'), where('shortCode', '==', shortCode), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as QRCodeRecord;
    }
    return null;
  } catch (err) {
    console.error('Error fetching QR code by shortCode:', err);
    return null;
  }
}

export async function createQRCode(record: Omit<QRCodeRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalScans'>, userPlan: UserPlan = 'free'): Promise<QRCodeRecord> {
  // Check quota for dynamic QR codes if needed
  if (record.isDynamic) {
    const userCodes = await getUserQRCodes(record.userId);
    const dynamicCount = userCodes.filter(c => c.isDynamic).length;
    const limitMax = PLANS[userPlan]?.dynamicQRLimit || 1;
    if (dynamicCount >= limitMax) {
      throw new Error(`Limite de ${limitMax} QR Codes dinâmicos atingido para o plano ${PLANS[userPlan].name}. Faça upgrade para criar mais!`);
    }
  }

  const id = `qr_${Date.now()}_${generateShortCode(4)}`;
  const now = new Date().toISOString();

  const newRecord: QRCodeRecord = {
    ...record,
    id,
    totalScans: 0,
    scansThisMonth: 0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db, 'qrcodes', id);
  await setDoc(docRef, {
    ...newRecord,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newRecord;
}

export async function updateQRCode(
  qrId: string, 
  updates: Partial<Omit<QRCodeRecord, 'id' | 'userId' | 'createdAt' | 'totalScans'>>
): Promise<void> {
  const docRef = doc(db, 'qrcodes', qrId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleQRCodeActive(qrId: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  const docRef = doc(db, 'qrcodes', qrId);
  await updateDoc(docRef, {
    isActive: newStatus,
    updatedAt: serverTimestamp(),
  });
  return newStatus;
}

export async function deleteQRCode(qrId: string): Promise<void> {
  const docRef = doc(db, 'qrcodes', qrId);
  await deleteDoc(docRef);
}

// Record scan event
export async function recordScanEvent(
  qr: QRCodeRecord,
  clientInfo: {
    deviceType?: 'mobile' | 'desktop' | 'tablet' | 'bot';
    os?: string;
    browser?: string;
    country?: string;
    city?: string;
    referer?: string;
  }
): Promise<void> {
  try {
    // 1. Increment totalScans and update lastScannedAt on the QR document
    const qrRef = doc(db, 'qrcodes', qr.id);
    await updateDoc(qrRef, {
      totalScans: increment(1),
      scansThisMonth: increment(1),
      lastScannedAt: new Date().toISOString(),
    });

    // 2. Add scan record for rich analytics
    await addDoc(collection(db, 'scans'), {
      qrId: qr.id,
      userId: qr.userId,
      shortCode: qr.shortCode,
      timestamp: serverTimestamp(),
      country: clientInfo.country || 'Brasil',
      city: clientInfo.city || 'São Paulo',
      deviceType: clientInfo.deviceType || 'mobile',
      os: clientInfo.os || 'Android',
      browser: clientInfo.browser || 'Chrome',
      referer: clientInfo.referer || 'Direto',
    });
  } catch (err) {
    console.error('Non-blocking scan recording error:', err);
  }
}

// Fetch scans for analytics
export async function getScansForUser(userId: string, limitCount = 100): Promise<ScanRecord[]> {
  try {
    const q = query(
      collection(db, 'scans'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        qrId: data.qrId,
        userId: data.userId,
        shortCode: data.shortCode,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
        country: data.country,
        city: data.city,
        deviceType: data.deviceType,
        os: data.os,
        browser: data.browser,
        referer: data.referer,
      };
    });
  } catch (err) {
    console.warn('Fallback fetching scans for user:', err);
    try {
      const qSimple = query(collection(db, 'scans'), where('userId', '==', userId), limit(limitCount));
      const snap = await getDocs(qSimple);
      return snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: new Date().toISOString() } as ScanRecord));
    } catch {
      return [];
    }
  }
}
