#!/bin/bash

# 同步到香港宝塔服务器的脚本
# 使用方法: ./sync-to-server.sh

# 配置信息
SERVER_HOST="119.28.19.237"  # 替换为您的服务器IP
SERVER_USER="root"            # 替换为您的服务器用户名
SERVER_PATH="/www/wwwroot/2weima"  # 替换为您的网站目录
GIT_REPO="https://github.com/wubian2007/2weima.git"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始同步代码到香港宝塔服务器...${NC}"

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

# 3. 连接到服务器并更新代码
echo -e "${YELLOW}🔗 连接到服务器并更新代码...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    echo "📁 进入网站目录..."
    cd ${SERVER_PATH}
    
    echo "📥 拉取最新代码..."
    git pull origin main
    
    echo "📦 安装依赖..."
    npm install
    
    echo "🔄 重启服务..."
    pm2 restart 2weima || echo "PM2服务不存在，跳过重启"
    
    echo "✅ 同步完成！"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 代码同步成功！${NC}"
    echo -e "${GREEN}🌐 网站地址: http://${SERVER_HOST}${NC}"
else
    echo -e "${RED}❌ 同步失败，请检查服务器连接${NC}"
    exit 1
fi
