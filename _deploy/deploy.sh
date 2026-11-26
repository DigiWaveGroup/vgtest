#!/usr/bin/env bash
# 部署 VGW 靜態網站到 AWS 主機（只上傳公開檔案），並更新完整性基準與部署紀錄。
# 用法：_deploy/deploy.sh            （預設主機與金鑰）
#       VGW_HOST=1.2.3.4 _deploy/deploy.sh
set -euo pipefail

HOST="${VGW_HOST:-43.213.15.188}"
KEY="${VGW_KEY:-$HOME/.ssh/vgw-key.pem}"
USER_="admin"
DEST="/var/www/vgw"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH=(ssh -i "$KEY" -o BatchMode=yes "$USER_@$HOST")

cd "$ROOT"
if [ -n "$(git status --porcelain)" ]; then
  echo "工作目錄有未提交的修改，請先 commit 再部署（部署版本需可追溯）。" >&2
  exit 1
fi
REV="$(git rev-parse --short HEAD)"

rsync -rltz --delete \
  --exclude='.git/' --exclude='.github/' --exclude='.claude/' \
  --exclude='_tools/' --exclude='_deploy/' \
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
