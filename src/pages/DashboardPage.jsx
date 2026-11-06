import React, { useEffect, useState } from 'react';
import WeeklyCommentsFeed from '../components/WeeklyCommentsFeed';
import { useTectonic } from '../context/TectonicContext';
import {
  computeAdherenceMetrics,
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
    toggleCommitmentPillar,
    getNormalizedPillarChecks,
    showToast
  } = useTectonic();

  const [isEditing, setIsEditing] = useState(false);
  const [activeCheckDay, setActiveCheckDay] = useState(getTodayDayKey);
  const [showExampleGuide, setShowExampleGuide] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fastingCommitment, setFastingCommitment] = useState('');
  const [prayerMinutes, setPrayerMinutes] = useState('');
  const [prayerTimes, setPrayerTimes] = useState('');
  const [prayerAltTimes, setPrayerAltTimes] = useState('');
  const [meditationMinutes, setMeditationMinutes] = useState('');
  const [meditationTimeRange, setMeditationTimeRange] = useState('');
  const [reflectionNotes, setReflectionNotes] = useState('');

  const selectedWeekObj =
    weeksList.find((w) => w.weekKey === selectedFormWeek) || currentWeekInfo;

  const existingCommitment = currentUser
    ? commitmentsById[`${currentUser.uid}_${selectedFormWeek}`]
    : null;

  // Reset to non-editable mode whenever the user switches weeks
  useEffect(() => {
    setIsEditing(false);
    setShowExampleGuide(false);
  }, [selectedFormWeek]);

  // Sync form fields when entering edit mode or when existingCommitment updates
  useEffect(() => {
    if (existingCommitment) {
      setFastingCommitment(existingCommitment.fastingCommitment || '');
      setPrayerMinutes(String(existingCommitment.prayerMinutes || ''));
      setPrayerTimes(existingCommitment.prayerTimes || '');
      setPrayerAltTimes(existingCommitment.prayerAltTimes || '');
      setMeditationMinutes(String(existingCommitment.meditationMinutes || ''));
      setMeditationTimeRange(existingCommitment.meditationTimeRange || '');
      setReflectionNotes(existingCommitment.reflectionNotes || '');
    } else {
      setFastingCommitment('');
      setPrayerMinutes('');
      setPrayerTimes('');
      setPrayerAltTimes('');
      setMeditationMinutes('');
      setMeditationTimeRange('');
      setReflectionNotes('');
    }
  }, [existingCommitment, selectedFormWeek]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        reflectionNotes
      });
      setIsEditing(false);
    } catch (err) {
      showToast(err.message || 'Could not save commitment');
    } finally {
      setSaving(false);
    }
  };

  // Compute read-only metrics & per-pillar check states when commitment exists
  const readOnlyMetrics = existingCommitment
    ? computeAdherenceMetrics(existingCommitment.dailyStatus || {})
    : null;

  const readOnlyBadgeLabel = readOnlyMetrics
    ? readOnlyMetrics.adherenceStatus === 'skipping'
      ? `🚨 Skipping (${readOnlyMetrics.skippedCount} days skipped)`
      : readOnlyMetrics.adherenceStatus === 'slipping'
      ? `⚠️ Slipping (${readOnlyMetrics.skippedCount} skip / ${readOnlyMetrics.partialCount} partial)`
      : `✅ On Track (${readOnlyMetrics.completedCount}/7 days done)`
    : '';

  const pillarChecksByDay = getNormalizedPillarChecks(existingCommitment);
  const activeDayChecks = pillarChecksByDay[activeCheckDay] || {
    fasting: false,
    prayer: false,
    meditation: false
  };
  const activeDayCheckedCount =
    (activeDayChecks.fasting ? 1 : 0) +
    (activeDayChecks.prayer ? 1 : 0) +
    (activeDayChecks.meditation ? 1 : 0);
  const activeDayLabel =
    DAYS_OF_WEEK.find((d) => d.key === activeCheckDay)?.label || 'Today';

  return (
    <section className="view-section">
      {/* Top Dashboard Greeting & Week Selector */}
      <div className="dashboard-header-card">
        <div>
          <span className="eyebrow">WEEKLY COVENANT DASHBOARD</span>
          <h2 className="section-title">
            Welcome, {currentUser ? currentUser.displayName : 'Participant'}
          </h2>
          <p className="section-subtitle">
            Program Week: {selectedWeekObj.weekLabel}
          </p>
        </div>

        <div className="dashboard-week-controls">
          <label htmlFor="formWeekSelect" className="field-label">
            Select Week
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

      {/* =================================================================== */}
      {/* MODE 1: NON-EDITABLE CHECKABLE LIST VIEW (Default)                  */}
      {/* =================================================================== */}
      {!isEditing && (
        <>
          {!existingCommitment ? (
            /* Empty State when no commitment is saved for this week */
            <div className="card empty-commitment-card">
              <div className="empty-commitment-icon" aria-hidden="true">
                🔥
              </div>
              <h3 className="empty-commitment-title">No Covenant Recorded Yet</h3>
              <p className="empty-commitment-desc">
                Your spiritual commitment for <strong>{selectedWeekObj.weekLabel}</strong>{' '}
                has not been submitted yet.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => setIsEditing(true)}
              >
                You have not made commitments for this week — Make Commitment
              </button>
            </div>
          ) : (
            /* Checkable List of Commitments Card */
            <div className="card readonly-commitment-card">
              <div className="readonly-header">
                <div>
                  <span className="eyebrow">{existingCommitment.weekKey} COVENANT</span>
                  <h3 className="section-title" style={{ margin: '0.15rem 0' }}>
                    My Weekly Commitments Checklist
                  </h3>
                  <p className="section-subtitle">
                    Check all 3 items below to automatically mark the day as Done.
                  </p>
                </div>

                <div className="readonly-header-actions">
                  <span
                    className={`adherence-badge adherence-badge--${readOnlyMetrics.adherenceStatus}`}
                  >
                    {readOnlyBadgeLabel}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEditing(true)}
                  >
                    ✎ Edit Commitments
                  </button>
                </div>
              </div>

              {/* Day Selector Bar to check off commitments for each day of the week */}
              <div className="check-day-selector-bar">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <span className="pillar-label">
                    Select Day to Check Items ({activeDayLabel}):
                  </span>
                  <span className="pillar-label" style={{ color: 'var(--accent-primary)' }}>
                    {activeDayCheckedCount}/3 Items Checked{' '}
                    {activeDayCheckedCount === 3 ? '— Day Marked Done ✓' : ''}
                  </span>
                </div>
                <div className="week-strip" style={{ marginTop: '0.4rem' }}>
                  {DAYS_OF_WEEK.map(({ key, label }) => {
                    const st =
                      (existingCommitment.dailyStatus &&
                        existingCommitment.dailyStatus[key]) ||
                      'pending';
                    const isSelectedDay = activeCheckDay === key;
                    const icon =
                      st === 'completed'
                        ? '✓'
                        : st === 'partial'
                        ? '◐'
                        : st === 'skipped'
                        ? '✕'
                        : '·';
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveCheckDay(key)}
                        className={`day-pill day-pill--${st} ${
                          isSelectedDay ? 'day-pill--active-select' : ''
                        }`}
                      >
                        <span>{label}</span>
                        <span>{icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkable List of the 3 Registered Commitments */}
              <div className="checkable-commitments-list">
                {/* 1. Fasting Commitment */}
                <label
                  className={`checkable-commitment-item ${
                    activeDayChecks.fasting ? 'checkable-commitment-item--done' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    className="commitment-checkbox"
                    checked={Boolean(activeDayChecks.fasting)}
                    onChange={() =>
                      toggleCommitmentPillar(selectedFormWeek, activeCheckDay, 'fasting')
                    }
                  />
                  <div className="checkable-commitment-content">
                    <div className="checkable-commitment-top">
                      <span className="example-tag">1. Fasting Commitment</span>
                      <span
                        className={`check-status-tag ${
                          activeDayChecks.fasting ? 'check-status-tag--done' : ''
                        }`}
                      >
                        {activeDayChecks.fasting
                          ? `✓ Done (${activeDayLabel})`
                          : `Check Done (${activeDayLabel})`}
                      </span>
                    </div>
                    <div className="readonly-pillar-main">
                      {existingCommitment.fastingCommitment}
                    </div>
                  </div>
                </label>

                {/* 2. Prayer Commitment */}
                <label
                  className={`checkable-commitment-item ${
                    activeDayChecks.prayer ? 'checkable-commitment-item--done' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    className="commitment-checkbox"
                    checked={Boolean(activeDayChecks.prayer)}
                    onChange={() =>
                      toggleCommitmentPillar(selectedFormWeek, activeCheckDay, 'prayer')
                    }
                  />
                  <div className="checkable-commitment-content">
                    <div className="checkable-commitment-top">
                      <span className="example-tag">
                        2. Prayer Commitment ({existingCommitment.prayerMinutes} Minutes)
                      </span>
                      <span
                        className={`check-status-tag ${
                          activeDayChecks.prayer ? 'check-status-tag--done' : ''
                        }`}
                      >
                        {activeDayChecks.prayer
                          ? `✓ Done (${activeDayLabel})`
                          : `Check Done (${activeDayLabel})`}
                      </span>
                    </div>
                    <div className="readonly-pillar-main">
                      {existingCommitment.prayerTimes}
                    </div>
                    <div className="readonly-pillar-sub">
                      <strong>Alternative / Backup Time:</strong>{' '}
                      {existingCommitment.prayerAltTimes}
                    </div>
                  </div>
                </label>

                {/* 3. Meditation Commitment */}
                <label
                  className={`checkable-commitment-item ${
                    activeDayChecks.meditation ? 'checkable-commitment-item--done' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    className="commitment-checkbox"
                    checked={Boolean(activeDayChecks.meditation)}
                    onChange={() =>
                      toggleCommitmentPillar(
                        selectedFormWeek,
                        activeCheckDay,
                        'meditation'
                      )
                    }
                  />
                  <div className="checkable-commitment-content">
                    <div className="checkable-commitment-top">
                      <span className="example-tag">
                        3. Meditation Commitment ({existingCommitment.meditationMinutes}{' '}
                        Minutes)
                      </span>
                      <span
                        className={`check-status-tag ${
                          activeDayChecks.meditation ? 'check-status-tag--done' : ''
                        }`}
                      >
                        {activeDayChecks.meditation
                          ? `✓ Done (${activeDayLabel})`
                          : `Check Done (${activeDayLabel})`}
                      </span>
                    </div>
                    <div className="readonly-pillar-main">
                      {existingCommitment.meditationTimeRange}
                    </div>
                  </div>
                </label>
              </div>

              {existingCommitment.reflectionNotes && (
                <div className="readonly-notes-box">
                  <span className="pillar-label">
                    Weekly Focus Scripture / Accountability Note
                  </span>
                  <p className="readonly-notes-text">
                    “{existingCommitment.reflectionNotes}”
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* =================================================================== */}
      {/* MODE 2: EDITABLE FORM (Only shown when user clicks Edit or Create)  */}
      {/* =================================================================== */}
      {isEditing && (
        <>
          <div className="example-guide-wrapper">
            <div className="example-guide-bar">
              <div>
                <h3 className="example-guide-heading">
                  📖 Tectonic Shift Commitment Example Guide
                </h3>
                <p className="example-guide-caption">
                  Not sure how to structure your fasting, prayer, and meditation rhythm?
                  View our recommended sample covenant.
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
                      Specify your daily fasting window and type (e.g., water only,
                      Daniel fast, or liquid fast) and any exceptions.
                    </p>
                  </div>
                  <div className="example-item">
                    <span className="example-tag">2. Prayer Commitment</span>
                    <strong>
                      45 Minutes Total • 5:30 AM – 6:00 AM &amp; 9:30 PM – 9:45 PM
                    </strong>
                    <p>
                      <em>Alternative Times:</em> 12:30 PM – 1:00 PM (lunch hour) or 7:00
                      PM commute if morning session is disrupted.
                    </p>
                  </div>
                  <div className="example-item">
                    <span className="example-tag">3. Meditation Commitment</span>
                    <strong>20 Minutes • 6:00 AM – 6:20 AM</strong>
                    <p>
                      Focused Scripture meditation and stillness immediately following
                      morning prayer.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                  Example: &quot;6:00 AM to 3:00 PM daily (Water only)&quot; or
                  &quot;6:00 AM to 6:00 PM Mon–Fri (Daniel Fast)&quot;
                </span>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">2. Prayer Commitment</h3>
              <p className="form-section-desc">
                Set your daily prayer duration, primary scheduled times, and backup times
                so life disruptions never cause a full skip.
              </p>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="prayerMinutes" className="field-label">
                    Daily Prayer Duration (Minutes){' '}
                    <span className="required-star">*</span>
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
                  Alternative / Backup Prayer Time(s){' '}
                  <span className="required-star">*</span>
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
                  Having a pre-decided alternative slot prevents skipping when your
                  primary slot is interrupted.
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
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
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
        </>
      )}

      {/* =================================================================== */}
      {/* WEEKLY EXPERIENCE FEED & COMMENTS SECTION (With Replies)            */}
      {/* =================================================================== */}
      <WeeklyCommentsFeed
        weekKey={selectedWeekObj.weekKey}
        weekLabel={selectedWeekObj.weekLabel}
      />
    </section>
  );
}
