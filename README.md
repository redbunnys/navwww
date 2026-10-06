# 导航页

可收藏、可搜索的个人导航页。React 19 + TanStack Query + Tailwind CSS v4 + Vite。

## 用法

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 类型检查 + 生产构建到 dist/
pnpm preview    # 预览构建产物
```

## 功能

- 主页面搜索引擎：居中搜索框，左侧显示当前引擎，点它展开切换（百度 / 必应 / 谷歌 / 搜狗 / 360 / 知乎 / 哔哩哔哩 / GitHub / 淘宝 / 豆瓣）；
  输入即筛选书签，回车用当前引擎新标签页直达搜索
- 左侧分类栏：参照 HiTab 的 Win12 式竖向图标栏（图标在上、名称在下，选中项高亮并带数量角标），
  可新建 / 重命名 / 换图标 / 删除，底部为背景、主题、数据三个入口
- 图标栏：自适应网格，三档磁贴尺寸（小 / 中 / 大），可切换显示名称或仅图标
- 收藏：磁贴右上角星标一键收藏，侧栏「收藏」聚合所有收藏项
- 书签搜索：匹配名称、网址、描述与拼音首字母（`gh` → GitHub），命中高亮并显示所属分类
- 背景：侧栏「背景」可切换默认 / 渐变（8 套）/ 图片（6 张预设 + 自定义图片地址 + 本地图片）/ 纯色，支持遮罩不透明度与模糊
- 壁纸模式：启用背景后不再有半透明底板，图标与文字直接浮在壁纸上，标题、图标名称、侧栏文字自动转为白色并带文字阴影
- 快捷键：`Ctrl/Cmd + K` 或 `/` 聚焦搜索框，`Esc` 清空
- 书签管理：添加 / 编辑 / 删除 / 复制链接，图标默认自动抓取站点 `favicon.ico`，可自定义图标地址与配色
- 更多操作：磁贴右键或左上角按钮呼出菜单
- 主题：浅色 / 深色 / 跟随系统，跟随系统时实时响应系统切换
- 数据：全部存于浏览器 `localStorage`（键名 `nav:data`），支持导出 / 导入 JSON、恢复默认

## 结构

```
src/
├─ App.tsx                 布局与业务编排
├─ types.ts                数据模型
├─ data/
│  ├─ repo.ts              仓储接口 + localStorage 实现
│  ├─ storage.ts           读写、默认设置、版本迁移
│  └─ defaults.ts          内置分类与书签种子数据
├─ hooks/
│  ├─ useNav.ts            TanStack Query 封装与写入
│  └─ usePersistentState.ts
├─ lib/
│  ├─ search.ts            搜索索引、打分、拼音首字母、高亮
│  ├─ url.ts               URL 规范化、favicon、打开与复制
│  ├─ engines.ts           搜索引擎列表与跳转
│  ├─ background.ts        渐变/图片预设、背景样式、图片压缩
│  └─ constants.ts         调色板、磁贴尺寸
└─ components/             侧栏、居中搜索、背景层、磁贴、对话框、Toast
```

## 说明

- 预设图片来自 `picsum.photos`，需要联网才能显示；本地图片会先压缩到最长边 2400px 再以 data URL 存进 `localStorage`
- `localStorage` 单站点容量约 5MB，上传图片过多时会保存失败，重要数据建议先导出备份

## 换成 SQLite 后端

UI 只依赖 `src/data/repo.ts` 里的 `NavRepository` 接口（`load` / `save` / `reset`）。
新增一个调用后端的实现并替换 `src/hooks/useNav.ts` 中的 `localRepository` 即可，
组件与查询键（`['nav']`）无需改动。
