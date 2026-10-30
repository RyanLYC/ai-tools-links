# AGENTS.md — AI 协作上下文文档

> 目的：让任何 AI 助手（或新开发者）在不重新摸索的情况下，快速理解本项目的架构、数据流、关键机制与历史决策。**修改代码前请先读完本文档。**

---

## 1. 项目是什么

**AI 工具集（ai-tools-links）**：一个"收藏夹"性质的纯前端网站导航管理工具。

- 无任何后端，所有数据存浏览器 **IndexedDB**（Dexie.js 封装）
- 支持网站/分类/标签的完整 CRUD、图标上传（ArrayBuffer 存库）、APIKey 管理（脱敏显示）
- JSON 导入导出；GitHub Gist 加密远程同步（AES-256-GCM）
- 双形态部署：
  - **静态站点**：部署在 `https://younglina.wang/tool-links/` 子路径（vite `base: './'`）
  - **Chrome 扩展**：`dist` 目录即 MV3 扩展（`public/manifest.json` + `background.js`）

## 2. 技术栈与常用命令

| 项     | 值                                                                              |
| ------ | ------------------------------------------------------------------------------- |
| 框架   | Vue 3.4（`<script setup>` + Composition API）                                   |
| 语言   | TypeScript（**宽松模式**：`strict: false`、`noImplicitAny: false`）             |
| 构建   | Vite 5（`target: esnext`，manualChunks 拆 vue-vendor/dexie）                    |
| 样式   | Tailwind 3 + 手写 scoped CSS，唯一主题 `neumorphism`（CSS 变量驱动）            |
| 状态   | Pinia 2（仅筛选状态 `stores/app.ts`；业务数据在 composables 模块级单例 ref 中） |
| 数据库 | Dexie 3，库名 `SitesDB`，表：websites / categories / tags                       |

命令（**Windows PowerShell，用 `;` 分隔，不用 `&&`**）：

```bash
npm run dev          # 开发服务器，端口 7080，自动开浏览器
npm run build        # 产物输出到 dist/
npm run type-check   # vue-tsc --noEmit（见 §6 约定：不要每步都跑）
```

## 3. 目录与模块地图

```
src/
├── main.ts                 # 入口：seed 数据库 → 挂载；注册 SW（见 §4 注意事项）
├── App.vue                 # 布局壳：Header/Sidebar/MainContent/SyncSettings；中转 action 事件
├── db/
│   ├── index.ts            # SitesDB 类。version 2 迁移：categoryId → categoryIds[]
│   └── seed.ts             # 空库时注入默认分类/标签；DEV 才注入 12 个示例网站
├── composables/            # ★ 模块级单例模式：ref 定义在模块顶层，所有调用方共享同一份 state
│   ├── useWebsites.ts      # websites 列表 + CRUD（每次写操作后全量 reload）
│   ├── useCategories.ts    # categories 列表 + CRUD（带 loaded 标记防重复加载）
│   ├── useTags.ts          # tags 列表 + CRUD
│   ├── useImageUpload.ts   # File→ArrayBuffer、ArrayBuffer→BlobURL 工具 + 上传表单逻辑
│   ├── useImportExport.ts  # JSON 导出（icon 转 base64）/ 导入（merge=按 url 去重, replace=清空重灌）
│   ├── useApiKey.ts        # APIKey 复制/脱敏（被 ApiKeyInput 使用）
│   └── useTheme.ts         # 主题切换（当前只有 neumorphism 一种）
├── stores/
│   ├── app.ts              # 筛选状态：categoryId / tagIds / searchQuery
│   └── sync.ts             # Gist 同步状态机（encrypting→uploading→…），配置存 localStorage
├── services/gistSync.ts    # GitHub Gist REST 封装（upload/download/validateToken）
├── utils/
│   ├── crypto.ts           # PBKDF2(100k 迭代) 派生密钥 + AES-GCM；密文含 iv/salt/version
│   ├── merge.ts            # 同步合并策略：按 id + updatedAt 新者胜；分类按 name 去重
│   ├── validators.ts       # URL 校验、APIKey 脱敏、剪贴板、日期格式化
│   └── constants.ts        # 默认分类/标签、MAX_FILE_SIZE(500KB)
├── components/
│   ├── layouts/            # Header(搜索+添加下拉+导入导出)、Sidebar(仅包 CategoryFilter)、MainContent(★核心)
│   ├── filter/             # SearchBar、CategoryFilter（侧边栏分类+计数）
│   ├── website/            # WebsiteCard、WebsiteForm、WebsiteDetailDrawer、ImageUploader、ApiKeyInput
│   └── common/             # CategoryManageModal、TagManageModal
└── styles/                 # main.css + themes/neumorphism.css（:root[data-theme="neumorphism"] 定义变量）
```

### 核心数据流

1. **加载**：`MainContent.onMounted` → `Promise.all([loadWebsites, loadCategories, loadTags])`
2. **筛选**：SearchBar/CategoryFilter 修改 Pinia `appStore.filter` → `MainContent.filteredWebsites` computed 在内存中过滤（不查库）
3. **卡片交互（2026-10 重构）**：**点击卡片 = 新标签直接访问网站**（`window.open`，在 WebsiteCard 内部处理）；查看详情/编辑/删除在 hover 工具栏（emit `detail`/`edit`/`delete` → MainContent）
4. **写操作**：WebsiteForm 提交 → `useWebsites.add/update` → 写 Dexie → `loadWebsites()` 全量刷新 → 所有 WebsiteCard 因数组重建而重渲染
5. **同步**：`SyncSettings` → `stores/sync.ts` → 读取全库 → crypto 加密 → gistSync 上传；下载则反向 + `merge.ts` 合并 + 事务重灌 → 发 `synced` 事件 → App 调 `MainContent.refreshData()`
6. **导入/导出**：Header **自己**处理（不经 App 中转），完成后需要通知刷新界面（2026-10 修复前缺失，见 §5）

## 4. 关键机制与注意事项

- **Vite 8 (Rolldown 内核)**：`rollupOptions.output.manualChunks` 只支持**函数形式**，对象写法会构建失败；CSS/JS 产物体积与 Vite 5 略有差异属正常。
- **图标**：`ArrayBuffer` 存 Dexie → 显示时经 `useWebsites.getWebsiteIconUrl` 的模块级缓存（`Map<id, {url, updatedAt}>`）转 Blob URL，删除网站时 revoke。**图标展示三级回退**：上传图标 → 自动加载站点 `/favicon.ico`（`useImageUpload.getFaviconUrl`，`<img>` 展示不受跨域限制，onerror 后置 `faviconFailed` 不再重试）→ MDI 占位图标。**注意：不要用 fetch 下载 favicon 存库**（需对方 CORS 头，多数站点没有，必失败）。
- **public/sw.js 必须是纯 JS**：public 目录不经过编译，写 TypeScript 语法（如 `(event: any)`）会导致 SW 解析失败。SW 仅在 `http(s)` 协议下注册（Chrome 扩展环境是 `chrome-extension://`，不注册）；注册路径要用 `import.meta.env.BASE_URL`（站点部署在子路径）。
- **SW 缓存策略**：页面导航 network-first（避免更新后卡旧版本），`/assets/` 下带 hash 的静态资源 cache-first。
- **Chrome 扩展**：`manifest.json` 无 `default_popup`，点击图标由 `background.js` 打开 `index.html` 标签页。`dist` 就是扩展根目录。
- **仓库里的 `tool-links/` 目录是历史部署产物**（对应线上子路径），**不要删除**；`dist/` 同理是构建产物。
- **seed 逻辑**：`main.ts` 在 mount 前 `await seedDatabase()`（保证首屏有分类/标签）；seed.ts 内部用 count 判断幂等；示例网站仅 `import.meta.env.DEV` 注入。
- **导入 merge 模式**：分类/标签按名称查重映射新旧 id；网站按 **url** 去重跳过。`replace` 模式先清空三表。

## 5. 2026-10 全面优化记录

> 探索全库后确定的问题清单与处置。状态：✅ 已完成（以下所有项均已完成）。

### Bug 修复（行为正确性）

| #   | 问题                                                                       | 位置                                | 方案                                                                      | 状态 |
| --- | -------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------- | ---- |
| B-1 | sw.js 含 TS 语法，SW 永远解析失败                                          | `public/sw.js`                      | 重写为纯 JS + network-first/cache-first 策略 + activate 清理旧缓存        | ✅   |
| B-2 | SW 注册路径硬编码 `/sw.js`，子路径部署 404；扩展环境无意义注册             | `src/main.ts`                       | 用 `BASE_URL` + 仅 `http(s)` 协议注册                                     | ✅   |
| B-3 | 导入 JSON 成功后界面不刷新（Header 自行处理导入，无人通知 MainContent）    | `Header.vue`/`App.vue`              | Header 导入成功后 emit `imported` → App 调 `mainContentRef.refreshData()` | ✅   |
| B-4 | 搜索词在 store 里被 `toLowerCase()` 持久化，标题显示 `搜索: "小写文本"`    | `stores/app.ts` + `MainContent.vue` | store 存原始输入，过滤时再 lowercase                                      | ✅   |
| B-5 | `useTheme` 在 onMounted 才设置 `data-theme`，首帧 CSS 变量缺失（闪烁风险） | `useTheme.ts`                       | 模块/setup 内同步恢复主题                                                 | ✅   |

### 性能优化

| #   | 问题                                                                                                                  | 位置                               | 方案                                                                            | 状态 |
| --- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------- | ---- |
| P-1 | 启动时全表**双份加载**：CategoryFilter 自行 `loadWebsites()`（含所有图标 ArrayBuffer），与 MainContent 并发重复查询   | `CategoryFilter.vue`               | 移除组件内加载，统一由 MainContent 负责                                         | ✅   |
| P-2 | `useCategories`/`useTags` 的 loaded 标记在并发首载时会重复查询（await 后才置位）                                      | 两个 composable                    | in-flight Promise 共享（同一时刻只发一次查询）                                  | ✅   |
| P-3 | WebsiteCard 每张卡 onMounted 调 loadCategories/loadTags（冗余）                                                       | `WebsiteCard.vue`                  | 删除，MainContent 已保证加载                                                    | ✅   |
| P-4 | 图标 blob URL 泄漏：computed 每次 website 引用变化就 createObjectURL，旧 URL 仅组件卸载才回收；编辑/增删后旧 URL 泄漏 | `WebsiteCard.vue`/`useWebsites.ts` | 模块级 `Map<id, {url, updatedAt}>` 缓存，按 updatedAt 失效重建；删网站时 revoke | ✅   |
| P-5 | 搜索无防抖，每击键全量过滤                                                                                            | `SearchBar.vue`                    | 300ms debounce                                                                  | ✅   |
| P-6 | 过滤时每条记录每次重复 `toLowerCase()` ×3                                                                             | `MainContent.vue`                  | WeakMap 缓存每条记录的小写搜索串                                                | ✅   |
| P-7 | `getSyncSummary` O(n²)（循环内 find）且内部重复调用一次 `mergeWebsites`                                               | `utils/merge.ts`                   | 全程 Map 索引，一次遍历出全部统计                                               | ✅   |
| P-8 | base64 转换逐字节字符串拼接，大图标 O(n²) 内存抖动                                                                    | `useImportExport.ts`/`crypto.ts`   | 0x8000 分块 `String.fromCharCode`                                               | ✅   |
| P-9 | `main.ts` await seed 阻塞挂载 + `App.vue` 里 useDexie 又重复 open+seed                                                | `main.ts`/`App.vue`/`useDexie.ts`  | 删除 useDexie 调用与文件（seed 已在入口保证，Dexie 惰性 open）                  | ✅   |

### 死代码清理（均已确认无任何引用）

| #   | 对象                                                                                                                                    | 说明                                                                            | 状态 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---- |
| D-1 | `components/filter/TagFilter.vue`                                                                                                       | 无引用（侧边栏只用 CategoryFilter），内部 showAddDialog 也是死 UI               | ✅   |
| D-2 | `components/common/ManagePanel.vue` + `CategoryDialog.vue` + `TagDialog.vue`                                                            | 三件套仅被 ManagePanel 引用，而 ManagePanel 无人引用（已被 \*ManageModal 取代） | ✅   |
| D-3 | `useWebsites.selectedWebsite/getWebsiteById`、`useCategories.getCategoryById`、`useTags.getTagById/incrementTagCount/decrementTagCount` | 无调用方                                                                        | ✅   |
| D-4 | `MainContent.handleEditWebsite/handleDeleteWebsite`                                                                                     | 模板未使用的遗留函数                                                            | ✅   |
| D-5 | `validators.generateId`（用了已弃用的 `substr`）、`merge.detectConflicts/mergeGeneric`                                                  | 无调用方                                                                        | ✅   |

### 工程配置

| #   | 问题                                                                       | 方案                                                  | 状态 |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------- | ---- |
| C-1 | vite alias `"@": "/src"` 非标准写法                                        | 改 `fileURLToPath(new URL('./src', import.meta.url))` | ✅   |
| C-2 | tsconfig `declaration/declarationMap` 对应用无意义，拖慢 vue-tsc           | 移除                                                  | ✅   |
| C-3 | `types/index.ts` 的 `icon: ArrayBuffer` 必填与导入逻辑不符（导入可无图标） | 改 `icon?: ArrayBuffer`                               | ✅   |

### 基线产物（优化前，供对比）

```
dist/index.html 2.72 kB │ CSS 377.31 kB(gzip 64.16) │ JS: index 72.96 + dexie 74.29 + vue-vendor 79.00 kB
字体: woff2 403kB + woff 588kB + ttf/eot 各 1.3MB（浏览器运行时只下载 woff2，其余格式仅进 dist）
```

### 第二轮：工具链升级与界面/交互优化（同日）

**工具链**

- vite 5.1 → **8.3.5**（Rolldown 内核）、`@vitejs/plugin-vue@6`、`vue-tsc` 升至最新；vue/typescript 随之升级
- 新增 `vite-plugin-vue-devtools@8`（仅 dev 注入，build 不受影响）

**功能增强**

- 侧边栏分类新增**排序工具栏**（默认/名称/数量，选择持久化到 localStorage `categorySortMode`）
- Sidebar：移动端遮罩点击可关闭、Esc 关闭、选中分类后自动收起（CategoryFilter emit `navigate` → Sidebar emit `close`）、`100dvh` 适配
- 搜索：`Ctrl/Cmd+K` 全局聚焦 + 键帽提示（SearchBar）

**视觉/布局**

- 品牌渐变（蓝→青 `--accent` → `--secondary-accent`）应用于 logo 与添加按钮；body 加柔和光晕背景
- 修复卡片入场交错动画（`.animate-fade-in-up` 改 `animation-fill-mode: both`）；卡片 hover 微交互（上浮/图标放大/标题变色）
- 主区标题下增加"共 N 个网站"计数副标题
- **统一间距体系**：页面横向边距 32px（header `0 2rem` 与主区 `24px 32px` 对齐）、区块间距 24px、卡片 20px/内距 12px、列表项 8px；≤1024px 与 ≤640px 断点同步收敛

### 第三轮：卡片重构与高密度布局（同日）

- **行为变更**：点击卡片由"打开详情抽屉"改为**新标签直接访问网站**；详情入口移至 hover 工具栏（眼睛图标 + 编辑 + 删除）；原"访问网站"按钮移除（与整卡点击重复）
- **紧凑化**：图标 40→32px、描述改**单行省略**（`:title` 悬停看全文）、卡片 padding 12px 14px/内距 8px、名称 15px
- **网格**：最小列宽 220px（≤1024px 时 180px）、间距 20px —— 1080p 全屏约 6 列，一屏 30+ 项
- **自动站点图标**：WebsiteCard/WebsiteDetailDrawer 三级回退（上传图标 → 站点 favicon.ico → 占位图标）；抽屉的旧 blob 逻辑已统一到共享缓存版 `getWebsiteIconUrl`

### 明确不做的（含原因）

- **MDI 字体子集化**：`@mdi/font` 全量 CSS+字体是 CSS 377KB 的主因，但按需子集需要改构建链（unplugin-icons 或定制 font-face），风险收益比不合适。浏览器运行时只下载 woff2（403KB），实际首屏影响有限。
- **替换 alert/confirm 为 toast**：改变交互形态，超出"优化"范畴，如需请单独立项。
- **图片上传时 canvas 压缩**：功能增强而非优化，涉及图像质量取舍，单独立项。
- **删除仓库内 `tool-links/` 与 `dist/`**：分别为线上部署产物与扩展产物。

## 6. 开发约定（本项目所有者明确要求）

1. **不要每步改动都跑 `type-check`/ESLint**——功能验证以 `npm run dev` 编译通过 + 浏览器实际效果为准；静态校验留到提交前统一处理。
2. **验证过程的临时产物不入仓库**（截图、临时脚本等）：先补 `.gitignore`，收尾时删除并用 `git status` 复核。
3. 注释与 UI 文案使用中文；代码风格向周围文件看齐（无分号/单引号为主流，个别文件带分号，就地保持一致）。
4. composables 是**模块级单例**：新增共享状态请沿用"ref 定义在模块顶层、函数在 composable 内"的既有模式，不要为了"规范"改成类或全局 store。
5. 改动 Dexie schema 必须**新增 version 并写 upgrade**，不能改旧 version（用户本地已有数据）。
