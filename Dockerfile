FROM node:18 AS builder
COPY ./frontend/package.json /app/frontend/package.json
COPY ./backend/package.json /app/backend/package.json
# BE
WORKDIR /app/backend
RUN npm i
COPY ./backend .
# Temp
RUN rm -rf src/DAO/database
RUN npm run build
RUN npm run minimize
# FE
WORKDIR /app/frontend
RUN npm i
COPY ./frontend .
RUN npm run build && rm dist/js/*.map

FROM node:18
WORKDIR /app
COPY ./backend/package.json package.json
RUN npm install --production && rm package*.json
COPY --from=builder /app/backend/dist_minimized .
COPY --from=builder /app/frontend/dist ./public
