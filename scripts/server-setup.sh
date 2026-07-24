#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Разовая настройка сервера под Dustore v3.
#
#  СТАРЫЙ САЙТ НЕ ТРОГАЕТСЯ. Скрипт:
#    • ставит новую версию в ОТДЕЛЬНУЮ папку /var/www/dustore-v3
#    • НЕ пишет ничего в /var/www/html (там живёт старый сайт)
#    • НЕ меняет существующие конфиги Apache
#    • НЕ трогает базу dustore
#
#  Запускать НА СЕРВЕРЕ:  bash server-setup.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR=/var/www/dustore-v3          # новая версия — отдельно от /var/www/html
OLD_SITE=/var/www/html/dustore.ru    # старый сайт, только проверяем что цел
APP_USER="${SUDO_USER:-$USER}"
PORT=3000
SERVICE=dustore-v3

echo "════════════════════════════════════════════"
echo " Установка Dustore v3"
echo "   новая версия  → $APP_DIR"
echo "   старый сайт   → $OLD_SITE (не трогаем)"
echo "   порт          → $PORT"
echo "════════════════════════════════════════════"
echo

# ── защита: не даём поставить поверх старого сайта ──
case "$APP_DIR" in
  /var/www/html*|/var/www/html/*)
    echo "СТОП: APP_DIR внутри /var/www/html — там старый сайт. Прерываю."
    exit 1 ;;
esac

if [ -d "$OLD_SITE" ]; then
  echo "▸ старый сайт на месте ($(ls -1 "$OLD_SITE" | wc -l) файлов) — не трогаю"
else
  echo "▸ старого сайта по пути $OLD_SITE нет — ок, продолжаю"
fi

# ── порт свободен? ──
if ss -ltn 2>/dev/null | grep -q ":$PORT "; then
  echo "СТОП: порт $PORT уже занят. Освободи его или поменяй PORT в скрипте."
  ss -ltnp | grep ":$PORT " || true
  exit 1
fi
echo "▸ порт $PORT свободен"

echo
echo "▸ 1/6 Node…"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
  echo "  ставлю Node 22 (старый PHP это не затронет)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "  $(node -v)"

echo "▸ 2/6 Папки…"
sudo mkdir -p "$APP_DIR" /etc/dustore-v3
sudo chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
echo "  $APP_DIR готова"

echo "▸ 3/6 Секреты…"
if [ ! -f /etc/dustore-v3/env ]; then
  SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '\n')
  sudo tee /etc/dustore-v3/env > /dev/null <<EOF
NODE_ENV=production
PORT=$PORT
NUXT_SESSION_SECRET=$SECRET
# раскомментируй, когда создашь базу dustorev3:
# DATABASE_URL=mysql://dustorev3:ПАРОЛЬ@localhost:3306/dustorev3
EOF
  sudo chmod 600 /etc/dustore-v3/env
  echo "  создан /etc/dustore-v3/env"
else
  echo "  уже есть — не перезаписываю"
fi

echo "▸ 4/6 Автозапуск (systemd)…"
sudo tee /etc/systemd/system/$SERVICE.service > /dev/null <<EOF
[Unit]
Description=Dustore v3 (Nuxt/Nitro)
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=/etc/dustore-v3/env
ExecStart=/usr/bin/node $APP_DIR/.output/server/index.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE > /dev/null 2>&1
echo "  сервис $SERVICE зарегистрирован (пока не запускаю — кода ещё нет)"

echo "▸ 5/6 Модули Apache…"
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers > /dev/null 2>&1 || true
echo "  включены. Существующие сайты НЕ тронуты."

echo "▸ 6/6 Ключ для деплоя…"
if [ ! -f ~/.ssh/dustore_deploy ]; then
  mkdir -p ~/.ssh && chmod 700 ~/.ssh
  ssh-keygen -t ed25519 -f ~/.ssh/dustore_deploy -N "" -C "github-deploy-v3" > /dev/null
  cat ~/.ssh/dustore_deploy.pub >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  echo "  ключ создан"
else
  echo "  ключ уже есть"
fi

cat <<'EOM'

═══════════════════════════════════════════════════
 ЧТО ДАЛЬШЕ — три шага
═══════════════════════════════════════════════════

1) Новый vhost для поддомена. Создай файл
   /etc/apache2/sites-available/v3.dustore.ru.conf

   <VirtualHost *:80>
       ServerName v3.dustore.ru
       ProxyPreserveHost On
       ProxyPass        / http://127.0.0.1:3000/
       ProxyPassReverse / http://127.0.0.1:3000/
       RewriteEngine On
       RewriteCond %{HTTP:Upgrade} =websocket [NC]
       RewriteRule /(.*) ws://127.0.0.1:3000/$1 [P,L]
       ErrorLog  ${APACHE_LOG_DIR}/v3-error.log
       CustomLog ${APACHE_LOG_DIR}/v3-access.log combined
   </VirtualHost>

   sudo a2ensite v3.dustore.ru
   sudo apache2ctl configtest      # проверка ДО перезагрузки
   sudo systemctl reload apache2
   sudo certbot --apache -d v3.dustore.ru

   (a2ensite добавляет НОВЫЙ сайт, старый продолжает работать)

2) База данных — отдельная, старую не трогаем:

   CREATE DATABASE dustorev3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'dustorev3'@'localhost' IDENTIFIED BY 'ПАРОЛЬ';
   GRANT ALL PRIVILEGES ON dustorev3.* TO 'dustorev3'@'localhost';
   GRANT SELECT ON dustore.users TO 'dustorev3'@'localhost';
   FLUSH PRIVILEGES;

   Потом впиши DATABASE_URL в /etc/dustore-v3/env

3) Секреты в GitHub → Settings → Secrets and variables → Actions
EOM

echo
echo "SSH_HOST = $(hostname -I | awk '{print $1}')"
echo "SSH_USER = $APP_USER"
echo "SSH_KEY  = весь текст ниже, вместе со строками BEGIN/END"
echo "──────────────────────────────────────────────"
cat ~/.ssh/dustore_deploy
echo "──────────────────────────────────────────────"
echo
echo "Готово. Старый сайт не тронут — проверь: curl -I http://dustore.ru"