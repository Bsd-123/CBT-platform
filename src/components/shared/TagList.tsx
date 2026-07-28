import { getTagBadgeStyle } from "@/lib/utils/tag-colors";

type TagListItem = {
  id: string;
  name?: string;
  color?: string | null;
  tag?: { name: string; color?: string | null };
};

type TagListProps = {
  tags: TagListItem[];
};

export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) return null;

  return (
    <p className="tag-list">
      {tags.map((item) => {
        const name = item.tag?.name ?? item.name;
        const color = item.tag?.color ?? item.color;
        if (!name) return null;

        return (
          <span
            key={item.id}
            className="badge tag-badge"
            style={getTagBadgeStyle(color)}
          >
            {name}
          </span>
        );
      })}
    </p>
  );
}
