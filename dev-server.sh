#!/bin/bash

# 本地开发服务器脚本
# 使用方法: ./dev-server.sh

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 启动本地开发服务器${NC}"
echo -e "${BLUE}==================${NC}"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js未安装${NC}"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
fi

# 启动开发服务器
echo -e "${GREEN}✅ 启动开发服务器...${NC}"
echo -e "${BLUE}🌐 主服务器: http://localhost:3000${NC}"
echo -e "${BLUE}🖼️ 图片转换工具: http://localhost:3000/image-converter.html${NC}"
echo -e "${BLUE}📤 上传工具: http://localhost:3000/upload.html${NC}"
echo -e "${BLUE}🔧 管理后台: http://localhost:3000/admin.html${NC}"
echo -e "${BLUE}📊 GitHub API: http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止服务器${NC}"
echo ""

# 启动主服务器
npm start
