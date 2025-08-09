#!/bin/bash

echo "🚀 启动 CTG AI PILOT - 爆款短视频内容GENERATOR"
echo "========================"

# 检查是否存在 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖包..."
    npm install
fi

echo "🔧 启动开发服务器..."
npm run dev 