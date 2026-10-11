"use client";

import { useState } from "react";
import { ProfessionalRequestCommentForm } from "@/components/professional-requests/ProfessionalRequestCommentForm";
import { ReportForm } from "@/components/shared/ReportForm";
import type {
  PublicProfessionalRequest,
  PublicProfessionalRequestComment,
} from "@/lib/models/professional-request";
import { getInitials } from "@/lib/utils/expert-approval-ui";

/** The database allows a comment, a reply and a reply to that reply. */
const MAX_REPLY_DEPTH = 2;

type ReplyTarget = "request" | string;

type ProfessionalRequestThreadProps = {
  request: Pick<PublicProfessionalRequest, "id" | "title" | "description" | "created_at" | "user">;
  comments: PublicProfessionalRequestComment[];
};

function formatChatTime(value: Date | string): string {
  return new Date(value).toLocaleString("he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Bubble({
  authorName,
  createdAt,
  variant,
  badge,
  title,
  content,
}: {
  authorName: string;
  createdAt: Date | string;
  variant: "parent" | "reply" | "nested";
  badge?: string;
  title?: string;
  content: string;
}) {
  const className =
    variant === "parent"
      ? "rec-chat-bubble"
      : variant === "nested"
        ? "rec-chat-bubble rec-chat-bubble--nested"
        : "rec-chat-bubble rec-chat-bubble--reply";

  return (
    <div className={className}>
      <div className="rec-chat-bubble-header">
        <span className="rec-chat-author">{authorName}</span>
        {badge && <span className="rec-chat-type-badge">{badge}</span>}
        <time className="rec-chat-time" dateTime={new Date(createdAt).toISOString()}>
          {formatChatTime(createdAt)}
        </time>
      </div>
      {title && <h1 className="rec-chat-title">{title}</h1>}
      <p className="rec-chat-content">{content}</p>
    </div>
  );
}

function CommentNode({
  comment,
  requestId,
  depth,
  replyingTo,
  onReply,
  onCancelReply,
}: {
  comment: PublicProfessionalRequestComment;
  requestId: string;
  depth: number;
  replyingTo: ReplyTarget | null;
  onReply: (target: ReplyTarget) => void;
  onCancelReply: () => void;
}) {
  const authorName = comment.user?.full_name ?? "משתמש";
  const isReplying = replyingTo === comment.id;
  const canReply = depth < MAX_REPLY_DEPTH;

  return (
    <div className="rec-chat-reply-group">
      <div className="rec-chat-message">
        <div className="rec-chat-avatar rec-chat-avatar--small" aria-hidden="true">
          {getInitials(authorName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Bubble
            authorName={authorName}
            createdAt={comment.created_at}
            variant={depth === 0 ? "reply" : "nested"}
            content={comment.content}
          />
          {canReply && (
            <div className="rec-chat-actions">
              <button
                type="button"
                className="rec-chat-action-btn"
                aria-expanded={isReplying}
                onClick={() => (isReplying ? onCancelReply() : onReply(comment.id))}
              >
                {isReplying ? "סגירה" : "השב"}
              </button>
            </div>
          )}
          {isReplying && (
            <ProfessionalRequestCommentForm
              requestId={requestId}
              parentCommentId={comment.id}
              placeholder="כתבו מענה לתגובה..."
              onCancel={onCancelReply}
            />
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="rec-chat-nested-replies">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              requestId={requestId}
              depth={depth + 1}
              replyingTo={replyingTo}
              onReply={onReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** A professional request and its discussion, laid out like a recommendations thread. */
export function ProfessionalRequestThread({ request, comments }: ProfessionalRequestThreadProps) {
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const authorName = request.user?.full_name ?? "משתמש";
  const responding = replyingTo === "request";
  const cancel = () => setReplyingTo(null);

  return (
    <article className="rec-chat-thread" aria-label="פנייה מקצועית">
      <div className="rec-chat-message rec-chat-message--parent">
        <div className="rec-chat-avatar" aria-hidden="true">
          {getInitials(authorName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Bubble
            authorName={authorName}
            createdAt={request.created_at}
            variant="parent"
            badge="פנייה מקצועית"
            title={request.title}
            content={request.description}
          />
          <div className="rec-chat-actions">
            <ReportForm targetType="professional_request" targetId={request.id} />
          </div>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="rec-chat-replies" aria-label="תגובות לפנייה">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              requestId={request.id}
              depth={0}
              replyingTo={replyingTo}
              onReply={setReplyingTo}
              onCancelReply={cancel}
            />
          ))}
        </div>
      )}

      {/* The response form stays hidden until the button is pressed. */}
      <div className="rec-chat-thread-footer">
        {responding ? (
          <ProfessionalRequestCommentForm
            requestId={request.id}
            placeholder="כתבו תגובה לפנייה..."
            onCancel={cancel}
          />
        ) : (
          <button
            type="button"
            className="rec-chat-action-btn"
            aria-expanded={false}
            onClick={() => setReplyingTo("request")}
          >
            {comments.length === 0 ? "הוסיפו תגובה ראשונה" : "הוספת תגובה"}
          </button>
        )}
      </div>
    </article>
  );
}
