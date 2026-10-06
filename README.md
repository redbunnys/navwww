# 导航页

可收藏、可搜索的个人导航页。React 19 + TanStack Query + Tailwind CSS v4 + Vite。

## 用法

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 类型检查 + 生产构建到 dist/
pnpm preview    # 预览构建产物

# 云端后端（Cloudflare Workers + D1）
pnpm worker:dev        # 本地后端 http://127.0.0.1:8787
pnpm worker:typecheck  # 后端类型检查
pnpm db:local          # 本地 D1 建表
pnpm db:remote         # 线上 D1 建表
pnpm worker:deploy     # 部署后端到 Cloudflare
pnpm web:deploy        # 构建并部署前端静态站点到 Cloudflare
```

## 功能

- 主页面搜索引擎：居中搜索框，左侧显示当前引擎，点它展开切换（百度 / 必应 / 谷歌 / 搜狗 / 360 / 知乎 / 哔哩哔哩 / GitHub / 淘宝 / 豆瓣）；
  输入即筛选书签，回车用当前引擎新标签页直达搜索
- 左侧分类栏：参照 HiTab 的 Win12 式竖向图标栏（图标在上、名称在下，选中项高亮并带数量角标），
  可新建 / 重命名 / 换图标 / 删除，底部为背景、主题、数据三个入口
- 图标栏：自适应网格，三档磁贴尺寸（小 / 中 / 大），可切换显示名称或仅图标
- 收藏：磁贴右上角星标一键收藏，侧栏「收藏」聚合所有收藏项
- 书签搜索：匹配名称、网址、描述与拼音首字母（`gh` → GitHub），命中高亮并显示所属分类
- 背景：默认使用项目内置壁纸（`public/wallpaper.jpg`），侧栏「背景」可切换默认 / 渐变（8 套）/ 图片（内置壁纸 + 6 张预设 + 自定义图片地址 + 本地图片）/ 纯色，支持遮罩不透明度与模糊
- 壁纸模式：启用背景后不再有半透明底板，图标与文字直接浮在壁纸上，标题、图标名称、侧栏文字自动转为白色并带文字阴影
- 快捷键：`Ctrl/Cmd + K` 或 `/` 聚焦搜索框，`Esc` 清空
- 书签管理：添加 / 编辑 / 删除 / 复制链接，图标默认自动抓取站点 `favicon.ico`，可自定义图标地址与配色
- 更多操作：磁贴右键或左上角按钮呼出菜单
- 主题：浅色 / 深色 / 跟随系统，跟随系统时实时响应系统切换
- 数据：未登录时存于浏览器 `localStorage`（键名 `nav:data`），支持导出 / 导入 JSON、恢复默认
- 导入浏览器收藏夹：支持 Chrome / Edge / Firefox 导出的收藏夹 HTML，按文件里的文件夹结构建立分类（嵌套文件夹为「父 / 子」），
  自动跳过 `javascript:`、`place:` 等无效链接与重复网址；已登录时导入结果会一并同步到云端
- 账号：侧栏底部登录 / 注册，用户名 + 密码，服务端 PBKDF2 加盐哈希、HMAC 签名 JWT；
  账号面板可修改密码与用户名（都需要输入当前密码确认）
- 管理员：第一个注册的账号自动成为管理员，可在账号面板里查看全部账号并开关「开放注册」
- 云同步：登录后自动改用云端数据；若本机已有数据，会询问「合并 / 只用云端 / 用本地覆盖云端」
- 云端存储：Cloudflare Workers + D1（SQLite），每个账号一份 JSON，单次上限 1MB

## 结构

```
src/
├─ App.tsx                 布局与业务编排
├─ types.ts                数据模型
├─ data/
│  ├─ repo.ts              仓储接口 + localStorage 实现
│  ├─ storage.ts           读写、默认设置、版本迁移
│  ├─ defaults.ts          内置分类与书签种子数据
│  ├─ session.ts           登录状态与 API 地址
│  ├─ api.ts               云端接口封装
│  ├─ cloudRepo.ts         云端仓储实现（写入自动合并）
│  └─ merge.ts             本机与云端数据的合并 / 替换策略
├─ hooks/
│  ├─ useNav.ts            TanStack Query 封装与写入
│  └─ usePersistentState.ts
├─ lib/
│  ├─ search.ts            搜索索引、打分、拼音首字母、高亮
│  ├─ bookmarks.ts         浏览器收藏夹 HTML 解析与合并
│  ├─ url.ts               URL 规范化、favicon、打开与复制
│  ├─ engines.ts           搜索引擎列表与跳转
│  ├─ background.ts        渐变/图片预设、背景样式、图片压缩
│  └─ constants.ts         调色板、磁贴尺寸
├─ components/             侧栏、居中搜索、背景层、磁贴、对话框、Toast
│  └─ 账号相关              LoginDialog、SyncDialog、AccountDialog

worker/                     云端后端（Hono + Cloudflare Workers）
├─ src/index.ts             路由 /api/auth/*、/api/data
├─ src/crypto.ts            PBKDF2 密码哈希 + HMAC JWT
├─ src/store.ts             D1 读写
├─ schema.sql               users / user_data / app_config 建表
└─ migrations/              已有数据库的升级脚本

public/                     静态资源（默认壁纸）
```

## 说明

- 预设图片来自 `picsum.photos`，需要联网才能显示；本地图片会先压缩到最长边 2400px 再以 data URL 存进 `localStorage`
- `localStorage` 单站点容量约 5MB，上传图片过多时会保存失败，重要数据建议先导出备份
- 本地上传的图片壁纸（data URL）不会上传云端，只保留在本机；换设备登录后云端数据里没有这张壁纸
- 云端接口地址：开发默认 `http://127.0.0.1:8787`，线上由 `.env.production` 的 `VITE_API_BASE` 决定

## 云端同步与部署（Cloudflare）

后端是 Cloudflare Worker（Hono 路由）+ D1（SQLite）。UI 只依赖 `src/data/repo.ts` 的 `NavRepository`
接口（`load` / `save` / `reset`），未登录用 `localRepository`，登录后切到 `createCloudRepository`，组件无需改动。

线上地址：前端 <https://nav.okrust.com>，接口 <https://nav-api.okrust.com>。

> `*.workers.dev` 在部分网络下被 DNS 污染、无法访问，所以两个服务都绑定了自有域名；
> 绑定的域名会自动签发证书，无需额外配置。若要换域名，改 `wrangler.toml` 的 `[[routes]]`
> 与 `wrangler.web.toml` 的 `[[routes]]`，并同步 `ALLOWED_ORIGINS` 和 `.env.production`。

1. 登录 Cloudflare（首次会打开浏览器授权）：

   ```bash
   npx wrangler login
   ```

2. 创建 D1 数据库，把输出的 `database_id` 填进 `wrangler.toml`：

   ```bash
   npx wrangler d1 create navpage
   ```

3. 建表（本地 / 线上）：

   ```bash
   pnpm db:local    # 本地开发
   pnpm db:remote   # 线上
   ```

   已经有数据的库不要重跑建表，改用升级脚本（版本 0001 增加了 `users.role` 与 `app_config`，
   并把最早的账号提升为管理员）：

   ```bash
   npx wrangler d1 execute navpage --local  --file=worker/migrations/0001-admin.sql
   npx wrangler d1 execute navpage --remote --file=worker/migrations/0001-admin.sql
   ```

4. 配置密钥并部署后端：

   ```bash
   npx wrangler secret put JWT_SECRET   # 输入一串随机长字符串
   pnpm worker:deploy
   ```

5. 前端：`.env.production` 里的 `VITE_API_BASE` 指向接口域名（构建时写进产物，`pnpm dev` 不受影响），
   然后 `pnpm web:deploy` 构建并部署静态站点（`wrangler.web.toml` 里的静态资源 Worker）。
   跨域需在 `wrangler.toml` 的 `ALLOWED_ORIGINS` 里加上前端域名，改完重新 `pnpm worker:deploy`。

本地全流程调试：`pnpm worker:dev` 起后端，另开终端 `pnpm dev` 起前端，即可注册登录。

### 平台限制

- Cloudflare Workers 的 PBKDF2 最多 10 万次迭代（`worker/src/crypto.ts` 的 `ITERATIONS`），
  写成 15 万在线上会直接抛错返回 500，本地 `workerd` 不校验所以测不出来
- 单个账号数据上限 1MB，超出会返回 413
- `wrangler tail`（WebSocket）在受限网络下可能连不上，排错可改用 `npx wrangler deployments list` 与线上接口自测
