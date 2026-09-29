# Production Server Access Guide & SSH Keys

This guide contains access instructions and SSH credentials for the two production load-balanced servers hosting the **MABDC Finance & Registrar System**.

---

## 1. Production Server Nodes Summary

| Server Node | Public IP | SSH User | App Root Directory | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Production Node 1** | `2.28.30.85` | `root` | `/var/www/registrar_system` | Primary Application & Database Node |
| **Production Node 2** | `2.28.22.242` | `root` | `/var/www/registrar_system` | Load-Balanced Secondary Node |

---

## 2. Web Portal Access

* **Main System & Login**: [https://finance.mabdc.com](https://finance.mabdc.com) (Redirects to `/login`)
* **Finance Dashboard**: [https://finance.mabdc.com/dashboard](https://finance.mabdc.com/dashboard)
* **Learner Accounts**: [https://finance.mabdc.com/learner-accounts](https://finance.mabdc.com/learner-accounts)

---

## 3. SSH Connection Commands

### From PowerShell / Terminal / WSL / macOS:
Save the private key below to a file named `hetzner_id_ed25519` (e.g. `~/.ssh/hetzner_id_ed25519`), ensure key permissions (`chmod 600 ~/.ssh/hetzner_id_ed25519`), and run:

#### Connect to Node 1 (`2.28.30.85`):
```bash
ssh -i ~/.ssh/hetzner_id_ed25519 root@2.28.30.85
```

#### Connect to Node 2 (`2.28.22.242`):
```bash
ssh -i ~/.ssh/hetzner_id_ed25519 root@2.28.22.242
```

---

## 4. SSH Key Credentials

### Private Key (`hetzner_id_ed25519`):
```text
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBmu21Xpvhh3kesV9E82ltSTTL8431dCxBL7VyQE8S8sQAAAJgGL16jBi9e
owAAAAtzc2gtZWQyNTUxOQAAACBmu21Xpvhh3kesV9E82ltSTTL8431dCxBL7VyQE8S8sQ
AAAEAnD7RQL8fYYR9/wepp+JnjwnyRBQY9d1pABev8U2P8t2a7bVem+GHeR6xX0TzaW1JN
MvzjfV0LEEvtXJATxLyxAAAAFHJvb3RAREVTS1RPUC00VkQwMVU4AQ==
-----END OPENSSH PRIVATE KEY-----
```

### Public Key (`hetzner_id_ed25519.pub`):
```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGa7bVem+GHeR6xX0TzaW1JNMvzjfV0LEEvtXJATxLyx root@DESKTOP-4VD01U8
```

---

## 5. Common Maintenance Commands

Once connected via SSH:

```bash
# Navigate to application directory
cd /var/www/registrar_system

# View live application logs
tail -f storage/logs/laravel.log

# Clear application, route, and view caches
php artisan cache:clear && php artisan route:clear && php artisan view:clear
```
