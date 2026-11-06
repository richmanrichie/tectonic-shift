import { STORAGE_KEYS } from '../services/firebase';

export const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' }
];

export const SAMPLE_COMMITMENT = {
  fastingCommitment: '6:00 AM to 3:00 PM daily (Water only)',
  prayerMinutes: 45,
  prayerTimes: '5:30 AM – 6:00 AM & 9:30 PM – 9:45 PM',
  prayerAltTimes: '12:30 PM – 1:15 PM (Lunch break) or 6:30 PM commute',
  meditationMinutes: 20,
  meditationTimeRange: '6:00 AM – 6:20 AM',
  reflectionNotes:
    'Meditating on Psalm 63 & Isaiah 58. Asking for grace and consistency during midday fasting.'
};

export function getISOWeekInfo(dateInput = new Date()) {
  const date = new Date(
    Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  const year = date.getUTCFullYear();
  const weekKey = `${year}-W${String(weekNo).padStart(2, '0')}`;

  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - 3);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const rangeStr = `${fmt.format(monday)} – ${fmt.format(sunday)}, ${year}`;
  const weekLabel = `Week ${weekNo} (${rangeStr})`;

  return { weekKey, weekNo, year, rangeStr, weekLabel };
}

export function buildRecentWeeksList(count = 6) {
  const weeks = [];
  const now = new Date();
  for (let offset = 1; offset > 1 - count; offset--) {
    const d = new Date(now);
    d.setDate(now.getDate() + offset * 7);
    const info = getISOWeekInfo(d);
    weeks.push({
      ...info,
      isCurrent: offset === 0
    });
  }
  return weeks;
}

export function getTodayDayKey() {
  const jsDay = new Date().getDay();
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[jsDay];
}

export function createDefaultDailyStatus() {
  return {
    mon: 'pending',
    tue: 'pending',
    wed: 'pending',
    thu: 'pending',
    fri: 'pending',
    sat: 'pending',
    sun: 'pending'
  };
}

export function computeAdherenceMetrics(dailyStatus = {}) {
  let completedCount = 0;
  let partialCount = 0;
  let skippedCount = 0;

  DAYS_OF_WEEK.forEach(({ key }) => {
    const st = dailyStatus[key] || 'pending';
    if (st === 'completed') completedCount += 1;
    else if (st === 'partial') partialCount += 1;
    else if (st === 'skipped') skippedCount += 1;
  });

  let adherenceStatus = 'on-track';
  if (skippedCount >= 2) {
    adherenceStatus = 'skipping';
  } else if (skippedCount === 1 || partialCount >= 2) {
    adherenceStatus = 'slipping';
  }

  return {
    completedCount,
    partialCount,
    skippedCount,
    adherenceStatus
  };
}

export function getInitials(name = 'Participant') {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ensureSeedDemoData(weeksList) {
  const currentWeek = weeksList.find((w) => w.isCurrent) || weeksList[0];
  const prevWeek = weeksList[2] || weeksList[1];
  const twoWeeksAgo = weeksList[3] || weeksList[1];

  let participants = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_PARTICIPANTS) || 'null');
  let commitments = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_COMMITMENTS) || 'null');

  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    participants = [
      { uid: 'demo-p1', displayName: 'Hannah Mensah', cohortRole: 'Intercessor' },
      { uid: 'demo-p2', displayName: 'Daniel Osei', cohortRole: 'Participant' },
      { uid: 'demo-p3', displayName: 'Caleb Nwosu', cohortRole: 'Participant' },
      { uid: 'demo-p4', displayName: 'Miriam Adeyemi', cohortRole: 'Group Lead' },
      { uid: 'demo-p5', displayName: 'Jordan Kofi', cohortRole: 'Participant' },
      { uid: 'demo-p6', displayName: 'Esther Boateng', cohortRole: 'Participant' }
    ];
    localStorage.setItem(STORAGE_KEYS.DEMO_PARTICIPANTS, JSON.stringify(participants));
  }

  if (!commitments || typeof commitments !== 'object') {
    commitments = {
      [`demo-p1_${currentWeek.weekKey}`]: {
        uid: 'demo-p1',
        displayName: 'Hannah Mensah',
        weekKey: currentWeek.weekKey,
        weekLabel: currentWeek.weekLabel,
        fastingCommitment: '6:00 AM to 3:00 PM daily (Water only)',
        prayerMinutes: 60,
        prayerTimes: '5:00 AM – 5:40 AM & 9:30 PM – 9:50 PM',
        prayerAltTimes: '1:00 PM – 1:30 PM (Quiet room) or 7:00 PM',
        meditationMinutes: 30,
        meditationTimeRange: '5:40 AM – 6:10 AM',
        reflectionNotes: 'Focusing on Ephesians 3:14-21 for spiritual strength.',
        dailyStatus: {
          mon: 'completed',
          tue: 'completed',
          wed: 'completed',
          thu: 'completed',
          fri: 'pending',
          sat: 'pending',
          sun: 'pending'
        },
        ...computeAdherenceMetrics({
          mon: 'completed',
          tue: 'completed',
          wed: 'completed',
          thu: 'completed'
        }),
        updatedAtISO: new Date().toISOString()
      },
      [`demo-p2_${currentWeek.weekKey}`]: {
        uid: 'demo-p2',
        displayName: 'Daniel Osei',
        weekKey: currentWeek.weekKey,
        weekLabel: currentWeek.weekLabel,
        fastingCommitment: '6:00 AM to 2:00 PM daily (Water & tea only)',
        prayerMinutes: 30,
        prayerTimes: '6:00 AM – 6:30 AM',
        prayerAltTimes: '8:30 PM – 9:00 PM after work',
        meditationMinutes: 15,
        meditationTimeRange: '6:30 AM – 6:45 AM',
        reflectionNotes: 'Struggled with late shifts Tuesday and Wednesday—need prayer cover.',
        dailyStatus: {
          mon: 'completed',
          tue: 'skipped',
          wed: 'skipped',
          thu: 'skipped',
          fri: 'pending',
          sat: 'pending',
          sun: 'pending'
        },
        ...computeAdherenceMetrics({
          mon: 'completed',
          tue: 'skipped',
          wed: 'skipped',
          thu: 'skipped'
        }),
        updatedAtISO: new Date().toISOString()
      },
      [`demo-p3_${currentWeek.weekKey}`]: {
        uid: 'demo-p3',
        displayName: 'Caleb Nwosu',
        weekKey: currentWeek.weekKey,
        weekLabel: currentWeek.weekLabel,
        fastingCommitment: '6:00 AM to 3:00 PM Mon–Sat (Daniel Fast)',
        prayerMinutes: 45,
        prayerTimes: '5:30 AM – 6:15 AM',
        prayerAltTimes: '12:15 PM – 1:00 PM or 9:00 PM',
        meditationMinutes: 20,
        meditationTimeRange: '9:30 PM – 9:50 PM',
        reflectionNotes: 'Missed Tuesday morning prayer & backup slot; got back on track Thursday.',
        dailyStatus: {
          mon: 'completed',
          tue: 'skipped',
          wed: 'partial',
          thu: 'completed',
          fri: 'pending',
          sat: 'pending',
          sun: 'pending'
        },
        ...computeAdherenceMetrics({
          mon: 'completed',
          tue: 'skipped',
          wed: 'partial',
          thu: 'completed'
        }),
        updatedAtISO: new Date().toISOString()
      },
      [`demo-p4_${currentWeek.weekKey}`]: {
        uid: 'demo-p4',
        displayName: 'Miriam Adeyemi',
        weekKey: currentWeek.weekKey,
        weekLabel: currentWeek.weekLabel,
        fastingCommitment: '6:00 AM to 4:00 PM daily (Water only)',
        prayerMinutes: 60,
        prayerTimes: '4:45 AM – 5:30 AM & 10:00 PM – 10:15 PM',
        prayerAltTimes: '12:30 PM – 1:00 PM & 6:00 PM – 6:15 PM',
        meditationMinutes: 25,
        meditationTimeRange: '5:30 AM – 5:55 AM',
        reflectionNotes: 'Standing in the gap for our entire Tectonic Shift cohort.',
        dailyStatus: {
          mon: 'completed',
          tue: 'completed',
          wed: 'completed',
          thu: 'completed',
          fri: 'pending',
          sat: 'pending',
          sun: 'pending'
        },
        ...computeAdherenceMetrics({
          mon: 'completed',
          tue: 'completed',
          wed: 'completed',
          thu: 'completed'
        }),
        updatedAtISO: new Date().toISOString()
      },
      [`demo-p1_${prevWeek.weekKey}`]: {
        uid: 'demo-p1',
        displayName: 'Hannah Mensah',
        weekKey: prevWeek.weekKey,
        weekLabel: prevWeek.weekLabel,
        fastingCommitment: '6:00 AM to 3:00 PM daily (Water only)',
        prayerMinutes: 45,
        prayerTimes: '5:30 AM – 6:15 AM',
        prayerAltTimes: '1:00 PM – 1:45 PM',
        meditationMinutes: 20,
        meditationTimeRange: '6:15 AM – 6:35 AM',
        reflectionNotes: 'Completed all 7 days with joy.',
        dailyStatus: {
          mon: 'completed',
          tue: 'completed',
          wed: 'completed',
          thu: 'completed',
          fri: 'completed',
          sat: 'completed',
          sun: 'completed'
        },
        ...computeAdherenceMetrics({
          mon: 'completed',
          tue: 'completed',
          wed: 'completed',
          thu: 'completed',
          fri: 'completed',
          sat: 'completed',
          sun: 'completed'
        }),
        updatedAtISO: new Date(Date.now() - 6 * 86400000).toISOString()
      },
      [`demo-p1_${twoWeeksAgo.weekKey}`]: {
        uid: 'demo-p1',
        displayName: 'Hannah Mensah',
        weekKey: twoWeeksAgo.weekKey,
        weekLabel: twoWeeksAgo.weekLabel,
        fastingCommitment: '6:00 AM to 2:00 PM daily (Water only)',
        prayerMinutes: 30,
        prayerTimes: '6:00 AM – 6:30 AM',
        prayerAltTimes: '8:00 PM – 8:30 PM',
        meditationMinutes: 15,
        meditationTimeRange: '6:30 AM – 6:45 AM',
        reflectionNotes: 'Week 1 foundation.',
        dailyStatus: {
          mon: 'completed',
          tue: 'completed',
          wed: 'partial',
          thu: 'completed',
          fri: 'completed',
          sat: 'completed',
          sun: 'completed'
        },
        ...computeAdherenceMetrics({
          mon: 'completed',
          tue: 'completed',
          wed: 'partial',
          thu: 'completed',
          fri: 'completed',
          sat: 'completed',
          sun: 'completed'
        }),
        updatedAtISO: new Date(Date.now() - 13 * 86400000).toISOString()
      }
    };
    localStorage.setItem(STORAGE_KEYS.DEMO_COMMITMENTS, JSON.stringify(commitments));
  }
}

