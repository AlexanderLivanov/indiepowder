#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  ПЕРВЫЙ ДЕПЛОЙ Dustore v3 на v3.dustore.ru
#
#  Запускать НА СЕРВЕРЕ:
#      bash deploy-first.sh https://github.com/ТЫ/ТВОЙ-РЕПОЗИТОРИЙ.git
#
#  Старый сайт в /var/www/html/dustore.ru НЕ ТРОГАЕТСЯ.
#  Новая версия ставится в /var/www/dustore-v3 на порт 3000.
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

REPO="${1:-}"
DOMAIN="${2:-v3.dustore.ru}"
APP_DIR=/var/www/dustore-v3
ENV_DIR=/etc/dustore-v3
SERVICE=dustore-v3
PORT=3000
OLD_SITE=/var/www/html/dustore.ru

if [ -z "$REPO" ]; then
  echo "Использование: bash deploy-first.sh <git-url> [домен]"
  echo "Пример: bash deploy-first.sh https://github.com/leo/dustore.git v3.dustore.ru"
  exit 1
fi

say() { echo -e "\n\033[35m▸ $1\033[0m"; }
die() { echo -e "\033[31mСТОП: $1\033[0m"; exit 1; }

echo "═══════════════════════════════════════════"
echo " Dustore v3 → $DOMAIN"
echo "   репозиторий: $REPO"
echo "   папка:       $APP_DIR"
echo "   порт:        $PORT"
echo "   старый сайт: $OLD_SITE (не трогаем)"
echo "═══════════════════════════════════════════"

# ── защита ──
case "$APP_DIR" in /var/www/html*) die "APP_DIR внутри /var/www/html — там старый сайт" ;; esac
[ -d "$OLD_SITE" ] && echo "  старый сайт на месте, $(ls -1 "$OLD_SITE" | wc -l) файлов"
if ss -ltn 2>/dev/null | grep -q ":$PORT "; then
  ss -ltnp | grep ":$PORT " || true
  die "порт $PORT занят"
fi

say "1/8 Node 22"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

say "2/8 Забираю код"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin && git -C "$APP_DIR" reset --hard origin/main
else
  git clone "$REPO" "$APP_DIR"
fi

say "3/8 Секреты"
sudo mkdir -p "$ENV_DIR"
if [ ! -f "$ENV_DIR/env" ]; then
  SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '\n=/+' | head -c 44)
  sudo tee "$ENV_DIR/env" > /dev/null <<EOF
NODE_ENV=production
PORT=$PORT
NUXT_SESSION_SECRET=$SECRET
DATABASE_URL=mysql://ПОЛЬЗОВАТЕЛЬ:ПАРОЛЬ@localhost:3306/dustore
EOF
  sudo chmod 600 "$ENV_DIR/env"
  echo
  echo "  \033[33m⚠ ВПИШИ ЛОГИН И ПАРОЛЬ К БАЗЕ:\033[0m"
  echo "    sudo nano $ENV_DIR/env"
  echo
  read -rp "  Нажми Enter, когда впишешь DATABASE_URL… "
else
  echo "  уже есть, не трогаю"
fi
grep -q 'ПАРОЛЬ' "$ENV_DIR/env" 2>/dev/null && die "в $ENV_DIR/env остался шаблон — впиши реальные данные"

say "4/8 Сборка"
cd "$APP_DIR"
set -a; . "$ENV_DIR/env"; set +a
npm ci || npm install
npm run build

say "5/8 Миграции"
if ls drizzle/*.sql >/dev/null 2>&1; then
  node scripts/migrate-verbose.mjs || die "миграции не прошли — смотри ошибку выше"
else
  echo "  миграций нет, пропускаю"
fi

say "6/8 Автозапуск"
sudo tee /etc/systemd/system/$SERVICE.service > /dev/null <<EOF
[Unit]
Description=Dustore v3 (Nuxt/Nitro)
After=network.target mysql.service mariadb.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_DIR/env
ExecStart=/usr/bin/node $APP_DIR/.output/server/index.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now $SERVICE
sleep 4
sudo systemctl is-active --quiet $SERVICE || { sudo journalctl -u $SERVICE -n 30 --no-pager; die "сервис не поднялся"; }
curl -fsS "http://127.0.0.1:$PORT/" > /dev/null || die "приложение не отвечает на порту $PORT"
echo "  приложение живо"

say "7/8 Apache"
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers > /dev/null 2>&1 || true
VHOST=/etc/apache2/sites-available/$DOMAIN.conf
if [ ! -f "$VHOST" ]; then
  sudo tee "$VHOST" > /dev/null <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN

    ProxyPreserveHost On
    ProxyPass        / http://127.0.0.1:$PORT/
    ProxyPassReverse / http://127.0.0.1:$PORT/

    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://127.0.0.1:$PORT/\$1 [P,L]

    ErrorLog  \${APACHE_LOG_DIR}/$DOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$DOMAIN-access.log combined
</VirtualHost>
EOF
  sudo a2ensite "$DOMAIN" > /dev/null
fi
sudo apache2ctl configtest || die "ошибка в конфиге Apache — старый сайт НЕ перезагружен"
sudo systemctl reload apache2
echo "  vhost включён, конфиг проверен"

say "8/8 Проверка"
echo -n "  новый сайт:  "; curl -s -o /dev/null -w "%{http_code}\n" -H "Host: $DOMAIN" http://127.0.0.1/
echo -n "  старый сайт: "; curl -s -o /dev/null -w "%{http_code}\n" http://dustore.ru/ || echo "(проверь вручную)"

cat <<EOM

═══════════════════════════════════════════
 Готово. Осталось два шага:

 1) DNS: A-запись  v3  →  $(hostname -I | awk '{print $1}')

 2) HTTPS (обязателен для PWA):
      sudo certbot --apache -d $DOMAIN

 Полезное:
   sudo systemctl status $SERVICE
   sudo journalctl -u $SERVICE -f
   sudo systemctl restart $SERVICE

 Обновить вручную:
   cd $APP_DIR && git pull && npm ci && npm run build \\
     && node scripts/migrate-verbose.mjs && sudo systemctl restart $SERVICE
═══════════════════════════════════════════
EOM