#!/bin/bash

# 2weima项目部署脚本
# 使用方法: ./deploy.sh

# 配置信息
SERVER_HOST="119.28.19.237"
SERVER_USER="root"
SERVER_PATH="/www/wwwroot/2weima"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始部署2weima项目到服务器...${NC}"
echo -e "${BLUE}服务器: ${SERVER_HOST}${NC}"
echo -e "${BLUE}目录: ${SERVER_PATH}${NC}"
echo ""

# 1. 检查本地Git状态
echo -e "${YELLOW}📋 检查本地Git状态...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ 本地有未提交的更改，请先提交代码${NC}"
    git status
    exit 1
fi

# 2. 推送到GitHub
echo -e "${YELLOW}📤 推送到GitHub...${NC}"
git push origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 推送到GitHub失败${NC}"
    exit 1
fi

# 3. 连接到服务器并部署
echo -e "${YELLOW}🔗 连接到服务器并部署...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    echo "📁 进入网站目录..."
    cd ${SERVER_PATH}
    
    echo "📥 拉取最新代码..."
    git pull origin main
    
    echo "📦 安装依赖..."
    npm install --production
    
    echo "📝 创建日志目录..."
    mkdir -p logs
    
    echo "🔄 重启PM2服务..."
    pm2 delete 2weima-server 2>/dev/null || echo "服务不存在，跳过删除"
    pm2 delete 2weima-github-api 2>/dev/null || echo "服务不存在，跳过删除"
    pm2 start ecosystem.config.js
    
    echo "💾 保存PM2配置..."
    pm2 save
    
    echo "🔄 重启Nginx..."
    nginx -t && systemctl reload nginx
    
    echo "✅ 部署完成！"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 部署成功！${NC}"
    echo -e "${GREEN}🌐 网站地址: http://${SERVER_HOST}${NC}"
    echo -e "${GREEN}📊 PM2状态: ssh ${SERVER_USER}@${SERVER_HOST} 'pm2 status'${NC}"
else
    echo -e "${RED}❌ 部署失败，请检查服务器连接${NC}"
    exit 1
fi
