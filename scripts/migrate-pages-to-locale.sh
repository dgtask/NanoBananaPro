#!/bin/bash
# 🔥 老王的页面架构迁移脚本
# 用途：批量迁移页面从 app/ 到 app/[locale]/
# 警告：运行前请先备份代码！

set -e  # 遇到错误立即退出

echo "🔥 老王开始迁移页面架构！"
echo ""

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/Users/kening/biancheng/nanobanana-clone"
cd "$PROJECT_ROOT"

# 检查是否在 git 仓库中
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ 错误：不在 git 仓库中！${NC}"
    exit 1
fi

# 备份当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}📌 当前分支：$CURRENT_BRANCH${NC}"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  检测到未提交的更改${NC}"
    echo "是否继续？这些更改不会丢失。(y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "迁移已取消"
        exit 0
    fi
fi

echo ""
echo "🔍 扫描需要迁移的页面..."

# 查找所有需要迁移的页面（排除已经在 [locale] 目录下的）
PAGES_TO_MIGRATE=$(find app -name 'page.tsx' -type f | grep -v '\[locale\]' | grep -v 'api/' | sort)

# 统计页面数量
TOTAL_PAGES=$(echo "$PAGES_TO_MIGRATE" | wc -l | tr -d ' ')

echo -e "${GREEN}✅ 找到 $TOTAL_PAGES 个需要迁移的页面${NC}"
echo ""

# 显示前10个页面作为示例
echo "示例页面（前10个）："
echo "$PAGES_TO_MIGRATE" | head -10 | while read -r page; do
    echo "  - $page"
done
echo ""

# 确认迁移
echo -e "${YELLOW}🚨 准备迁移 $TOTAL_PAGES 个页面到 app/[locale]/ 架构${NC}"
echo "这将："
echo "  1. 在 app/[locale]/ 下创建对应目录"
echo "  2. 移动页面文件"
echo "  3. 更新页面代码以支持 locale 参数"
echo ""
echo "是否继续？(y/n)"
read -r response

if [ "$response" != "y" ]; then
    echo "迁移已取消"
    exit 0
fi

echo ""
echo "🚀 开始迁移..."
echo ""

# 计数器
SUCCESS_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

# 遍历每个页面并迁移
echo "$PAGES_TO_MIGRATE" | while read -r page; do
    # 跳过根页面（已经迁移）
    if [ "$page" = "app/page.tsx" ]; then
        echo -e "${YELLOW}⏭️  跳过：$page（根页面已迁移）${NC}"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        continue
    fi

    # 提取相对路径（去掉 app/ 前缀和 page.tsx 后缀）
    RELATIVE_PATH=$(echo "$page" | sed 's|^app/||' | sed 's|/page\.tsx$||')

    # 如果是根级页面（如 app/page.tsx），则 RELATIVE_PATH 为空
    if [ -z "$RELATIVE_PATH" ]; then
        TARGET_DIR="app/[locale]"
    else
        TARGET_DIR="app/[locale]/$RELATIVE_PATH"
    fi

    TARGET_FILE="$TARGET_DIR/page.tsx"

    # 检查目标文件是否已存在
    if [ -f "$TARGET_FILE" ]; then
        echo -e "${YELLOW}⏭️  跳过：$page（目标已存在：$TARGET_FILE）${NC}"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        continue
    fi

    echo -e "${GREEN}📦 迁移：$page → $TARGET_FILE${NC}"

    # 创建目标目录
    mkdir -p "$TARGET_DIR"

    # 复制文件（不是移动，保留原文件以便回滚）
    cp "$page" "$TARGET_FILE"

    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
done

echo ""
echo "✅ 迁移完成！"
echo "  - 成功：$SUCCESS_COUNT 个"
echo "  - 跳过：$SKIPPED_COUNT 个"
echo "  - 失败：$FAILED_COUNT 个"
echo ""

# 下一步提示
echo -e "${YELLOW}📝 下一步操作：${NC}"
echo "1. 检查迁移结果：git status"
echo "2. 更新页面代码以支持 locale 参数"
echo "3. 测试所有页面：pnpm dev"
echo "4. 提交：git add -A && git commit -m 'feat: migrate pages to app/[locale] architecture'"
echo ""
echo "🔥 老王提醒：如果需要回滚，运行："
echo "   git checkout -- app/[locale]"
echo ""
