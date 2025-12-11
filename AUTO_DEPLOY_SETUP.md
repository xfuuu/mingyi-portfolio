# 自动部署设置指南

## 🎯 目标

实现：**Admin 上传作品 → 自动更新 GitHub → 自动部署到 Cloudflare → 网站立即更新**

## ✨ 工作流程

```
你在 admin.html 上传作品
    ↓
Cloudflare Function 处理
    ↓
├─→ 上传图片到 R2
└─→ 更新 GitHub data.json
    ↓
GitHub 检测到 data.json 变化
    ↓
自动触发 GitHub Actions
    ↓
自动部署到 Cloudflare Pages
    ↓
网站更新完成！✨
```

**整个过程约 1-2 分钟，完全自动！**

## 📋 设置步骤

### 步骤 1: 获取 Cloudflare API Token

1. **访问 Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/profile/api-tokens
   ```

2. **创建新 Token**
   - 点击 **Create Token**
   - 选择 **Edit Cloudflare Workers** 模板
   - 或者自定义：
     - Permissions:
       - Account → Cloudflare Pages → Edit
     - Account Resources:
       - Include → 你的账户
   - 点击 **Continue to summary**
   - 点击 **Create Token**

3. **复制 Token**
   ```
   示例: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   **⚠️ 只显示一次，立即复制！**

### 步骤 2: 获取 Cloudflare Account ID

1. **在 Cloudflare Dashboard 右侧栏**
2. **找到 Account ID**
   ```
   示例: 1234567890abcdef1234567890abcdef
   ```
3. **复制它**

### 步骤 3: 添加 GitHub Secrets

1. **访问你的 GitHub 仓库**
   ```
   https://github.com/xfuuu/mingyi-portfolio
   ```

2. **进入 Settings → Secrets and variables → Actions**

3. **点击 "New repository secret"**

4. **添加第一个 Secret：**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: 粘贴你在步骤 1 复制的 API Token
   - 点击 **Add secret**

5. **添加第二个 Secret：**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: 粘贴你在步骤 2 复制的 Account ID
   - 点击 **Add secret**

### 步骤 4: 推送代码到 GitHub

```bash
cd /Users/xinyuefu/Downloads/mingyi-portfolio-deploy/deploy

# 添加 GitHub Actions 配置
git add .github/workflows/deploy.yml
git add AUTO_DEPLOY_SETUP.md
git commit -m "Add automatic deployment with GitHub Actions"
git push origin main
```

### 步骤 5: 测试自动部署

1. **访问 Admin 页面**
   ```
   https://mingyizou.pages.dev/admin.html
   ```

2. **上传一个测试作品**

3. **查看 GitHub Actions 运行状态**
   ```
   https://github.com/xfuuu/mingyi-portfolio/actions
   ```

4. **等待 1-2 分钟**

5. **刷新网站，新作品出现！** 🎉

## 🔍 监控部署状态

### GitHub Actions 页面
```
https://github.com/xfuuu/mingyi-portfolio/actions
```

**你会看到：**
- ✅ 绿色勾号 = 部署成功
- ❌ 红色叉号 = 部署失败（点击查看日志）
- 🟡 黄色圆圈 = 正在部署中

### Cloudflare Pages 页面
```
https://dash.cloudflare.com/ → Workers & Pages → mingyizou → Deployments
```

## ⚙️ 工作原理

### GitHub Actions Workflow

```yaml
# 监听这些文件的变化
on:
  push:
    paths:
      - 'data.json'        # Admin 上传更新这个
      - 'assets/**'        # 图片文件
      - '*.html'           # HTML 文件
      - '*.css'            # 样式文件
      - '*.js'             # JavaScript 文件
      - 'functions/**'     # API 函数

# 自动执行
jobs:
  deploy:
    - 检出代码
    - 安装 wrangler
    - 部署到 Cloudflare Pages
    - 完成！
```

### 触发条件

**以下操作会自动触发部署：**
1. ✅ Admin 上传作品（更新 data.json）
2. ✅ 手动编辑 HTML/CSS/JS 并推送
3. ✅ 更新 Functions API 代码
4. ✅ 添加新图片到 assets

## 📊 时间轴

```
0:00  你点击 "Upload" 按钮
0:05  图片上传到 R2 完成
0:10  GitHub data.json 更新完成
0:15  GitHub Actions 检测到变化，开始运行
0:30  下载代码，安装依赖
1:00  部署到 Cloudflare Pages
1:30  Cloudflare 全球 CDN 更新
2:00  ✅ 网站更新完成！新作品可见
```

## 🎯 最佳实践

### 1. 上传后的验证

上传作品后：
1. 访问 GitHub Actions 页面确认部署开始
2. 等待 2 分钟
3. 刷新网站首页
4. 检查新作品是否出现

### 2. 批量上传

如果要上传多个作品：
- 可以连续上传，每次都会触发部署
- 或者等待上传完所有作品后，最后一次部署会包含所有更新

### 3. 失败处理

如果部署失败：
1. 检查 GitHub Actions 日志
2. 确认 CLOUDFLARE_API_TOKEN 和 CLOUDFLARE_ACCOUNT_ID 正确
3. 检查 Cloudflare API Token 权限
4. 重新推送代码触发部署

## 🔧 故障排除

### 错误: "Invalid API Token"

**解决方案：**
1. 重新生成 Cloudflare API Token
2. 确保权限包含 "Cloudflare Pages - Edit"
3. 更新 GitHub Secret: `CLOUDFLARE_API_TOKEN`

### 错误: "Account ID not found"

**解决方案：**
1. 确认 Account ID 正确复制
2. 更新 GitHub Secret: `CLOUDFLARE_ACCOUNT_ID`

### 部署成功但网站没更新

**解决方案：**
1. 清除浏览器缓存
2. 等待 CDN 更新（最多 5 分钟）
3. 使用隐私模式访问

## 📈 成本

### GitHub Actions
- **免费额度**: 2000 分钟/月
- **每次部署**: 约 1-2 分钟
- **可用次数**: 约 1000+ 次部署/月
- **结论**: 完全免费！

### Cloudflare Pages
- **免费额度**: 500 次部署/月
- **每月上传**: 假设每天上传 5 个作品
- **实际使用**: 约 150 次/月
- **结论**: 完全免费！

## 🎉 完成后的体验

**上传作品：**
1. 打开 admin.html
2. 填写信息，上传图片
3. 点击提交
4. 等待 2 分钟
5. 刷新网站 → 新作品已上线！✨

**完全自动化，无需任何手动操作！**

---

## 💡 下一步

设置完成后，你可以：
1. ✅ 随时通过 Admin 上传作品
2. ✅ 自动部署到网站
3. ✅ 专注于创作，不用担心技术细节

**需要帮助？** 查看 GitHub Actions 日志或 Cloudflare Dashboard！
