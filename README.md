# 2weima - 图片二维码管理系统

一个基于Node.js的图片二维码管理系统，支持图片地址更新，适用于支付引导页面等场景。

## 🌟 功能特性

### 图片更新模式
- **图片地址更新** - 直接输入图片URL地址，自动同步到前端

### 核心功能
- ✅ 图片地址管理
- ✅ 实时图片预览和测试
- ✅ 配置文件自动更新
- ✅ 响应式设计，支持移动端
- ✅ SSH密钥认证，无密码部署
- ✅ 防缓存机制

## 🚀 快速开始

### 访问地址
- **主页面**: https://2wei.top
- **管理后台**: https://2wei.top/admin-server.html

### 登录信息
- **用户名**: `admin`
- **密码**: `admin123`

## 📁 项目结构

```
2weima/
├── index.html              # 主页面（支付引导页面）
├── admin-server.html       # 管理后台（主要管理界面）
├── server.js              # Node.js后端服务器
├── image-config.js        # 图片配置文件
├── package.json           # 项目依赖配置
├── ecosystem.config.js    # PM2进程管理配置
├── nginx-domain.conf      # Nginx域名配置模板
├── nginx-wildcard.conf    # Nginx泛域名配置
├── bt-sync.sh            # 宝塔面板同步脚本
├── server-manager.sh     # 服务器管理脚本
├── domain-manager.sh     # 域名管理脚本
├── check-config.sh       # 配置检查脚本
├── test-config.js        # 配置测试脚本
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

#### 图片地址管理
1. 访问管理后台并登录
2. 在"图片地址管理"区域输入图片URL地址
3. 点击"💾 更新图片地址"
4. 点击"📄 测试配置文件"查看是否更新成功
5. 刷新前端页面查看效果

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

### 图片地址管理
- **GET** `/api/current-image-url` - 获取当前图片地址
- **POST** `/api/update-image-url` - 更新图片地址

### 静态文件
- **GET** `/image-config.js` - 获取图片配置文件
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
