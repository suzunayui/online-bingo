#!/bin/bash

# オンラインビンゴアプリ自動セットアップスクリプト（Docker版）
# Ubuntu 24.04 LTS 対応

set -e

echo "🎉 オンラインビンゴアプリ（Docker版）のセットアップを開始します..."

# 色付きログ関数
log_info() { echo -e "\033[36mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[31m❌ $1\033[0m"; }

# 管理者権限チェック
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        log_warning "このスクリプトは管理者権限で実行してください"
        echo "sudo ./setup.sh として実行してください"
        exit 1
    fi
}

# ドメイン名設定
setup_domain() {
    log_info "ドメイン名を設定してください（例: bingo.example.com）"
    read -p "ドメイン名（IPアドレスでテストする場合は 'localhost' と入力）: " DOMAIN
    
    if [[ -z "$DOMAIN" ]]; then
        DOMAIN="localhost"
    fi
    
    log_info "設定されたドメイン: $DOMAIN"
    
    # 環境変数ファイルに保存
    echo "DOMAIN=$DOMAIN" > .env
}

# システム更新
update_system() {
    log_info "システムを更新中..."
    apt update && apt upgrade -y
    log_success "システム更新完了"
}

# Node.js インストール（削除：Dockerで不要）
# install_nodejs() {
#     log_info "Node.js をインストール中..."
#     curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
#     apt-get install -y nodejs
#     log_success "Node.js $(node --version) インストール完了"
# }

# Docker & Docker Compose インストール
install_docker() {
    log_info "Docker をインストール中..."
    
    # 古いDockerバージョンを削除
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # 必要なパッケージをインストール
    apt-get update
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # DockerのGPGキーを追加
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Dockerリポジトリを追加
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Dockerをインストール
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Dockerサービスを開始
    systemctl start docker
    systemctl enable docker
    
    # 現在のユーザーをdockerグループに追加
    usermod -aG docker $SUDO_USER
    
    log_success "Docker $(docker --version) インストール完了"
}

# Caddy インストール（削除：Dockerで管理）
# install_caddy() {
#     log_info "Caddy をインストール中..."
#     apt install -y debian-keyring debian-archive-keyring apt-transport-https
#     curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
#     curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
#     apt update
#     apt install -y caddy
#     log_success "Caddy インストール完了"
# }

# PM2 インストール（削除：Dockerで不要）
# install_pm2() {
#     log_info "PM2 をインストール中..."
#     npm install -g pm2
#     log_success "PM2 インストール完了"
# }

# ファイアウォール設定
setup_firewall() {
    log_info "ファイアウォールを設定中..."
    ufw --force enable
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw allow 3000  # Dockerコンテナ用
    log_success "ファイアウォール設定完了"
}

# バックエンドディレクトリ作成（削除：既に存在）
# create_backend() {
#     log_info "バックエンドを作成中..."
#     
#     # backend ディレクトリ作成
#     mkdir -p backend
#     cd backend
#     
#     # package.json 作成
#     cat > package.json << EOF
# {
#   "name": "online-bingo-backend",
#   "version": "1.0.0",
#   "description": "オンラインビンゴバックエンド",
#   "main": "server.js",
#   "scripts": {
#     "start": "node server.js",
#     "dev": "node server.js"
#   },
#   "dependencies": {
#     "express": "^4.18.2",
#     "socket.io": "^4.7.5",
#     "cors": "^2.8.5",
#     "uuid": "^9.0.1"
#   }
# }
# EOF
# 
#     # 依存関係インストール
#     npm install
#     
#     cd ..
#     log_success "バックエンド準備完了"
# }

# Caddyfile 作成（削除：Docker Composeで管理）
# create_caddyfile() {
#     log_info "Caddyfile を作成中..."
#     
#     if [[ "$DOMAIN" == "localhost" ]]; then
#         # ローカルテスト用設定
#         cat > Caddyfile << EOF
# :80 {
#     root * /home/\$USER/online-bingo/frontend
#     file_server
#     
#     # API とソケット通信をバックエンドに転送
#     reverse_proxy /socket.io/* localhost:3000
#     reverse_proxy /api/* localhost:3000
# }
# EOF
#     else
#         # 本番用設定（HTTPS自動取得）
#         cat > Caddyfile << EOF
# $DOMAIN {
#     root * /home/\$USER/online-bingo/frontend
#     file_server
#     
#     # API とソケット通信をバックエンドに転送
#     reverse_proxy /socket.io/* localhost:3000
#     reverse_proxy /api/* localhost:3000
# }
# EOF
#     fi
#     
#     # Caddyfile を正しい場所にコピー
#     cp Caddyfile /etc/caddy/Caddyfile
#     
#     log_success "Caddyfile 作成完了"
# }

# PM2 設定ファイル作成（削除：Docker Composeで管理）
# create_pm2_config() {
#     log_info "PM2設定を作成中..."
#     
#     cat > ecosystem.config.js << EOF
# module.exports = {
#   apps: [{
#     name: 'online-bingo',
#     script: './backend/server.js',
#     instances: 1,
#     autorestart: true,
#     watch: false,
#     max_memory_restart: '1G',
#     env: {
#       NODE_ENV: 'production',
#       PORT: 3000
#     }
#   }]
# };
# EOF
#     
#     log_success "PM2設定作成完了"
# }

# Docker Composeでサービス起動
start_services() {
    log_info "Dockerコンテナを起動中..."
    
    # バックエンドのpackage.jsonが存在するかチェック
    if [[ ! -f "backend/package.json" ]]; then
        log_error "backend/package.json が見つかりません"
        exit 1
    fi
    
    # Docker Composeでサービス起動
    DOMAIN=$DOMAIN docker-compose up -d --build
    
    # サービスが起動するまで待機
    log_info "サービス起動を待機中..."
    sleep 10
    
    # ヘルスチェック
    for i in {1..30}; do
        if docker-compose ps | grep -q "Up (healthy)"; then
            log_success "すべてのサービスが正常に起動しました"
            break
        elif [[ $i -eq 30 ]]; then
            log_warning "サービスの起動に時間がかかっています。ログを確認してください。"
            log_info "ログ確認コマンド: docker-compose logs"
        else
            echo -n "."
            sleep 2
        fi
    done
}

# 完了メッセージ
show_completion() {
    log_success "🎉 セットアップ完了！"
    echo ""
    echo "📡 アクセス情報:"
    if [[ "$DOMAIN" == "localhost" ]]; then
        echo "   🌐 http://localhost"
        echo "   🌐 http://$(hostname -I | awk '{print $1}')"
    else
        echo "   🌐 https://$DOMAIN"
    fi
    echo ""
    echo "� Docker管理コマンド:"
    echo "   docker-compose ps           - コンテナ状態確認"
    echo "   docker-compose logs         - ログ確認"
    echo "   docker-compose restart      - コンテナ再起動"
    echo "   docker-compose down         - コンテナ停止"
    echo "   docker-compose up -d        - コンテナ起動"
    echo ""
    echo "🔧 その他のコマンド:"
    echo "   docker-compose logs backend - バックエンドログ"
    echo "   docker-compose logs caddy   - Caddyログ"
    echo "   docker system prune         - 未使用リソース削除"
    echo ""
    echo "🎮 ビンゴを楽しんでください！"
}

# メイン実行
main() {
    check_sudo
    setup_domain
    update_system
    install_docker
    setup_firewall
    start_services
    show_completion
}

main "$@"
