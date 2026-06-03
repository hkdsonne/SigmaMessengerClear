# React Dockerfile
FROM node:18-alpine AS builder

ARG VITE_CHATS_SERVICE_IP
ARG VITE_AUTH_SERVICE_IP
ARG VITE_USER_SERVICE_IP
ARG VITE_FILE_SERVICE_IP
ARG VITE_MAIL_SERVICE_IP
ARG VITE_SOCIAL_SERVICE_IP

ENV VITE_CHATS_SERVICE_IP=$VITE_CHATS_SERVICE_IP
ENV VITE_AUTH_SERVICE_IP=$VITE_AUTH_SERVICE_IP
ENV VITE_USER_SERVICE_IP=$VITE_USER_SERVICE_IP
ENV VITE_FILE_SERVICE_IP=$VITE_FILE_SERVICE_IP
ENV VITE_MAIL_SERVICE_IP=$VITE_MAIL_SERVICE_IP
ENV VITE_SOCIAL_SERVICE_IP=$VITE_SOCIAL_SERVICE_IP

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN ls -la /app/dist

# Второй этап
FROM alpine:3.19

RUN apk add --no-cache curl

RUN adduser -D -u 1000 react

RUN mkdir -p /static && chown -R react:react /static

COPY --from=builder --chown=react:react /app/dist /static

USER react

# Упрощенный скрипт без sudo
CMD ["sh", "-c", "echo 'Copying static files...' && cp -r /static/* /output/ && echo 'Done! Files:' && ls -la /output/ && tail -f /dev/null"]
