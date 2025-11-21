import fs from "fs";
import esbuild from "esbuild";
import path from "path";
import { pathToFileURL } from "url";

export async function transformRunTs(tsFilePath: string) {
  const jsFilePath = path.join(
    path.dirname(tsFilePath),
    `./${Math.random().toString().replace(".", "")}-${Date.now()}.${/\.mts$/.test(tsFilePath) ? "mjs" : "js"}`
  );
  try {
    const tsContent = fs.readFileSync(tsFilePath, "utf-8");
    const result = await esbuild.transform(tsContent, {
      loader: "ts",
      format: "esm",
      target: "node18",
    });

    const jsCode = result.code;

    fs.writeFileSync(jsFilePath, jsCode);

    const result2 = await import(pathToFileURL(jsFilePath).toString());
    return result2;
  } catch (e) {
    console.error("transformRunTs error", e);
    throw e;
  } finally {
    if (fs.statSync(jsFilePath, { throwIfNoEntry: false })?.isFile()) {
      fs.rmSync(jsFilePath);
    }
  }
}
