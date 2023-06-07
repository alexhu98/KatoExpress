docker stop katoexpress
docker rm katoexpress
docker build --pull --rm -f "Dockerfile" -t katoexpress:latest "."

docker run -d -p 8003:8003 --restart unless-stopped \
  -v /mnt/x/:/mnt/x/ \
  -v /mnt/data/:/mnt/data/ \
  -v /mnt/hdd4/:/mnt/hdd4/ \
  -v /data/WorkspaceAndroid/KatoExpress:/app \
  --name katoexpress katoexpress:latest 
