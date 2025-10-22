import fs from "fs";
import path from "path";

import { UpdateVersionType } from "../constants/enum.js";

export function getAppUpdateVersion(appPath: string, updateVersionType: string) {
  const packageJsonPath = path.join(appPath, "package.json");
  if (!fs.statSync(packageJsonPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`package.json 文件不存在: ${appPath}`);
  }
  const onVersion = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version || "1.0.0";
  const [major, minor, patch] = onVersion.split(".");
  let newVersion = "";
  switch (updateVersionType) {
    case UpdateVersionType.MAJOR:
      newVersion = `${parseInt(major) + 1}.0.0`;
      break;
    case UpdateVersionType.MINOR:
      newVersion = `${major}.${parseInt(minor) + 1}.0`;
      break;
    case UpdateVersionType.PATCH:
      newVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
      break;
    default:
      newVersion = onVersion;
  }
  return newVersion;
}

export function setAppVersion(appPath: string, version: string) {
  const packageJsonPath = path.join(appPath, "package.json");
  if (!fs.statSync(packageJsonPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`package.json 文件不存在: ${appPath}`);
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}
