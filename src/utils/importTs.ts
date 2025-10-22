import esbuild from "esbuild";
import { rmSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";

/**
 * @param tsFilePath
 */
export async function importTs(tsFilePath: string) {
  const outfile = path.join(path.dirname(tsFilePath), `./${Math.random().toString().replace(".", "")}-${Date.now()}.mjs`);
  await esbuild.build({
    bundle: true,
    format: "esm",
    entryPoints: [tsFilePath],
    outfile,
  });
  try {
    const res = await import(pathToFileURL(outfile).toString());
    return res;
  } catch {
  } finally {
    rmSync(outfile);
  }
  return {};
}
