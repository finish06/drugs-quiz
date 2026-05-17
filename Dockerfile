FROM node:22-alpine AS build

ARG VITE_APP_URL=http://localhost:8080
ARG VITE_UMAMI_WEBSITE_ID=
ARG VITE_ALLOW_INDEXING=false
ARG VITE_ROBOTS_CONTENT="noindex,nofollow"
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID
ENV VITE_ALLOW_INDEXING=$VITE_ALLOW_INDEXING
ENV VITE_ROBOTS_CONTENT=$VITE_ROBOTS_CONTENT

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
