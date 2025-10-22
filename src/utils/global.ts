import fs from "fs";
import path from "path";

/**
 * @param path
 */
export function hasFile(path: string) {
  return hasPath(path, "file");
}

/**
 * @param path
 */
export function hasDir(path: string) {
  return hasPath(path, "dir");
}

/**
 * @param path
 * @param type
 */
export function hasPath(path: string, type: "file" | "dir") {
  return fs.promises
    .stat(path)
    .then((res) => {
      if (type === "file") {
        return res.isFile();
      } else if (type === "dir") {
        return res.isDirectory();
      } else {
        return false;
      }
    })
    .catch(() => false);
}

/**
 * 按固定大小分组（等分切割）
 * @param arr 原数组
 * @param size 每组大小（必须为正整数）
 */
export function chunkArray<T>(arr: T[], size: number) {
  // 处理边界：size 无效时返回原数组或空数组
  if (size <= 0 || !Array.isArray(arr)) return [];

  // 计算总组数（向上取整）
  const groupCount = Math.ceil(arr.length / size);

  // 生成分组结果
  return Array.from({ length: groupCount }, (_, index) => {
    const start = index * size;
    const end = start + size;
    return arr.slice(start, end); // 截取 [start, end) 区间
  });
}

/**
 * @param obj
 */
export function getQueryString(obj: Record<string, string>) {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

/**
 * @param queryString
 */
export function parseQueryString(queryString: string): Record<string, string> {
  return queryString
    .split("&")
    .map((item) => item.split("="))
    .reduce((acc, [key, value]) => {
      // @ts-expect-error
      acc[key] = value;
      return acc;
    }, {});
}

/**
 * 递归往上层查找文件
 * @param dir
 * @param formats 这个参数是格式的意思比如 ['a.ts','a.d.ts','a.js']
 */
export function lookupFile(dir: string, formats: string[]) {
  for (const format of formats) {
    const fullPath = path.join(dir, format);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  const parentDir = path.dirname(dir);
  if (parentDir !== dir) {
    return lookupFile(parentDir, formats);
  }
}
