# Deployment Instructions (EC2)

## 1. Upload project
- Zip the entire project (exclude `node_modules`).
- Upload the zip file to the server via **FileZilla**.
- On EC2, move it into:

- Unzip the file.

## 2. Create 2GB Swap (if not exists)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

free -m

npm ci --only=production

pm2 restart web-buyer
# or
pm2 start npm --name "web-buyer" -- run start
pm2 save

pm2 logs web-buyer
