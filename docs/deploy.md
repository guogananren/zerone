# Zerone Docker 部署说明

本文档说明如何使用 Docker 与 Docker Compose 部署 Zerone（前端 + BFF + 网关）。

## 前置条件

- 已安装 [Docker](https://docs.docker.com/get-docker/) 与 [Docker Compose](https://docs.docker.com/compose/install/)
- 已获取阿里云百炼 API Key：[百炼控制台](https://dashscope.console.aliyun.com/)

## 架构说明

| 服务     | 说明                     | 对外端口 |
|----------|--------------------------|----------|
| gateway  | Nginx 反向代理，统一入口 | 80       |
| frontend | 前端静态资源（Vue SPA）  | 仅内网   |
| bff      | Express BFF，提供 `/api` | 仅内网   |

访问 `http://localhost` 时，`/` 由 frontend 提供，`/api/*` 由 gateway 转发到 bff。

## 环境变量

在运行前设置 BFF 所需的 API Key（不要写进镜像或提交到仓库）：

```bash
export DASHSCOPE_API_KEY=sk-你的密钥
```

或创建 `.env` 文件（已被 `.gitignore` 忽略，仅本地使用）：

```bash
# .env（不要提交）
DASHSCOPE_API_KEY=sk-你的密钥
```

Docker Compose 会自动读取同目录下的 `.env` 并注入到 bff 服务。

## 构建与运行

### 使用部署脚本（推荐）

项目根目录提供了 `deploy.sh`，封装常用命令：

```bash
./deploy.sh start   # 构建并启动（需已设置 DASHSCOPE_API_KEY 或存在 .env）
./deploy.sh stop    # 停止并移除容器
./deploy.sh status  # 查看服务状态
./deploy.sh logs    # 查看全部日志；./deploy.sh logs bff 只看 BFF
./deploy.sh build   # 仅构建镜像
```

### 一键启动（手动）

在项目根目录执行：

```bash
# 设置 API Key 后启动
export DASHSCOPE_API_KEY=sk-xxx
docker compose up -d --build
```

若使用项目根目录的 `.env` 文件，可直接：

```bash
docker compose up -d --build
```

### 分步执行

```bash
# 1. 构建镜像
docker compose build

# 2. 启动所有服务（前台，看日志）
docker compose up

# 或后台运行
docker compose up -d
```

### 访问

- 浏览器打开：**http://localhost**
- BFF 健康检查：http://localhost/api/health（应返回 `{"status":"ok"}`）

## 常用命令

```bash
# 查看运行状态
docker compose ps

# 查看日志（全部）
docker compose logs -f

# 只看 BFF 日志
docker compose logs -f bff

# 停止并删除容器
docker compose down

# 停止并删除容器与镜像
docker compose down --rmi local
```

## 仅构建/运行单个服务

```bash
# 只构建前端
docker compose build frontend

# 只构建 BFF
docker compose build bff

# 只启动 BFF（依赖 frontend 会一并启动）
docker compose up -d bff
# 网关依赖 frontend 与 bff，若要完整访问需启动 gateway
docker compose up -d
```

## 健康检查

- **BFF**：容器内每 30 秒请求 `GET http://localhost:3001/api/health`，失败重试 3 次；gateway 在 bff 健康后才转发 `/api` 请求。
- **手动检查**：`curl http://localhost/api/health` 或 `curl http://localhost:3001/api/health`（若单独暴露 BFF 端口）。

## 排错

1. **页面能打开但对话失败**  
   - 检查是否已设置 `DASHSCOPE_API_KEY`：`docker compose exec bff env | grep DASHSCOPE`  
   - 查看 BFF 日志：`docker compose logs bff`

2. **502 Bad Gateway**  
   - 确认 bff 已健康：`docker compose ps`，或 `curl http://localhost/api/health`  
   - 若 bff 未就绪，稍等几秒或查看 bff 日志

3. **构建失败**  
   - 确认 Node 版本满足 `package.json` 的 engines（如 Node 20+）  
   - 前端构建需网络拉取依赖，确保可访问 npm 镜像

## 后续接网关

当前使用 Nginx 作为网关；若计划接入 K8s Ingress 或云厂商 API 网关，可：

- 保留 **frontend**、**bff** 两个镜像及部署方式；
- 将 **gateway** 替换为 Ingress/网关配置：`/` → frontend 服务，`/api` → bff 服务；
- BFF 仍通过环境变量或 Secret 注入 `DASHSCOPE_API_KEY`，健康检查继续使用 `GET /api/health`。
