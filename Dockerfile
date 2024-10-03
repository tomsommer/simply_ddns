FROM node:18-alpine as builder
ADD . /app
WORKDIR /app
RUN npm install --omit=dev

FROM node:16-alpine
ENV NODE_ENV=production
COPY --from=builder /app /app
WORKDIR /app
CMD ["node", "app.js"]
