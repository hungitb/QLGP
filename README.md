# QLGP

## ENV
```bash
# Dev setting
QLGP_BACKEND_FAKE_DB=false
QLGP_FRONTEND_GEN_FAKE_DATA=false

# Build setting
NODE_ENV=development
QLGP_USE_BACKEND=true

# App settings
QLGP_BACKEND_PORT=4800
QLGP_SESSION_DURATION=30 # minutes
QLGP_FUSEKI_URL=http://localhost:3030
```

## Docker image: hungitb/qlgp-be
|Env|Default value|Note|
|-|-|-|
|QLGP_BACKEND_PORT|4800|Port run backend|
|QLGP_SESSION_DURATION|30|Session expired in minutes|
|QLGP_FUSEKI_URL|http://localhost:3030|Database URL|

## Docker image: hungitb/qlgp-fuseki
|Env|Default value|Note|
|-|-|-|
|ADMIN_PASSWORD|qlgp|Password dashboard|

## Docker compose for production
```yaml
services:
  backend:
    image: hungitb/qlgp-be
    container_name: qlgp_be
    ports:
      - 4800:4800
    environment:
      QLGP_FUSEKI_URL: http://fuseki:3030
    restart: unless-stopped
  fuseki:
    image: hungitb/qlgp-fuseki
    container_name: qlgp_fuseki
    volumes:
      - ./fuseki-data:/jena-fuseki/DB
    restart: unless-stopped
```
