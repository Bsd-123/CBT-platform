"use client";

import { useState } from "react";
import type { RecommendationType } from "@prisma/client";
import type { PublicRecommendationComment } from "@/lib/models/recommendation";
import type { RecommendationFeedItem } from "@/lib/repositories/recommendation.repository";
import { getInitials } from "@/lib/utils/expert-approval-ui";
import { getTagBadgeStyle } from "@/lib/utils/tag-colors";
import { ReportForm } from "@/components/shared/ReportForm";
import { RecommendationChatReplyForm } from "@/components/recommendations/RecommendationChatReplyForm";

const TYPE_LABELS: Record<RecommendationType, string> = {
  book: "ספר",
  game: "משחק",
  workshop: "סדנה",
};

type ReplyTarget = "recommendation" | string;

type RecommendationChatThreadProps = {
  item: RecommendationFeedItem;
  highlighted?: boolean;
};

function formatChatTime(value: Date | string): string {
  return new Date(value).toLocaleString("he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatBubble({
  authorName,
  content,
  createdAt,
  variant = "reply",
  typeLabel,
}: {
  authorName: string;
  content: string;
  createdAt: Date | string;
  variant?: "parent" | "reply" | "nested";
  typeLabel?: string | null;
}) {
  const bubbleClass =
    variant === "parent"
      ? "rec-chat-bubble"
      : variant === "nested"
        ? "rec-chat-bubble rec-chat-bubble--nested"
        : "rec-chat-bubble rec-chat-bubble--reply";

  return (
    <div className={bubbleClass}>
      <div className="rec-chat-bubble-header">
        <span className="rec-chat-author">{authorName}</span>
        {typeLabel && <span className="rec-chat-type-badge">{typeLabel}</span>}
        <time className="rec-chat-time" dateTime={new Date(createdAt).toISOString()}>
          {formatChatTime(createdAt)}
        </time>
      </div>
      <p className="rec-chat-content">{content}</p>
    </div>
  );
}

function CommentNode({
  comment,
  recommendationId,
  replyingTo,
  onReply,
  onCancelReply,
}: {
  comment: PublicRecommendationComment;
  recommendationId: string;
  replyingTo: ReplyTarget | null;
  onReply: (target: ReplyTarget) => void;
  onCancelReply: () => void;
}) {
  const authorName = comment.user?.full_name ?? "משתמש";
  const canReply = comment.depth === 0;
  const isReplying = replyingTo === comment.id;

  return (
    <div className="rec-chat-reply-group">
      <div className="rec-chat-message">
        <div className="rec-chat-avatar rec-chat-avatar--small" aria-hidden="true">
          {getInitials(authorName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ChatBubble
            authorName={authorName}
            content={comment.content}
            createdAt={comment.created_at}
            variant="reply"
          />
          <div className="rec-chat-actions">
            {canReply && (
              <button
                type="button"
                className="rec-chat-action-btn"
                onClick={() => (isReplying ? onCancelReply() : onReply(comment.id))}
              >
                {isReplying ? "סגירה" : "השב"}
              </button>
            )}
          </div>
          {isReplying && (
            <RecommendationChatReplyForm
              recommendationId={recommendationId}
              parentCommentId={comment.id}
              placeholder="כתבו מענה לתגובה..."
              onCancel={onCancelReply}
              autoFocus
            />
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="rec-chat-nested-replies">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="rec-chat-message">
              <div className="rec-chat-avatar rec-chat-avatar--small" aria-hidden="true">
                {getInitials(reply.user?.full_name ?? "משתמש")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ChatBubble
                  authorName={reply.user?.full_name ?? "משתמש"}
                  content={reply.content}
                  createdAt={reply.created_at}
                  variant="nested"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecommendationChatThread({ item, highlighted = false }: RecommendationChatThreadProps) {
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const comments = item.comments ?? [];
  const authorName = item.user?.full_name ?? "משתמש";
  const typeLabel = item.type ? TYPE_LABELS[item.type] : null;

  return (
    <article
      id={`rec-${item.id}`}
      className="rec-chat-thread"
      data-highlighted={highlighted}
    >
      <div className="rec-chat-message rec-chat-message--parent">
        <div className="rec-chat-avatar" aria-hidden="true">
          {getInitials(authorName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ChatBubble
            authorName={authorName}
            content={item.content}
            createdAt={item.created_at}
            variant="parent"
            typeLabel={typeLabel}
          />
          {item.tags.length > 0 && (
            <div className="rec-chat-tags">
              {item.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rec-chat-tag"
                  style={getTagBadgeStyle(tag.color)}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <div className="rec-chat-actions">
            <button
              type="button"
              className="rec-chat-action-btn"
              onClick={() =>
                setReplyingTo((current) => (current === "recommendation" ? null : "recommendation"))
              }
            >
              {replyingTo === "recommendation" ? "סגירה" : "הגב להמלצה"}
            </button>
            <ReportForm targetType="recommendation" targetId={item.id} />
          </div>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="rec-chat-replies" aria-label="תגובות להמלצה">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              recommendationId={item.id}
              replyingTo={replyingTo}
              onReply={setReplyingTo}
              onCancelReply={() => setReplyingTo(null)}
            />
          ))}
        </div>
      )}

      <div className="rec-chat-thread-footer">
        {replyingTo === "recommendation" ? (
          <RecommendationChatReplyForm
            recommendationId={item.id}
            placeholder="כתבו תגובה להמלצה..."
            onCancel={() => setReplyingTo(null)}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="rec-chat-action-btn"
            onClick={() => setReplyingTo("recommendation")}
          >
            {comments.length === 0 ? "הוסיפו תגובה ראשונה" : "הוסיפו תגובה"}
          </button>
        )}
      </div>
    </article>
  );
}
