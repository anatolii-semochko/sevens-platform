FROM composer

FROM php:8.4-cli-alpine

ENV XDEBUG_VERSION 3.4.1

COPY --from=composer /usr/bin/composer /usr/local/bin/composer

RUN apk add --no-cache libpq-dev bash coreutils git linux-headers \
    && git clone --branch ${XDEBUG_VERSION} --depth 1 https://github.com/xdebug/xdebug.git /usr/src/php/ext/xdebug \
    && docker-php-ext-configure xdebug --enable-xdebug-dev \
    && docker-php-ext-install pdo_mysql xdebug \
    && apk del git linux-headers

RUN mv $PHP_INI_DIR/php.ini-development $PHP_INI_DIR/php.ini

COPY ./common/php/conf.d /usr/local/etc/php/conf.d
COPY ./development/php/conf.d /usr/local/etc/php/conf.d

COPY ./common/wait-for-it.sh /usr/local/bin/wait-for-it
RUN chmod 555 /usr/local/bin/wait-for-it

RUN addgroup -g 1001 app && adduser -u 1001 -G app -s /bin/sh -D app

WORKDIR /app

USER app
