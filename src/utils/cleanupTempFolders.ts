import fs from "fs";
import path from "path";

/**
 * 清理目标目录下的临时文件夹,随机哈希命名
 * @param targetDir
 */
export function cleanupTempHashFolders(targetDir: string) {
  const files = fs.readdirSync(targetDir);

  // 匹配32位十六进制哈希值命名的文件夹
  const hashPattern = /^[a-f0-9]{32}$/;

  files.forEach((file) => {
    const fullPath = path.join(targetDir, file);
    if (
      hashPattern.test(file) &&
      fs.statSync(fullPath, { throwIfNoEntry: false })?.isDirectory() &&
      // 如果文件夹不为空，则不删除
      fs.readdirSync(fullPath).length === 0
    ) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ 已删除临时文件夹: ${file}`);
      } catch (err) {
        console.error(`❌ 删除临时文件夹失败: ${file}`, err);
      }
    }
  });
}
