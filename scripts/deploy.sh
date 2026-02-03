#!/bin/bash

# continew-admin-ui 生产环境部署脚本
# 作者: 自动生成
# 日期: $(date +%Y-%m-%d)

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
DEFAULT_SERVER_HOST="your-server.com"
DEFAULT_SERVER_USER="root"
DEFAULT_SERVER_PATH="/var/www/continew-admin-ui"
DEFAULT_NGINX_CONFIG="/etc/nginx/sites-available/continew-admin-ui"
DEFAULT_BACKUP_DIR="/var/backups/continew-admin-ui"

# 读取配置文件或使用默认值
if [ -f "deploy-config.env" ]; then
    source deploy-config.env
    echo -e "${GREEN}✓ 已加载部署配置文件${NC}"
else
    echo -e "${YELLOW}警告: 未找到deploy-config.env配置文件，使用默认配置${NC}"
    SERVER_HOST=${SERVER_HOST:-$DEFAULT_SERVER_HOST}
    SERVER_USER=${SERVER_USER:-$DEFAULT_SERVER_USER}
    SERVER_PATH=${SERVER_PATH:-$DEFAULT_SERVER_PATH}
    NGINX_CONFIG=${NGINX_CONFIG:-$DEFAULT_NGINX_CONFIG}
    BACKUP_DIR=${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    continew-admin-ui 生产环境部署${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}目标服务器: $SERVER_HOST${NC}"
echo -e "${YELLOW}部署用户: $SERVER_USER${NC}"
echo -e "${YELLOW}部署路径: $SERVER_PATH${NC}"
echo ""

# 检查构建文件是否存在
echo -e "${BLUE}[1/8] 检查构建文件...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}错误: 构建文件不存在，请先运行 ./scripts/build.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 构建文件检查通过${NC}"

# 检查服务器连接
echo -e "${BLUE}[2/8] 检查服务器连接...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo -e "${RED}错误: 无法连接到服务器 $SERVER_HOST${NC}"
    echo -e "${YELLOW}请确保:${NC}"
    echo -e "${YELLOW}1. 服务器地址正确${NC}"
    echo -e "${YELLOW}2. SSH密钥已配置${NC}"
    echo -e "${YELLOW}3. 服务器防火墙允许SSH连接${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 服务器连接正常${NC}"

# 创建部署包
echo -e "${BLUE}[3/8] 创建部署包...${NC}"
DEPLOY_PACKAGE="continew-admin-ui-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf $DEPLOY_PACKAGE -C dist .

if [ $? -eq 0 ]; then
    PACKAGE_SIZE=$(du -h $DEPLOY_PACKAGE | cut -f1)
    echo -e "${GREEN}✓ 部署包创建成功: $DEPLOY_PACKAGE ($PACKAGE_SIZE)${NC}"
else
    echo -e "${RED}错误: 部署包创建失败${NC}"
    exit 1
fi

# 上传部署包
echo -e "${BLUE}[4/8] 上传部署包到服务器...${NC}"
scp $DEPLOY_PACKAGE $SERVER_USER@$SERVER_HOST:/tmp/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 部署包上传成功${NC}"
else
    echo -e "${RED}错误: 部署包上传失败${NC}"
    exit 1
fi

# 服务器端部署操作
echo -e "${BLUE}[5/8] 在服务器上执行部署操作...${NC}"
ssh $SERVER_USER@$SERVER_HOST << EOF
set -e

echo "开始服务器端部署操作..."

# 创建备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p $BACKUP_DIR
    echo "✓ 创建备份目录: $BACKUP_DIR"
fi

# 备份当前版本
if [ -d "$SERVER_PATH" ]; then
    BACKUP_NAME="backup-\$(date +%Y%m%d-%H%M%S)"
    cp -r $SERVER_PATH $BACKUP_DIR/\$BACKUP_NAME
    echo "✓ 当前版本已备份到: $BACKUP_DIR/\$BACKUP_NAME"
    
    # 只保留最近5个备份
    cd $BACKUP_DIR
    ls -t | tail -n +6 | xargs -r rm -rf
    echo "✓ 清理旧备份，保留最近5个版本"
fi

# 创建部署目录
mkdir -p $SERVER_PATH
cd $SERVER_PATH

# 清空当前目录
rm -rf *

# 解压新版本
tar -xzf /tmp/$DEPLOY_PACKAGE

echo "✓ 新版本部署完成"

# 设置文件权限
chown -R www-data:www-data $SERVER_PATH
chmod -R 755 $SERVER_PATH

echo "✓ 文件权限设置完成"

# 清理临时文件
rm -f /tmp/$DEPLOY_PACKAGE

echo "✓ 临时文件清理完成"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 服务器端部署操作完成${NC}"
else
    echo -e "${RED}错误: 服务器端部署操作失败${NC}"
    exit 1
fi

# 检查并配置Nginx
echo -e "${BLUE}[6/8] 检查Nginx配置...${NC}"
ssh $SERVER_USER@$SERVER_HOST << EOF
# 检查Nginx是否安装
if ! command -v nginx &> /dev/null; then
    echo "警告: Nginx未安装，请手动安装并配置"
    exit 0
fi

# 检查配置文件是否存在
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "创建Nginx配置文件..."
    cat > $NGINX_CONFIG << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    root $SERVER_PATH;
    index index.html;

    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API代理（如果需要）
    location /api/ {
        proxy_pass https://api.continew.top/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINX_EOF

    # 启用站点
    if [ -d "/etc/nginx/sites-enabled" ]; then
        ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
    fi
    
    echo "✓ Nginx配置文件已创建"
else
    echo "✓ Nginx配置文件已存在"
fi

# 测试Nginx配置
nginx -t
if [ \$? -eq 0 ]; then
    echo "✓ Nginx配置测试通过"
    systemctl reload nginx
    echo "✓ Nginx配置已重新加载"
else
    echo "错误: Nginx配置测试失败"
    exit 1
fi
EOF

# 健康检查
echo -e "${BLUE}[7/8] 执行部署后健康检查...${NC}"
sleep 3

# 检查网站是否可访问
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_HOST/ || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ 网站健康检查通过 (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${YELLOW}警告: 网站可能无法正常访问 (HTTP $HTTP_STATUS)${NC}"
        echo -e "${YELLOW}请检查域名解析和防火墙设置${NC}"
    fi
else
    echo -e "${YELLOW}警告: 未安装curl，跳过健康检查${NC}"
fi

# 清理本地临时文件
echo -e "${BLUE}[8/8] 清理本地临时文件...${NC}"
rm -f $DEPLOY_PACKAGE
echo -e "${GREEN}✓ 本地临时文件清理完成${NC}"

# 部署完成
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    🎉 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}部署信息:${NC}"
echo -e "${YELLOW}  服务器: $SERVER_HOST${NC}"
echo -e "${YELLOW}  路径: $SERVER_PATH${NC}"
echo -e "${YELLOW}  访问地址: http://$SERVER_HOST${NC}"
echo ""
echo -e "${YELLOW}后续操作建议:${NC}"
echo -e "${YELLOW}1. 配置域名解析${NC}"
echo -e "${YELLOW}2. 配置SSL证书${NC}"
echo -e "${YELLOW}3. 设置防火墙规则${NC}"
echo -e "${YELLOW}4. 配置监控和日志${NC}"
echo ""
