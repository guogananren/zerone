#!/usr/bin/env bash
# Zerone Docker 部署脚本
# 用法: ./deploy.sh <命令> [参数]
# 命令: start | stop | status | logs | build

set -e
cd "$(dirname "$0")"

cmd="${1:-start}"
shift || true

case "$cmd" in
  start)
    if [ -z "$DASHSCOPE_API_KEY" ] && [ ! -f .env ]; then
      echo "错误: 请设置 DASHSCOPE_API_KEY 或创建 .env 文件（参考 .env.example）" >&2
      exit 1
    fi
    docker compose up -d --build
    echo ""
    echo "启动完成。访问 http://localhost"
    ;;
  stop)
    docker compose down
    echo "已停止并移除容器"
    ;;
  status)
    docker compose ps
    ;;
  logs)
    docker compose logs -f "$@"
    ;;
  build)
    docker compose build "$@"
    echo "构建完成。执行 ./deploy.sh start 启动"
    ;;
  *)
    echo "用法: $0 {start|stop|status|logs|build} [选项...]" >&2
    echo "  start  - 构建并启动（需 DASHSCOPE_API_KEY 或 .env）" >&2
    echo "  stop   - 停止并移除容器" >&2
    echo "  status - 查看服务状态" >&2
    echo "  logs   - 查看日志（可加服务名如 bff、frontend、gateway）" >&2
    echo "  build  - 仅构建镜像" >&2
    exit 1
    ;;
esac
