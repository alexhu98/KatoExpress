FROM node:14-slim

WORKDIR /tmp

RUN apt-get update
RUN apt-get install -y wget

RUN wget -q https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
  && tar xJf /tmp/ffmpeg-release-amd64-static.tar.xz -C /tmp \
  && mv /tmp/ffmpeg-4.4-amd64-static/ffprobe /usr/local/bin/ \
  && rm -rf /tmp/ffmpeg*

WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD ["npm", "start"]
