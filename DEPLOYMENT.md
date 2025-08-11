# 部署说明文档

本文档详细说明了如何部署和配置图片转Base64工具的不同版本。

## 📋 目录

1. [服务器版本部署](#服务器版本部署)
2. [GitHub Pages版本部署](#github-pages版本部署)
3. [Deploy Keys配置](#deploy-keys配置)
4. [API服务器配置](#api服务器配置)
5. [常见问题](#常见问题)

## 🖥️ 服务器版本部署

### 环境要求
- Node.js 14.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/2weima.git
   cd 2weima
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动服务器**
   ```bash
   npm start
   ```

4. **访问管理页面**
   - 打开浏览器访问：`http://localhost:3000/admin-server.html`
   - 使用默认账户登录：`admin` / `admin123`

### 功能特性
- ✅ 支持文件上传到服务器
- ✅ 自动生成服务器图片URL
- ✅ 实时预览上传的图片
- ✅ 支持多种图片格式

## 🌐 GitHub Pages版本部署

### 方法一：直接部署到GitHub Pages

1. **Fork或克隆仓库**
   ```bash
   git clone https://github.com/your-username/2weima.git
   cd 2weima
   ```

2. **推送到GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **启用GitHub Pages**
   - 前往GitHub仓库设置
   - 找到 "Pages" 选项
   - 选择 "Deploy from a branch"
   - 选择 `main` 分支和 `/ (root)` 目录
   - 点击 "Save"

4. **访问页面**
   - 访问：`https://your-username.github.io/2weima/`
   - 管理页面：`https://your-username.github.io/2weima/admin-github.html`

### 方法二：使用API服务器（推荐）

如果您需要自动更新文件功能，建议使用API服务器：

1. **启动API服务器**
   ```bash
   npm run github-api
   ```

2. **配置Deploy Keys**（见下文）

3. **配置管理页面**
   - 访问管理页面
   - 填写GitHub仓库信息
   - 设置API服务器地址

## 🔑 Deploy Keys配置

### 步骤1：生成SSH密钥对

```bash
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/github_deploy_key
```

**注意：** 按回车键确认，无需设置密码

### 步骤2：查看公钥内容

```bash
cat ~/.ssh/github_deploy_key.pub
```

复制输出的公钥内容（以 `ssh-ed25519` 开头）

### 步骤3：添加Deploy Key到GitHub仓库

1. 前往GitHub仓库页面
2. 点击 "Settings" 标签
3. 在左侧菜单中找到 "Deploy keys"
4. 点击 "Add deploy key"
5. 填写信息：
   - **Title**: `2weima-deploy-key`
   - **Key**: 粘贴上一步的公钥内容
   - **Allow write access**: ✅ 勾选此选项
6. 点击 "Add key"

### 步骤4：配置SSH密钥

```bash
ssh-add ~/.ssh/github_deploy_key
```

### 步骤5：测试SSH连接

```bash
ssh -T git@github.com
```

应该看到类似以下消息：
```
Hi your-username! You've successfully authenticated, but GitHub does not provide shell access.
```

## 🚀 API服务器配置

### 启动API服务器

```bash
# 生产环境
npm run github-api

# 开发环境（自动重启）
npm run github-api-dev
```

### 配置说明

API服务器默认运行在端口 `3001`，提供以下功能：

- **文件更新**: `POST /api/github/update-file`
- **连接测试**: `GET /api/github/test/:username/:repo`
- **文件获取**: `GET /api/github/file/:username/:repo/:branch/:filePath`
- **健康检查**: `GET /health`

### 环境变量

可以通过环境变量配置：

```bash
export PORT=3001
export GITHUB_USERNAME=your-username
export GITHUB_EMAIL=your-email@example.com
```

## 📝 管理页面配置

### GitHub Pages版本配置

1. **GitHub仓库信息**
   - GitHub用户名
   - 仓库名称
   - 分支名称（默认：main）
   - 提交邮箱

2. **API服务器配置**
   - API服务器地址（默认：http://localhost:3001）

3. **图片配置方法**
   - 直接URL配置
   - Base64转换
   - 外部图片源（腾讯云COS、阿里云OSS等）

### 配置示例

```javascript
// GitHub配置
{
  "username": "your-username",
  "repo": "2weima",
  "branch": "main",
  "email": "your-email@example.com"
}

// API服务器地址
"apiServerUrl": "http://localhost:3001"
```

## 🔧 常见问题

### Q1: Deploy Key配置失败

**问题**: SSH连接测试失败

**解决方案**:
1. 检查公钥是否正确添加到GitHub
2. 确认勾选了 "Allow write access"
3. 重新运行 `ssh-add ~/.ssh/github_deploy_key`

### Q2: API服务器无法启动

**问题**: 端口被占用

**解决方案**:
```bash
# 查看端口占用
lsof -i :3001

# 杀死占用进程
kill -9 <PID>

# 或使用其他端口
PORT=3002 npm run github-api
```

### Q3: 文件更新失败

**问题**: 权限不足

**解决方案**:
1. 检查Deploy Key是否配置正确
2. 确认仓库有写入权限
3. 检查Git配置是否正确

### Q4: GitHub Pages无法访问

**问题**: 页面显示404

**解决方案**:
1. 检查仓库设置中的Pages配置
2. 确认文件在正确的分支和目录
3. 等待几分钟让GitHub Pages生效

## 📞 技术支持

如果您遇到问题，请：

1. 检查本文档的常见问题部分
2. 查看GitHub Issues
3. 提交新的Issue并详细描述问题

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。
