# Node.js 20 LTS Alpine版を使用（軽量）
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー（レイヤーキャッシュ最適化）
COPY package*.json ./

# 依存関係をインストール
RUN npm install --omit=dev

# アプリケーションコードをコピー
COPY . .

# 非rootユーザーを作成してセキュリティ向上
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# アプリケーションファイルの所有者を変更
RUN chown -R nodejs:nodejs /app
USER nodejs

# ポート3000を公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# アプリケーション起動
CMD ["node", "server.js"]
