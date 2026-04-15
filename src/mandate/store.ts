import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { MandateProfile } from "./types.js";

export class FileMandateStore {
  constructor(private readonly rootDir: string) {}

  async load(userId: string): Promise<MandateProfile | null> {
    try {
      const raw = await readFile(this.resolvePath(userId), "utf8");
      return JSON.parse(raw) as MandateProfile;
    } catch (error: unknown) {
      const code =
        error && typeof error === "object" && "code" in error ? (error as NodeJS.ErrnoException).code : undefined;
      if (code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async save(userId: string, profile: MandateProfile): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await writeFile(this.resolvePath(userId), `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  }

  private resolvePath(userId: string): string {
    return join(this.rootDir, `${userId}.json`);
  }
}
