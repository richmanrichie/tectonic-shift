import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  initializeFirebaseServices,
  STORAGE_KEYS
} from '../services/firebase';
import {
  buildRecentWeeksList,
  computeAdherenceMetrics,
  ensureSeedDemoData
} from '../utils/weeks';

const TectonicContext = createContext(null);

export function TectonicProvider({ children }) {
  const weeksList = useMemo(() => buildRecentWeeksList(6), []);
  const currentWeekInfo = useMemo(
    () => weeksList.find((w) => w.isCurrent) || weeksList[0],
    [weeksList]
  );

  const [firebaseState] = useState(() => {
    ensureSeedDemoData(weeksList);
    return initializeFirebaseServices();
  });

  const { isLive: isFirebaseLive, auth, db, config: activeConfig } = firebaseState;

  const [currentUser, setCurrentUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [commitmentsById, setCommitmentsById] = useState({});
  const [selectedFormWeek, setSelectedFormWeek] = useState(currentWeekInfo.weekKey);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3600);
  };

  const ensureParticipantDoc = async (userObj) => {
    if (!isFirebaseLive || !db || !userObj) return;
    try {
      const ref = doc(db, 'participants', userObj.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: userObj.uid,
          displayName: userObj.displayName.slice(0, 80),
          cohortRole: 'Participant',
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('Could not upsert participant profile doc:', err);
    }
  };

  const loadDemoData = () => {
    const savedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_USER) || 'null');
    if (savedUser === null) {
      const defaultUser = {
        uid: 'demo-p1',
        displayName: 'Hannah Mensah',
        email: 'hannah.mensah@example.com'
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(defaultUser));
      setCurrentUser(defaultUser);
    } else if (savedUser && savedUser.uid) {
      setCurrentUser(savedUser);
    } else {
      setCurrentUser(null);
    }

    setParticipants(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_PARTICIPANTS) || '[]')
    );
    setCommitmentsById(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_COMMITMENTS) || '{}')
    );
  };

  useEffect(() => {
    if (!isFirebaseLive) {
      loadDemoData();
      return undefined;
    }

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const displayName =
          user.displayName || (user.email ? user.email.split('@')[0] : 'Participant');
        const userObj = {
          uid: user.uid,
          displayName,
          email: user.email || ''
        };
        setCurrentUser(userObj);
        await ensureParticipantDoc(userObj);
      } else {
        setCurrentUser(null);
      }
    });

    const unsubParticipants = onSnapshot(
      collection(db, 'participants'),
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() });
        });
        setParticipants(list);
      },
      (err) => console.warn('Participants listener warning:', err)
    );

    const unsubCommitments = onSnapshot(
      collection(db, 'commitments'),
      (snap) => {
        const map = {};
        snap.forEach((docSnap) => {
          map[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });
        setCommitmentsById(map);
      },
      (err) => console.warn('Commitments listener warning:', err)
    );

    return () => {
      unsubAuth();
      unsubParticipants();
      unsubCommitments();
    };
  }, [isFirebaseLive, auth, db]);

  // Save or update weekly commitment
  const saveCommitment = async (weekKey, formValues) => {
    if (!currentUser) {
      throw new Error('Please sign in first to save your commitment.');
    }

    const weekObj = weeksList.find((w) => w.weekKey === weekKey) || currentWeekInfo;
    const docId = `${currentUser.uid}_${weekKey}`;
    const metrics = computeAdherenceMetrics(formValues.dailyStatus);

    const payloadBase = {
      uid: currentUser.uid,
      displayName: currentUser.displayName.slice(0, 80),
      weekKey: weekObj.weekKey,
      weekLabel: weekObj.weekLabel,
      fastingCommitment: formValues.fastingCommitment.trim().slice(0, 300),
      prayerMinutes: Math.min(720, Math.max(1, Math.round(Number(formValues.prayerMinutes)))),
      prayerTimes: formValues.prayerTimes.trim().slice(0, 200),
      prayerAltTimes: formValues.prayerAltTimes.trim().slice(0, 200),
      meditationMinutes: Math.min(
        720,
        Math.max(1, Math.round(Number(formValues.meditationMinutes)))
      ),
      meditationTimeRange: formValues.meditationTimeRange.trim().slice(0, 200),
      reflectionNotes: (formValues.reflectionNotes || '').trim().slice(0, 500),
      dailyStatus: { ...formValues.dailyStatus },
      completedCount: metrics.completedCount,
      skippedCount: metrics.skippedCount,
      adherenceStatus: metrics.adherenceStatus
    };

    if (isFirebaseLive && db) {
      const ref = doc(db, 'commitments', docId);
      const existingSnap = await getDoc(ref);
      await setDoc(ref, {
        ...payloadBase,
        createdAt: existingSnap.exists()
          ? existingSnap.data().createdAt
          : serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const storedCommitments = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.DEMO_COMMITMENTS) || '{}'
      );
      storedCommitments[docId] = {
        ...payloadBase,
        updatedAtISO: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_COMMITMENTS, JSON.stringify(storedCommitments));

      const storedParticipants = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.DEMO_PARTICIPANTS) || '[]'
      );
      if (!storedParticipants.some((p) => p.uid === currentUser.uid)) {
        storedParticipants.push({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          cohortRole: 'Participant'
        });
        localStorage.setItem(
          STORAGE_KEYS.DEMO_PARTICIPANTS,
          JSON.stringify(storedParticipants)
        );
        setParticipants(storedParticipants);
      }
      setCommitmentsById(storedCommitments);
    }

    showToast(`Commitment saved for ${weekObj.weekKey}!`);
  };

  // Sign In / Sign Up
  const authenticateWithEmail = async ({ mode, email, password, displayName }) => {
    if (isFirebaseLive && auth) {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        const userObj = {
          uid: cred.user.uid,
          displayName,
          email: cred.user.email
        };
        setCurrentUser(userObj);
        await ensureParticipantDoc(userObj);
        showToast(`Welcome to Tectonic Shift, ${displayName}!`);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Signed in successfully!');
      }
    } else {
      const derivedName =
        displayName ||
        email
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const uid = `demo-${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const userObj = { uid, displayName: derivedName, email };
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(userObj));

      const storedParticipants = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.DEMO_PARTICIPANTS) || '[]'
      );
      if (!storedParticipants.some((p) => p.uid === uid)) {
        storedParticipants.push({
          uid,
          displayName: derivedName,
          cohortRole: 'Participant'
        });
        localStorage.setItem(
          STORAGE_KEYS.DEMO_PARTICIPANTS,
          JSON.stringify(storedParticipants)
        );
      }
      loadDemoData();
      showToast(`Signed in as ${derivedName}`);
    }
  };

  const signInWithGoogle = async () => {
    if (isFirebaseLive && auth) {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const name = res.user.displayName || 'Participant';
      await ensureParticipantDoc({
        uid: res.user.uid,
        displayName: name,
        email: res.user.email
      });
      showToast(`Signed in with Google as ${name}`);
    } else {
      const demoGoogleUser = {
        uid: 'demo-p1',
        displayName: 'Hannah Mensah',
        email: 'hannah.mensah@gmail.com'
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(demoGoogleUser));
      loadDemoData();
      showToast('Signed in with Google (Demo Cohort)');
    }
  };

  const logOut = async () => {
    if (isFirebaseLive && auth) {
      await signOut(auth);
    } else {
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify({}));
      loadDemoData();
    }
    showToast('Signed out.');
  };

  const updateUserDisplayName = async (newName) => {
    const trimmed = newName.trim();
    if (!trimmed || !currentUser) return;
    const updatedUser = { ...currentUser, displayName: trimmed };
    setCurrentUser(updatedUser);

    if (isFirebaseLive && auth?.currentUser) {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await setDoc(
        doc(db, 'participants', currentUser.uid),
        {
          uid: currentUser.uid,
          displayName: trimmed.slice(0, 80),
          cohortRole: 'Participant',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } else {
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(updatedUser));
      const storedParticipants = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.DEMO_PARTICIPANTS) || '[]'
      );
      const idx = storedParticipants.findIndex((p) => p.uid === currentUser.uid);
      if (idx >= 0) storedParticipants[idx].displayName = trimmed;
      localStorage.setItem(
        STORAGE_KEYS.DEMO_PARTICIPANTS,
        JSON.stringify(storedParticipants)
      );
      loadDemoData();
    }
    showToast('Display name updated!');
  };

  const value = {
    isFirebaseLive,
    activeConfig,
    weeksList,
    currentWeekInfo,
    currentUser,
    participants,
    commitmentsById,
    selectedFormWeek,
    setSelectedFormWeek,
    toastMessage,
    showToast,
    saveCommitment,
    authenticateWithEmail,
    signInWithGoogle,
    logOut,
    updateUserDisplayName
  };

  return <TectonicContext.Provider value={value}>{children}</TectonicContext.Provider>;
}

export function useTectonic() {
  const ctx = useContext(TectonicContext);
  if (!ctx) {
    throw new Error('useTectonic must be used inside a TectonicProvider');
  }
  return ctx;
}

