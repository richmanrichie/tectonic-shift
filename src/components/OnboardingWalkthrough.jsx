import React, { useState } from 'react';

const WALKTHROUGH_STEPS = [
  {
    badge: 'STEP 1 OF 4 • WELCOME',
    icon: '🔥',
    title: 'Welcome to Tectonic Shift',
    description:
      'You are now part of Tectonic Shift. Each week, our cohort aligns around three core spiritual disciplines: Fasting, Prayer, and Scripture Meditation.',
    highlights: [
      'Your Google account is linked to your cohort profile.',
      'Your progress is synced in real time across mobile and desktop.',
      'Install this app to your phone home screen for quick daily access.'
    ]
  },
  {
    badge: 'STEP 2 OF 4 • WEEKLY COMMITMENT',
    icon: '📝',
    title: 'Register Your Weekly Commitment',
    description:
      'At the start of each week, open your Dashboard and click "Make Commitment" to set your personal schedule for the week:',
    highlights: [
      'Fasting Commitment (e.g., 6:00 AM – 3:00 PM daily, Water only)',
      'Prayer Commitment (Total minutes, primary times & backup/alternative times)',
      'Meditation Commitment (Total minutes & daily time window)',
      'Tip: Use the "Show Example Guide" or "Auto-Fill Sample" button if you need a template!'
    ]
  },
  {
    badge: 'STEP 3 OF 4 • DAILY CHECKLIST',
    icon: '✅',
    title: 'Check Each Item Off to Complete Your Day',
    description:
      'Once your commitment is saved, your Dashboard transforms into an interactive checklist for Monday through Sunday.',
    highlights: [
      'Select the day of the week (defaults to Today).',
      'Check off Fasting, Prayer, and Meditation as you complete each one.',
      'Checking all 3 items (3/3) automatically marks that day as Done ✓!'
    ]
  },
  {
    badge: 'STEP 4 OF 4 • ACCOUNTABILITY & FEED',
    icon: '🌍',
    title: 'Community Watchtower & Experience Feed',
    description:
      'We walk this journey together so no one falls behind:',
    highlights: [
      'Community Progress: See everyone’s weekly adherence and reach out to encourage anyone on the Skipping Watchlist.',
      'Weekly Experience Feed: Drop comments about your fasting/prayer experiences each week and reply to fellow participants.',
      'History: Review or reuse your saved commitments from previous weeks.'
    ]
  }
];

export default function OnboardingWalkthrough({ isOpen, onClose, userName }) {
  const [stepIndex, setStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = WALKTHROUGH_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === WALKTHROUGH_STEPS.length - 1;

  const handleFinish = () => {
    setStepIndex(0);
    onClose();
  };

  return (
    <div
      className="walkthrough-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
    >
      <div className="walkthrough-modal card">
        <div className="walkthrough-top-bar">
          <span className="eyebrow">{currentStep.badge}</span>
          <button
            type="button"
            className="walkthrough-skip-btn"
            onClick={handleFinish}
          >
            Skip Tour ✕
          </button>
        </div>

        <div className="walkthrough-body">
          <div className="walkthrough-icon" aria-hidden="true">
            {currentStep.icon}
          </div>

          <h2 id="walkthrough-title" className="walkthrough-title">
            {stepIndex === 0 && userName
              ? `Welcome, ${userName.split(' ')[0]}!`
              : currentStep.title}
          </h2>

          <p className="walkthrough-desc">{currentStep.description}</p>

          <ul className="walkthrough-list">
            {currentStep.highlights.map((item, idx) => (
              <li key={idx} className="walkthrough-list-item">
                <span className="walkthrough-check" aria-hidden="true">
                  ✦
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Step Indicator Dots */}
        <div className="walkthrough-dots" aria-hidden="true">
          {WALKTHROUGH_STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`walkthrough-dot ${
                idx === stepIndex ? 'walkthrough-dot--active' : ''
              }`}
            />
          ))}
        </div>

        <div className="walkthrough-footer">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={isFirst}
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            style={{ visibility: isFirst ? 'hidden' : 'visible' }}
          >
            ← Back
          </button>

          {!isLast ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                setStepIndex((prev) =>
                  Math.min(WALKTHROUGH_STEPS.length - 1, prev + 1)
                )
              }
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinish}
            >
              Get Started 🔥
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

