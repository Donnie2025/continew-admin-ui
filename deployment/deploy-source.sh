#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="continew-admin-ui"
SERVER_ALIAS="tx"
SERVER_DEPLOY_PATH="/www/wwwroot/${PROJECT_NAME}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
PACKAGE_NAME="${PROJECT_NAME}-source-${TIMESTAMP}.tar.gz"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    Node.js 项目源码部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 清理历史包
echo -e "${BLUE}[1/4] 清理历史打包文件...${NC}"
if [ -d "package" ]; then
    rm -rf package/*
    echo -e "${GREEN}✓ 已清理 package/ 目录${NC}"
else
    mkdir -p package
    echo -e "${GREEN}✓ 已创建 package/ 目录${NC}"
fi

# 创建源码包（排除不需要的文件）
echo -e "${BLUE}[2/4] 创建源码打包文件...${NC}"
tar -czf $PACKAGE_NAME \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    --exclude=.DS_Store \
    --exclude=package \
    --exclude=*.log \
    --exclude=coverage \
    --exclude=.nyc_output \
    --exclude=.vscode \
    --exclude=.idea \
    --exclude=deployment \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 源码包创建成功: ${PACKAGE_NAME}${NC}"
else
    echo -e "${RED}✗ 源码包创建失败${NC}"
    exit 1
fi

# 移动到部署文件夹
echo -e "${BLUE}[3/4] 移动打包文件到部署目录...${NC}"
mv $PACKAGE_NAME package/
echo -e "${GREEN}✓ 打包文件已移动到 package/ 目录${NC}"

# 上传到服务器
echo -e "${BLUE}[4/4] 上传源码包到服务器...${NC}"
cd package
scp $PACKAGE_NAME ${SERVER_ALIAS}:/tmp/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 源码包上传成功${NC}"
else
    echo -e "${RED}✗ 源码包上传失败${NC}"
    exit 1
fi

# 在服务器上解压源码
echo -e "${BLUE}[5/5] 在服务器上解压源码...${NC}"
ssh ${SERVER_ALIAS} << EOF
    # 创建部署目录
    sudo mkdir -p ${SERVER_DEPLOY_PATH}
    
    # 进入部署目录
    cd ${SERVER_DEPLOY_PATH}
    
    # 清理旧文件（保留.node_modules目录如果存在）
    find . -maxdepth 1 ! -name 'node_modules' ! -name '.' -exec rm -rf {} +
    
    # 解压新源码
    tar -xzf /tmp/${PACKAGE_NAME}
    
    # 设置权限
    sudo chown -R www:www ${SERVER_DEPLOY_PATH}
    sudo chmod -R 755 ${SERVER_DEPLOY_PATH}
    
    # 清理临时文件
    rm /tmp/${PACKAGE_NAME}
    
    echo "✓ 源码解压完成"
    echo "✓ 项目路径: ${SERVER_DEPLOY_PATH}"
    echo "✓ 权限设置完成"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 服务器解压成功${NC}"
else
    echo -e "${RED}✗ 服务器解压失败${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    🎉 源码部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}项目路径: ${SERVER_DEPLOY_PATH}${NC}"
echo -e "${YELLOW}部署时间: $(date)${NC}"
echo ""
echo -e "${BLUE}下一步操作:${NC}"
echo -e "1. 登录服务器: ssh ${SERVER_ALIAS}"
echo -e "2. 进入项目目录: cd ${SERVER_DEPLOY_PATH}"
echo -e "3. 安装依赖: npm install"
echo -e "4. 构建项目: npm run build"
echo -e "5. 配置Nginx指向 dist 目录"
