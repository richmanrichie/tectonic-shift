import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTectonic } from '../context/TectonicContext';
import {
  createDefaultDailyStatus,
  DAYS_OF_WEEK,
  getTodayDayKey,
  SAMPLE_COMMITMENT
} from '../utils/weeks';

export default function DashboardPage() {
  const {
    weeksList,
    currentWeekInfo,
    currentUser,
    commitmentsById,
    selectedFormWeek,
    setSelectedFormWeek,
    saveCommitment,
    showToast
  } = useTectonic();
  const navigate = useNavigate();

  const [showExampleGuide, setShowExampleGuide] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('');

  const [fastingCommitment, setFastingCommitment] = useState('');
  const [prayerMinutes, setPrayerMinutes] = useState('');
  const [prayerTimes, setPrayerTimes] = useState('');
  const [prayerAltTimes, setPrayerAltTimes] = useState('');
  const [meditationMinutes, setMeditationMinutes] = useState('');
  const [meditationTimeRange, setMeditationTimeRange] = useState('');
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [dailyStatus, setDailyStatus] = useState(createDefaultDailyStatus);

  const selectedWeekObj =
    weeksList.find((w) => w.weekKey === selectedFormWeek) || currentWeekInfo;

  const existingCommitment = currentUser
    ? commitmentsById[`${currentUser.uid}_${selectedFormWeek}`]
    : null;

  useEffect(() => {
    if (!currentUser) {
      setFastingCommitment('');
      setPrayerMinutes('');
      setPrayerTimes('');
      setPrayerAltTimes('');
      setMeditationMinutes('');
      setMeditationTimeRange('');
      setReflectionNotes('');
      setDailyStatus(createDefaultDailyStatus());
      setLastSavedText('Sign in to load or save your commitment');
      return;
    }

    if (existingCommitment) {
      setFastingCommitment(existingCommitment.fastingCommitment || '');
      setPrayerMinutes(String(existingCommitment.prayerMinutes || ''));
      setPrayerTimes(existingCommitment.prayerTimes || '');
      setPrayerAltTimes(existingCommitment.prayerAltTimes || '');
      setMeditationMinutes(String(existingCommitment.meditationMinutes || ''));
      setMeditationTimeRange(existingCommitment.meditationTimeRange || '');
      setReflectionNotes(existingCommitment.reflectionNotes || '');
      setDailyStatus({
        ...createDefaultDailyStatus(),
        ...(existingCommitment.dailyStatus || {})
      });
      setLastSavedText(`Saved for ${selectedWeekObj.weekKey} • You can update anytime`);
    } else {
      setFastingCommitment('');
      setPrayerMinutes('');
      setPrayerTimes('');
      setPrayerAltTimes('');
      setMeditationMinutes('');
      setMeditationTimeRange('');
      setReflectionNotes('');
      setDailyStatus(createDefaultDailyStatus());
      setLastSavedText(`No commitment saved yet for ${selectedWeekObj.weekKey}`);
    }
  }, [currentUser, existingCommitment, selectedFormWeek, selectedWeekObj.weekKey]);

  const handleFillSample = () => {
    setFastingCommitment(SAMPLE_COMMITMENT.fastingCommitment);
    setPrayerMinutes(String(SAMPLE_COMMITMENT.prayerMinutes));
    setPrayerTimes(SAMPLE_COMMITMENT.prayerTimes);
    setPrayerAltTimes(SAMPLE_COMMITMENT.prayerAltTimes);
    setMeditationMinutes(String(SAMPLE_COMMITMENT.meditationMinutes));
    setMeditationTimeRange(SAMPLE_COMMITMENT.meditationTimeRange);
    setReflectionNotes(SAMPLE_COMMITMENT.reflectionNotes);
    showToast('Pre-filled with the Tectonic Shift sample commitment!');
  };

  const handleMarkTodayKept = () => {
    const todayKey = getTodayDayKey();
    setDailyStatus((prev) => ({
      ...prev,
      [todayKey]: 'completed'
    }));
    showToast(
      `Marked ${todayKey.toUpperCase()} as Kept! Click "Save Commitment" to publish.`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in first to save your weekly commitment.');
      navigate('/auth');
      return;
    }

    if (
      !fastingCommitment.trim() ||
      !prayerMinutes ||
      Number(prayerMinutes) <= 0 ||
      !prayerTimes.trim() ||
      !prayerAltTimes.trim() ||
      !meditationMinutes ||
      Number(meditationMinutes) <= 0 ||
      !meditationTimeRange.trim()
    ) {
      showToast('Please complete all required Fasting, Prayer, and Meditation fields.');
      return;
    }

    setSaving(true);
    try {
      await saveCommitment(selectedFormWeek, {
        fastingCommitment,
        prayerMinutes,
        prayerTimes,
        prayerAltTimes,
        meditationMinutes,
        meditationTimeRange,
        reflectionNotes,
        dailyStatus
      });
      setLastSavedText(
        `Last saved at ${new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}`
      );
    } catch (err) {
      showToast(err.message || 'Could not save commitment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="view-section">
      {!currentUser && (
        <div className="callout callout--warning">
          <div>
            <strong>Sign in required to save your weekly commitment</strong>
            <p>
              You can preview the form and example guide below, but please sign in or
              create an account to submit your commitment under your name.
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => navigate('/auth')}
          >
            Sign In Now
          </button>
        </div>
      )}

      <div className="dashboard-header-card">
        <div>
          <span className="eyebrow">WEEKLY COVENANT DASHBOARD</span>
          <h2 className="section-title">
            Welcome, {currentUser ? currentUser.displayName : 'Guest Participant'}
          </h2>
          <p className="section-subtitle">
            Target Program Week: {selectedWeekObj.weekLabel}
          </p>
        </div>

        <div className="dashboard-week-controls">
          <label htmlFor="formWeekSelect" className="field-label">
            Target Week
          </label>
          <select
            id="formWeekSelect"
            className="input-select"
            value={selectedFormWeek}
            onChange={(e) => setSelectedFormWeek(e.target.value)}
          >
            {weeksList.map((w) => (
              <option key={w.weekKey} value={w.weekKey}>
                {w.weekLabel}
                {w.isCurrent ? ' • Current' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Example Guide Toggle Section */}
      <div className="example-guide-wrapper">
        <div className="example-guide-bar">
          <div>
            <h3 className="example-guide-heading">
              📖 Tectonic Shift Commitment Example Guide
            </h3>
            <p className="example-guide-caption">
              Not sure how to structure your fasting, prayer, and meditation rhythm? View
              our recommended sample covenant.
            </p>
          </div>
          <div className="example-guide-actions">
            <button
              className="btn btn-outline btn-sm"
              type="button"
              aria-expanded={showExampleGuide}
              onClick={() => setShowExampleGuide((prev) => !prev)}
            >
              {showExampleGuide ? 'Hide Example Guide' : 'Show Example Guide'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={handleFillSample}
            >
              Auto-Fill Sample
            </button>
          </div>
        </div>

        {showExampleGuide && (
          <div className="example-guide-panel">
            <div className="example-grid">
              <div className="example-item">
                <span className="example-tag">1. Fasting Commitment</span>
                <strong>6:00 AM to 3:00 PM daily (Water only)</strong>
                <p>
                  Specify your daily fasting window and type (e.g., water only, Daniel
                  fast, or liquid fast) and any exceptions.
                </p>
              </div>
              <div className="example-item">
                <span className="example-tag">2. Prayer Commitment</span>
                <strong>
                  45 Minutes Total • 5:30 AM – 6:00 AM &amp; 9:30 PM – 9:45 PM
                </strong>
                <p>
                  <em>Alternative Times:</em> 12:30 PM – 1:00 PM (lunch hour) or 7:00 PM
                  commute if morning session is disrupted.
                </p>
              </div>
              <div className="example-item">
                <span className="example-tag">3. Meditation Commitment</span>
                <strong>20 Minutes • 6:00 AM – 6:20 AM</strong>
                <p>
                  Focused Scripture meditation and stillness immediately following morning
                  prayer.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Commitment Form */}
      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <h3 className="form-section-title">1. Fasting Commitment</h3>
          <p className="form-section-desc">
            Define your fasting window and dietary parameters for every day this week.
          </p>

          <div className="form-group">
            <label htmlFor="fastingCommitment" className="field-label">
              Fasting Schedule &amp; Type <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="fastingCommitment"
              className="input-text"
              placeholder="e.g., 6:00 AM to 3:00 PM daily (Water only)"
              maxLength={300}
              value={fastingCommitment}
              onChange={(e) => setFastingCommitment(e.target.value)}
              required
            />
            <span className="field-hint">
              Example: &quot;6:00 AM to 3:00 PM daily (Water only)&quot; or &quot;6:00 AM
              to 6:00 PM Mon–Fri (Daniel Fast)&quot;
            </span>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">2. Prayer Commitment</h3>
          <p className="form-section-desc">
            Set your daily prayer duration, primary scheduled times, and backup times so
            life disruptions never cause a full skip.
          </p>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="prayerMinutes" className="field-label">
                Daily Prayer Duration (Minutes) <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="prayerMinutes"
                className="input-text"
                placeholder="e.g., 45"
                min={5}
                max={720}
                value={prayerMinutes}
                onChange={(e) => setPrayerMinutes(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prayerTimes" className="field-label">
                Primary Prayer Time(s) <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="prayerTimes"
                className="input-text"
                placeholder="e.g., 5:30 AM – 6:00 AM & 9:30 PM – 9:45 PM"
                maxLength={200}
                value={prayerTimes}
                onChange={(e) => setPrayerTimes(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="prayerAltTimes" className="field-label">
              Alternative / Backup Prayer Time(s) <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="prayerAltTimes"
              className="input-text"
              placeholder="e.g., 12:30 PM – 1:15 PM (Lunch break) or 6:30 PM – 7:15 PM"
              maxLength={200}
              value={prayerAltTimes}
              onChange={(e) => setPrayerAltTimes(e.target.value)}
              required
            />
            <span className="field-hint">
              Having a pre-decided alternative slot prevents skipping when your primary
              slot is interrupted.
            </span>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">3. Meditation Commitment</h3>
          <p className="form-section-desc">
            Dedicated quiet time in Scripture meditation and spiritual reflection.
          </p>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="meditationMinutes" className="field-label">
                Daily Meditation Duration (Minutes){' '}
                <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="meditationMinutes"
                className="input-text"
                placeholder="e.g., 20"
                min={5}
                max={720}
                value={meditationMinutes}
                onChange={(e) => setMeditationMinutes(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meditationTimeRange" className="field-label">
                Meditation Time Range <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="meditationTimeRange"
                className="input-text"
                placeholder="e.g., 6:00 AM – 6:20 AM"
                maxLength={200}
                value={meditationTimeRange}
                onChange={(e) => setMeditationTimeRange(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="daily-header-row">
            <div>
              <h3 className="form-section-title">
                4. Daily Accountability Check-In (Mon – Sun)
              </h3>
              <p className="form-section-desc">
                Log your honest daily adherence. This updates the public Community
                Progress board so your cohort can celebrate with you or hold you
                accountable if you skip.
              </p>
            </div>
            <div className="quick-day-actions">
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={handleMarkTodayKept}
              >
                ✓ Mark Today Kept
              </button>
            </div>
          </div>

          <div className="daily-checkin-grid">
            {DAYS_OF_WEEK.map(({ key, label }) => (
              <div key={key} className="day-checkin-card">
                <label className="day-checkin-title" htmlFor={`day-status-${key}`}>
                  {label}
                </label>
                <select
                  id={`day-status-${key}`}
                  className="day-status-select"
                  value={dailyStatus[key] || 'pending'}
                  onChange={(e) =>
                    setDailyStatus((prev) => ({
                      ...prev,
                      [key]: e.target.value
                    }))
                  }
                >
                  <option value="pending">· Pending</option>
                  <option value="completed">✓ Kept</option>
                  <option value="partial">◐ Partial</option>
                  <option value="skipped">✕ Skipped</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="reflectionNotes" className="field-label">
              Weekly Focus Scripture / Accountability Note (Optional)
            </label>
            <textarea
              id="reflectionNotes"
              className="input-textarea"
              rows={2}
              maxLength={500}
              placeholder="e.g., Meditating on Psalm 63. Please hold me accountable on Wednesday & Friday afternoons!"
              value={reflectionNotes}
              onChange={(e) => setReflectionNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="form-footer">
          <span className="last-saved-text">{lastSavedText}</span>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : existingCommitment
              ? 'Update Commitment'
              : 'Save Commitment'}
          </button>
        </div>
      </form>
    </section>
  );
}

