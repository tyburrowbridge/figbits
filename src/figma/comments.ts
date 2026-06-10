import type { FigmaClient } from "./client.js";

export type CommentUser = {
  handle: string;
  img_url?: string;
  id: string;
};

export type CommentClientMeta = {
  node_id?: string;
  node_offset?: { x: number; y: number };
};

export type FigmaComment = {
  id: string;
  file_key: string;
  parent_id: string;
  user: CommentUser;
  created_at: string;
  resolved_at: string | null;
  message: string;
  client_meta?: CommentClientMeta | null;
  order_id?: string;
};

type CommentsResponse = {
  comments: FigmaComment[];
};

type FileNodesResponse = {
  nodes: Record<
    string,
    {
      document?: { id: string; name: string; type: string };
    } | null
  >;
};

export type FileMeta = {
  name: string;
};

type FileMetaResponse = {
  name: string;
};

export async function fetchComments(
  client: FigmaClient,
  fileKey: string,
): Promise<FigmaComment[]> {
  const res = await client.get<CommentsResponse>(`/v1/files/${fileKey}/comments`);
  return res.comments;
}

export async function fetchFileMeta(
  client: FigmaClient,
  fileKey: string,
): Promise<FileMeta> {
  return client.get<FileMetaResponse>(`/v1/files/${fileKey}?depth=1`);
}

export async function resolveNodeNames(
  client: FigmaClient,
  fileKey: string,
  nodeIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (nodeIds.length === 0) return map;
  const unique = [...new Set(nodeIds)];
  const ids = unique.map(encodeURIComponent).join(",");
  const res = await client.get<FileNodesResponse>(
    `/v1/files/${fileKey}/nodes?ids=${ids}&depth=1`,
  );
  for (const [id, entry] of Object.entries(res.nodes)) {
    if (entry?.document?.name) map.set(id, entry.document.name);
  }
  return map;
}

export type CommentFilterInput = {
  comments: FigmaComment[];
  lastRunIso: string | null;
  surfacedThreadIds: Set<string>;
};

export type CommentFilterOutput = {
  fresh: FigmaComment[];
  nextSurfacedThreadIds: Set<string>;
};

export function filterFreshComments(
  input: CommentFilterInput,
): CommentFilterOutput {
  const { comments, lastRunIso, surfacedThreadIds } = input;
  const cutoff = lastRunIso ? new Date(lastRunIso).getTime() : null;
  const newSurfaced = new Set(surfacedThreadIds);

  const newTopLevel: FigmaComment[] = [];
  for (const c of comments) {
    if (c.parent_id !== "") continue;
    if (cutoff !== null && new Date(c.created_at).getTime() <= cutoff) continue;
    newTopLevel.push(c);
    newSurfaced.add(c.id);
  }

  const replies: FigmaComment[] = [];
  for (const c of comments) {
    if (c.parent_id === "") continue;
    if (!newSurfaced.has(c.parent_id)) continue;
    if (cutoff !== null && new Date(c.created_at).getTime() <= cutoff) continue;
    replies.push(c);
  }

  const fresh = [...newTopLevel, ...replies].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return { fresh, nextSurfacedThreadIds: newSurfaced };
}
