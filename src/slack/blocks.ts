import type { FigmaComment } from "../figma/comments.js";
import type { SlackBlock, SlackPayload } from "./webhook.js";

export type DigestItem = {
  fileKey: string;
  fileName: string;
  comments: FigmaComment[];
  nodeNames: Map<string, string>;
};

export type BuildDigestInput = {
  items: DigestItem[];
  nextRunLabel: string | null;
};

const MAX_ITEMS_PER_FILE = 10;
const MAX_MESSAGE_CHARS = 240;

export function buildDigestPayload(input: BuildDigestInput): SlackPayload {
  const { items, nextRunLabel } = input;
  const totalComments = items.reduce((n, it) => n + it.comments.length, 0);
  const filesWithActivity = items.filter((it) => it.comments.length > 0);

  const headerText = `:art: *Figma activity* — ${filesWithActivity.length} file${plural(
    filesWithActivity.length,
  )}, ${totalComments} new comment${plural(totalComments)}`;

  const blocks: SlackBlock[] = [
    { type: "section", text: { type: "mrkdwn", text: headerText } },
    { type: "divider" },
  ];

  for (const item of filesWithActivity) {
    blocks.push(...buildFileBlocks(item));
    blocks.push({ type: "divider" });
  }

  const contextElements: { type: "mrkdwn"; text: string }[] = [
    { type: "mrkdwn", text: `:clock3: ${formatNow()}` },
  ];
  if (nextRunLabel) {
    contextElements.push({ type: "mrkdwn", text: `Next run: ${nextRunLabel}` });
  }
  blocks.push({ type: "context", elements: contextElements });

  return {
    text: `Figma activity: ${totalComments} new comment${plural(totalComments)} across ${filesWithActivity.length} file${plural(filesWithActivity.length)}`,
    blocks,
  };
}

function buildFileBlocks(item: DigestItem): SlackBlock[] {
  const fileUrl = `https://www.figma.com/file/${item.fileKey}`;
  const shown = item.comments.slice(0, MAX_ITEMS_PER_FILE);
  const overflow = item.comments.length - shown.length;

  const lines: string[] = [
    `:page_facing_up: *<${fileUrl}|${escape(item.fileName)}>*  ·  ${item.comments.length} new`,
  ];

  for (const c of shown) {
    lines.push(renderCommentLine(c, item.fileKey, item.nodeNames));
  }

  if (overflow > 0) {
    lines.push(
      `_…and ${overflow} more — <${fileUrl}|open file> to see all_`,
    );
  }

  return [
    { type: "section", text: { type: "mrkdwn", text: lines.join("\n") } },
  ];
}

function renderCommentLine(
  c: FigmaComment,
  fileKey: string,
  nodeNames: Map<string, string>,
): string {
  const isReply = c.parent_id !== "";
  const prefix = isReply ? "    ↳" : "•";
  const handle = c.user.handle;
  const message = truncate(stripMentions(c.message), MAX_MESSAGE_CHARS);
  const nodeId = c.client_meta?.node_id;
  const frameLabel = nodeId ? nodeNames.get(nodeId) ?? "frame" : null;
  const link = buildCommentLink(fileKey, c.id, nodeId);
  const location = frameLabel ? `  _on_ \`${escape(frameLabel)}\`` : "";
  return `${prefix} *@${escape(handle)}*${location}: "${escape(message)}"  <${link}|Open ↗>`;
}

function buildCommentLink(
  fileKey: string,
  commentId: string,
  nodeId: string | undefined,
): string {
  const base = `https://www.figma.com/file/${fileKey}`;
  if (nodeId) {
    return `${base}?node-id=${encodeURIComponent(nodeId)}#${commentId}`;
  }
  return `${base}#${commentId}`;
}

function stripMentions(message: string): string {
  return message.replace(/\s+/g, " ").trim();
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plural(n: number): string {
  return n === 1 ? "" : "s";
}

function formatNow(): string {
  const d = new Date();
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
