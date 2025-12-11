# Admin Upload System - 完整设置指南

## 概述

这个系统让你可以通过 Web 界面直接上传作品，无需手动编辑 JSON 文件。

### 工作流程
1. 在 `/admin.html` 上传作品和图片
2. 图片自动存储到 Cloudflare R2
3. 自动更新 GitHub 的 `data.json`
4. Cloudflare Pages 自动重新部署
5. 新作品立即出现在网站上

## 步骤 1: 创建 Cloudflare R2 存储桶

### 1.1 在 Cloudflare Dashboard 创建 R2 Bucket

```bash
# 使用 wrangler CLI
wrangler r2 bucket create mingyi-artworks
```

或者在 Dashboard:
1. 登录 Cloudflare Dashboard
2. 进入 **R2**
3. 点击 **Create bucket**
4. 名称: `mingyi-artworks`
5. 点击 **Create bucket**

### 1.2 配置公开访问（重要！）

**方式 1: 使用 R2.dev 域名（快速）**
1. 进入你的 R2 bucket
2. Settings → Public Access
3. 点击 **Allow Access**
4. 复制 R2.dev URL (类似: `https://pub-xxxxx.r2.dev`)
https://pub-cd10c8c547584cc39b2ced83d0cfcf1d.r2.dev

**方式 2: 使用自定义域名（推荐）**
1. 进入 R2 bucket → Settings
2. Custom Domains → Connect Domain
3. 输入你的域名 (如: `cdn.mingyizou.art`)
4. 按提示添加 DNS 记录

## 步骤 2: 创建 GitHub Personal Access Token

### 2.1 生成 Token

1. 访问 https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. 配置:
   - Note: `Cloudflare Admin Upload`
   - Expiration: `No expiration` (或选择时长)
   - 勾选权限:
     - ✅ `repo` (完整仓库权限)
4. 点击 **Generate token**
5. **立即复制 token** (只显示一次！)

### 2.2 获取仓库信息

你的 GitHub 仓库格式应该是：
- 格式: `用户名/仓库名`
- 例如: `mingyizou/mingyi-portfolio`
- 分支: `main` 或 `master`

## 步骤 3: 在 Cloudflare Pages 设置环境变量

进入 Cloudflare Dashboard:
1. Workers & Pages → `mingyizou`
2. Settings → Environment variables
3. Production (生产环境) - 添加以下变量:

| 变量名 | 值 | 示例 |
|--------|---|------|
| `ADMIN_TOKEN` | 你的管理员口令 | `M1n9Y1Z0u!` |
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_xxxxxxxxxxxx` |
| `GITHUB_REPO` | GitHub 仓库 | `mingyizou/mingyi-portfolio` |
| `GITHUB_BRANCH` | Git 分支 | `main` |
| `R2_PUBLIC_URL` | R2 公开 URL 的 ID 部分 | `cd10c8c547584cc39b2ced83d0cfcf1d` |

**重要提示：** 
- 所有变量类型选择 **Secret** (不要用 Plaintext)
- 保存后需要重新部署才能生效

## 步骤 4: 绑定 R2 Bucket

### 4.1 在 Cloudflare Pages Settings

1. Settings → Functions → R2 bucket bindings
2. 点击 **Add binding**
3. 配置:
   - Variable name: `ARTWORKS_BUCKET`
   - R2 bucket: 选择 `mingyi-artworks`
4. 点击 **Save**

## 步骤 5: 重新部署

```bash
cd /Users/xinyuefu/Downloads/mingyi-portfolio-deploy/deploy
npm run deploy
```

## 步骤 6: 测试上传

1. 访问 `https://mingyizou.pages.dev/admin.html`
2. 输入你的 Admin Token
3. 填写作品信息
4. 上传图片
5. 提交

### 预期结果
- ✅ 图片上传到 R2
- ✅ `data.json` 自动更新
- ✅ Cloudflare Pages 自动重新部署（约 1-2 分钟）
- ✅ 新作品出现在网站上

## 故障排除

### 错误: "Invalid admin token"
- 检查 `ADMIN_TOKEN` 环境变量
- 确认已重新部署

### 错误: "Failed to upload to R2"
- 检查 R2 bucket binding 是否正确
- 确认 bucket 名称: `mingyi-artworks`

### 错误: "Failed to update GitHub"
- 检查 `GITHUB_TOKEN` 权限
- 确认 `GITHUB_REPO` 格式正确
- 检查 `GITHUB_BRANCH` 名称

### 图片无法显示
- 检查 R2 公开访问已启用
- 确认 `R2_PUBLIC_URL` 设置正确
- 测试 R2 URL: `https://pub-xxxxx.r2.dev/artworks/test.jpg`

## 安全建议

1. **定期更换 Token**
   - Admin Token 每月更换
   - GitHub Token 每 6 个月更换

2. **使用 Secret 类型**
   - 所有敏感变量用 Secret 而非 Plaintext

3. **限制访问**
   - 不要分享 admin.html 链接
   - 考虑添加 IP 白名单

4. **备份数据**
   - 定期备份 `data.json`
   - R2 设置生命周期规则

## 高级配置

### 自动图片优化

可以添加 Cloudflare Images 转换:
```js
// 在前端 app.js 中
const optimizedUrl = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_ID}/${imageId}/public`;
```

### 批量上传

修改 admin.html 支持多文件:
```html
<input type="file" name="images" multiple accept="image/*" />
```

### 预览功能

在上传前预览图片:
```js
const preview = URL.createObjectURL(file);
```

## 成本估算

### Cloudflare R2
- 存储: $0.015/GB/月
- 出站流量: 免费（Cloudflare CDN）
- 请求: 前 1000万 免费

### Cloudflare Pages
- 免费版: 500 部署/月
- Pro: $20/月 (无限部署)

### 示例成本
- 1000 张图片 (平均 2MB): ~$0.03/月
- 10,000 访问/月: 免费
- **总计: 几乎免费！**

## 下一步

- [ ] 测试完整上传流程
- [ ] 添加图片编辑功能
- [ ] 实现作品删除功能
- [ ] 添加批量导入
- [ ] 集成图片优化服务

## 需要帮助？

- Cloudflare 文档: https://developers.cloudflare.com/r2/
- GitHub API 文档: https://docs.github.com/rest
- 问题反馈: 通过 GitHub Issues
