import { AppConfigExtend } from "../../types/config.js";
import { LoaderHandler } from "./type.js";

/**
 * 代码自定义条件替换
 * 示例：
 * // TODO: #code_cu_if_app(appConfig.env.NODE_ENV === "production")
 * console.log("production");
 * // TODO: #end_code_cu_if_app
 *
 *
 * @param _
 * @param appConfig
 * @param buffer
 * @returns
 */
export const codeCustomIf: LoaderHandler = (_: string, appConfig: AppConfigExtend, buffer: Buffer) => {
  return buffer
    .toString()
    .replace(/\/\/\s*TODO:\s*#code_cu_if_app\((.+?)\)\s*([\s\S]*?)\s*\/\/\sTODO:\s*#end_code_cu_if_app\s*/g, (_, param, code) => {
      if (!!new Function("app", `return ${param}`)(appConfig)) {
        return code;
      }
      return "";
    });
};
