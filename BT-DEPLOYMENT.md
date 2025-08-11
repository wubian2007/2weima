# 宝塔服务器部署指南

本文档详细说明如何在香港宝塔服务器上部署图片转Base64工具。

## 📋 目录

1. [服务器环境准备](#服务器环境准备)
2. [宝塔面板配置](#宝塔面板配置)
3. [代码部署](#代码部署)
4. [服务配置](#服务配置)
5. [自动化部署](#自动化部署)
6. [监控和维护](#监控和维护)

## 🖥️ 服务器环境准备

### 系统要求
- CentOS 7+ / Ubuntu 18+ / Debian 9+
- 内存：2GB+
- 硬盘：20GB+
- 带宽：5Mbps+

### 安装宝塔面板

```bash
# CentOS
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh

# Ubuntu/Debian
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

### 安装必要软件

在宝塔面板中安装以下软件：
- Nginx 1.18+
- Node.js 14+
- PM2管理器
- Git

## 🎛️ 宝塔面板配置

### 1. 创建网站

1. 登录宝塔面板
2. 点击"网站" → "添加站点"
3. 填写信息：
   - 域名：`your-domain.com`
   - 根目录：`/www/wwwroot/2weima`
   - FTP：不创建
   - 数据库：不创建
   - SSL：申请Let's Encrypt证书

### 2. 配置SSL证书

1. 在网站列表中找到刚创建的站点
2. 点击"SSL" → "Let's Encrypt"
3. 勾选域名，点击"申请"
4. 开启"强制HTTPS"

### 3. 配置反向代理

1. 点击网站的"设置"
2. 找到"反向代理" → "添加反向代理"
3. 添加以下代理：

**主服务器代理：**
- 代理名称：`2weima-server`
- 目标URL：`http://127.0.0.1:3000`
- 发送域名：`$host`

**GitHub API代理：**
- 代理名称：`2weima-github-api`
- 目标URL：`http://127.0.0.1:3001`
- 发送域名：`$host`

## 📦 代码部署

### 方法一：通过Git部署（推荐）

1. **在服务器上克隆代码**
   ```bash
   cd /www/wwwroot
   git clone https://github.com/wubian2007/2weima.git
   cd 2weima
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **创建日志目录**
   ```bash
   mkdir -p logs
   ```

4. **启动服务**
   ```bash
   # 使用PM2启动
   pm2 start ecosystem.config.js
   
   # 保存PM2配置
   pm2 save
   pm2 startup
   ```

### 方法二：通过宝塔面板上传

1. 在宝塔面板中进入网站根目录
2. 上传项目文件
3. 在终端中执行安装和启动命令

## ⚙️ 服务配置

### 1. 配置Nginx

使用提供的 `nginx.conf` 模板：

1. 在宝塔面板中找到网站设置
2. 点击"配置文件"
3. 替换为以下内容（记得修改域名）：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL证书（宝塔自动配置）
    ssl_certificate /www/server/panel/vhost/cert/your-domain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/your-domain.com/privkey.pem;
    
    root /www/wwwroot/2weima;
    index index.html index.htm;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /github-api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 2. 配置PM2

1. **安装PM2**
   ```bash
   npm install -g pm2
   ```

2. **启动应用**
   ```bash
   cd /www/wwwroot/2weima
   pm2 start ecosystem.config.js
   ```

3. **设置开机自启**
   ```bash
   pm2 save
   pm2 startup
   ```

### 3. 配置防火墙

在宝塔面板中：
1. 安全 → 防火墙
2. 放行端口：80, 443, 3000, 3001

## 🤖 自动化部署

### 1. 配置同步脚本

1. **修改同步脚本配置**
   ```bash
   # 编辑 sync-to-server.sh
   vim sync-to-server.sh
   ```

2. **修改服务器信息**
   ```bash
   SERVER_HOST="your-server-ip"
   SERVER_USER="root"
   SERVER_PATH="/www/wwwroot/2weima"
   ```

3. **设置执行权限**
   ```bash
   chmod +x sync-to-server.sh
   ```

### 2. 使用同步脚本

```bash
# 执行同步
./sync-to-server.sh
```

### 3. 配置GitHub Webhook（可选）

1. 在GitHub仓库设置中添加Webhook
2. Payload URL: `https://your-domain.com/webhook`
3. Content type: `application/json`
4. Secret: 设置一个密钥

## 📊 监控和维护

### 1. 查看服务状态

```bash
# 查看PM2进程
pm2 status

# 查看日志
pm2 logs 2weima-server
pm2 logs 2weima-github-api

# 查看Nginx状态
systemctl status nginx
```

### 2. 性能监控

在宝塔面板中：
1. 监控 → 系统监控
2. 查看CPU、内存、磁盘使用情况
3. 设置告警阈值

### 3. 日志管理

```bash
# 查看Nginx访问日志
tail -f /www/wwwlogs/your-domain.com.log

# 查看错误日志
tail -f /www/wwwlogs/your-domain.com.error.log

# 查看PM2日志
pm2 logs --lines 100
```

### 4. 备份策略

1. **代码备份**
   ```bash
   # 创建备份脚本
   vim /www/backup/backup-2weima.sh
   ```

   ```bash
   #!/bin/bash
   BACKUP_DIR="/www/backup/2weima"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   mkdir -p $BACKUP_DIR
   tar -czf $BACKUP_DIR/2weima_$DATE.tar.gz /www/wwwroot/2weima
   
   # 删除7天前的备份
   find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
   ```

2. **数据库备份**（如果有）
3. **配置文件备份**

## 🔧 常见问题

### Q1: 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001

# 杀死进程
kill -9 <PID>
```

### Q2: PM2进程异常

```bash
# 重启所有进程
pm2 restart all

# 重新加载配置
pm2 reload ecosystem.config.js
```

### Q3: Nginx配置错误

```bash
# 测试配置
nginx -t

# 重新加载配置
nginx -s reload
```

### Q4: SSL证书问题

1. 在宝塔面板中重新申请SSL证书
2. 检查域名解析是否正确
3. 确认防火墙放行了443端口

## 📞 技术支持

如果遇到问题：

1. 查看宝塔面板的错误日志
2. 检查PM2进程状态
3. 查看Nginx错误日志
4. 联系技术支持

## 📄 更新日志

- 2025-01-XX: 初始版本部署
- 添加自动化部署脚本
- 配置PM2进程管理
- 设置Nginx反向代理
