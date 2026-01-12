#!/bin/bash

# PTA答题助手 - 后端服务启动脚本
# 快速启动腾讯云hunyuan代理服务

set -e

echo "========================================"
echo "  PTA答题助手 - 后端服务启动"
echo "========================================"

# 检查并使用nvm
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    echo "📦 使用nvm管理Node.js版本..."
    source "$HOME/.nvm/nvm.sh"
    
    # 切换到Node.js v22
    if nvm ls 22 &>/dev/null; then
        echo "✅ 切换到Node.js v22..."
        nvm use 22
    else
        echo "⚠️  Node.js v22未安装，尝试使用当前版本..."
    fi
    
    NODE_VERSION=$(node --version)
    echo "当前Node.js版本: $NODE_VERSION"
else
    echo "⚠️  未找到nvm，使用系统Node.js版本"
fi

# 进入 Node 兼容代理目录
cd "$(dirname "$0")/../apps/backend-node-compat"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，安装依赖..."
    npm install
else
    echo "✅ 依赖已安装"
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: .env文件不存在，复制.env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 请编辑 apps/backend-node-compat/.env 文件并填入您的腾讯云API密钥"
    else
        echo "❌ 错误: .env.example文件也不存在"
        exit 1
    fi
fi

# 启动服务
echo ""
echo "========================================"
echo "  🚀 启动后端服务..."
echo "========================================"
echo ""
echo "服务将在 http://localhost:3002 运行（Node 兼容代理）"
echo "健康检查: http://localhost:3002/health"
echo "聊天API: http://localhost:3002/api/chat"
echo "（它会转发到 Java 后端默认 http://localhost:3001/api/chat）"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 启动开发模式（自动重启）
npm run dev
