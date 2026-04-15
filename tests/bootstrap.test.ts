import { describe, expect, it } from "vitest";

import { createDePhalanxApp } from "../src/index.js";

const testConfig = {
  brainHost: "openclaw",
  openClawBaseUrl: "http://127.0.0.1:3001",
  phalanxSkillBaseUrl: "http://127.0.0.1:8787",
  mandateStorePath: "./mandates",
};

describe("DePhalanx bootstrap", () => {
  it("boots the DePhalanx product shell", async () => {
    const app = await createDePhalanxApp(testConfig);
    expect(app.brainAdapter).toBeDefined();
    expect(app.phalanxSkillClient).toBeDefined();
  });
});
