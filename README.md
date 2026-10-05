# Rakuraku
日々の作業を整理するタスク管理アプリです。タスクの作成・編集・削除から、期限・優先度・進捗の確認までを Next.js と型付き API で実装しています。

## 主な機能
- タスクの CRUD、完了状態の切り替え
- タイトル・説明の検索、状態・優先度による絞り込みと並べ替え
- 期限、期限切れ件数、完了率などの統計表示
- Google 認証とユーザー単位のデータ取得・更新

## 技術と構成
Next.js 15 / React 19 / TypeScript / tRPC 11 / Prisma 6 / PostgreSQL / Auth.js (NextAuth v5 beta) / Tailwind CSS 4 / Playwright / Biome。
- [src/app/_components/tasks](src/app/_components/tasks): タスク画面とフォーム
- [src/server/api/routers/task.ts](src/server/api/routers/task.ts): 入力検証・所有者確認・CRUD・集計
- [prisma/schema.prisma](prisma/schema.prisma): データモデル
- [src/server/auth/config.ts](src/server/auth/config.ts): Google 認証と開発用 E2E 認証
- [tests/e2e](tests/e2e): CRUD、フィルター、認証などのテスト

## 実装上のポイント
tRPC と Zod を用いて UI と API の型をつなぎ、サーバー側ではセッションのユーザーIDで対象データを絞り込みます。フォーム、一覧、フィルター、統計をコンポーネントとして分けています。

## ローカル起動
Node.js・npm と PostgreSQL、Google OAuth の開発用設定が必要です。
```sh
cp .env.example .env
# .env にローカルDB、AUTH_SECRET、AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET を設定
npm ci
npm run db:push
npm run dev
```
`http://localhost:3000` にアクセスします。`db:push` はスキーマを変更するため、専用の開発DBで実行してください。

## 検証
```sh
npm run typecheck
npm run check
npm run build
npm run test:e2e
```
E2E認証の回帰テストは Node.js 22.18 以上で `node --test tests/security/e2e-mode.test.mjs` を実行できます。

E2E は専用テストDBと Playwright のブラウザが必要です。テスト用スクリプトはデータ変更を行うため、本番の接続情報を渡さないでください。

## 設定・セキュリティ
- 環境変数は [src/env.js](src/env.js) に合わせ、Google 用の実装とサンプルを統一しています。秘密を含む .env は追跡しません。
- E2E 用認証はサーバー側の E2E_TEST_MODE=true かつ非 production の場合だけ有効です。リクエストヘッダーで有効化できません。
- ローカル試験用の接続例は本番資格情報ではありません。共用・公開DBで再利用しないでください。
- 生成済みテストレポートは追跡しません。削除前のファイルは Git 履歴に残ります。

## 現状の制約
Auth.js は beta 版を使用しています。大規模データ向けのページングや運用監視、実環境での総合検証は別途必要です。テストファイルの存在と、全テストの合格は区別してください。既存 README が参照していた LICENSE ファイルはリポジトリに存在せず、この整理で新しい利用許諾は付与していません。
