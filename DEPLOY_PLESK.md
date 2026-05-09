# دليل نشر المشروع على سيرفر Plesk

## المعمارية

```
Browser
  └─► https://alemedu.com          (Nginx:443 → Next.js :3000)
  └─► https://api.alemedu.com      (Nginx:443 → Go Fiber :8081)

Next.js SSR  ──► http://127.0.0.1:8081/api   (اتصال داخلي مباشر، بدون Nginx)
Go Fiber     ──► MySQL / Redis               (localhost)
```

---

## متطلبات السيرفر

- Node.js 20 LTS
- Go 1.22+
- PM2
- Nginx (مدار عبر Plesk)
- MySQL / MariaDB
- Redis

---

## الخطوات

### 1. تثبيت Node.js و PM2

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
npm install -g pm2
pm2 startup
```

### 2. إعداد مجلدات الموقع

```bash
mkdir -p /var/www/vhosts/alemedu.com/httpdocs
mkdir -p /var/www/vhosts/alemedu.com/logs
```

### 3. رفع مشروع Next.js (Frontend)

```bash
cd /var/www/vhosts/alemedu.com/httpdocs
git clone https://github.com/alemancenter/frontend.git .
npm ci --omit=dev
```

أنشئ ملف `.env.production` على السيرفر:

```bash
cat > /var/www/vhosts/alemedu.com/httpdocs/.env.production << 'EOF'
NODE_ENV=production

# Public URL (baked into JS bundle — browser calls)
NEXT_PUBLIC_API_URL=https://api.alemedu.com/api
NEXT_PUBLIC_APP_URL=https://alemedu.com

# Internal URL (server-side SSR — direct to Go Fiber, bypasses Nginx)
API_INTERNAL_URL=http://127.0.0.1:8081/api
API_HOSTNAME=api.alemedu.com

# Frontend API Keys — must match FRONTEND_API_KEY in Go Fiber .env
FRONTEND_API_KEY=<your_key_here>
NEXT_PUBLIC_FRONTEND_API_KEY=<your_key_here>
EOF
```

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

---

### 4. نشر Go Fiber (Backend)

```bash
# بناء الـ binary
cd /path/to/Fiber
go build -o /usr/local/bin/alemedu-api ./cmd/server

# إنشاء ملف البيئة
cat > /etc/alemedu/api.env << 'EOF'
APP_NAME="Alemedu API"
APP_ENV=production
APP_DEBUG=false
APP_HOST=127.0.0.1
APP_PORT=8081
APP_URL=https://api.alemedu.com

FRONTEND_URL=https://alemedu.com
CORS_ALLOWED_ORIGINS=https://alemedu.com,https://www.alemedu.com
FRONTEND_API_KEY=<your_key_here>

DB_HOST_JO=127.0.0.1
DB_PORT_JO=3306
DB_NAME_JO=alhurani_jo
DB_USER_JO=<user>
DB_PASS_JO=<password>

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

STORAGE_PATH=/var/www/vhosts/alemedu.com/httpdocs/storage/app/public
STORAGE_URL=https://api.alemedu.com/storage
EOF

# تشغيل عبر PM2
pm2 start /usr/local/bin/alemedu-api \
  --name alemedu-api \
  --env-file /etc/alemedu/api.env
pm2 save
```

---

### 5. إعداد Nginx في Plesk

#### لـ alemedu.com (Frontend)

في Plesk → **alemedu.com → Apache & nginx Settings → Additional nginx directives**:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
}

location /_next/static {
    proxy_pass http://127.0.0.1:3000;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

#### لـ api.alemedu.com (Backend)

في Plesk → **api.alemedu.com → Apache & nginx Settings → Additional nginx directives**:

```nginx
client_max_body_size 100M;

# Static storage — served directly by Nginx
location /storage/ {
    alias /var/www/vhosts/alemedu.com/httpdocs/storage/app/public/;
    expires 365d;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Health check
location = /api/ping {
    proxy_pass http://127.0.0.1:8081;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}

# API endpoints
location /api/ {
    proxy_pass http://127.0.0.1:8081;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

---

### 6. SSL (Let's Encrypt)

في Plesk لكلا الدومينين:
1. **alemedu.com → SSL/TLS Certificates → Let's Encrypt**
2. **api.alemedu.com → SSL/TLS Certificates → Let's Encrypt**
3. فعّل **Redirect from HTTP to HTTPS** لكل منهما

---

### 7. أوامر مفيدة

```bash
# حالة التطبيقات
pm2 status

# سجلات Next.js
pm2 logs alemancenter-frontend --lines 100

# سجلات Go Fiber
pm2 logs alemedu-api --lines 100

# إعادة تشغيل بعد تحديث
pm2 reload alemancenter-frontend --update-env
pm2 reload alemedu-api --update-env

# اختبار الاتصال الداخلي
curl -s http://127.0.0.1:8081/api/ping

# مراقبة الأداء
pm2 monit
```

---

### 8. التحقق من الاتصال الداخلي

بعد تشغيل كلا التطبيقين، تحقق من أن Next.js يصل لـ Go Fiber مباشرة:

```bash
# يجب أن يرجع {"success":true}
curl -s http://127.0.0.1:8081/api/ping

# تحقق أن المنفذ 8081 مقيّد على localhost فقط (غير مكشوف خارجياً)
ss -tlnp | grep 8081
# يجب أن يظهر 127.0.0.1:8081 وليس 0.0.0.0:8081
```

---

### 9. استكشاف الأخطاء

**التطبيق لا يعمل:**
```bash
pm2 status
pm2 logs alemancenter-frontend --err --lines 50
pm2 logs alemedu-api --err --lines 50
```

**مشاكل الصلاحيات:**
```bash
chown -R nginx:nginx /var/www/vhosts/alemedu.com/httpdocs
chmod -R 755 /var/www/vhosts/alemedu.com/httpdocs
```

**إعادة تشغيل Nginx:**
```bash
systemctl reload nginx
```

---

## ملاحظات هامة

1. **الاتصال الداخلي**: Next.js SSR يتصل بـ Go Fiber على `127.0.0.1:8081` مباشرة — بدون DNS أو SSL overhead
2. **CORS**: Go Fiber يسمح فقط من `https://alemedu.com` — طلبات SSR من `127.0.0.1` لا تحتاج CORS
3. **المنفذ 8081**: مقيّد على `127.0.0.1` — لا يمكن الوصول إليه من الخارج
4. **Storage**: الملفات في `/var/www/vhosts/alemedu.com/httpdocs/storage/app/public/`
5. **FRONTEND_API_KEY**: يجب أن يكون نفس القيمة في `.env.production` (Next.js) وملف Go Fiber
