#!/bin/bash

# continew-admin-ui 版本回滚脚本
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
echo -e "${BLUE}    continew-admin-ui 版本回滚${NC}"
echo -e "${BLUE}========================================${NC}"

# 显示可用的备份版本
echo -e "${BLUE}获取可用的备份版本...${NC}"
ssh $SERVER_USER@$SERVER_HOST << EOF
if [ -d "$BACKUP_DIR" ]; then
    echo "可用的备份版本:"
    ls -la $BACKUP_DIR | grep backup- | awk '{print NR". " \$9 " (" \$6 " " \$7 " " \$8 ")"}'
else
    echo "错误: 备份目录不存在"
    exit 1
fi
EOF

# 让用户选择要回滚的版本
echo ""
read -p "请输入要回滚的版本号 (输入数字): " VERSION_NUM

if ! [[ "$VERSION_NUM" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}错误: 请输入有效的数字${NC}"
    exit 1
fi

# 执行回滚
echo -e "${BLUE}开始回滚到选定版本...${NC}"
ssh $SERVER_USER@$SERVER_HOST << EOF
set -e

cd $BACKUP_DIR
BACKUP_NAME=\$(ls -t | grep backup- | sed -n "${VERSION_NUM}p")

if [ -z "\$BACKUP_NAME" ]; then
    echo "错误: 无效的版本号"
    exit 1
fi

echo "回滚到版本: \$BACKUP_NAME"

# 备份当前版本
CURRENT_BACKUP="backup-current-\$(date +%Y%m%d-%H%M%S)"
cp -r $SERVER_PATH $BACKUP_DIR/\$CURRENT_BACKUP
echo "✓ 当前版本已备份为: \$CURRENT_BACKUP"

# 执行回滚
rm -rf $SERVER_PATH/*
cp -r $BACKUP_DIR/\$BACKUP_NAME/* $SERVER_PATH/

# 设置权限
chown -R www-data:www-data $SERVER_PATH
chmod -R 755 $SERVER_PATH

echo "✓ 版本回滚完成"

# 重启服务
systemctl reload nginx
echo "✓ Nginx已重新加载"
EOF

echo -e "${GREEN}✓ 版本回滚完成${NC}"
echo -e "${YELLOW}请验证网站是否正常运行${NC}"
