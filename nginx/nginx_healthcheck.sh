#!/bin/sh
# nginx_healthcheck.sh

# Используем HTTPS с игнорированием проверки сертификата
curl -fk https://localhost/health 2>/dev/null || exit 1
