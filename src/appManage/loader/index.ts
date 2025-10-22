import { codeCustomIf } from "./codeCustomIf.js";

export enum LoaderHandlerType {
  CODE_CUSTOM_IF = "codeCustomIf",
}

export const usableLoaderHandlers = {
  [LoaderHandlerType.CODE_CUSTOM_IF]: codeCustomIf,
};
