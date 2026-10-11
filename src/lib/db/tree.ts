export type WithReplies<T> = T & { replies: WithReplies<T>[] };

/**
 * Turns a flat list into a reply tree. Items whose parent is not in the list (for example
 * because the parent is hidden) are dropped, which hides the whole subtree, as nested
 * queries did before.
 */
export function buildReplyTree<T extends { id: string }>(
  items: T[],
  parentOf: (item: T) => string | null,
): WithReplies<T>[] {
  const nodes = new Map<string, WithReplies<T>>();
  for (const item of items) nodes.set(item.id, { ...item, replies: [] });

  const roots: WithReplies<T>[] = [];
  for (const item of items) {
    const node = nodes.get(item.id)!;
    const parentId = parentOf(item);
    if (parentId === null) {
      roots.push(node);
    } else {
      nodes.get(parentId)?.replies.push(node);
    }
  }
  return roots;
}
