import { PackConfig, PagesConfig } from "../types/pages.js";

export function getAppPacks(appPages: PagesConfig) {
  const pages: PackConfig[] = [
    {
      root: "pages",
      pages: appPages.pages.map((item) => {
        const res: PackConfig["pages"][number] = {
          name: item.name || "",
          path: item.path.replace(/^pages\//, ""),
          title: item.style?.navigationBarTitleText || item.name || "",
        };
        return res;
      }),
    },
    ...(appPages.subPackages?.map((item) => {
      return {
        root: item.root,
        pages:
          item.pages?.map((item) => {
            const res: PackConfig["pages"][number] = {
              name: item.name || "",
              path: item.path,
              title: item.style?.navigationBarTitleText || item.name || "",
            };
            return res;
          }) || [],
      };
    }, []) || []),
  ]
    .filter((item) => /^pages-?/.test(item.root))
    .filter((item) => item.pages.length > 0);
  return pages;
}
