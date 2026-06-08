# LiteResume

LiteResume 是一个基于 Vue 3 的中文简历制作工具，适合快速编辑个人信息、经历模块、简历样式，并预览 A4 简历版式。

当前临时部署地址：[https://lite-resume.vercel.app/](https://lite-resume.vercel.app/)

## 功能特点

- 在线编辑个人信息、联系方式、头像、求职意向等基础资料
- 支持个人优势、工作经历、项目经历、教育经历、技能标签和自定义模块
- 支持模块新增、删除、排序，以及经历条目的上下移动和时间排序
- 提供现代、居中、紧凑等简历模板
- 支持多种主题色、字体、日期格式和排版密度
- 支持一页优先排版，可自动压缩版式并支持撤销
- 支持导入已有简历文本或文件，并进行本地规则解析
- 支持浏览器打印和 PDF 导出；本地服务端导出优先，线上可使用浏览器端导出兜底

## 技术栈

- Vue 3
- Vite
- Element Plus
- Tiptap / Markdown
- Express
- Puppeteer Core
- OpenAI SDK（AI 解析接口已预留）

## 本地运行

确保本机已安装 Node.js，然后在项目根目录执行：

```bash
npm install
npm run dev
```

默认启动地址：

- 前端页面：http://127.0.0.1:5173
- 本地 API：http://127.0.0.1:8787

## 环境变量

如需启用后端相关能力，可复制环境变量示例：

```bash
cp .env.example .env
```

`.env` 示例：

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
API_PORT=8787
```

说明：

- `OPENAI_API_KEY`：用于后端 AI 简历解析接口，当前前端的 AI 增强入口暂未开放调用
- `OPENAI_MODEL`：后端解析接口使用的模型
- `API_PORT`：本地 Express API 端口，默认 `8787`
- `CHROME_PATH`：可选；如果 PDF 导出找不到 Chrome 或 Edge，可手动指定浏览器路径

## 常用命令

```bash
npm run dev       # 同时启动前端和本地 API
npm run build     # 构建生产版本
npm run preview   # 预览生产构建
npm run dev:api   # 仅启动本地 API
npm run dev:client # 仅启动前端开发服务
```

## 项目结构

```text
.
├── server/              # 本地 Express API，包含 PDF 导出和 AI 解析接口
├── src/
│   ├── components/      # 简历编辑、工具栏、预览等 Vue 组件
│   ├── composables/     # 简历状态、导入、导出、分页、一页适配逻辑
│   ├── constants/       # 模板、主题色、字体、日期格式等配置
│   ├── data/            # 默认简历数据
│   └── utils/           # 简历内容和 Markdown 处理工具
├── index.html
├── package.json
└── vite.config.js
```

## 部署说明

当前项目可作为 Vite 前端应用部署到 Vercel。线上地址主要用于访问、编辑简历页面，并可通过浏览器端能力导出 PDF。

需要注意的是，项目中的 Express API 默认只监听本机 `127.0.0.1:8787`，服务端 PDF 导出和后端 AI 解析能力适合本地开发环境使用。若要在线上完整启用后端能力，需要额外部署接口，并通过 `VITE_API_BASE_URL` 调整前端 API 地址。

## 许可证

当前项目仅作为个人简历制作工具使用，暂无单独许可证声明。
