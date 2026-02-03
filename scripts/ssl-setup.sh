#!/bin/bash

# SSL证书配置脚本（使用Let's Encrypt）
# 作者: 自动生成

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 读取配置
if [ -f "deploy-config.env" ]; then
    source deploy-config.env
else
    echo -e "${RED}错误: 未找到deploy-config.env配置文件${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    SSL证书自动配置脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 在服务器上安装和配置SSL证书
ssh $SERVER_USER@$SERVER_HOST << EOF
set -e

echo "开始SSL证书配置..."

# 安装certbot
if ! command -v certbot &> /dev/null; then
    echo "安装certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# 获取SSL证书
certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $MONITORING_EMAIL

# 设置自动续期
if ! crontab -l | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    echo "✓ SSL证书自动续期已配置"
fi

# 重启Nginx
systemctl restart nginx

echo "✓ SSL证书配置完成"
EOF

echo -e "${GREEN}✓ SSL证书配置完成${NC}"
echo -e "${YELLOW}网站现在可以通过 https://$DOMAIN_NAME 访问${NC}"
