# 2weima - 图片二维码管理系统

一个基于Node.js的图片二维码管理系统，支持多种图片更新模式，适用于支付引导页面等场景。

## 🌟 功能特性

### 三种图片更新模式
1. **图片地址更新** - 直接输入图片URL地址
2. **上传图片更新** - 上传图片到服务器并自动更新
3. **Base64转换更新** - 本地图片转换为Base64格式

### 核心功能
- ✅ 实时图片预览和测试
- ✅ 拖拽上传支持
- ✅ 自动保存配置到localStorage
- ✅ 响应式设计，支持移动端
- ✅ SSH密钥认证，无密码部署

## 🚀 快速开始

### 访问地址
- **主页面**: https://2wei.top
- **管理后台**: https://2wei.top/admin-server.html
- **导航页面**: https://2wei.top/nav.html

### 登录信息
- **用户名**: `admin`
- **密码**: `admin123`

## 📁 项目结构

```
2weima/
├── index.html              # 主页面（支付引导页面）
├── admin-server.html       # 管理后台（主要管理界面）
├── nav.html               # 功能导航页面
├── server.js              # Node.js后端服务器
├── package.json           # 项目依赖配置
├── ecosystem.config.js    # PM2进程管理配置
├── nginx-domain.conf      # Nginx域名配置模板
├── bt-sync.sh            # 宝塔面板同步脚本
├── server-manager.sh     # 服务器管理脚本
├── check-config.sh       # 配置检查脚本
├── dev-server.sh         # 本地开发服务器
├── BT-SETUP.md           # 宝塔面板安装指南
└── README.md             # 项目说明文档
```

## 🛠️ 安装部署

### 本地开发
```bash
# 克隆项目
git clone https://github.com/wubian2007/2weima.git
cd 2weima

# 安装依赖
npm install

# 启动本地服务器
./dev-server.sh
```

### 服务器部署
```bash
# 使用宝塔面板同步脚本
./bt-sync.sh --server

# 或使用服务器管理脚本
./server-manager.sh update
```

## 📖 使用指南

### 管理后台使用

#### 模式1: 图片地址更新
1. 访问管理后台并登录
2. 选择"模式1: 图片地址更新"
3. 输入图片URL地址
4. 点击"💾 更新并保存图片地址"
5. 在测试区域查看效果

#### 模式2: 上传图片更新
1. 选择"模式2: 上传图片更新"
2. 点击上传区域或"📂 手动选择图片文件"按钮
3. 选择图片文件（支持拖拽）
4. 预览图片后点击"🚀 上传到服务器并更新"
5. 自动更新前端图片

#### 模式3: Base64转换更新
1. 选择"模式3: Base64转换更新"
2. 点击上传区域或"📂 手动选择图片文件"按钮
3. 选择图片文件（支持拖拽）
4. 预览图片后点击"🔄 转换为Base64并更新"
5. 自动更新前端图片

### 服务器管理

#### 快速命令
```bash
# 检查服务状态
./server-manager.sh status

# 重启服务
./server-manager.sh restart

# 查看日志
./server-manager.sh logs

# 更新代码
./server-manager.sh update

# 测试网站
./server-manager.sh test

# 完整检查
./server-manager.sh all
```

#### 同步部署
```bash
# 完整同步（本地+服务器）
./bt-sync.sh

# 仅同步到服务器
./bt-sync.sh --server

# 实时监控模式
./bt-sync.sh --watch
```

## 🔧 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js, Express.js
- **文件上传**: Multer
- **进程管理**: PM2
- **Web服务器**: Nginx
- **部署环境**: 宝塔面板 LNMP

## 🌐 API接口

### 图片上传
- **POST** `/upload` - 上传图片到服务器
- **GET** `/api/files` - 获取文件列表
- **POST** `/api/save-base64` - 保存Base64数据
- **POST** `/api/upload-image` - 上传并转换图片

### 静态文件
- **GET** `/uploads/*` - 访问上传的图片文件
- **GET** `/*.html` - 访问HTML页面

## 📝 配置说明

### 服务器配置
- **服务器地址**: 119.28.19.237
- **域名**: 2wei.top
- **网站路径**: /www/wwwroot/2weima
- **Node.js端口**: 3000

### SSH配置
- **SSH密钥**: ~/.ssh/2weima-server
- **用户**: root
- **端口**: 22

## 🔒 安全说明

- 管理后台使用localStorage存储登录状态
- 支持SSH密钥认证，无需密码
- 图片上传限制文件大小和类型
- Nginx配置安全头信息

## 📞 支持

如有问题，请检查：
1. 服务器连接状态
2. 服务进程状态
3. Nginx配置
4. 文件权限

使用 `./server-manager.sh all` 进行完整检查。

## 📄 许可证

MIT License

---

**版本**: v2.0  
**更新时间**: 2025-08-12  
**维护者**: 2weima团队
