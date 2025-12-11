# Admin Upload System - 快速开始

## 🎯 目标

创建一个 Web 管理界面，让你可以直接上传作品和图片，无需手动编辑 JSON 文件。

## ✨ 功能

- ✅ Web 界面上传作品信息和图片
- ✅ 自动存储图片到 Cloudflare R2
- ✅ 自动更新 GitHub 的 `data.json`
- ✅ 自动触发 Cloudflare Pages 重新部署
- ✅ 新作品立即显示在网站上

## 🚀 快速开始

### 方式 1: 自动化脚本（推荐）

```bash
./setup-admin.sh
```

脚本会自动：
- 创建 R2 bucket
- 收集所需的 token 和配置
- 生成本地开发配置

### 方式 2: 手动设置

按照 `ADMIN_SETUP_GUIDE.md` 中的详细步骤操作。

## 📋 前置要求

1. **Cloudflare Account** - 免费即可
2. **GitHub Account** - 存储代码和数据
3. **已部署的 Cloudflare Pages 站点**

## 🔧 需要设置的内容

### 1. Cloudflare R2 Bucket
```bash
wrangler r2 bucket create mingyi-artworks
```

### 2. GitHub Personal Access Token
- 访问: https://github.com/settings/tokens
- 权限: `repo` (完整仓库权限)

### 3. Cloudflare 环境变量

在 **Workers & Pages → mingyizou → Settings → Environment variables** 添加：

| 变量名 | 说明 |
|--------|------|
| `ADMIN_TOKEN` | 管理员口令（自己设置） |
| `GITHUB_TOKEN` | GitHub Personal Access Token |
| `GITHUB_REPO` | 仓库名称（如：mingyizou/mingyi-portfolio） |
| `GITHUB_BRANCH` | 分支名称（通常是 main） |
| `R2_PUBLIC_URL` | R2 公开 URL 的 ID 部分 |

### 4. R2 Bucket Binding

在 **Settings → Functions → R2 bucket bindings** 添加：
- Variable name: `ARTWORKS_BUCKET`
- R2 bucket: `mingyi-artworks`

### 5. 启用 R2 公开访问

在 **R2 → mingyi-artworks → Settings → Public Access**:
- 点击 **Allow Access**
- 复制 R2.dev URL

## 📱 使用方法

### 1. 访问 Admin 页面
```
https://mingyizou.pages.dev/admin.html
```

### 2. 输入 Admin Token
使用你在环境变量中设置的 `ADMIN_TOKEN`

### 3. 填写作品信息
- 选择类别（Painting / Photography）
- 填写标题、年份、日期等
- 上传图片
- 提交

### 4. 等待部署
- 图片立即上传到 R2 ✅
- GitHub 自动更新 data.json ✅
- Cloudflare Pages 自动重新部署（1-2分钟）✅
- 新作品出现在网站上 ✅

## 🎨 工作流程图

```
用户上传作品
    ↓
Admin 表单提交
    ↓
Cloudflare Function API
    ↓
├─→ 上传图片到 R2
│   (https://pub-xxxxx.r2.dev/artworks/...)
│
└─→ 更新 GitHub data.json
    (通过 GitHub API)
    ↓
    触发 Cloudflare Pages 自动部署
    ↓
    网站更新完成！
```

## 📊 成本

### Cloudflare R2
- **免费额度**: 10 GB 存储
- **超出后**: $0.015/GB/月
- **出站流量**: 免费（通过 Cloudflare CDN）

### Cloudflare Pages
- **免费版**: 500 次部署/月
- **足够使用**: 每天上传 10+ 作品

### 示例成本
- 1000 张照片 (每张 2MB) = 2GB
- 月成本: **免费** (在免费额度内)

## 🔒 安全建议

1. **使用强密码**
   - Admin Token 至少 20 字符
   - 包含大小写字母、数字、符号

2. **定期更换**
   - 每 3-6 个月更换一次 token

3. **不要分享**
   - 不要公开 admin.html 链接
   - 不要把 token 提交到 git

4. **使用 Secret 类型**
   - 环境变量全部用 Secret，不用 Plaintext

## ❓ 常见问题

### Q: 上传后图片不显示？
**A:** 检查 R2 公开访问是否启用，访问测试 URL 确认。

### Q: "Invalid admin token" 错误？
**A:** 确认环境变量 `ADMIN_TOKEN` 已设置，并重新部署。

### Q: GitHub 更新失败？
**A:** 检查 `GITHUB_TOKEN` 权限，确认 `repo` 权限已勾选。

### Q: 如何删除已上传的作品？
**A:** 目前需要手动编辑 `data.json`，删除功能即将推出。

### Q: 可以批量上传吗？
**A:** 当前只支持单个上传，批量功能在开发计划中。

## 📚 相关文档

- [详细设置指南](./ADMIN_SETUP_GUIDE.md)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [GitHub API 文档](https://docs.github.com/rest)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)

## 🛠️ 故障排除

遇到问题？查看详细日志：
```bash
wrangler tail
```

查看 R2 bucket 内容：
```bash
wrangler r2 object list mingyi-artworks
```

## 🚧 未来计划

- [ ] 图片编辑功能（裁剪、旋转）
- [ ] 批量上传
- [ ] 作品删除/编辑
- [ ] 自动图片优化
- [ ] 预览发布前效果
- [ ] 作品分类管理

## 💡 需要帮助？

如果遇到问题，请：
1. 查看 `ADMIN_SETUP_GUIDE.md`
2. 检查 Cloudflare 控制台日志
3. 提交 GitHub Issue

---

**享受创作，让技术为艺术服务！** 🎨✨
