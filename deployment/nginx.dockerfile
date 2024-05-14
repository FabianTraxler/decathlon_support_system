# nginx/Dockerfile

FROM nginx:1.25.5-alpine

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443