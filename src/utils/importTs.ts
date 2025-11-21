import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function importTs(tsFilePath: string) {
  const outfile = path.join(path.dirname(tsFilePath), `./${Math.random().toString().replace(".", "")}-${Date.now()}.mjs`);
  try {
    await esbuild.build({
      bundle: true,
      format: "esm",
      entryPoints: [tsFilePath],
      outfile,
    });
    const result = await import(pathToFileURL(outfile).toString());
    return result;
  } catch (e) {
    console.error("importTs error", e);
    throw e;
  } finally {
    if (fs.statSync(outfile, { throwIfNoEntry: false })?.isFile()) {
      fs.rmSync(outfile);
    }
  }
}
