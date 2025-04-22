FROM stain/jena-fuseki:5.1.0

ENV FUSEKI_ARGS="--config /fuseki/config.ttl"
ENV ADMIN_PASSWORD=qlgp

COPY ./config.ttl /fuseki/config.ttl
COPY ./rules/ /fuseki/rules
