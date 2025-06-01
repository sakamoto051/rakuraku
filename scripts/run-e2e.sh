#!/bin/bash

# E2E テスト実行スクリプト
export E2E_TEST_MODE=true
export NODE_ENV=test

echo "Running E2E tests with environment:"
echo "E2E_TEST_MODE: $E2E_TEST_MODE"
echo "NODE_ENV: $NODE_ENV"
echo "---"

# 特定のテストを実行する場合
if [ $# -gt 0 ]; then
    npx playwright test --project chromium --headed --timeout 30000 "$@" --reporter=list
else
    # 全テストを実行
    npx playwright test --project chromium --headed --timeout 30000 tests/e2e/ --reporter=list
fi
