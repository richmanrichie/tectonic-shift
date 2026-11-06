import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTectonic } from '../context/TectonicContext';
import { computeAdherenceMetrics } from '../utils/weeks';

export default function HistoryPage() {
  const {
    currentUser,
    commitmentsById,
    currentWeekInfo,
    setSelectedFormWeek
  } = useTectonic();
  const navigate = useNavigate();

  const userCommitments = useMemo(() => {
    if (!currentUser) return [];
    return Object.values(commitmentsById)
      .filter((c) => c && c.uid === currentUser.uid)
      .sort((a, b) => String(b.weekKey).localeCompare(String(a.weekKey)));
  }, [currentUser, commitmentsById]);

  const handleOpenWeek = (weekKey) => {
    setSelectedFormWeek(weekKey);
    navigate('/dashboard');
  };

  return (
    <section className="view-section">
      <div className="section-header-row">
        <div>
          <span className="eyebrow">PERSONAL ARCHIVE</span>
          <h2 className="section-title">My Saved Commitments History</h2>
          <p className="section-subtitle">
            Review your spiritual commitments and weekly adherence across previous weeks
            of Tectonic Shift.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={() => handleOpenWeek(currentWeekInfo.weekKey)}
        >
          Edit Current Week
        </button>
      </div>

      <div className="history-list">
        {!currentUser ? (
          <div className="card">
            <h3>Sign In to View Your Commitment History</h3>
            <p className="section-subtitle">
              Once signed in, all of your saved commitments from previous weeks will
              appear here.
            </p>
            <div style={{ marginTop: '0.85rem' }}>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => navigate('/auth')}
              >
                Sign In Now
              </button>
            </div>
          </div>
        ) : userCommitments.length === 0 ? (
          <div className="card">
            <h3>No Saved Commitments Yet</h3>
            <p className="section-subtitle">
              Open the &quot;My Commitment&quot; page to submit your first weekly
              spiritual commitment.
            </p>
          </div>
        ) : (
          userCommitments.map((c) => {
            const metrics = computeAdherenceMetrics(c.dailyStatus || {});
            const badgeLabel =
              metrics.adherenceStatus === 'skipping'
                ? `🚨 Skipping (${metrics.skippedCount} skipped)`
                : metrics.adherenceStatus === 'slipping'
                ? `⚠️ Slipping (${metrics.skippedCount} skipped)`
                : `✅ Faithful (${metrics.completedCount}/7 days kept)`;

            return (
              <article key={c.weekKey} className="history-card">
                <div className="history-card-header">
                  <div>
                    <span className="eyebrow">{c.weekKey}</span>
                    <h3 className="participant-name">{c.weekLabel || c.weekKey}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      className={`adherence-badge adherence-badge--${metrics.adherenceStatus}`}
                    >
                      {badgeLabel}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => handleOpenWeek(c.weekKey)}
                    >
                      Open / Edit
                    </button>
                  </div>
                </div>

                <div className="commitment-pillars">
                  <div className="pillar-row">
                    <span className="pillar-label">Fasting Commitment</span>
                    <span className="pillar-value">{c.fastingCommitment}</span>
                  </div>
                  <div className="pillar-row">
                    <span className="pillar-label">
                      Prayer Commitment ({c.prayerMinutes} mins)
                    </span>
                    <span className="pillar-value">
                      Primary: {c.prayerTimes} • Alternative: {c.prayerAltTimes}
                    </span>
                  </div>
                  <div className="pillar-row">
                    <span className="pillar-label">
                      Meditation Commitment ({c.meditationMinutes} mins)
                    </span>
                    <span className="pillar-value">{c.meditationTimeRange}</span>
                  </div>
                  {c.reflectionNotes && (
                    <div className="pillar-row">
                      <span className="pillar-label">Notes</span>
                      <span className="pillar-value">{c.reflectionNotes}</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

