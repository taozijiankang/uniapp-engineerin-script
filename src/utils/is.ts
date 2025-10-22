import os from "os";

export function isWindows() {
  return os.type() === "Windows_NT" || os.platform() === "win32";
}

export function isMacOS() {
  return os.type() === "Darwin" || os.platform() === "darwin";
}

export function isLinux() {
  return os.type() === "Linux" || os.platform() === "linux";
}
