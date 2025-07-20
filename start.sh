#!/bin/bash

# オンラインビンゴ クイックスタートスクリプト

set -e

echo "🎉 オンラインビンゴ クイックスタート"
echo ""

# 実行権限チェック
if [[ ! -x "manage.sh" ]]; then
    echo "📝 スクリプトに実行権限を付与中..."
    chmod +x manage.sh setup.sh
fi

echo "🤔 どの環境で起動しますか？"
echo ""
echo "1) 本番環境（Docker + Caddy）"
echo "2) 開発環境（Docker + ポート8080）"
echo "3) ローカル開発（Node.js直接実行）"
echo "4) ヘルプを表示"
echo ""
read -p "選択してください [1-4]: " choice

case $choice in
    1)
        echo "🚀 本番環境で起動中..."
        ./manage.sh start
        ;;
    2)
        echo "🛠️  開発環境で起動中..."
        ./manage.sh dev
        ;;
    3)
        echo "💻 ローカル開発環境で起動中..."
        echo "フロントエンド: frontend/index.html を直接ブラウザで開いてください"
        echo "バックエンド: backend ディレクトリで npm start を実行してください"
        cd backend
        if [[ ! -d "node_modules" ]]; then
            echo "📦 依存関係をインストール中..."
            npm install
        fi
        echo "🚀 バックエンドサーバーを起動中..."
        npm start
        ;;
    4)
        ./manage.sh help
        ;;
    *)
        echo "❌ 無効な選択です"
        exit 1
        ;;
esac
