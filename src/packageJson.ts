import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PackageJson } from "./types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const packageJson: PackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json")).toString());
