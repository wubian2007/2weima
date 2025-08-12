#!/bin/bash

# 服务器管理脚本
# 使用方法: ./server-manager.sh [命令]
# 命令: status, restart, logs, update, test

# 配置信息
SERVER_HOST="119.28.19.237"
SERVER_USER="root"
SERVER_PATH="/www/wwwroot/2weima"
SSH_KEY="~/.ssh/2weima-server"

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

# 检查服务状态
check_status() {
    echo -e "${BLUE}🔍 检查服务状态...${NC}"
    ssh_cmd "cd $SERVER_PATH && pm2 status"
}

# 重启服务
restart_service() {
    echo -e "${BLUE}🔄 重启服务...${NC}"
    ssh_cmd "cd $SERVER_PATH && pm2 restart 2weima-server"
}

# 查看日志
view_logs() {
    echo -e "${BLUE}📋 查看服务日志...${NC}"
    ssh_cmd "cd $SERVER_PATH && pm2 logs 2weima-server --lines 20"
}

# 更新代码
update_code() {
    echo -e "${BLUE}📥 更新代码...${NC}"
    ssh_cmd "cd $SERVER_PATH && git pull origin main && npm install && pm2 restart 2weima-server"
}

# 测试网站
test_website() {
    echo -e "${BLUE}🌐 测试网站...${NC}"
    echo "测试主页面..."
    curl -I https://9gtu.com
    echo ""
    echo "测试API..."
    curl -s https://9gtu.com/api/files
    echo ""
    echo "测试管理页面..."
    curl -I https://9gtu.com/admin-server.html
}

# 查看Nginx状态
nginx_status() {
    echo -e "${BLUE}🌐 查看Nginx状态...${NC}"
    ssh_cmd "nginx -t && systemctl status nginx"
}

# 重启Nginx
restart_nginx() {
    echo -e "${BLUE}🔄 重启Nginx...${NC}"
    ssh_cmd "nginx -s reload"
}

# 查看服务器资源
server_info() {
    echo -e "${BLUE}💻 服务器信息...${NC}"
    ssh_cmd "df -h && free -h && uptime"
}

# 主函数
main() {
    case $1 in
        "status")
            check_status
            ;;
        "restart")
            restart_service
            ;;
        "logs")
            view_logs
            ;;
        "update")
            update_code
            ;;
        "test")
            test_website
            ;;
        "nginx")
            nginx_status
            ;;
        "nginx-restart")
            restart_nginx
            ;;
        "info")
            server_info
            ;;
        "all")
            echo -e "${BLUE}🚀 执行完整检查...${NC}"
            check_status
            echo ""
            test_website
            echo ""
            nginx_status
            echo ""
            server_info
            ;;
        *)
            echo -e "${YELLOW}使用方法: $0 [命令]${NC}"
            echo "可用命令:"
            echo "  status        - 检查服务状态"
            echo "  restart       - 重启Node.js服务"
            echo "  logs          - 查看服务日志"
            echo "  update        - 更新代码并重启"
            echo "  test          - 测试网站功能"
            echo "  nginx         - 查看Nginx状态"
            echo "  nginx-restart - 重启Nginx"
            echo "  info          - 查看服务器信息"
            echo "  all           - 执行完整检查"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
