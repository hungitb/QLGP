FROM stain/jena-fuseki:5.1.0

ARG FUSEKI_ARGS=--config /fuseki/config.ttl
ARG ADMIN_PASSWORD=qlgp

COPY ./config.ttl /fuseki/config.ttl
COPY ./rules/ /fuseki/rules
