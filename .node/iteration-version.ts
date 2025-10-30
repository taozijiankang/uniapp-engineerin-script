import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { program } from "commander";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, "../package.json");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());

interface IterationVersionOptions {
  type?: "major" | "minor" | "patch";
}

program
  .version(packageJson.version)
  .description("迭代版本号")
  .option("-t, --type <type>", "版本号类型，可选值：major|minor|patch")
  .action(() => {
    iterationVersion(program.opts());
  })
  .parse(process.argv);

async function iterationVersion(options: IterationVersionOptions) {
  const { type } = options;

  const remoteVersion = await new Promise<string>((resolve, reject) => {
    exec(`npm view ${packageJson.name} version`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout.trim());
    });
  }).catch((error) => {
    return "1.0.0";
  });

  const [major = "1", minor = "0", patch = "0"] = remoteVersion.split(".");

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
