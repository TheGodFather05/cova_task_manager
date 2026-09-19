FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache gettext
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.d/../entrypoint.sh
COPY --from=build /build/dist /usr/share/nginx/html
# Cloud Run overrides this; compose keeps 80
ENV PORT=80
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
