export type SlackBlock = Record<string, unknown>;

export type SlackPayload = {
  text?: string;
  blocks?: SlackBlock[];
};

export class SlackError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "SlackError";
  }
}

export async function postToWebhook(
  url: string,
  payload: SlackPayload,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new SlackError(
      `Slack ${res.status} ${res.statusText}: ${body.slice(0, 200)}`,
      res.status,
    );
  }
}

export async function postConnectionTest(url: string): Promise<void> {
  await postToWebhook(url, {
    text: ":white_check_mark: figbits connected — you'll receive Figma comment digests here.",
  });
}
