import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTectonic } from '../context/TectonicContext';
import {
  computeAdherenceMetrics,
  createDefaultDailyStatus,
  DAYS_OF_WEEK,
  getInitials
} from '../utils/weeks';

export default function HomePage() {
  const {
    weeksList,
    currentWeekInfo,
    currentUser,
    participants,
    commitmentsById
  } = useTectonic();
  const navigate = useNavigate();

  const [selectedWeekKey, setSelectedWeekKey] = useState(currentWeekInfo.weekKey);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedWeekObj = useMemo(
    () => weeksList.find((w) => w.weekKey === selectedWeekKey) || currentWeekInfo,
    [weeksList, selectedWeekKey, currentWeekInfo]
  );

  // Merge all registered participants + any commitment authors
  const enrichedRows = useMemo(() => {
    const participantMap = new Map();
    participants.forEach((p) => {
      participantMap.set(p.uid, {
        uid: p.uid,
        displayName: p.displayName || 'Participant',
        cohortRole: p.cohortRole || 'Participant'
      });
    });

    Object.values(commitmentsById).forEach((c) => {
      if (c && c.uid && !participantMap.has(c.uid)) {
        participantMap.set(c.uid, {
          uid: c.uid,
          displayName: c.displayName || 'Participant',
          cohortRole: 'Participant'
        });
      }
    });

    const rows = Array.from(participantMap.values()).map((person) => {
      const docId = `${person.uid}_${selectedWeekKey}`;
      const commitment = commitmentsById[docId] || null;

      if (!commitment) {
        return {
          person,
          commitment: null,
          statusCategory: 'skipping',
          statusBadgeLabel: '🚨 Missing Commitment',
          skipReason: 'No weekly commitment submitted',
          completedCount: 0,
          skippedCount: 0
        };
      }

      const dailyStatus = commitment.dailyStatus || createDefaultDailyStatus();
      const metrics = computeAdherenceMetrics(dailyStatus);

      let statusCategory = metrics.adherenceStatus;
      let statusBadgeLabel = `✅ On Track (${metrics.completedCount}/7 days kept)`;
      let skipReason = '';

      if (statusCategory === 'skipping') {
        statusBadgeLabel = `🚨 Skipping (${metrics.skippedCount} days skipped)`;
        skipReason = `Skipped ${metrics.skippedCount} day${
          metrics.skippedCount === 1 ? '' : 's'
        } this week`;
      } else if (statusCategory === 'slipping') {
        statusBadgeLabel = `⚠️ Slipping (${metrics.skippedCount} skip / ${metrics.partialCount} partial)`;
        skipReason = '1 day skipped / partial adherence';
      }

      return {
        person,
        commitment,
        dailyStatus,
        statusCategory,
        statusBadgeLabel,
        skipReason,
        completedCount: metrics.completedCount,
        skippedCount: metrics.skippedCount
      };
    });

    const priorityOrder = { skipping: 0, slipping: 1, 'on-track': 2 };
    rows.sort((a, b) => {
      const diff = priorityOrder[a.statusCategory] - priorityOrder[b.statusCategory];
      if (diff !== 0) return diff;
      return a.person.displayName.localeCompare(b.person.displayName);
    });

    return rows;
  }, [participants, commitmentsById, selectedWeekKey]);

  const stats = useMemo(() => {
    return {
      total: enrichedRows.length,
      onTrack: enrichedRows.filter((r) => r.statusCategory === 'on-track').length,
      slipping: enrichedRows.filter((r) => r.statusCategory === 'slipping').length,
      skipping: enrichedRows.filter((r) => r.statusCategory === 'skipping').length
    };
  }, [enrichedRows]);

  const watchlistRows = useMemo(
    () =>
      enrichedRows.filter(
        (r) => r.statusCategory === 'skipping' || r.statusCategory === 'slipping'
      ),
    [enrichedRows]
  );

  const filteredRows = useMemo(() => {
    return enrichedRows.filter((row) => {
      if (statusFilter !== 'all' && row.statusCategory !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        return row.person.displayName
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
      }
      return true;
    });
  }, [enrichedRows, statusFilter, searchQuery]);

  return (
    <section className="view-section">
      <div className="hero-card">
        <div className="hero-content">
          <div className="eyebrow">PUBLIC ACCOUNTABILITY WALL</div>
          <h1 className="hero-title">Community Progress &amp; Watchtower</h1>
          <p className="hero-description">
            “Iron sharpens iron.” Every participant’s weekly spiritual commitment and daily
            check-ins are visible to the cohort so we can celebrate faithfulness and reach
            out to those who have been skipping their commitments.
          </p>
        </div>

        <div className="week-picker-box">
          <label htmlFor="communityWeekSelect" className="field-label">
            Viewing Program Week
          </label>
          <select
            id="communityWeekSelect"
            className="input-select"
            value={selectedWeekKey}
            onChange={(e) => setSelectedWeekKey(e.target.value)}
          >
            {weeksList.map((w) => (
              <option key={w.weekKey} value={w.weekKey}>
                {w.weekLabel}
                {w.isCurrent ? ' • Current' : ''}
              </option>
            ))}
          </select>
          <span className="field-hint">{selectedWeekObj.weekLabel}</span>
        </div>
      </div>

      {/* Cohort KPI Summary Cards */}
      <div className="stats-grid" aria-label="Weekly cohort statistics">
        <article className="stat-card">
          <span className="stat-label">Active Cohort</span>
          <strong className="stat-value">{stats.total}</strong>
          <span className="stat-meta">Registered participants</span>
        </article>
        <article className="stat-card stat-card--success">
          <span className="stat-label">Faithful &amp; On Track</span>
          <strong className="stat-value">{stats.onTrack}</strong>
          <span className="stat-meta">Consistent fasting, prayer &amp; meditation</span>
        </article>
        <article className="stat-card stat-card--warning">
          <span className="stat-label">Slipping (1–2 Skips)</span>
          <strong className="stat-value">{stats.slipping}</strong>
          <span className="stat-meta">Needs gentle check-in</span>
        </article>
        <article className="stat-card stat-card--danger">
          <span className="stat-label">Skipping / Unsubmitted</span>
          <strong className="stat-value">{stats.skipping}</strong>
          <span className="stat-meta">Skipped 2+ days or missing form</span>
        </article>
      </div>

      {/* Watchlist Banner — Who Has Been Skipping */}
      <div className="watchlist-banner">
        <div className="watchlist-header">
          <div>
            <h2 className="watchlist-title">
              ⚠️ Accountability Watchlist — Who Has Been Skipping
            </h2>
            <p className="watchlist-subtitle">
              Participants below have either skipped multiple spiritual commitment days this
              week or have not yet submitted their weekly covenant. Reach out to encourage
              them!
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            Update My Progress
          </button>
        </div>

        <div className="watchlist-chips">
          {watchlistRows.length === 0 ? (
            <div className="watchlist-chip">
              <span>
                🎉 Every participant in the cohort has submitted their commitment and is on
                track this week!
              </span>
            </div>
          ) : (
            watchlistRows.map((row) => (
              <div key={row.person.uid} className="watchlist-chip">
                <strong>{row.person.displayName}</strong>
                <span className="watchlist-reason">{row.skipReason}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filter Pills & Search */}
      <div className="board-toolbar">
        <div className="filter-pills" role="group" aria-label="Filter participants">
          {[
            { id: 'all', label: 'All Participants' },
            { id: 'skipping', label: '🚨 Skipping / Missing' },
            { id: 'slipping', label: '⚠️ Slipping' },
            { id: 'on-track', label: '✅ On Track' }
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`filter-pill ${statusFilter === pill.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="search-box">
          <input
            type="search"
            className="input-text"
            placeholder="Search participant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search participant name"
          />
        </div>
      </div>

      {/* Participant Progress Cards */}
      <div className="community-grid">
        {filteredRows.length === 0 ? (
          <div className="card">
            <p className="section-subtitle">No participants match the current filter.</p>
          </div>
        ) : (
          filteredRows.map(({ person, commitment, statusCategory, statusBadgeLabel }) => {
            const isCurrentUser = currentUser && currentUser.uid === person.uid;
            const cardModClass =
              statusCategory === 'skipping'
                ? 'participant-card--skipping'
                : statusCategory === 'slipping'
                ? 'participant-card--slipping'
                : '';

            if (!commitment) {
              return (
                <article key={person.uid} className={`participant-card ${cardModClass}`}>
                  <div className="participant-card-top">
                    <div className="participant-identity">
                      <span className="participant-avatar">
                        {getInitials(person.displayName)}
                      </span>
                      <div>
                        <h3 className="participant-name">
                          {person.displayName}{' '}
                          {isCurrentUser && <span className="pillar-label">(You)</span>}
                        </h3>
                        <span className="participant-meta">
                          {person.cohortRole || 'Participant'}
                        </span>
                      </div>
                    </div>
                    <span className="adherence-badge adherence-badge--skipping">
                      {statusBadgeLabel}
                    </span>
                  </div>

                  <div className="commitment-pillars">
                    <div className="pillar-row">
                      <span className="pillar-label">
                        Status for {selectedWeekObj.weekKey}
                      </span>
                      <span className="pillar-value">
                        Has not submitted a weekly fasting, prayer, or meditation
                        commitment yet.
                      </span>
                    </div>
                  </div>
                </article>
              );
            }

            const daily = commitment.dailyStatus || createDefaultDailyStatus();

            return (
              <article key={person.uid} className={`participant-card ${cardModClass}`}>
                <div className="participant-card-top">
                  <div className="participant-identity">
                    <span className="participant-avatar">
                      {getInitials(person.displayName)}
                    </span>
                    <div>
                      <h3 className="participant-name">
                        {person.displayName}{' '}
                        {isCurrentUser && <span className="pillar-label">(You)</span>}
                      </h3>
                      <span className="participant-meta">
                        {commitment.weekLabel || selectedWeekObj.weekLabel}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`adherence-badge adherence-badge--${statusCategory}`}
                  >
                    {statusBadgeLabel}
                  </span>
                </div>

                <div className="commitment-pillars">
                  <div className="pillar-row">
                    <span className="pillar-label">Fasting Commitment</span>
                    <span className="pillar-value">{commitment.fastingCommitment}</span>
                  </div>
                  <div className="pillar-row">
                    <span className="pillar-label">
                      Prayer ({commitment.prayerMinutes} mins)
                    </span>
                    <span className="pillar-value">
                      Primary: {commitment.prayerTimes} • Alt: {commitment.prayerAltTimes}
                    </span>
                  </div>
                  <div className="pillar-row">
                    <span className="pillar-label">
                      Meditation ({commitment.meditationMinutes} mins)
                    </span>
                    <span className="pillar-value">{commitment.meditationTimeRange}</span>
                  </div>
                  {commitment.reflectionNotes && (
                    <div className="pillar-row">
                      <span className="pillar-label">Accountability Note</span>
                      <span className="pillar-value">“{commitment.reflectionNotes}”</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="pillar-label">
                    Daily Check-In Record (✓ Kept • ◐ Partial • ✕ Skipped)
                  </span>
                  <div className="week-strip">
                    {DAYS_OF_WEEK.map(({ key, label }) => {
                      const st = daily[key] || 'pending';
                      const icon =
                        st === 'completed'
                          ? '✓'
                          : st === 'partial'
                          ? '◐'
                          : st === 'skipped'
                          ? '✕'
                          : '·';
                      return (
                        <div
                          key={key}
                          className={`day-pill day-pill--${st}`}
                          title={`${label}: ${st}`}
                        >
                          <span>{label}</span>
                          <span>{icon}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

