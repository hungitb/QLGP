# Kỷ niệm build lại source code jena fuseki để thêm custom và câu chuyện buồn sau đó

Khi đang cần làm rule suy luận lớn tuổi hơn thì cần phải so ngày tháng năm sinh. Tuy nhiên builtin functor của fuseki là `lessThan` chỉ có thể so sánh số và ngày tháng format chuẩn. Web của mình sử dụng format khác để lưu ngày tháng dạng `Ngày` hoặc `Ngày/Tháng` hoặc `Ngày/Tháng/Năm` hoặc `Ngày/Tháng/Năm Âm lịch`. Vì vậy cần phải có 1 functor mới và mình đã viết thêm 2 cái functor như dưới đây. Và phải register functor mới tại file [jena-core/src/main/java/org/apache/jena/reasoner/rulesys/BuiltinRegistry.java](./BuiltinRegistry.java).

## qlgpDateLessThan(?x, ?y)
Test đúng nếu **Ngày ?x thực sự bé hơn ngày ?y**. Source code [jena-core/src/main/java/org/apache/jena/reasoner/rulesys/builtins/QlgpDateGE.java](./QlgpDateLessThan.java).

## qlgpDateGE(?x, ?y)
Test đúng nếu **Ngày ?x lớn hơn hoặc bằng ngày ?y; hoặc 2 ngày này không thể so sánh với nhau**. Source code [jena-core/src/main/java/org/apache/jena/reasoner/rulesys/builtins/QlgpDateLessThan.java](./QlgpDateGE.java).

Lúc đầu thêm rule này cố để giải quyết vần đề không mệnh đề phủ định của fuseki nhưng vẫn lòi ra vấn đề khác. Kết luận là vẫn cần mệnh đề phủ định.

# Build image

Build image fuseki
```Dockerfile
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
```

Build với file trên hơi lâu nên lại có trò build trên window trước rồi copy vào image có sẵn
```Dockerfile
# Build in window and copy
FROM stain/jena-fuseki:5.1.0
COPY ./jena/jena-fuseki2/apache-jena-fuseki/target/apache-jena-fuseki-5.1.0.tar.gz fuseki.tar.gz
RUN tar zxf fuseki.tar.gz && mv apache-jena-fuseki-5.1.0/fuseki-server.jar /jena-fuseki/fuseki-server.jar
RUN rm fuseki.tar.gz && rm -rf apache-jena-fuseki-5.1.0
COPY ./config.ttl /fuseki/config.ttl
COPY ./rules /fuseki/rules
```

# Câu truyện buồn
Tuy nhiên chỉ dựa vào các luật trên thì sẽ không đủ vì không phải lúc nào người dùng cũng nhập đủ thông tin và chính những ngày tháng cũng không so được với nhau. Ví dụ `1/6/2025`, `6/2025`, `2025` không thể so được với nhau.

Vì vậy mình phải thêm một số rule bổ trợ ít được ưu tiên như nếu tạo sau thì sẽ ít tuổi hơn. Nhưng những rule này cần mệnh đề phủ định và lúc này mình nhận ra rằng fuseki không hề hỗ trợ mệnh đề phủ định.

Hạn chế của fuseki: Không biểu diễn được các luật phủ định. Do tư tưởng là nếu có thêm tripple thì phải sinh ra tripple mới chứ không phải là làm mất tripple cũ đi.
