#!/bin/bash

# 宝塔服务器配置向导
# 使用方法: ./config-wizard.sh

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 宝塔服务器配置向导${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# 检查配置文件是否存在
if [ ! -f "sync-to-server.sh" ]; then
    echo -e "${RED}❌ 找不到 sync-to-server.sh 文件${NC}"
    exit 1
fi

# 获取服务器信息
echo -e "${YELLOW}📝 请输入服务器信息：${NC}"
echo ""

# 服务器IP
read -p "服务器IP地址: " SERVER_IP
if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}❌ 服务器IP不能为空${NC}"
    exit 1
fi

# 服务器用户名
read -p "服务器用户名 (默认: root): " SERVER_USER
if [ -z "$SERVER_USER" ]; then
    SERVER_USER="root"
fi

# 网站目录
read -p "网站目录路径 (默认: /www/wwwroot/2weima): " SERVER_PATH
if [ -z "$SERVER_PATH" ]; then
    SERVER_PATH="/www/wwwroot/2weima"
fi

# 域名（可选）
read -p "域名 (可选，用于显示网站地址): " DOMAIN

echo ""
echo -e "${YELLOW}📋 配置信息确认：${NC}"
echo "服务器IP: $SERVER_IP"
echo "用户名: $SERVER_USER"
echo "网站目录: $SERVER_PATH"
if [ ! -z "$DOMAIN" ]; then
    echo "域名: $DOMAIN"
fi
echo ""

read -p "确认配置信息正确吗？(y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}配置已取消${NC}"
    exit 0
fi

# 更新同步脚本
echo -e "${YELLOW}🔄 更新同步脚本配置...${NC}"
sed -i.bak "s/SERVER_HOST=\"your-server-ip\"/SERVER_HOST=\"$SERVER_IP\"/" sync-to-server.sh
sed -i.bak "s/SERVER_USER=\"root\"/SERVER_USER=\"$SERVER_USER\"/" sync-to-server.sh
sed -i.bak "s|SERVER_PATH=\"/www/wwwroot/2weima\"|SERVER_PATH=\"$SERVER_PATH\"|" sync-to-server.sh

# 更新网站地址显示
if [ ! -z "$DOMAIN" ]; then
    sed -i.bak "s|echo -e \"\${GREEN}🌐 网站地址: http://\${SERVER_HOST}\${NC}\"|echo -e \"\${GREEN}🌐 网站地址: https://$DOMAIN\${NC}\"|" sync-to-server.sh
fi

# 更新Nginx配置
echo -e "${YELLOW}🔄 更新Nginx配置模板...${NC}"
if [ ! -z "$DOMAIN" ]; then
    sed -i.bak "s/your-domain.com/$DOMAIN/g" nginx.conf
fi

# 更新PM2配置
echo -e "${YELLOW}🔄 更新PM2配置...${NC}"
sed -i.bak "s/your-domain.com/$DOMAIN/g" ecosystem.config.js

# 创建配置备份
echo -e "${YELLOW}💾 创建配置备份...${NC}"
cp sync-to-server.sh sync-to-server.sh.backup
cp nginx.conf nginx.conf.backup
cp ecosystem.config.js ecosystem.config.js.backup

echo ""
echo -e "${GREEN}✅ 配置完成！${NC}"
echo ""
echo -e "${BLUE}📋 下一步操作：${NC}"
echo "1. 确保服务器已安装宝塔面板"
echo "2. 在宝塔面板中创建网站"
echo "3. 配置SSL证书"
echo "4. 运行同步脚本: ./sync-to-server.sh"
echo ""
echo -e "${BLUE}📚 详细说明请查看：${NC}"
echo "- BT-DEPLOYMENT.md (宝塔部署指南)"
echo "- DEPLOYMENT.md (GitHub Pages部署指南)"
echo ""

# 测试SSH连接
echo -e "${YELLOW}🔍 测试SSH连接...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    echo -e "${GREEN}✅ SSH连接测试成功！${NC}"
else
    echo -e "${RED}❌ SSH连接测试失败，请检查：${NC}"
    echo "  - 服务器IP是否正确"
    echo "  - SSH服务是否开启"
    echo "  - 防火墙是否放行22端口"
    echo "  - SSH密钥是否配置"
fi

echo ""
echo -e "${GREEN}🎉 配置向导完成！${NC}"
