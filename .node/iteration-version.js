import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { program } from "commander";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, "../package.json");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());

/**
 * @typedef {Object} IterationVersionOptions
 * @property {'major' | 'minor' | 'patch'} [type] 版本号类型
 */

program
  .version(packageJson.version)
  .description("迭代版本号")
  .option("-t, --type <type>", "版本号类型，可选值：major|minor|patch")
  .action(() => {
    iterationVersion(program.opts());
  })
  .parse(process.argv);

/**
 * @param {IterationVersionOptions} options
 */
async function iterationVersion(options) {
  const { type = "patch" } = options;

  const remoteVersion = await new Promise((resolve, reject) => {
    exec(`npm view ${packageJson.name}11 version`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout.trim());
    });
  }).catch((error) => {
    return "1.0.0";
  });

  const [major, minor, patch] = remoteVersion.split(".");

  let newVersion = "";
  switch (type) {
    case "major":
      newVersion = `${parseInt(major) + 1}.0.0`;
      break;
    case "minor":
      newVersion = `${major}.${parseInt(minor) + 1}.0`;
      break;
    case "patch":
      newVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
      break;
    default:
      newVersion = remoteVersion;
      break;
  }

  console.log(`${packageJson.name} 的版本号从 ${remoteVersion} 迭代为 ${newVersion}`);
  packageJson.version = newVersion;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}
