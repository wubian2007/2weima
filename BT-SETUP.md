# 宝塔面板LNMP环境配置指南

## 1. 宝塔面板环境准备

### 1.1 安装Node.js
在宝塔面板中：
1. 进入 **软件商店**
2. 搜索并安装 **Node.js版本管理器**
3. 安装 **Node.js 18.x** 版本

### 1.2 安装PM2
```bash
# 在服务器SSH中执行
npm install -g pm2
```

### 1.3 创建网站
1. 在宝塔面板中点击 **网站**
2. 点击 **添加站点**
3. 填写信息：
   - 域名：`119.28.19.237`（或您的域名）
   - 根目录：`/www/wwwroot/2weima`
   - PHP版本：纯静态（不需要PHP）

## 2. 项目部署

### 2.1 克隆项目
```bash
# 在服务器SSH中执行
cd /www/wwwroot
git clone https://github.com/wubian2007/2weima.git 2weima
cd 2weima
npm install --production
```

### 2.2 配置Nginx
在宝塔面板中：
1. 进入 **网站** → 找到您的站点 → **设置**
2. 点击 **配置文件**
3. 将以下配置替换原有内容：

```nginx
server {
    listen 80;
    server_name 119.28.19.237;  # 替换为您的域名
    
    # 网站根目录
    root /www/wwwroot/2weima;
    index index.html index.htm;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # API代理到Node.js服务器
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # GitHub API服务器代理
    location /github-api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 主页面
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    # 日志
    access_log /www/wwwlogs/2weima.log;
    error_log /www/wwwlogs/2weima.error.log;
}
```

4. 保存配置并重启Nginx

### 2.3 启动PM2服务
```bash
# 在项目目录中执行
cd /www/wwwroot/2weima
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 3. 本地开发同步

### 3.1 安装同步工具
```bash
# 在本地项目目录中
chmod +x bt-sync.sh
```

### 3.2 同步选项

#### 完整同步（推荐）
```bash
./bt-sync.sh
```

#### 实时监控同步（开发时使用）
```bash
./bt-sync.sh --watch
```

#### 仅同步到服务器
```bash
./bt-sync.sh --server
```

#### 仅本地操作
```bash
./bt-sync.sh --local
```

#### 强制同步（忽略Git状态）
```bash
./bt-sync.sh --force
```

## 4. 开发工作流

### 4.1 日常开发流程
1. 在本地修改代码
2. 运行 `./bt-sync.sh --watch` 启动实时监控
3. 保存文件后自动同步到服务器
4. 访问 `http://119.28.19.237` 查看效果

### 4.2 手动同步流程
1. 修改代码
2. 运行 `./bt-sync.sh` 手动同步
3. 查看同步结果

### 4.3 服务器管理
```bash
# 查看PM2状态
pm2 status

# 查看日志
pm2 logs 2weima-server
pm2 logs 2weima-github-api

# 重启服务
pm2 restart 2weima-server

# 停止服务
pm2 stop 2weima-server
```

## 5. 故障排除

### 5.1 SSH连接问题
- 检查服务器防火墙是否开放22端口
- 确认SSH服务正常运行
- 检查SSH密钥配置

### 5.2 网站访问问题
- 检查Nginx配置是否正确
- 确认PM2服务正常运行
- 查看Nginx错误日志

### 5.3 同步失败
- 检查Git仓库状态
- 确认服务器目录权限
- 查看同步脚本日志

## 6. 常用命令

```bash
# 本地开发
npm run dev          # 启动本地开发服务器
./bt-sync.sh --watch # 实时同步

# 服务器管理
ssh root@119.28.19.237
cd /www/wwwroot/2weima
pm2 status           # 查看服务状态
pm2 logs             # 查看日志
nginx -t             # 测试Nginx配置
systemctl reload nginx # 重载Nginx配置
```
