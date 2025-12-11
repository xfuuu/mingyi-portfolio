# Cloudflare Pages Functions Setup for Admin Panel

## 问题与解决方案

### 原始问题
- 网站已部署到 Cloudflare Pages (静态)
- 需要动态 admin 功能来上传图片和更新数据
- 不能在 Cloudflare Pages 上直接运行 Node.js 服务器
- 需要安全的文件上传和数据管理

### 解决方案
使用 Cloudflare Pages Functions 创建无服务器 API，处理 admin 上传功能。

## 设置步骤

### 1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare
```bash
wrangler auth login
```

### 3. 配置环境变量
在 Cloudflare Dashboard 中设置：
- 进入你的 Pages 项目
- Settings → Environment variables
- 添加 `ADMIN_TOKEN` 变量，设置一个安全的口令

或者在本地 `wrangler.toml` 中设置：
```toml
[env.production.vars]
ADMIN_TOKEN = "your-secure-token-here"
```

### 4. 创建 Cloudflare R2 存储桶 (可选，用于文件存储)
```bash
# 创建 R2 存储桶
wrangler r2 bucket create mingyi-artworks

# 绑定到 Pages Functions
echo '[r2_buckets]
bucket_name = "mingyi-artworks"' >> wrangler.toml
```

### 5. 部署到 Cloudflare Pages
```bash
# 部署 (会自动包含 Functions)
wrangler pages deploy .
```

## 文件结构
```
deploy/
├── functions/
│   └── api/
│       └── admin/
│           └── upload.js          # Admin 上传 API
├── wrangler.toml                  # Cloudflare 配置
├── admin.html                     # Admin 界面 (自动检测环境)
├── data.json                      # 艺术品数据
└── ...                           # 其他静态文件
```

## API 端点

### POST `/api/admin/upload`
处理艺术品上传。

**请求格式:**
- Content-Type: `multipart/form-data`
- 字段:
  - `token`: Admin 口令
  - `category`: "artworks" 或 "photography"
  - `title`: 作品标题
  - `year`: 年份
  - `date`: 日期
  - `medium`: 媒材
  - `dimensions`: 尺寸
  - `price`: 价格
  - `description`: 描述
  - `image`: 图片文件
  - `featured`: 是否精选 ("true"/"false")
  - `available`: 是否可售 ("true"/"false")

**响应:**
```json
{
  "ok": true,
  "item": {
    "id": "mz-1234567890",
    "title": "New Artwork",
    // ... 其他字段
  }
}
```

## 安全性考虑

1. **口令认证**: 使用环境变量中的 `ADMIN_TOKEN`
2. **HTTPS**: Cloudflare 自动提供 HTTPS
3. **CORS**: Pages Functions 自动处理 CORS
4. **文件存储**: 使用 Cloudflare R2 (安全且快速)

## 本地开发

```bash
# 安装依赖
npm install

# 本地开发 (包含 Functions)
wrangler pages dev .

# 访问
# - 前端: http://localhost:8788
# - Admin: http://localhost:8788/admin.html
# - API: http://localhost:8788/api/admin/upload
```

## 生产环境

1. 推送到 GitHub
2. 在 Cloudflare Pages 中连接 GitHub repo
3. 设置构建命令: `echo 'Static build complete'`
4. 设置环境变量 `ADMIN_TOKEN`
5. 部署

## 替代方案

如果不想用 Pages Functions，也可以考虑:

1. **Cloudflare Workers + KV/D1**
   - 完全无服务器
   - 使用 Cloudflare D1 存储数据

2. **Vercel Functions**
   - 如果迁移到 Vercel

3. **Netlify Functions**
   - 如果迁移到 Netlify

## 注意事项

- Pages Functions 有冷启动延迟 (~100ms)
- 文件上传大小限制: 25MB (免费版)
- 每月请求限制: 100,000 (免费版)
- 数据持久化需要外部存储 (R2/KV/D1)

## 故障排除

### 常见错误
1. **"Invalid admin token"**: 检查环境变量 `ADMIN_TOKEN`
2. **"Missing required fields"**: 确保所有必需字段都填写
3. **CORS 错误**: Pages Functions 自动处理，大多不需要手动配置

### 日志查看
```bash
wrangler tail
```
