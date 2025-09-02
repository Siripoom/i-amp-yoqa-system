FROM node:20

WORKDIR /app

# สำหรับกรณีที่ build context อยู่ที่ root
COPY back-end/package*.json ./

RUN yarn install

COPY back-end/ ./

EXPOSE 5000
CMD ["yarn", "start"]