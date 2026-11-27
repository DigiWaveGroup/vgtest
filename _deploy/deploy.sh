#!/usr/bin/env bash
# 部署 VGW 靜態網站到 AWS 主機（只上傳公開檔案），並更新完整性基準與部署紀錄。
# 用法：_deploy/deploy.sh
# 主機位址、登入帳號、金鑰路徑放在本機的 _deploy/deploy.local.env（已列入 .gitignore，不上傳），格式：
#   VGW_HOST=主機IP
#   VGW_USER=登入帳號
#   VGW_KEY="$HOME/.ssh/金鑰檔.pem"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_ENV="$ROOT/_deploy/deploy.local.env"
if [ -f "$LOCAL_ENV" ]; then
  # shellcheck disable=SC1090
  . "$LOCAL_ENV"
fi
: "${VGW_HOST:?找不到主機位址：請在 _deploy/deploy.local.env 設定 VGW_HOST}"
: "${VGW_USER:?找不到登入帳號：請在 _deploy/deploy.local.env 設定 VGW_USER}"
: "${VGW_KEY:?找不到金鑰路徑：請在 _deploy/deploy.local.env 設定 VGW_KEY}"
HOST="$VGW_HOST"
KEY="$VGW_KEY"
USER_="$VGW_USER"
DEST="/var/www/vgw"
SSH=(ssh -i "$KEY" -o BatchMode=yes "$USER_@$HOST")

cd "$ROOT"
if [ -n "$(git status --porcelain)" ]; then
  echo "工作目錄有未提交的修改，請先 commit 再部署（部署版本需可追溯）。" >&2
  exit 1
fi
REV="$(git rev-parse --short HEAD)"

rsync -rltz --delete \
  --exclude='.git/' --exclude='.github/' --exclude='.claude/' \
  --exclude='_tools/' --exclude='_deploy/' --exclude='.impeccable/' \
  --exclude='README.md' --exclude='robots.txt' \
  --exclude='.DS_Store' --exclude='*.md' --exclude='.gitignore' \
  -e "ssh -i $KEY -o BatchMode=yes" \
  ./ "$USER_@$HOST:$DEST/"

"${SSH[@]}" "set -e
  sudo chgrp -R www-data $DEST
  find $DEST -type d -exec chmod 750 {} +
  find $DEST -type f -exec chmod 640 {} +
  cd $DEST && find . -type f -print0 | sort -z | xargs -0 sha256sum | sudo tee /var/lib/vgw-integrity.sha256 >/dev/null
  echo \"\$(date '+%F %T %z') deploy rev=$REV by=\$(whoami) from=\${SSH_CLIENT%% *} files=\$(wc -l < /var/lib/vgw-integrity.sha256)\" | sudo tee -a /var/log/vgw-deploy.log"
echo "部署完成：rev $REV → http://$HOST/"
