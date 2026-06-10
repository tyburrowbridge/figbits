export type SchedulePreset =
  | "daily-9"
  | "twice-9-13"
  | "hourly-workday"
  | "weekly-mon";

export type WatchedFile = {
  key: string;
  name: string;
  projectName: string;
};

export type Config = {
  figmaPat: string;
  teamId: string;
  files: WatchedFile[];
  slackWebhook: string;
  schedule: SchedulePreset;
};

export type State = {
  lastRun: Record<string, string>;
  surfacedThreads: Record<string, string[]>;
};
