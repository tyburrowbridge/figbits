const FIGMA_API = "https://api.figma.com";

export class FigmaError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FigmaError";
  }
}

export type FigmaClient = {
  get<T>(path: string): Promise<T>;
};

export function createClient(pat: string): FigmaClient {
  return {
    async get<T>(path: string): Promise<T> {
      return request<T>(path, pat, 0);
    },
  };
}

async function request<T>(path: string, pat: string, attempt: number): Promise<T> {
  const res = await fetch(`${FIGMA_API}${path}`, {
    headers: { "X-Figma-Token": pat },
  });

  if (res.status === 429 || res.status >= 500) {
    if (attempt < 1) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? "2");
      await sleep(retryAfter * 1000);
      return request<T>(path, pat, attempt + 1);
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FigmaError(
      `Figma ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 200)}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
