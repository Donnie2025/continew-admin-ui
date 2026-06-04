#!/bin/bash

# ContiNew Admin UI 构建并发布到生产服务器（tx）
# 本地构建，rsync 同步 dist 到 tx:/www/wwwroot/continew-admin-ui/dist
#
# 用法：
#   ./deploy-dist.sh               构建 + 同步
#   ./deploy-dist.sh --skip-build  跳过构建，直接同步已有 dist
#   ./deploy-dist.sh -s            同上

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_DIR/dist"

REMOTE_HOST="tx"
REMOTE_PATH="/www/wwwroot/continew-admin-ui/dist"

# ==================== 处理入参 ====================
SKIP_BUILD=0
for arg in "$@"; do
    case "$arg" in
        --skip-build|-s) SKIP_BUILD=1 ;;
    esac
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    Admin UI 构建 & 发布脚本（tx）${NC}"
echo -e "${GREEN}========================================${NC}"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${RED}错误: 找不到 package.json${NC}"
    exit 1
fi

# ==================== 构建 ====================
if [ "$SKIP_BUILD" -eq 0 ]; then
    echo -e "\n${BLUE}[1/2] 本地构建生产版本...${NC}"
    cd "$PROJECT_DIR"
    pnpm build || { echo -e "${RED}✗ 构建失败${NC}"; exit 1; }
else
    echo -e "\n${YELLOW}[1/2] 跳过构建，直接使用已有 dist。${NC}"
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
    echo -e "${RED}✗ dist/index.html 不存在，请先构建${NC}"
    exit 1
fi

ENTRY_JS=$(grep -o 'index-[A-Za-z0-9_-]*\.js' "$DIST_DIR/index.html" | head -1)
echo -e "${GREEN}✓ 构建就绪，入口文件: ${ENTRY_JS}${NC}"

# ==================== 同步到服务器 ====================
echo -e "\n${BLUE}[2/2] 同步 dist 到 ${REMOTE_HOST}:${REMOTE_PATH} ...${NC}"

rsync -az --delete --checksum --exclude='.user.ini' \
    "$DIST_DIR/" "${REMOTE_HOST}:${REMOTE_PATH}/" \
    && echo -e "${GREEN}✓ 同步完成${NC}" \
    || { echo -e "${RED}✗ 同步失败${NC}"; exit 1; }

# ==================== 验证 ====================
REMOTE_ENTRY=$(ssh "$REMOTE_HOST" "grep -o 'index-[a-f0-9]*\.js' ${REMOTE_PATH}/index.html 2>/dev/null | head -1")
echo -e "\n  本地: ${ENTRY_JS}"
echo -e "  远端: ${REMOTE_ENTRY}"

if [ "$REMOTE_ENTRY" = "$ENTRY_JS" ]; then
    echo -e "${GREEN}✓ 版本一致${NC}"
else
    echo -e "${RED}✗ 版本不一致，请检查！${NC}"
    exit 1
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}    发布完成！${NC}"
echo -e "${GREEN}========================================${NC}"
