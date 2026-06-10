import { checkbox, input, password, select } from "@inquirer/prompts";
import { ICON } from "./icons.js";

export function header(step: number, total: number, title: string): void {
  process.stdout.write(`\n${ICON.spark} Step ${step}/${total}  ${title}\n`);
}

export function note(text: string): void {
  process.stdout.write(`   ${text}\n`);
}

export function success(text: string): void {
  process.stdout.write(`   ${ICON.ok} ${text}\n`);
}

export function warn(text: string): void {
  process.stdout.write(`   ${ICON.warn} ${text}\n`);
}

export async function askSecret(message: string): Promise<string> {
  return password({ message, mask: "*" });
}

export async function askInput(
  message: string,
  validate?: (v: string) => true | string,
): Promise<string> {
  return input({ message, validate });
}

export async function askSelect<T extends string>(
  message: string,
  choices: { name: string; value: T; description?: string }[],
): Promise<T> {
  return select<T>({ message, choices });
}

export async function askCheckbox<T>(
  message: string,
  choices: { name: string; value: T; checked?: boolean }[],
): Promise<T[]> {
  return checkbox<T>({ message, choices, pageSize: 15 });
}
