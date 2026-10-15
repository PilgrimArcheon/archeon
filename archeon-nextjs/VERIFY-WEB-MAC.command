#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
npm ci
npm run verify:release
npm run preflight
npm run typecheck
npm run build
npm run verify:invoice-receipts
npm run verify:invoice-gmail
printf '\nArcheon web checks passed. Review RELEASE-GUIDE.md before deploying.\n'
