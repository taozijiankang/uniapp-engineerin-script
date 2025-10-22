import { AppConfigExtend } from "../../types/config.js";
import { LoaderHandler } from "./type.js";

export const codeCustomIf: LoaderHandler = (_: string, appConfig: AppConfigExtend, buffer: Buffer) => {
  return buffer
    .toString()
    .replace(/\/\/\s*TODO:\s*#code_cu_if_app\((.+?)\)\s*([\s\S]*?)\s*\/\/\s*#end_code_cu_if_app\s*/g, (_, param, code) => {
      if (!!new Function("app", `return ${param}`)(appConfig)) {
        return code;
      }
      return "";
    });
};
