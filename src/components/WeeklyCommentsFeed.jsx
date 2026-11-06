import React, { useMemo, useState } from 'react';
import { useTectonic } from '../context/TectonicContext';
import { getInitials } from '../utils/weeks';

function formatCommentTime(comment) {
  const dateObj = comment.createdAt?.toDate
    ? comment.createdAt.toDate()
    : comment.createdAtISO
    ? new Date(comment.createdAtISO)
    : null;
  if (!dateObj || Number.isNaN(dateObj.getTime())) return 'Just now';
  return dateObj.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function WeeklyCommentsFeed({ weekKey, weekLabel }) {
  const { comments, addComment } = useTectonic();
  const [newCommentText, setNewCommentText] = useState('');
  const [postingRoot, setPostingRoot] = useState(false);

  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [postingReply, setPostingReply] = useState(false);

  // Filter comments for this week and group top-level posts vs replies
  const { rootComments, repliesByParentId } = useMemo(() => {
    const weekComments = comments
      .filter((c) => c && c.weekKey === weekKey)
      .sort((a, b) => {
        const msA = a.createdMs || (a.createdAtISO ? new Date(a.createdAtISO).getTime() : 0);
        const msB = b.createdMs || (b.createdAtISO ? new Date(b.createdAtISO).getTime() : 0);
        return msB - msA;
      });

    const roots = [];
    const replyMap = {};

    weekComments.forEach((c) => {
      if (!c.parentId) {
        roots.push(c);
      } else {
        if (!replyMap[c.parentId]) replyMap[c.parentId] = [];
        replyMap[c.parentId].push(c);
      }
    });

    // Sort replies oldest-first under each parent comment
    Object.values(replyMap).forEach((arr) => {
      arr.sort((a, b) => {
        const msA = a.createdMs || (a.createdAtISO ? new Date(a.createdAtISO).getTime() : 0);
        const msB = b.createdMs || (b.createdAtISO ? new Date(b.createdAtISO).getTime() : 0);
        return msA - msB;
      });
    });

    return { rootComments: roots, repliesByParentId: replyMap };
  }, [comments, weekKey]);

  const handleRootSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setPostingRoot(true);
    try {
      await addComment({
        weekKey,
        text: newCommentText,
        parentId: ''
      });
      setNewCommentText('');
    } finally {
      setPostingRoot(false);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setPostingReply(true);
    try {
      await addComment({
        weekKey,
        text: replyText,
        parentId
      });
      setReplyText('');
      setReplyingToId(null);
    } finally {
      setPostingReply(false);
    }
  };

  return (
    <div className="card feed-section-card">
      <div className="feed-header">
        <div>
          <span className="eyebrow">COHORT EXPERIENCE FEED</span>
          <h3 className="section-title" style={{ margin: '0.15rem 0' }}>
            💬 Weekly Reflections &amp; Testimonies ({weekKey})
          </h3>
          <p className="section-subtitle">
            Share your fasting, prayer, and meditation experiences for{' '}
            <strong>{weekLabel}</strong> and encourage fellow participants.
          </p>
        </div>
      </div>

      {/* New Experience Post Form */}
      <form className="feed-composer" onSubmit={handleRootSubmit}>
        <textarea
          className="input-textarea"
          rows={3}
          maxLength={1000}
          placeholder="Share how your fasting, prayer, or meditation is going this week..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          required
        />
        <div className="feed-composer-actions">
          <span className="field-hint">Visible to all signed-in cohort participants</span>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={postingRoot || !newCommentText.trim()}
          >
            {postingRoot ? 'Posting...' : 'Post Experience'}
          </button>
        </div>
      </form>

      {/* Threaded Comments Feed */}
      <div className="feed-list">
        {rootComments.length === 0 ? (
          <div className="feed-empty">
            <p className="section-subtitle">
              No experiences shared for {weekKey} yet. Be the first to drop a comment!
            </p>
          </div>
        ) : (
          rootComments.map((comment) => {
            const replies = repliesByParentId[comment.id] || [];
            const isReplying = replyingToId === comment.id;

            return (
              <article key={comment.id} className="feed-comment-card">
                <div className="feed-comment-top">
                  <div className="participant-identity">
                    <span className="participant-avatar">
                      {getInitials(comment.displayName)}
                    </span>
                    <div>
                      <strong className="feed-author-name">{comment.displayName}</strong>
                      <span className="feed-timestamp">
                        {formatCommentTime(comment)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => {
                      if (isReplying) {
                        setReplyingToId(null);
                      } else {
                        setReplyingToId(comment.id);
                        setReplyText('');
                      }
                    }}
                  >
                    {isReplying ? 'Cancel' : `↩ Reply (${replies.length})`}
                  </button>
                </div>

                <p className="feed-comment-body">{comment.text}</p>

                {/* Existing Replies */}
                {replies.length > 0 && (
                  <div className="feed-replies-list">
                    {replies.map((reply) => (
                      <div key={reply.id} className="feed-reply-item">
                        <div className="feed-reply-header">
                          <span className="user-avatar" style={{ width: '24px', height: '24px', fontSize: '0.68rem' }}>
                            {getInitials(reply.displayName)}
                          </span>
                          <strong className="feed-reply-author">
                            {reply.displayName}
                          </strong>
                          <span className="feed-timestamp">
                            • {formatCommentTime(reply)}
                          </span>
                        </div>
                        <p className="feed-reply-body">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Reply Composer */}
                {isReplying && (
                  <form
                    className="feed-reply-form"
                    onSubmit={(e) => handleReplySubmit(e, comment.id)}
                  >
                    <input
                      type="text"
                      className="input-text"
                      maxLength={1000}
                      placeholder={`Reply to ${comment.displayName}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      autoFocus
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-secondary btn-sm"
                      disabled={postingReply || !replyText.trim()}
                    >
                      {postingReply ? 'Sending...' : 'Reply'}
                    </button>
                  </form>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

