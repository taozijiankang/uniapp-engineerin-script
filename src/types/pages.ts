export interface PackConfig {
  root: string;
  pages: {
    name: string;
    path: string;
    title: string;
    pageConfig: Page;
  }[];
}

export interface PagesConfig {
  pages: Page[];
  subPackages?: SubPackage[];
}

export interface Page {
  path: string;
  name?: string;
  style?: {
    navigationBarTitleText?: string;
  };
}

export interface SubPackage {
  root: string;
  pages: Page[];
  plugins?: Record<
    string,
    {
      export: string;
    }
  >;
}
