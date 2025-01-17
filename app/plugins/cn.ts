import { BuiltinPlugin } from "./typing";

export const CN_PLUGINS: BuiltinPlugin[] = [
  {
    name: "搜索引擎",
    toolName: "web-search",
    lang: "cn",
    description: "搜索引擎的网络搜索功能工具。",
    builtin: true,
    createdAt: 1693744292000,
    enable: true,
    onlyNodeRuntime: false,
  },
  {
    name: "计算器",
    toolName: "calculator",
    lang: "cn",
    description: "计算器是一个用于计算数学表达式的工具。",
    builtin: true,
    createdAt: 1693744292000,
    enable: true,
    onlyNodeRuntime: false,
  },
  {
    name: "网页浏览器",
    toolName: "web-browser",
    lang: "cn",
    description:
      "一个用于与网页进行交互的工具，可以从网页中提取信息或总结其内容。",
    builtin: true,
    createdAt: 1693744292000,
    enable: true,
    onlyNodeRuntime: false,
  },
];
