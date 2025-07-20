#!/bin/bash

# オンラインビンゴ Docker管理スクリプト
# Makefileの代替として使用

set -e

# 色付きログ関数
log_info() { echo -e "\033[36mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[31m❌ $1\033[0m"; }

# ヘルプ表示
show_help() {
    echo "🎉 オンラインビンゴ Docker管理コマンド"
    echo ""
    echo "📚 使用方法: ./manage.sh [コマンド]"
    echo ""
    echo "📋 使用可能なコマンド:"
    echo "  help      - このヘルプを表示"
    echo "  build     - Dockerイメージをビルド"
    echo "  start     - 本番環境でコンテナ起動"
    echo "  dev       - 開発環境でコンテナ起動"
    echo "  stop      - コンテナ停止・削除"
    echo "  restart   - コンテナ再起動"
    echo "  logs      - ログ表示"
    echo "  status    - コンテナ状態確認"
    echo "  clean     - 未使用リソース削除"
    echo "  shell     - バックエンドコンテナに接続"
    echo "  health    - ヘルスチェック実行"
    echo "  rebuild   - 完全リビルド"
    echo ""
    echo "📝 例:"
    echo "  ./manage.sh start   # 本番環境起動"
    echo "  ./manage.sh dev     # 開発環境起動"
    echo "  ./manage.sh logs    # ログ確認"
}

# Dockerイメージビルド
build_images() {
    log_info "🔨 Dockerイメージをビルド中..."
    docker compose build --no-cache
    log_success "ビルド完了"
}

# 本番環境起動
start_prod() {
    log_info "🚀 本番環境でコンテナを起動中..."
    build_images
    docker compose up -d
    log_success "本番環境起動完了"
    
    # 起動確認
    sleep 5
    check_health
}

# 開発環境起動
start_dev() {
    log_info "🛠️  開発環境でコンテナを起動中..."
    docker compose -f docker-compose.dev.yml up -d
    log_success "開発環境起動完了"
    log_info "アクセス: http://localhost:8080"
}

# コンテナ停止・削除
stop_containers() {
    log_info "🛑 コンテナを停止中..."
    docker compose down 2>/dev/null || true
    docker compose -f docker-compose.dev.yml down 2>/dev/null || true
    log_success "コンテナ停止完了"
}

# コンテナ再起動
restart_containers() {
    log_info "🔄 コンテナを再起動中..."
    docker compose restart
    log_success "再起動完了"
}

# ログ表示
show_logs() {
    log_info "📋 ログを表示中... (Ctrl+Cで終了)"
    docker compose logs -f
}

# バックエンドログのみ表示
show_backend_logs() {
    log_info "📋 バックエンドログを表示中... (Ctrl+Cで終了)"
    docker compose logs -f bingo-backend
}

# Caddyログのみ表示
show_caddy_logs() {
    log_info "📋 Caddyログを表示中... (Ctrl+Cで終了)"
    docker compose logs -f caddy
}

# コンテナ状態確認
check_status() {
    log_info "📊 コンテナ状態:"
    docker compose ps
}

# 未使用リソース削除
clean_resources() {
    log_info "🧹 未使用Dockerリソースを削除中..."
    docker system prune -f
    docker volume prune -f
    log_success "クリーンアップ完了"
}

# バックエンドコンテナに接続
connect_shell() {
    log_info "🐚 バックエンドコンテナに接続中..."
    docker compose exec bingo-backend sh
}

# ヘルスチェック
check_health() {
    log_info "🏥 ヘルスチェック実行中..."
    
    # 少し待ってからチェック
    sleep 2
    
    if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
        log_success "ヘルスチェック成功 ✅"
    else
        log_warning "ヘルスチェック失敗 - サービスが起動中の可能性があります"
        log_info "数秒待ってから再度確認してください"
    fi
}

# 完全リビルド
rebuild_all() {
    log_info "🔄 完全リビルドを開始中..."
    stop_containers
    clean_resources
    build_images
    start_prod
    log_success "完全リビルド完了"
}

# 依存関係更新
update_deps() {
    log_info "📦 依存関係を更新中..."
    docker compose exec bingo-backend npm update
    log_success "依存関係更新完了"
}

# メイン処理
main() {
    case "${1:-help}" in
        "help"|"-h"|"--help")
            show_help
            ;;
        "build")
            build_images
            ;;
        "start"|"up")
            start_prod
            ;;
        "dev")
            start_dev
            ;;
        "stop"|"down")
            stop_containers
            ;;
        "restart")
            restart_containers
            ;;
        "logs")
            case "${2}" in
                "backend")
                    show_backend_logs
                    ;;
                "caddy")
                    show_caddy_logs
                    ;;
                *)
                    show_logs
                    ;;
            esac
            ;;
        "status"|"ps")
            check_status
            ;;
        "clean")
            clean_resources
            ;;
        "shell"|"bash")
            connect_shell
            ;;
        "health")
            check_health
            ;;
        "rebuild")
            rebuild_all
            ;;
        "update")
            update_deps
            ;;
        *)
            log_error "不明なコマンド: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"
