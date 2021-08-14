docker run -p 8003:8003 --restart unless-stopped \
  -v /mnt/x/:/mnt/x/ \
  -v /mnt/data/:/mnt/data/ \
  -v /home/alex/Videos/:/home/alex/Videos/ \
  -v /data/WorkspaceAndroid/KatoExpress:/app \
  --name katoexpress katoexpress:latest 
