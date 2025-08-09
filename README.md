# CTG AI PILOT - 爆款短视频内容GENERATOR

基于垂直九宫格框架的智能内容创作工具，帮助内容创作者快速生成高质量的短视频选题。

## 功能特性

- 🎯 **DWHY 框架**：基于 Domain（领域）、Who（目标人群）、Why（痛点）三维度选题生成
- 🔄 **智能关键词生成**：根据主题自动生成相关关键词
- 🔐 **关键词锁定**：支持锁定重要关键词，刷新时保持不变
- 🎨 **现代化界面**：响应式设计，支持移动端和桌面端
- 📊 **批量生成**：支持 5/10/15 条选题批量生成
- 💾 **导出功能**：支持选题导出为文本文件
- 🧩 **模块化设计**：可扩展的架构，支持添加更多内容创作工具

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式框架**：Tailwind CSS
- **图标库**：Lucide React
- **路由管理**：React Router
- **状态管理**：React Hooks

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 3. 构建生产版本

```bash
npm run build
```

构建文件将生成在 `dist` 目录中。

## 使用说明

### 基本操作

1. **输入主题**：在 Domain 九宫格中心输入您的主题关键词
2. **生成关键词**：按回车键自动生成相关关键词
3. **选择关键词**：
   - 左键点击：选择/取消选择关键词
   - 右键点击：锁定/解锁关键词（锁定后刷新时不会被替换）
4. **刷新关键词**：点击每个九宫格右上角的刷新按钮
5. **生成选题**：确保每个维度至少选择一个关键词，选择生成数量，点击"生成选题"

### 界面说明

- **Domain 九宫格**：主题相关的关键词
- **Who 九宫格**：目标用户群体
- **Why 九宫格**：用户痛点和需求
- **选题结果**：生成的短视频选题列表

### 导航菜单

- **爆款短视频内容GENERATOR**：主要功能页面
- **数据分析**：（开发中）内容数据分析工具
- **内容优化器**：（开发中）内容优化建议
- **AI 助手**：（开发中）智能创作助手
- **设置**：（开发中）个性化设置

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── Navigation.tsx   # 导航菜单
│   ├── KeywordGrid.tsx  # 关键词九宫格
│   ├── TopicResults.tsx # 选题结果展示
│   └── LoadingSpinner.tsx # 加载动画
├── hooks/              # 自定义 Hook
│   └── useKeywordGrid.ts # 关键词网格状态管理
├── pages/              # 页面组件
│   └── DwhyGenerator.tsx # 爆款短视频内容生成器页面
├── types/              # TypeScript 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   ├── cn.ts          # 类名合并工具
│   └── mockLLM.ts     # 模拟 LLM API
├── App.tsx            # 主应用组件
├── main.tsx           # 应用入口
└── index.css          # 全局样式
```

## 开发指南

### 添加新工具

1. 在 `src/pages/` 中创建新的页面组件
2. 在 `src/components/Navigation.tsx` 中添加导航项
3. 在 `src/App.tsx` 中添加新的路由

### 自定义样式

项目使用 Tailwind CSS，可以通过修改 `tailwind.config.js` 来自定义主题：

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* 主色调 */ },
      secondary: { /* 辅助色调 */ }
    }
  }
}
```

### 集成真实 LLM

目前使用模拟数据，要集成真实的 LLM API：

1. 修改 `src/utils/mockLLM.ts` 
2. 替换 `generateKeywords` 和 `generateTopics` 函数
3. 添加 API 密钥管理

## 部署

### Vercel 部署

```bash
npm run build
npx vercel --prod
```

### Netlify 部署

```bash
npm run build
# 将 dist 文件夹内容部署到 Netlify
```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请创建 Issue 或联系开发团队。

---

**CTG AI PILOT** - 让内容创作更简单，让选题生成更智能！ 