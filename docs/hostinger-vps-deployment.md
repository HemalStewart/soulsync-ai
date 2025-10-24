# chatsoul-ai VPS Deployment (Hostinger)

This guide walks through provisioning a new Hostinger VPS instance and deploying the chatsoul-ai stack (CodeIgniter PHP API + Next.js frontend) in a reproducible way. Adapt paths, hostnames, and credentials to match your environment.

---

## 1. Prerequisites

- Active Hostinger VPS with root SSH access.
- Registered domain (optional but recommended) with DNS control.
- SSH key pair (recommended) or a strong root password.
- GitHub/Repo access tokens for cloning the project.
- Database credentials and `.env` secrets for both backend (`backend/.env`) and frontend (`frontend/.env.local`).
- Local machine with `ssh` and `scp` (or an alternative such as PuTTY on Windows).

---

## 2. First-Time VPS Preparation

1. **Login via SSH**
   ```bash
   ssh root@your-server-ip
   ```
2. **Update the base system**
   ```bash
   apt update && apt upgrade -y
   apt install -y build-essential curl git ufw unzip
   ```
3. **Create a non-root deploy user (recommended)**
   ```bash
   adduser deploy
   usermod -aG sudo deploy
   rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
   ```
   Reconnect as `deploy@your-server-ip` for the remaining steps.

4. **Harden SSH (optional but recommended)**
   - Edit `/etc/ssh/sshd_config` to disable root/password auth if using keys (e.g., `PermitRootLogin no`, `PasswordAuthentication no`).
   - Restart SSH: `sudo systemctl restart sshd`.

5. **Configure UFW firewall**
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

---

## 3. Install Runtime Dependencies

### Node.js + PM2 (Next.js frontend)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### PHP + Composer (CodeIgniter backend)
```bash
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-mbstring php8.2-intl php8.2-xml php8.2-curl php8.2-zip
sudo apt install -y nginx mysql-client

# Composer
cd ~
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
rm composer-setup.php
```

> Adjust PHP version to match Hostinger’s images; keep it ≥ 8.1 for CodeIgniter 4.

---

## 4. Directory Layout

Choose a common app root (e.g., `/var/www/chatsoul-ai`).
```bash
sudo mkdir -p /var/www/chatsoul-ai
sudo chown -R deploy:deploy /var/www/chatsoul-ai
```

Clone the repo:
```bash
cd /var/www/chatsoul-ai
git clone https://github.com/your-org/chatsoul-ai.git .
```

If the repository is private, configure SSH keys or a personal access token.

---

## 5. Configure Backend (CodeIgniter API)

1. **Install dependencies**
   ```bash
   cd /var/www/chatsoul-ai/backend
   composer install --no-dev --optimize-autoloader
   ```

2. **Environment file**
   - Copy your production `.env` to the VPS:
     ```bash
     # From local machine
     scp backend/.env deploy@your-server-ip:/var/www/chatsoul-ai/backend/.env
     ```
   - Confirm `app.baseURL`, database credentials, mail settings, and any API keys.

3. **Optimize CodeIgniter for production**
   ```bash
   php spark cache:clear
   php spark migrate --all
   php spark cache:clear
   ```

4. **Set writable permissions**
   ```bash
   sudo chown -R www-data:www-data /var/www/chatsoul-ai/backend/writable
   sudo find /var/www/chatsoul-ai/backend/writable -type d -exec chmod 775 {} \;
   sudo find /var/www/chatsoul-ai/backend/writable -type f -exec chmod 664 {} \;
   ```

---

## 6. Configure Frontend (Next.js)

1. **Install dependencies & build**
   ```bash
   cd /var/www/chatsoul-ai/frontend
   npm install
   npm run build
   ```

2. **Environment file**
   ```bash
   # From local machine
   scp frontend/.env.local deploy@your-server-ip:/var/www/chatsoul-ai/frontend/.env.production
   ```
   - Ensure URLs point to your VPS domain (e.g., `NEXT_PUBLIC_API_BASE_URL=https://api.example.com`).
   - Update `.env.production` references to match Next.js conventions or adjust `next.config.mjs`.

3. **Run with PM2**
   ```bash
   cd /var/www/chatsoul-ai/frontend
   pm2 start npm --name "chatsoul-ai-frontend" -- start
   pm2 save
   pm2 status
   ```

   PM2 automatically restarts the app on boot if `pm2 startup` is configured:
   ```bash
   pm2 startup systemd
   sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
   pm2 save
   ```

---

## 7. Configure Nginx

> This setup serves the PHP API under `/api` and proxies all other traffic to Next.js.

1. **Create an upstream block**
   ```bash
   sudo tee /etc/nginx/conf.d/chatsoul-ai.conf >/dev/null <<'EOF'
   upstream chatsoul_ai_frontend {
       server 127.0.0.1:3000;
   }
   EOF
   ```

2. **Create the server block**
   ```bash
   sudo tee /etc/nginx/sites-available/chatsoul-ai >/dev/null <<'EOF'
   server {
       listen 80;
       server_name example.com www.example.com;

       client_max_body_size 25M;

       # Frontend proxy
       location / {
           proxy_pass http://chatsoul_ai_frontend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # API (CodeIgniter)
       location /api {
           alias /var/www/chatsoul-ai/backend/public;
           try_files $uri $uri/ /index.php?$args;

           index index.php;

           location ~ \.php$ {
               include snippets/fastcgi-php.conf;
               fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
               fastcgi_param SCRIPT_FILENAME $request_filename;
           }

           location ~ /\.ht {
               deny all;
           }
       }
   }
   EOF
   ```

3. **Enable the site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/chatsoul-ai /etc/nginx/sites-enabled/chatsoul-ai
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **(Optional) Separate API subdomain**
   - Point `api.example.com` at `/api` for cleaner routes.
   - Create a second server block dedicated to the backend if preferred.

5. **SSL with Let’s Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d example.com -d www.example.com
   ```
   - Automates certificate renewal via systemd timers.

---

## 8. Database Setup

1. Provision a managed database or install MySQL locally:
   ```bash
   sudo apt install -y mysql-server
   sudo mysql_secure_installation
   ```

2. Create the chatsoul-ai database and user:
   ```sql
   CREATE DATABASE `chatsoul-ai` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'chatsoul-ai'@'localhost' IDENTIFIED BY 'strongpassword';
   GRANT ALL PRIVILEGES ON `chatsoul-ai`.* TO 'chatsoul-ai'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Update `backend/.env` with the new credentials and run migrations (`php spark migrate`).

---

## 9. Deployments & Updates

1. **Pull latest code**
   ```bash
   cd /var/www/chatsoul-ai
   git fetch origin
   git checkout main
   git pull origin main
   ```

2. **Backend refresh**
   ```bash
   cd backend
   composer install --no-dev --optimize-autoloader
   php spark migrate --all
   php spark cache:clear
   sudo systemctl reload php8.2-fpm
   ```

3. **Frontend rebuild**
   ```bash
   cd /var/www/chatsoul-ai/frontend
   npm install
   npm run build
   pm2 restart chatsoul-ai-frontend
   pm2 save
   ```

4. **Verify services**
   ```bash
   systemctl status nginx
   systemctl status php8.2-fpm
   pm2 status
   ```

---

## 10. Monitoring & Maintenance

- **Logs**
  - Nginx: `/var/log/nginx/access.log` & `/var/log/nginx/error.log`
  - PHP-FPM: `/var/log/php8.2-fpm.log`
  - PM2/Next.js: `pm2 logs chatsoul-ai-frontend`
- **Backups**: Snapshot the VPS regularly; back up `.env` files and database dumps.
- **Security updates**: `sudo unattended-upgrade` or scheduled `apt update && apt upgrade`.
- **Resource usage**: `htop`, `df -h`, or Hostinger’s monitoring tools.

---

## 11. Troubleshooting Checklist

- 502 from `/` → check PM2 app status and port bindings.
- 502 from `/api` → ensure PHP-FPM socket path matches installed PHP version.
- CORS/auth errors → verify frontend `.env.production` URLs and backend CORS config.
- SSL renewals → `sudo certbot renew --dry-run` to confirm automated renewals work.

---

### Quick Reference Commands

```bash
# PM2
pm2 status
pm2 restart chatsoul-ai-frontend
pm2 logs chatsoul-ai-frontend

# Nginx & PHP
sudo systemctl reload nginx
sudo systemctl restart php8.2-fpm

# Git deploy
cd /var/www/chatsoul-ai && git pull && npm run build && pm2 restart chatsoul-ai-frontend
```

Keep this document updated as the stack evolves (e.g., runtime upgrades, infrastructure changes, CI/CD automation).
