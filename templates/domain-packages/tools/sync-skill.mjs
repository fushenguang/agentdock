#!/usr/bin/env node

import { cpSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { findProjectRoot, findSkillSource } from "./check-skill.mjs";

const SKILL = "astryx-web-design";
const root = findProjectRoot();
const source = findSkillSource(root);
if (!source) {
  console.error("Cannot find @cogito.ai/astryx-web skill source. Install the package first.");
  process.exitCode = 1;
} else {
  const vendor = join(root, ".agents/skills", SKILL);
  rmSync(vendor, { recursive: true, force: true });
  mkdirSync(vendor, { recursive: true });
  cpSync(source, vendor, { recursive: true });

  mkdirSync(join(root, ".claude/skills"), { recursive: true });
  const link = join(root, ".claude/skills", SKILL);
  rmSync(link, { force: true });
  symlinkSync(`../../.agents/skills/${SKILL}`, link, "dir");
  console.log(`Synced ${SKILL} from ${source}`);
}
