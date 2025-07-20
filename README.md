# 🎉 オンラインビンゴ

リアルタイムマルチプレイヤー対応のオンラインビンゴアプリです！

## ✨ 特徴

- 🌐 **リアルタイムマルチプレイヤー**: Socket.ioによるリアルタイム通信
- 🎨 **カラフルなUI**: パーティー感溢れる楽しいデザイン
- 🏠 **ルーム機能**: プライベートルームでの対戦
- 🎯 **自動ビンゴ判定**: リアルタイムでビンゴを検出
- 📱 **レスポンシブ対応**: スマートフォンでも快適にプレイ
- 🚀 **ワンコマンドデプロイ**: VPSに簡単デプロイ

## 🛠️ 技術スタック

### フロントエンド
- **HTML5/CSS3/JavaScript**: モダンなWeb技術
- **Socket.io Client**: リアルタイム通信
- **レスポンシブデザイン**: 全デバイス対応

### バックエンド
- **Node.js**: サーバーサイドJavaScript
- **Express**: Webフレームワーク
- **Socket.io**: WebSocketベースのリアルタイム通信
- **UUID**: ユニークID生成
- **🐳 Docker**: コンテナ化

### インフラ
- **Caddy**: リバースプロキシ（HTTPS自動取得）
- **Docker Compose**: コンテナオーケストレーション
- **Ubuntu 24.04**: 対応OS

## 🚀 クイックスタート

### VPSでのワンコマンドデプロイ（Docker版）

```bash
# リポジトリをクローン
git clone https://github.com/suzunayui/online-bingo.git
cd online-bingo

# セットアップスクリプトに実行権限を付与
chmod +x setup.sh

# ワンコマンドデプロイ（要sudo）
sudo ./setup.sh
```

### 簡単スタート

```bash
# インタラクティブなスタートスクリプト
./start.sh

# または管理スクリプトで直接起動
./manage.sh start    # 本番環境
./manage.sh dev      # 開発環境
```

### npm scriptsを使用

```bash
# npm経由でも管理可能
npm run start        # 本番環境起動
npm run dev          # 開発環境起動
npm run stop         # コンテナ停止
npm run logs         # ログ確認
npm run status       # 状態確認
```

### ローカル開発環境（従来型）

```bash
# 依存関係インストール
cd backend
npm install

# 開発サーバー起動
npm start

# ブラウザで開く（フロントエンドファイルを直接開く）
open frontend/index.html
```

## 🎮 使い方

### 1. ルーム作成
- 「🏠 ルーム作成」ボタンをクリック
- プレイヤー名を入力
- 生成されたルームIDを参加者に共有

### 2. ルーム参加
- 「🚪 ルーム参加」ボタンをクリック
- ルームIDとプレイヤー名を入力

### 3. ゲーム開始
- 司会者が「🎲 数字を呼ぶ」で数字をランダム選択
- プレイヤーは自分のカードの該当数字をクリック
- ビンゴが完成すると自動で判定・通知

## 🏗️ アーキテクチャ（Docker版）

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   フロントエンド   │◄──►│   Caddy Container │◄──►│   インターネット   │
│   (Static Files)  │    │ (リバースプロキシ)  │    │                │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▼
         │               ┌──────────────────┐
         │               │ Backend Container│
         │               │  (Express.js)    │
         │               └──────────────────┘
         │                        ▼
    ┌─────────────────────────────────────────┐
    │           Socket.io Server             │
    │     (リアルタイム通信・ゲーム状態管理)      │
    └─────────────────────────────────────────┘
```

## 📁 プロジェクト構成

```
online-bingo/
├── 📄 README.md              # このファイル
├── � package.json           # プロジェクト設定・スクリプト
├── �🔧 setup.sh               # 自動セットアップスクリプト
├── � start.sh               # クイックスタートスクリプト
├── ⚙️  manage.sh             # Docker管理スクリプト
├── �🐳 docker-compose.yml     # 本番用Docker Compose
├── 🛠️  docker-compose.dev.yml # 開発用Docker Compose
├── 📄 Caddyfile              # 本番用Caddy設定
├── 📄 Caddyfile.dev          # 開発用Caddy設定
├── 📁 frontend/              # フロントエンド
│   ├── 📄 index.html         # メインHTML
│   ├── 🎨 main.css           # スタイルシート
│   └── ⚡ app.js             # クライアントサイドJS
└── 📁 backend/               # バックエンド
    ├── 📄 package.json       # 依存関係
    ├── 🚀 server.js          # サーバーコード
    ├── 🐳 Dockerfile         # Dockerイメージ定義
    ├── 🏥 healthcheck.js     # ヘルスチェック
    └── 📄 .dockerignore      # Docker除外ファイル
```

## 🔧 管理コマンド

### シェルスクリプト（推奨）
```bash
./manage.sh help      # ヘルプ表示
./manage.sh start     # 本番環境起動
./manage.sh dev       # 開発環境起動
./manage.sh stop      # コンテナ停止
./manage.sh logs      # ログ確認
./manage.sh status    # ステータス確認
./manage.sh clean     # 未使用リソース削除
./manage.sh shell     # バックエンドコンテナに接続
./manage.sh health    # ヘルスチェック
./manage.sh rebuild   # 完全リビルド
```

### npm scripts
```bash
npm run help          # ヘルプ表示
npm run start         # 本番環境起動
npm run dev           # 開発環境起動
npm run stop          # コンテナ停止
npm run logs          # ログ確認
npm run logs:backend  # バックエンドログのみ
npm run status        # ステータス確認
npm run clean         # 未使用リソース削除
npm run rebuild       # 完全リビルド
```

### Docker Composeコマンド（直接）
```bash
# コンテナ状態確認
docker-compose ps

# ログ確認
docker-compose logs
docker-compose logs bingo-backend  # バックエンドのみ
docker-compose logs caddy          # Caddyのみ

# コンテナ再起動
docker-compose restart

# コンテナ停止
docker-compose down

# コンテナ起動
docker-compose up -d
```

## 🌐 API エンドポイント

- `GET /api/health` - サーバー状態確認
- `GET /api/rooms` - アクティブルーム一覧

## 🎯 ゲーム仕様

### ビンゴカード
- 5×5グリッド（中央はFREE）
- B列: 1-15, I列: 16-30, N列: 31-45, G列: 46-60, O列: 61-75
- 各カードはランダム生成

### ゲームルール
- 司会者が数字を呼ぶ
- プレイヤーは該当する数字をマーク
- 縦・横・斜めのいずれかで5つ揃ったらビンゴ
- リアルタイムで勝者判定

### ルーム機能
- 最大8人まで参加可能
- プライベートルーム（6桁のランダムID）
- 司会者権限（ルーム作成者）

## 🔒 セキュリティ

- HTTPS自動取得（Let's Encrypt）
- CORS設定済み
- ファイアウォール自動設定
- セッション管理

## 📈 パフォーマンス

- メモリベースの状態管理
- 自動ルームクリーンアップ（24時間）
- PM2によるプロセス監視
- CDN配信対応（静的ファイル）

## 🐛 トラブルシューティング

### サーバーが起動しない
```bash
# ポート使用状況確認
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Caddy設定チェック
sudo caddy validate --config /etc/caddy/Caddyfile
```

### Socket接続エラー
```bash
# ファイアウォール確認
sudo ufw status

# PM2ログ確認
pm2 logs online-bingo
```

## 🤝 コントリビューション

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 👨‍💻 作者

[@suzunayui](https://github.com/suzunayui)

---

🎊 **Let's Play Bingo!** 🎊
