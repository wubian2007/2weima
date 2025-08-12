# 宝塔面板泛域名配置指南

## 第一步：域名解析配置

### 在域名管理后台添加泛域名解析

1. **登录域名管理后台**（阿里云、腾讯云、腾讯云等）
2. **找到域名解析设置**
3. **添加解析记录**：
   ```
   记录类型: A记录
   主机记录: *
   记录值: 119.28.19.237
   TTL: 600秒
   ```

## 第二步：宝塔面板网站配置

### 1. 创建网站
1. 登录宝塔面板
2. 点击"网站" → "添加站点"
3. 填写配置：
   ```
   域名: *.9gtu.com
   根目录: /www/wwwroot/2weima
   PHP版本: 纯静态
   ```

### 2. 配置SSL证书
1. 在网站列表中找到刚创建的站点
2. 点击"SSL" → "Let's Encrypt"
3. 选择"泛域名证书"
4. 填写域名：`*.9gtu.com`
5. 申请并安装证书

### 3. 配置伪静态
1. 点击"设置" → "伪静态"
2. 选择"自定义"
3. 添加规则：
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

## 第三步：Nginx配置优化

### 1. 编辑网站配置文件
文件路径：`/www/server/panel/vhost/nginx/*.9gtu.com.conf`

### 2. 替换为以下配置：
```nginx
server {
    listen 80;
    server_name *.9gtu.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.9gtu.com;
    
    # SSL证书配置
    ssl_certificate /www/server/panel/vhost/cert/*.9gtu.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/*.9gtu.com/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头信息
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 网站根目录
    root /www/wwwroot/2weima;
    index index.html index.htm;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # API代理到Node.js服务
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
    
    # 上传文件代理
    location /upload {
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
    
    # 上传文件访问
    location /uploads/ {
        alias /www/wwwroot/2weima/uploads/;
        expires 1y;
        add_header Cache-Control "public";
        try_files $uri =404;
    }
    
    # 主页面
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /index.html;
}
```

## 第四步：测试配置

### 1. 测试随机域名访问
```bash
# 生成随机二级域名
RANDOM_SUBDOMAIN=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 6 | head -n 1)
TEST_DOMAIN="${RANDOM_SUBDOMAIN}.9gtu.com"

# 测试访问
curl -I "https://$TEST_DOMAIN"
```

### 2. 检查SSL证书
```bash
# 检查证书是否支持泛域名
openssl s_client -connect abc123.9gtu.com:443 -servername abc123.9gtu.com
```

## 第五步：验证功能

1. **访问随机域名**：`https://abc123.9gtu.com`
2. **检查API功能**：`https://abc123.9gtu.com/api/files`
3. **测试上传功能**：`https://abc123.9gtu.com/admin-server.html`

## 注意事项

1. **SSL证书**：确保申请的是泛域名证书（*.9gtu.com）
2. **DNS解析**：泛域名解析可能需要几分钟生效
3. **防火墙**：确保80和443端口开放
4. **Node.js服务**：确保PM2服务正常运行

## 优势

- ✅ 无需手动添加每个域名
- ✅ 支持无限个随机二级域名
- ✅ 统一的SSL证书管理
- ✅ 自动的域名轮换功能
- ✅ 更好的防护效果
