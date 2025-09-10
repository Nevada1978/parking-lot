# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 开发命令

- `pnpm dev` - 启动开发服务器 (在 http://localhost:3000 打开)
- `pnpm build` - 构建生产环境应用
- `pnpm start` - 启动生产服务器
- `pnpm lint` - 运行 ESLint 代码质量检查

## 项目架构

这是一个使用 App Router 架构的 Next.js 15 应用，配合 TypeScript 和 Tailwind CSS 4.x。

### 核心技术栈

- **框架**: Next.js 15.5.2 + React 19.1.0
- **包管理器**: pnpm
- **样式**: Tailwind CSS v4 + PostCSS
- **TypeScript**: 严格模式，配置 Next.js 插件
- **UI 组件库**: shadcn/ui 风格组件
- **工具库**:
  - `clsx` 和 `tailwind-merge` 在 `lib/utils.ts` 中合并为 `cn()` 工具函数
  - `class-variance-authority` 用于组件变体处理
  - `lucide-react` 图标库

### 项目结构

- `app/` - Next.js App Router 页面和布局
  - `layout.tsx` - 根布局，配置 Geist 字体
  - `page.tsx` - 首页组件
  - `globals.css` - 全局 Tailwind CSS 样式
- `lib/utils.ts` - 工具函数，包含 `cn()` 类名合并函数
- TypeScript 路径别名 `@/*` 映射到项目根目录
- 配置说明

- ESLint 配置了 Next.js 推荐规则和 TypeScript 支持
- TypeScript 严格模式，目标 ES2017，启用 Next.js 插件
- 使用 pnpm 作为包管理器
- 项目基于 shadcn/ui + Tailwind CSS 4.x 构建
