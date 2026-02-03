#!/bin/bash

# continew-admin-ui 生产环境打包脚本
# 作者: 自动生成
# 日期: $(date +%Y-%m-%d)

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="continew-admin-ui"
BUILD_TIME=$(date +"%Y-%m-%d %H:%M:%S")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    $PROJECT_NAME 生产环境打包脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}构建时间: $BUILD_TIME${NC}"
echo -e "${YELLOW}Git分支: $GIT_BRANCH${NC}"
echo -e "${YELLOW}Git提交: $GIT_COMMIT${NC}"
echo ""

# 检查Node.js版本
echo -e "${BLUE}[1/7] 检查Node.js环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到Node.js，请先安装Node.js${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js版本: $NODE_VERSION${NC}"

# 检查pnpm
echo -e "${BLUE}[2/7] 检查pnpm包管理器...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}警告: 未找到pnpm，尝试安装...${NC}"
    npm install -g pnpm
fi

PNPM_VERSION=$(pnpm -v)
echo -e "${GREEN}✓ pnpm版本: $PNPM_VERSION${NC}"

# 清理旧的构建文件
echo -e "${BLUE}[3/7] 清理旧的构建文件...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✓ 已清理dist目录${NC}"
fi

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}清理node_modules目录...${NC}"
    rm -rf node_modules
fi

# 安装依赖
echo -e "${BLUE}[4/7] 安装项目依赖...${NC}"
pnpm install --frozen-lockfile --registry=https://registry.npmmirror.com

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 依赖安装成功${NC}"
else
    echo -e "${RED}错误: 依赖安装失败${NC}"
    exit 1
fi

# 类型检查
echo -e "${BLUE}[5/7] 执行TypeScript类型检查...${NC}"
pnpm run typecheck

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 类型检查通过${NC}"
else
    echo -e "${RED}错误: TypeScript类型检查失败${NC}"
    exit 1
fi

# 代码检查
echo -e "${BLUE}[6/7] 执行代码质量检查...${NC}"
pnpm run lint

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 代码质量检查通过${NC}"
else
    echo -e "${YELLOW}警告: 代码质量检查有问题，尝试自动修复...${NC}"
    pnpm run lint:fix
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: 代码质量问题无法自动修复${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ 代码质量问题已自动修复${NC}"
fi

# 生产环境构建
echo -e "${BLUE}[7/7] 开始生产环境构建...${NC}"
echo -e "${YELLOW}使用生产环境配置进行构建...${NC}"

# 设置生产环境变量
export NODE_ENV=production

# 执行构建
pnpm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 生产环境构建成功${NC}"
else
    echo -e "${RED}错误: 生产环境构建失败${NC}"
    exit 1
fi

# 构建信息统计
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}           构建完成统计信息${NC}"
echo -e "${BLUE}========================================${NC}"

if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    FILE_COUNT=$(find dist -type f | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ 构建输出目录: dist/${NC}"
    echo -e "${GREEN}✓ 构建文件大小: $DIST_SIZE${NC}"
    echo -e "${GREEN}✓ 构建文件数量: $FILE_COUNT${NC}"
    
    # 显示主要文件
    echo -e "${YELLOW}主要构建文件:${NC}"
    find dist -name "*.js" -o -name "*.css" -o -name "*.html" | head -10 | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo -e "  ${file} (${size})"
    done
else
    echo -e "${RED}错误: 构建输出目录不存在${NC}"
    exit 1
fi

# 生成构建信息文件
echo -e "${BLUE}生成构建信息文件...${NC}"
cat > dist/build-info.json << EOF
{
  "projectName": "$PROJECT_NAME",
  "buildTime": "$BUILD_TIME",
  "gitBranch": "$GIT_BRANCH",
  "gitCommit": "$GIT_COMMIT",
  "nodeVersion": "$NODE_VERSION",
  "pnpmVersion": "$PNPM_VERSION",
  "buildSize": "$DIST_SIZE",
  "fileCount": $FILE_COUNT
}
EOF

echo -e "${GREEN}✓ 构建信息已保存到 dist/build-info.json${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    🎉 生产环境打包完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}构建输出: $(pwd)/dist${NC}"
echo -e "${YELLOW}下一步: 运行 ./scripts/deploy.sh 进行部署${NC}"
echo ""
