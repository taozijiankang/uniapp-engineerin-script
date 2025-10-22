import { AppConfigExtend } from "../../types/config.js";

export interface Loader {
  rules: RegExp | { (filePath: string): boolean };
  handler: string | LoaderHandler;
}

export interface LoaderHandler {
  (filePath: string, appConfig: AppConfigExtend, buffer: Buffer): Promise<Buffer | string> | Buffer | string;
}
