import { UpdateVersionNumType } from "../constants/enum.js";

export function getUpdateVersionNum(onVersion: string, updateVersionNumType: UpdateVersionNumType) {
  const [major = "1", minor = "0", patch = "0"] = onVersion.split(".");

  let newVersion = "";
  switch (updateVersionNumType) {
    case UpdateVersionNumType.MAJOR:
      newVersion = `${parseInt(major) + 1}.0.0`;
      break;
    case UpdateVersionNumType.MINOR:
      newVersion = `${major}.${parseInt(minor) + 1}.0`;
      break;
    case UpdateVersionNumType.PATCH:
      newVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
      break;
    default:
      newVersion = onVersion;
  }
  return newVersion;
}
