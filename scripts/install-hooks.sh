#!/usr/bin/env bash
# Install a git post-merge hook that runs scripts/deploy.sh whenever a
# merge lands on master. Optional but convenient: `git pull` on master
# becomes "deploy".
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/.git/hooks/post-merge"

cat > "$HOOK" <<'EOF'
#!/usr/bin/env bash
# Auto-deploy on master after a pull/merge.
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || true)
if [ "$current_branch" = "master" ]; then
  bash "$(dirname "$0")/../../scripts/deploy.sh"
fi
EOF

chmod +x "$HOOK"
echo "✓ Hook instalado en .git/hooks/post-merge"
echo "A partir de ahora, hacer pull en master redespliega automáticamente."