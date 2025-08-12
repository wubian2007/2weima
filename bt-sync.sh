#!/bin/bash

# 宝塔面板LNMP环境同步脚本
# 使用方法: ./bt-sync.sh [选项]
# 选项: 
#   -w, --watch    实时监控文件变化并同步
#   -f, --force    强制同步（忽略Git状态）
#   -s, --server   只同步到服务器
#   -l, --local    只本地操作

# 配置信息
SERVER_HOST="119.28.19.237"
SERVER_USER="root"
SERVER_PATH="/www/wwwroot/2weima"
DOMAIN="9gtu.com"
GIT_REPO="https://github.com/wubian2007/2weima.git"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 解析参数
WATCH_MODE=false
FORCE_MODE=false
SERVER_ONLY=false
LOCAL_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--watch)
            WATCH_MODE=true
            shift
            ;;
        -f|--force)
            FORCE_MODE=true
            shift
            ;;
        -s|--server)
            SERVER_ONLY=true
            shift
            ;;
        -l|--local)
            LOCAL_ONLY=true
            shift
            ;;
        *)
            echo "未知参数: $1"
            echo "使用方法: $0 [-w|--watch] [-f|--force] [-s|--server] [-l|--local]"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🔧 宝塔面板LNMP同步工具${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# 检查SSH连接
check_ssh() {
    echo -e "${YELLOW}🔍 检查SSH连接...${NC}"
    if ssh -i ~/.ssh/2weima-server -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST "echo 'SSH连接测试成功'" 2>/dev/null; then
        echo -e "${GREEN}✅ SSH连接正常${NC}"
        return 0
    else
        echo -e "${RED}❌ SSH连接失败${NC}"
        echo "请检查："
        echo "  - 服务器IP: $SERVER_HOST"
        echo "  - SSH服务是否开启"
        echo "  - 防火墙是否放行22端口"
        echo "  - SSH密钥是否配置"
        return 1
    fi
}

# 本地Git操作
local_git_ops() {
    if [ "$FORCE_MODE" = false ]; then
        echo -e "${YELLOW}📋 检查本地Git状态...${NC}"
        if [ -n "$(git status --porcelain)" ]; then
            echo -e "${YELLOW}📝 发现未提交的更改，正在提交...${NC}"
            git add .
            git commit -m "自动同步: $(date '+%Y-%m-%d %H:%M:%S')"
        fi
    fi
    
    echo -e "${YELLOW}📤 推送到GitHub...${NC}"
    git push origin main
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 推送到GitHub失败${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ 推送到GitHub成功${NC}"
}

# 服务器端操作
server_ops() {
    echo -e "${YELLOW}🔗 连接到服务器并更新...${NC}"
    ssh -i ~/.ssh/2weima-server ${SERVER_USER}@${SERVER_HOST} << EOF
        echo "📁 进入网站目录..."
        cd ${SERVER_PATH}
        
        # 检查目录是否存在
        if [ ! -d ".git" ]; then
            echo "📥 首次部署，克隆项目..."
            git clone ${GIT_REPO} .
        fi
        
        echo "📥 拉取最新代码..."
        git pull origin main
        
        echo "📦 安装依赖..."
        npm install --production
        
        echo "📝 创建日志目录..."
        mkdir -p logs
        
        echo "🔄 重启PM2服务..."
        pm2 delete 2weima-server 2>/dev/null || echo "服务不存在，跳过删除"
        pm2 start ecosystem.config.js
        
        echo "💾 保存PM2配置..."
        pm2 save
        
        echo "✅ 服务器更新完成！"
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 服务器同步成功！${NC}"
        echo -e "${GREEN}🌐 网站地址: https://${DOMAIN}${NC}"
        echo -e "${GREEN}🌐 备用地址: http://${SERVER_HOST}${NC}"
        return 0
    else
        echo -e "${RED}❌ 服务器同步失败${NC}"
        return 1
    fi
}

# 实时监控模式
watch_mode() {
    echo -e "${BLUE}👀 启动实时监控模式...${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止监控${NC}"
    echo ""
    
    # 检查是否安装了fswatch
    if ! command -v fswatch &> /dev/null; then
        echo -e "${YELLOW}📦 安装fswatch用于文件监控...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install fswatch
        else
            echo -e "${RED}请手动安装fswatch: sudo apt-get install fswatch${NC}"
            exit 1
        fi
    fi
    
    # 监控文件变化并同步
    fswatch -o . | while read f; do
        echo -e "${BLUE}🔄 检测到文件变化，开始同步...${NC}"
        if local_git_ops && server_ops; then
            echo -e "${GREEN}✅ 实时同步完成！${NC}"
        else
            echo -e "${RED}❌ 实时同步失败${NC}"
        fi
        echo ""
    done
}

# 主流程
main() {
    # 检查SSH连接
    if ! check_ssh; then
        exit 1
    fi
    
    # 根据参数执行不同操作
    if [ "$LOCAL_ONLY" = true ]; then
        echo -e "${BLUE}📝 仅执行本地操作...${NC}"
        local_git_ops
    elif [ "$SERVER_ONLY" = true ]; then
        echo -e "${BLUE}🌐 仅执行服务器操作...${NC}"
        server_ops
    elif [ "$WATCH_MODE" = true ]; then
        watch_mode
    else
        echo -e "${BLUE}🚀 执行完整同步...${NC}"
        if local_git_ops && server_ops; then
            echo -e "${GREEN}🎉 同步完成！${NC}"
        else
            echo -e "${RED}❌ 同步失败${NC}"
            exit 1
        fi
    fi
}

# 运行主流程
main
