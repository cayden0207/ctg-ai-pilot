# Vercel 部署指南

## 部署步骤

### 1. 连接 GitHub 仓库到 Vercel

1. 访问 [Vercel](https://vercel.com)
2. 登录你的账号（或注册新账号）
3. 点击 "New Project"
4. 选择 "Import Git Repository"
5. 选择你的 GitHub 仓库 `cayden0207/ctg-ai-pilot`

### 2. 配置项目设置

Vercel 会自动检测到这是一个 Vite 项目，并使用以下配置：

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

1. 进入项目设置 (Settings)
2. 选择 "Environment Variables"
3. 添加以下变量：

```
VITE_OPENAI_API_KEY = 你的OpenAI API密钥
VITE_OPENAI_MODEL = gpt-4o-mini
VITE_DEEPSEEK_API_KEY = 你的DeepSeek API密钥（可选）
VITE_DEEPSEEK_MODEL = deepseek-chat（可选）
```

**重要提醒：**
- 不要在代码中硬编码 API 密钥
- 确保使用新的、未泄露的 API 密钥
- Vercel 会安全地存储这些环境变量

### 4. 部署

1. 点击 "Deploy" 按钮
2. 等待构建和部署完成（通常需要 1-2 分钟）
3. 部署成功后，你会获得一个类似 `your-project.vercel.app` 的域名

### 5. 自定义域名（可选）

如果你有自己的域名：
1. 进入项目设置的 "Domains" 部分
2. 添加你的自定义域名
3. 按照指示配置 DNS 记录

## 自动部署

一旦设置完成，每次你推送代码到 GitHub 的 main 分支，Vercel 都会自动触发新的部署。

## 故障排除

### 构建失败
- 检查 build 日志中的错误信息
- 确保所有依赖都已正确安装
- 验证环境变量是否正确设置

### API 调用失败
- 确认环境变量已在 Vercel 中正确配置
- 检查 API 密钥是否有效
- 查看浏览器控制台的错误信息

### 页面路由问题
- `vercel.json` 已配置了 SPA 路由重写规则
- 所有路由都会指向 index.html

## 项目已准备部署

项目配置已完成，包括：
- ✅ vercel.json 配置文件
- ✅ 构建脚本配置
- ✅ 环境变量示例文件
- ✅ SPA 路由配置

现在可以按照上述步骤在 Vercel 上部署你的应用了！