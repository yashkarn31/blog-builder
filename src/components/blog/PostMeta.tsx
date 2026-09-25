import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/format";

export function PostMeta({
  author,
  date,
  readingTime,
  size = "sm",
}: {
  author: string;
  date: Date | null;
  readingTime: number;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex items-center gap-2.5 text-fg-muted">
      <Avatar name={author} size={size === "md" ? 40 : 28} />
      <div className={size === "md" ? "text-sm" : "text-[13px] leading-tight"}>
        <p className="font-medium text-fg">{author}</p>
        <p className="text-fg-subtle">
          <time dateTime={date?.toISOString()}>{formatDate(date)}</time>
          <span className="mx-1.5">·</span>
          {readingTime} min read
        </p>
      </div>
    </div>
  );
}
