# Build new fuseki-server image, add new rule functor
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder

COPY ./jena /jena
WORKDIR /jena/jena-core
RUN mvn -B --file pom.xml -Dmaven.javadoc.skip=true -DskipTests clean install
WORKDIR /jena/jena-fuseki2
RUN mvn -B --file pom.xml -Dmaven.javadoc.skip=true -DskipTests clean install

WORKDIR /
RUN mv /jena/jena-fuseki2/apache-jena-fuseki/target/apache-jena-fuseki-5.1.0.tar.gz fuseki.tar.gz
RUN tar zxf fuseki.tar.gz && mv apache-jena-fuseki-5.1.0/fuseki-server.jar fuseki-server.jar

# Replace old jar file with built file
FROM stain/jena-fuseki:5.1.0
COPY --from=builder /fuseki-server.jar /jena-fuseki/fuseki-server.jar
COPY ./config.ttl /fuseki/config.ttl
COPY ./rules /fuseki/rules
