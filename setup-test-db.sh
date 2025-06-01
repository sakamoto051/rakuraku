#!/usr/bin/env bash
# E2Eテスト用データベースのセットアップスクリプト

set -e

echo "Setting up E2E test database..."

# データベース接続情報
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="password"
DB_NAME="rakuraku_test"

# PostgreSQLコンテナが起動しているかチェック
if ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "Please start the database container first:"
    echo "  ./start-database.sh"
    exit 1
fi

echo "PostgreSQL is running. Setting up test database..."

# テスト用データベースを作成（既に存在する場合はスキップ）
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
SELECT 'CREATE DATABASE $DB_NAME' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')
\\gexec
" 2>/dev/null || true

echo "Test database '$DB_NAME' created or already exists."

# テスト用データベースのURLを設定
export DATABASE_URL_E2E="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo "Setting up Prisma schema for test database..."

# Prismaスキーマをテスト用データベースに適用
E2E_TEST_MODE=true DATABASE_URL_E2E="$DATABASE_URL_E2E" npx prisma db push --accept-data-loss

echo "✅ E2E test database setup complete!"
echo "Test database URL: $DATABASE_URL_E2E"
echo ""
echo "You can now run E2E tests with:"
echo "  npm run test:e2e"
