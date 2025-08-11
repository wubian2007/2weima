#!/bin/bash

# 配置检查脚本
# 使用方法: ./check-config.sh

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 配置状态检查${NC}"
echo -e "${BLUE}================${NC}"
echo ""

# 检查必要文件
echo -e "${YELLOW}📁 检查必要文件：${NC}"
files=("sync-to-server.sh" "nginx.conf" "ecosystem.config.js" "package.json" "server.js")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅ $file${NC}"
    else
        echo -e "  ${RED}❌ $file (缺失)${NC}"
    fi
done

echo ""

# 检查同步脚本配置
echo -e "${YELLOW}⚙️ 检查同步脚本配置：${NC}"
if grep -q "your-server-ip" sync-to-server.sh; then
    echo -e "  ${RED}❌ 服务器IP未配置${NC}"
else
    SERVER_IP=$(grep 'SERVER_HOST=' sync-to-server.sh | cut -d'"' -f2)
    echo -e "  ${GREEN}✅ 服务器IP: $SERVER_IP${NC}"
fi

if grep -q "your-domain.com" nginx.conf; then
    echo -e "  ${RED}❌ 域名未配置${NC}"
else
    echo -e "  ${GREEN}✅ 域名已配置${NC}"
fi

echo ""

# 检查Git状态
echo -e "${YELLOW}📋 检查Git状态：${NC}"
if [ -d ".git" ]; then
    echo -e "  ${GREEN}✅ Git仓库已初始化${NC}"
    
    # 检查远程仓库
    if git remote -v | grep -q "origin"; then
        echo -e "  ${GREEN}✅ 远程仓库已配置${NC}"
    else
        echo -e "  ${RED}❌ 远程仓库未配置${NC}"
    fi
    
    # 检查未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "  ${YELLOW}⚠️ 有未提交的更改${NC}"
        git status --short
    else
        echo -e "  ${GREEN}✅ 工作目录干净${NC}"
    fi
else
    echo -e "  ${RED}❌ Git仓库未初始化${NC}"
fi

echo ""

# 检查Node.js环境
echo -e "${YELLOW}🟢 检查Node.js环境：${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  ${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "  ${RED}❌ Node.js未安装${NC}"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "  ${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "  ${RED}❌ npm未安装${NC}"
fi

echo ""

# 检查依赖
echo -e "${YELLOW}📦 检查项目依赖：${NC}"
if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo -e "  ${GREEN}✅ 依赖已安装${NC}"
    else
        echo -e "  ${YELLOW}⚠️ 依赖未安装，运行: npm install${NC}"
    fi
else
    echo -e "  ${RED}❌ package.json不存在${NC}"
fi

echo ""

# 检查SSH连接
echo -e "${YELLOW}🔗 检查SSH连接：${NC}"
if [ -f "sync-to-server.sh" ]; then
    SERVER_IP=$(grep 'SERVER_HOST=' sync-to-server.sh | cut -d'"' -f2)
    SERVER_USER=$(grep 'SERVER_USER=' sync-to-server.sh | cut -d'"' -f2)
    
    if [ "$SERVER_IP" != "your-server-ip" ]; then
        echo -e "  ${YELLOW}🔍 测试连接到 $SERVER_USER@$SERVER_IP...${NC}"
        if ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
            echo -e "  ${GREEN}✅ SSH连接成功${NC}"
        else
            echo -e "  ${RED}❌ SSH连接失败${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️ 服务器IP未配置${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📋 配置建议：${NC}"

# 提供配置建议
if grep -q "your-server-ip" sync-to-server.sh; then
    echo -e "  ${YELLOW}1. 运行 ./config-wizard.sh 配置服务器信息${NC}"
fi

if [ ! -d "node_modules" ]; then
    echo -e "  ${YELLOW}2. 运行 npm install 安装依赖${NC}"
fi

if [ -n "$(git status --porcelain)" ]; then
    echo -e "  ${YELLOW}3. 提交代码更改: git add . && git commit -m 'update'${NC}"
fi

echo ""
echo -e "${GREEN}🎉 配置检查完成！${NC}"
