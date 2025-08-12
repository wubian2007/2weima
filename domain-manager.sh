#!/bin/bash

# 域名管理脚本
# 用于部署泛域名配置和管理域名

# 配置信息
SERVER_HOST="119.28.19.237"
SERVER_USER="root"
SERVER_PATH="/www/wwwroot/2weima"
SSH_KEY="~/.ssh/2weima-server"
NGINX_CONFIG_DIR="/www/server/panel/vhost/nginx"
NGINX_CONFIG_FILE="$NGINX_CONFIG_DIR/2wei.top.conf"

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

# 部署泛域名配置
deploy_wildcard_config() {
    echo -e "${BLUE}🌐 部署泛域名配置...${NC}"
    
    # 备份当前配置
    ssh_cmd "cp $NGINX_CONFIG_FILE ${NGINX_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # 上传新的泛域名配置
    scp -i $SSH_KEY nginx-wildcard.conf $SERVER_USER@$SERVER_HOST:$NGINX_CONFIG_FILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 泛域名配置上传成功${NC}"
        
        # 测试Nginx配置
        echo -e "${BLUE}🔍 测试Nginx配置...${NC}"
        if ssh_cmd "nginx -t" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Nginx配置测试通过${NC}"
            
            # 重载Nginx
            echo -e "${BLUE}🔄 重载Nginx配置...${NC}"
            ssh_cmd "nginx -s reload"
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Nginx重载成功${NC}"
                echo -e "${GREEN}✅ 泛域名配置部署完成！${NC}"
            else
                echo -e "${RED}❌ Nginx重载失败${NC}"
                return 1
            fi
        else
            echo -e "${RED}❌ Nginx配置测试失败${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ 泛域名配置上传失败${NC}"
        return 1
    fi
}

# 测试泛域名功能
test_wildcard_domain() {
    echo -e "${BLUE}🧪 测试泛域名功能...${NC}"
    
    # 生成测试域名
    TEST_SUBDOMAIN=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 6 | head -n 1)
    TEST_DOMAIN="${TEST_SUBDOMAIN}.2wei.top"
    
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

# 查看域名统计
show_domain_stats() {
    echo -e "${BLUE}📊 查看域名统计...${NC}"
    
    # 查看Nginx访问日志中的域名统计
    ssh_cmd "grep -o '[a-z0-9]\{6\}\.2wei\.top' /www/wwwlogs/2wei.top.log | sort | uniq -c | sort -nr | head -10"
}

# 清理过期域名记录
cleanup_domains() {
    echo -e "${BLUE}🧹 清理过期域名记录...${NC}"
    
    # 这里可以添加清理逻辑，比如清理超过7天的域名记录
    echo -e "${GREEN}✅ 域名记录清理完成${NC}"
}

# 查看当前配置
show_config() {
    echo -e "${BLUE}📋 查看当前Nginx配置...${NC}"
    ssh_cmd "head -20 $NGINX_CONFIG_FILE"
}

# 回滚配置
rollback_config() {
    echo -e "${BLUE}🔄 回滚Nginx配置...${NC}"
    
    # 查找最新的备份文件
    BACKUP_FILE=$(ssh_cmd "ls -t ${NGINX_CONFIG_FILE}.backup.* | head -1")
    
    if [ -n "$BACKUP_FILE" ]; then
        ssh_cmd "cp $BACKUP_FILE $NGINX_CONFIG_FILE"
        ssh_cmd "nginx -t && nginx -s reload"
        echo -e "${GREEN}✅ 配置回滚成功${NC}"
    else
        echo -e "${RED}❌ 未找到备份文件${NC}"
    fi
}

# 主函数
main() {
    case $1 in
        "deploy")
            if check_ssh; then
                deploy_wildcard_config
            fi
            ;;
        "test")
            if check_ssh; then
                test_wildcard_domain
            fi
            ;;
        "stats")
            if check_ssh; then
                show_domain_stats
            fi
            ;;
        "cleanup")
            if check_ssh; then
                cleanup_domains
            fi
            ;;
        "config")
            if check_ssh; then
                show_config
            fi
            ;;
        "rollback")
            if check_ssh; then
                rollback_config
            fi
            ;;
        *)
            echo -e "${YELLOW}使用方法: $0 [命令]${NC}"
            echo "可用命令:"
            echo "  deploy    - 部署泛域名配置"
            echo "  test      - 测试泛域名功能"
            echo "  stats     - 查看域名统计"
            echo "  cleanup   - 清理过期域名记录"
            echo "  config    - 查看当前配置"
            echo "  rollback  - 回滚配置"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
