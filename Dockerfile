FROM node:18 AS builder
# Do not use: ARG NODE_ENV=production. Because NPM will skip dev packages
ARG QLGP_USE_BACKEND=true

# Install packages FE
COPY ./frontend/package.json /app/frontend/package.json
WORKDIR /app/frontend
RUN npm i

# Install packages BE
COPY ./backend/package.json /app/backend/package.json
WORKDIR /app/backend
RUN npm i

# Build BE (không thể build FE trước để sử dụng cache tốt hơn, vì FE có dùng code của BE)
WORKDIR /app/backend
RUN npm i
COPY ./backend .
RUN rm -rf src/DAO/database
RUN npm run build
RUN npm run minimize

# Build FE
WORKDIR /app/frontend
COPY ./frontend .
RUN npm run build && rm dist/js/*.map

# Copy to final image
FROM node:18
ENV QLGP_FUSEKI_URL=http://localhost:3030
WORKDIR /app
COPY ./backend/package.json package.json
RUN npm install --production && rm package*.json
COPY --from=builder /app/backend/dist_minimized .
COPY --from=builder /app/frontend/dist ./public

CMD [ "node", "index.js" ]
