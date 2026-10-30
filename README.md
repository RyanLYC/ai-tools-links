# 工具集（AI Tools Links）

一个纯前端的**网站收藏夹 / AI 工具导航**：无需登录、无后端，所有数据存在浏览器 IndexedDB 中。支持一键直达网站、分类/标签筛选、APIKey 管理、JSON 导入导出与 GitHub Gist 加密同步，可打包为 Chrome 扩展使用。

## 功能特性

- **点击直达**：点击卡片直接在新标签页打开网站；悬停工具栏提供详情 / 编辑 / 删除
- **秒搜**：`Ctrl/⌘ + K` 全局聚焦搜索框，300ms 防抖实时过滤（名称 / 描述 / URL）
- **多维筛选**：侧边栏分类（支持按默认 / 名称 / 数量排序，偏好自动记忆）+ 标签多选
- **自动站点图标**：未上传图标时自动加载站点 favicon，失败回退占位图标；也可手动上传自定义图标
- **APIKey 管理**：为每个网站保存多个 APIKey，脱敏显示、一键复制
- **数据导入导出**：JSON 格式，导入支持"合并（按 URL 去重）/ 替换"两种模式
- **远程同步**：通过 GitHub Gist 进行 AES-256-GCM 加密同步（PBKDF2 派生密钥），跨设备恢复数据
- **离线可用**：内置 Service Worker，页面与静态资源可离线缓存

## 技术栈

| 项   | 说明                                                  |
| ---- | ----------------------------------------------------- |
| 框架 | Vue 3（`<script setup>` + Composition API）           |
| 构建 | Vite 8（Rolldown 内核）                               |
| 语言 | TypeScript（宽松模式）                                |
| 样式 | Tailwind CSS 3 + Neumorphism（软 UI）设计系统         |
| 状态 | Pinia（筛选状态）+ 模块级单例 composables（业务数据） |
| 存储 | Dexie.js（IndexedDB 封装），库名 `SitesDB`            |

## 快速开始

```bash
npm install
npm run dev        # 开发服务器 http://localhost:7080
npm run build      # 产物输出到 dist/
npm run type-check # 类型检查
```

### 安装为 Chrome 扩展（推荐）

1. 打开 `chrome://extensions/`，开启右上角**开发者模式**
2. 点击**加载已解压的扩展程序**，选择项目的 `dist` 目录
3. 建议在 `chrome://extensions/shortcuts` 为扩展设置全局快捷键（如 `Ctrl+B`），随时一键唤起

> 扩展模式下点击工具栏图标会在新标签页打开工具集；数据独立于普通网页环境。

### 部署为静态网站

项目使用相对路径 `base: './'`，`dist` 可部署在任意子路径（当前线上：`https://younglina.wang/tool-links/`）。手机浏览器访问后"添加到主屏幕"即可作为 PWA 使用。

## 日常使用建议

- **电脑**：装成 Chrome 扩展 + 全局快捷键，点开即搜即达
- **多设备**：日常数据变动后用"远程同步 → 上传"，新设备配置 Token 与 Gist ID 后"下载"合并恢复
- **备份**：重要数据定期"导出数据"保存 JSON

## 数据与隐私

- 所有数据仅存于浏览器本地（IndexedDB），卸载浏览器数据前请先同步或导出
- 远程同步数据经 AES-256-GCM 加密后才上传私有 Gist，同步密码不落盘、丢失无法解密
- 未上传图标的网站会自动加载其站点 favicon 用于展示（仅图片请求，不收集任何数据）

## 项目结构

```
├── src/
│   ├── components/
│   │   ├── layouts/        # Header / Sidebar / MainContent（核心列表页）
│   │   ├── filter/         # SearchBar / CategoryFilter（分类+排序）
│   │   ├── website/        # WebsiteCard / WebsiteForm / WebsiteDetailDrawer / ImageUploader / ApiKeyInput
│   │   ├── common/         # CategoryManageModal / TagManageModal
│   │   └── SyncSettings.vue
│   ├── composables/        # useWebsites / useCategories / useTags / useImageUpload / useImportExport / useApiKey / useTheme
│   ├── stores/             # app（筛选状态）/ sync（Gist 同步状态机）
│   ├── services/           # gistSync（GitHub Gist REST）
│   ├── db/                 # Dexie 实例与种子数据
│   ├── utils/              # crypto / merge / validators / constants
│   └── styles/             # main.css + themes/neumorphism.css
├── public/                 # manifest.json + background.js（Chrome 扩展）、sw.js（离线缓存）
├── AGENTS.md               # AI 协作上下文（架构 / 机制 / 开发约定）
└── prompt.xml              # Neumorphism 设计系统规范
```

## 面向 AI 助手 / 二次开发

架构、数据流、关键机制与开发约定详见 [AGENTS.md](./AGENTS.md)；UI 风格遵循 [prompt.xml](./prompt.xml) 中的 Neumorphism 设计系统规范。

## 许可证

MIT License
