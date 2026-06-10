import type { FigmaClient } from "./client.js";

export type Me = {
  id: string;
  email: string;
  handle: string;
};

export type Project = {
  id: string;
  name: string;
};

export type ProjectFile = {
  key: string;
  name: string;
  last_modified: string;
  thumbnail_url?: string;
};

type ProjectsResponse = {
  projects: Project[];
};

type FilesResponse = {
  files: ProjectFile[];
};

export type DiscoveredFile = ProjectFile & { projectName: string };

export async function validatePat(client: FigmaClient): Promise<Me> {
  return client.get<Me>("/v1/me");
}

export async function listProjects(
  client: FigmaClient,
  teamId: string,
): Promise<Project[]> {
  const res = await client.get<ProjectsResponse>(`/v1/teams/${teamId}/projects`);
  return res.projects;
}

export async function listFilesInProject(
  client: FigmaClient,
  projectId: string,
): Promise<ProjectFile[]> {
  const res = await client.get<FilesResponse>(`/v1/projects/${projectId}/files`);
  return res.files;
}

export async function discoverFiles(
  client: FigmaClient,
  teamId: string,
): Promise<DiscoveredFile[]> {
  const projects = await listProjects(client, teamId);
  const perProject = await Promise.all(
    projects.map(async (p) => {
      const files = await listFilesInProject(client, p.id);
      return files.map<DiscoveredFile>((f) => ({ ...f, projectName: p.name }));
    }),
  );
  const flat = perProject.flat();
  flat.sort(
    (a, b) =>
      new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime(),
  );
  return flat;
}

export function parseTeamId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/team\/(\d+)/);
  if (match && match[1]) return match[1];
  if (/^\d+$/.test(trimmed)) return trimmed;
  throw new Error(
    "Could not parse team id. Paste a URL like figma.com/files/team/123456 or the numeric id.",
  );
}
