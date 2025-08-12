#!/bin/bash

# 宝塔面板泛域名配置脚本
# 自动配置泛域名解析和SSL证书

# 配置信息
SERVER_HOST="119.28.19.237"
SERVER_USER="root"
SSH_KEY="~/.ssh/2weima-server"
DOMAIN="2wei.top"
WILDCARD_DOMAIN="*.${DOMAIN}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# SSH命令函数
ssh_cmd() {
    ssh -i $SSH_KEY -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "$1"
}

# 检查SSH连接
check_ssh() {
    echo -e "${BLUE}🔍 检查SSH连接...${NC}"
    if ssh_cmd "echo 'SSH连接正常'" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ SSH连接正常${NC}"
        return 0
    else
        echo -e "${RED}❌ SSH连接失败${NC}"
        return 1
    fi
}

# 检查域名解析
check_dns() {
    echo -e "${BLUE}🔍 检查域名解析...${NC}"
    
    # 生成测试域名
    TEST_SUBDOMAIN=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 6 | head -n 1)
    TEST_DOMAIN="${TEST_SUBDOMAIN}.${DOMAIN}"
    
    echo -e "${YELLOW}测试域名: $TEST_DOMAIN${NC}"
    
    # 检查DNS解析
    DNS_RESULT=$(nslookup $TEST_DOMAIN 2>/dev/null | grep -E "Address:|Name:")
    
    if echo "$DNS_RESULT" | grep -q "$SERVER_HOST"; then
        echo -e "${GREEN}✅ 泛域名解析正常${NC}"
        return 0
    else
        echo -e "${RED}❌ 泛域名解析失败${NC}"
        echo -e "${YELLOW}请确保已添加以下DNS记录：${NC}"
        echo -e "${YELLOW}类型: A记录${NC}"
        echo -e "${YELLOW}主机记录: *${NC}"
        echo -e "${YELLOW}记录值: $SERVER_HOST${NC}"
        return 1
    fi
}

# 创建宝塔面板网站
create_bt_site() {
    echo -e "${BLUE}🌐 创建宝塔面板网站...${NC}"
    
    # 检查网站是否已存在
    if ssh_cmd "ls /www/server/panel/vhost/nginx/*.${DOMAIN}.conf" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  网站配置已存在${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}请在宝塔面板中手动创建网站：${NC}"
    echo -e "${YELLOW}1. 登录宝塔面板${NC}"
    echo -e "${YELLOW}2. 点击'网站' → '添加站点'${NC}"
    echo -e "${YELLOW}3. 域名: $WILDCARD_DOMAIN${NC}"
    echo -e "${YELLOW}4. 根目录: /www/wwwroot/2weima${NC}"
    echo -e "${YELLOW}5. PHP版本: 纯静态${NC}"
    
    read -p "网站创建完成后按回车继续..."
}

# 配置SSL证书
setup_ssl() {
    echo -e "${BLUE}🔒 配置SSL证书...${NC}"
    
    # 检查SSL证书是否存在
    if ssh_cmd "ls /www/server/panel/vhost/cert/*.${DOMAIN}/fullchain.pem" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ SSL证书已存在${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}请在宝塔面板中申请SSL证书：${NC}"
    echo -e "${YELLOW}1. 在网站列表中找到刚创建的站点${NC}"
    echo -e "${YELLOW}2. 点击'SSL' → 'Let's Encrypt'${NC}"
    echo -e "${YELLOW}3. 选择'泛域名证书'${NC}"
    echo -e "${YELLOW}4. 填写域名: $WILDCARD_DOMAIN${NC}"
    echo -e "${YELLOW}5. 申请并安装证书${NC}"
    
    read -p "SSL证书安装完成后按回车继续..."
}

# 配置Nginx
setup_nginx() {
    echo -e "${BLUE}⚙️  配置Nginx...${NC}"
    
    # 备份现有配置
    ssh_cmd "cp /www/server/panel/vhost/nginx/*.${DOMAIN}.conf /www/server/panel/vhost/nginx/*.${DOMAIN}.conf.backup.$(date +%Y%m%d_%H%M%S)"
    
    # 创建新的Nginx配置
    cat > /tmp/wildcard.conf << EOF
server {
    listen 80;
    server_name *.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.${DOMAIN};
    
    # SSL证书配置
    ssl_certificate /www/server/panel/vhost/cert/*.${DOMAIN}/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/*.${DOMAIN}/privkey.pem;
    
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
        try_files \$uri =404;
    }
    
    # API代理到Node.js服务
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 上传文件代理
    location /upload {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 上传文件访问
    location /uploads/ {
        alias /www/wwwroot/2weima/uploads/;
        expires 1y;
        add_header Cache-Control "public";
        try_files \$uri =404;
    }
    
    # 主页面
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /index.html;
}
EOF
    
    # 上传配置文件
    scp -i $SSH_KEY /tmp/wildcard.conf $SERVER_USER@$SERVER_HOST:/www/server/panel/vhost/nginx/*.${DOMAIN}.conf
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx配置上传成功${NC}"
        
        # 测试配置
        if ssh_cmd "nginx -t" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Nginx配置测试通过${NC}"
            
            # 重载配置
            ssh_cmd "nginx -s reload"
            echo -e "${GREEN}✅ Nginx配置重载成功${NC}"
        else
            echo -e "${RED}❌ Nginx配置测试失败${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Nginx配置上传失败${NC}"
        return 1
    fi
    
    # 清理临时文件
    rm -f /tmp/wildcard.conf
}

# 测试泛域名功能
test_wildcard() {
    echo -e "${BLUE}🧪 测试泛域名功能...${NC}"
    
    # 生成测试域名
    TEST_SUBDOMAIN=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 6 | head -n 1)
    TEST_DOMAIN="${TEST_SUBDOMAIN}.${DOMAIN}"
    
    echo -e "${YELLOW}测试域名: $TEST_DOMAIN${NC}"
    
    # 测试HTTP访问
    echo -e "${BLUE}测试HTTP访问...${NC}"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$TEST_DOMAIN")
    if [ "$HTTP_STATUS" = "301" ]; then
        echo -e "${GREEN}✅ HTTP重定向正常${NC}"
    else
        echo -e "${RED}❌ HTTP重定向异常: $HTTP_STATUS${NC}"
    fi
    
    # 测试HTTPS访问
    echo -e "${BLUE}测试HTTPS访问...${NC}"
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$TEST_DOMAIN")
    if [ "$HTTPS_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ HTTPS访问正常${NC}"
    else
        echo -e "${RED}❌ HTTPS访问异常: $HTTPS_STATUS${NC}"
    fi
    
    # 测试API访问
    echo -e "${BLUE}测试API访问...${NC}"
    API_RESPONSE=$(curl -s "https://$TEST_DOMAIN/api/files")
    if echo "$API_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ API访问正常${NC}"
    else
        echo -e "${RED}❌ API访问异常${NC}"
    fi
}

# 主函数
main() {
    echo -e "${BLUE}🚀 宝塔面板泛域名配置工具${NC}"
    echo -e "${BLUE}================================${NC}"
    
    if ! check_ssh; then
        exit 1
    fi
    
    if ! check_dns; then
        echo -e "${YELLOW}请先配置DNS解析，然后重新运行脚本${NC}"
        exit 1
    fi
    
    create_bt_site
    setup_ssl
    setup_nginx
    test_wildcard
    
    echo -e "${GREEN}✅ 泛域名配置完成！${NC}"
    echo -e "${GREEN}现在可以使用任意二级域名访问您的网站${NC}"
    echo -e "${GREEN}例如: https://abc123.${DOMAIN}${NC}"
}

# 运行主函数
main "$@"
