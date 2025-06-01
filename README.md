# Rakuraku - らくらくタスク管理

<div align="center">
  <h1>🚀 Rakuraku Task Management</h1>
  <p>効率的なタスク管理で日々の作業をもっと楽に</p>
  
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-6.5-green" alt="Prisma">
  <img src="https://img.shields.io/badge/tRPC-11-red" alt="tRPC">
  <img src="https://img.shields.io/badge/Tailwind-4-blue" alt="Tailwind CSS">
</div>

## 📋 概要

Rakurakuは、直感的なインターフェースと強力な機能を組み合わせたモダンなタスク管理アプリケーションです。T3スタックをベースに構築され、効率的なタスク管理で日々の作業をもっと楽にします。

## ✨ 主要機能

- ✅ **直感的なタスク管理**: 簡単なタスクの作成、編集、削除
- 🔍 **高度な検索・フィルター**: タイトル、説明文での検索や状態・優先度でのフィルタリング
- 📊 **統計ダッシュボード**: タスクの完了率、期限切れタスクなどを可視化
- 🏷️ **優先度管理**: 高・中・低の3段階で優先度を設定
- 📅 **期限管理**: 期限設定と期限切れアラート
- 🔐 **セキュアな認証**: NextAuth.jsによる安全なユーザー認証
- 📱 **レスポンシブデザイン**: デスクトップ、タブレット、モバイル対応
- 🌙 **モダンUI**: TailwindCSSによる美しいデザイン

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15**: React フレームワーク、App Router
- **React 19**: ユーザーインターフェース
- **TypeScript**: 型安全性
- **Tailwind CSS 4**: スタイリング
- **Hero Icons**: アイコンライブラリ
- **React Hook Form**: フォーム管理
- **date-fns**: 日付処理

### バックエンド
- **tRPC 11**: 型安全なAPI
- **Prisma 6**: ORM・データベース
- **PostgreSQL**: メインデータベース
- **NextAuth.js**: 認証システム
- **Zod**: スキーマバリデーション

### 開発・テスト
- **Playwright**: E2Eテスト
- **Biome**: コード品質管理
- **ESLint**: 静的解析

## 🚀 クイックスタート

### 前提条件

- Node.js 18.x以上
- npm または yarn
- PostgreSQL データベース

### インストール

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/sakamoto051/rakuraku.git
   cd rakuraku
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **環境変数を設定**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local`ファイルを編集して、以下の変数を設定：
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/rakuraku"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Auth Providers (例: GitHub)
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   ```

4. **データベースをセットアップ**
   ```bash
   npm run db:push
   ```

5. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

6. **ブラウザでアクセス**
   
   [http://localhost:3000](http://localhost:3000) を開く

## 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── _components/        # 共有コンポーネント
│   │   ├── navigation/     # ナビゲーション関連
│   │   └── tasks/          # タスク関連コンポーネント
│   ├── tasks/              # タスク管理ページ
│   └── api/                # API Routes
├── server/                 # サーバーサイドコード
│   ├── api/                # tRPC ルーター
│   ├── auth/               # 認証設定
│   └── db/                 # データベース設定
├── trpc/                   # tRPC クライアント設定
└── styles/                 # スタイルファイル

tests/
├── e2e/                    # E2Eテスト
├── fixtures/               # テストデータ
└── utils/                  # テストユーティリティ
```

## 🔧 開発

### 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 型チェック
npm run typecheck

# コード品質チェック
npm run check

# データベース操作
npm run db:push          # スキーマをデータベースに適用
npm run db:studio        # Prisma Studio（GUI）を起動

# テスト実行
npm run test:e2e         # E2Eテスト実行
npm run test:e2e:ui      # PlaywrightのUIモードでテスト
npm run test:e2e:debug   # デバッグモードでテスト
```

### 開発ガイドライン

1. **ブランチ戦略**: feature/issue-番号-簡単な説明
2. **コミットメッセージ**: 具体的で理解しやすいメッセージを書く
3. **型安全性**: TypeScriptを活用し、any型は極力避ける
4. **テスト**: 新機能追加時はE2Eテストも更新する

## 📖 ドキュメント

詳細なドキュメントは、プロジェクトの開発ノート（Obsidian）で管理されています。開発者向けの情報は以下の通りです：

### 🚀 クイックリファレンス
- **セットアップ**: 上記のクイックスタートガイドを参照
- **API仕様**: tRPCによる型安全なAPI（`src/server/api/`参照）
- **コンポーネント**: `src/app/_components/`配下の各コンポーネント
- **データベース**: Prismaスキーマ（`prisma/schema.prisma`参照）

### 💬 サポート・質問
詳細な使用方法や開発ガイドについては、以下からお問い合わせください：
- [GitHub Issues](https://github.com/sakamoto051/rakuraku/issues) - 技術的な質問・バグ報告
- [GitHub Discussions](https://github.com/sakamoto051/rakuraku/discussions) - 一般的な議論・アイデア

## 🧪 テスト

### E2Eテスト

Playwrightを使用してエンドツーエンドテストを行っています。

```bash
# 全てのE2Eテストを実行
npm run test:e2e

# 特定のテストファイルを実行
npx playwright test auth.spec.ts

# UIモードでテスト実行（視覚的デバッグ）
npm run test:e2e:ui

# テストレポート表示
npm run test:e2e:report
```

テストカバレッジ：
- ✅ 認証フロー
- ✅ タスクCRUD操作
- ✅ フィルター・検索機能
- ✅ レスポンシブデザイン

## 🚀 デプロイ

### Vercel（推奨）

1. [Vercel](https://vercel.com)でアカウント作成
2. GitHubリポジトリを連携
3. 環境変数を設定
4. デプロイ

### 手動デプロイ

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは [MIT License](./LICENSE) の下でライセンスされています。

## 🙏 謝辞

- [T3 Stack](https://create.t3.gg/) - 優れた開発基盤
- [Theo](https://www.youtube.com/@t3dotgg) - T3スタックの作成者
- オープンソースコミュニティ - 素晴らしいツールとライブラリの提供

## 📞 サポート

何か問題や質問がありましたら、以下の方法でお気軽にお問い合わせください：

- [Issues](https://github.com/sakamoto051/rakuraku/issues) - バグ報告や機能要望
- [Discussions](https://github.com/sakamoto051/rakuraku/discussions) - 質問や意見交換

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/sakamoto051">sakamoto051</a>
</div>
