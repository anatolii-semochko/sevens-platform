PROJECT_NAME=blockchain
APP_PHP_CLI=php-cli

IMAGE_NAME=sevenstime/nginx
IMAGE_TAG=latest
REGISTRY=localhost make build
APP_PATH=.

init: docker-down-clear \
	clear \
	docker-pull docker-build docker-up
init-build: init app-build

up: docker-up
down: docker-down
restart: down up
logs: docker-logs
state: docker-ps

##########
## Docker
##########
docker-up:
	docker compose up -d

docker-down:
	docker compose down --remove-orphans

docker-down-clear:
	docker compose down -v --remove-orphans

docker-pull:
	docker compose pull

docker-build:
	docker compose build --pull

docker-logs:
	docker compose logs -f

docker-ps:
	docker compose ps

##########
## APP
##########
clear:
	docker run --rm -v ${PWD}:/app -w /app alpine sh -c 'rm -rf var/cache/* var/log/* var/test/*'

permission:
	docker run --rm -v ${PWD}:/app -w /app alpine chmod 777 var/cache var/log var/test

deps-install:
	docker compose run --rm ${APP_PHP_CLI} composer install

deps-update:
	docker compose run --rm ${APP_PHP_CLI} composer update

wait-db:
	docker compose run --rm ${APP_PHP_CLI} wait-for-it mysql:3306 -t 30

migration-diff:
	docker compose run --rm ${APP_PHP_CLI} bin/console doctrine:migrations:diff
migration-migrate:
	docker compose run --rm ${APP_PHP_CLI} bin/console doctrine:migrations:migrate

fixtures:
	docker compose run --rm ${APP_PHP_CLI} composer app fixtures:load

check: validate-schema lint analyze test

validate-schema:
	docker compose run --rm ${APP_PHP_CLI} composer app orm:validate-schema -- -v

lint:
	docker compose run --rm ${APP_PHP_CLI} composer lint
	docker compose run --rm ${APP_PHP_CLI} composer rector -- --dry-run
	docker compose run --rm ${APP_PHP_CLI} composer php-cs-fixer fix -- --dry-run --diff

lint-fix:
	docker compose run --rm ${APP_PHP_CLI} composer rector
	docker compose run --rm ${APP_PHP_CLI} composer php-cs-fixer fix

analyze:
	docker compose run --rm ${APP_PHP_CLI} composer psalm -- --no-diff

analyze-diff:
	docker compose run --rm ${APP_PHP_CLI} composer psalm

test:
	docker compose run --rm ${APP_PHP_CLI} composer test

test-coverage:
	docker compose run --rm ${APP_PHP_CLI} composer test-coverage

test-unit:
	docker compose run --rm ${APP_PHP_CLI} composer test -- --testsuite=unit

test-unit-coverage:
	docker compose run --rm ${APP_PHP_CLI} composer test-coverage -- --testsuite=unit

test-functional:
	docker compose run --rm ${APP_PHP_CLI} composer test -- --testsuite=functional

test-functional-coverage:
	docker compose run --rm ${APP_PHP_CLI} composer test-coverage -- --testsuite=functional

##########
## Build
##########
build:
	docker --log-level=debug build --pull --file=docker/production/nginx/Dockerfile --tag=${REGISTRY}/${IMAGE_NAME}-nginx:${IMAGE_TAG} ${APP_PATH}
	docker --log-level=debug build --pull --file=docker/production/php-fpm/Dockerfile --tag=${REGISTRY}/${IMAGE_NAME}-php-fpm:${IMAGE_TAG} ${APP_PATH}
	docker --log-level=debug build --pull --file=docker/production/php-cli/Dockerfile --tag=${REGISTRY}/${IMAGE_NAME}-php-cli:${IMAGE_TAG} ${APP_PATH}
	docker --log-level=debug build --pull --file=docker/common/postgres-backup/php-cli/Dockerfile --tag=${REGISTRY}/${IMAGE_NAME}-postgres-backup:${IMAGE_TAG} ${APP_PATH}

try-build:
	REGISTRY=localhost IMAGE_TAG=0 make build

push:
	docker push ${REGISTRY}/${IMAGE_NAME}-nginx:${IMAGE_TAG}
	docker push ${REGISTRY}/${IMAGE_NAME}-php-fpm:${IMAGE_TAG}
	docker push ${REGISTRY}/${IMAGE_NAME}-php-cli:${IMAGE_TAG}
	docker push ${REGISTRY}/${IMAGE_NAME}-postgres-backup:${IMAGE_TAG}

app-build: routes
	docker compose run --rm --user root ${APP_PHP_CLI} composer install
	docker compose run --rm -w /app web-node npm install
	docker compose run --rm -w /app web-node yarn build

routes:
	docker compose exec -T php-fpm php bin/console fos:js-routing:dump --target=public/build/fos_js_routes.json --format=json

routes-check:
	@echo "Checking routes file..."
	@if [ -f public/build/fos_js_routes.json ]; then \
		echo "✅ Routes file exists: public/build/fos_js_routes.json"; \
		echo "📊 Routes count: $$(jq -r '.routes | length' public/build/fos_js_routes.json 2>/dev/null || echo 'unknown')"; \
	else \
		echo "❌ Routes file not found. Run: make routes"; \
	fi

##########
## Deploy
##########
deploy:
	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'docker network create --driver=overlay blockchain.net || true'
	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'rm -rf site_${BUILD_NUMBER} && mkdir site_${BUILD_NUMBER}'

	envsubst < compose-prod.yml > compose-prod-env.yml
	scp -o StrictHostKeyChecking=no -P ${PORT} compose-prod-env.yml deploy@${HOST}:site_${BUILD_NUMBER}/compose.yml
	rm -f compose-prod-env.yml

	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'mkdir site_${BUILD_NUMBER}/secrets'
	scp -o StrictHostKeyChecking=no -P ${PORT} ${DB_PASSWORD_FILE} deploy@${HOST}:site_${BUILD_NUMBER}/secrets/db_password
	scp -o StrictHostKeyChecking=no -P ${PORT} ${MAILER_PASSWORD_FILE} deploy@${HOST}:site_${BUILD_NUMBER}/secrets/mailer_password
	scp -o StrictHostKeyChecking=no -P ${PORT} ${SENTRY_DSN_FILE} deploy@${HOST}:site_${BUILD_NUMBER}/secrets/sentry_dsn
	scp -o StrictHostKeyChecking=no -P ${PORT} ${JWT_ENCRYPTION_KEY_FILE} deploy@${HOST}:site_${BUILD_NUMBER}/secrets/jwt_encryption_key
	scp -o StrictHostKeyChecking=no -P ${PORT} ${JWT_PUBLIC_KEY} deploy@${HOST}:site_${BUILD_NUMBER}/secrets/jwt_public_key
	scp -o StrictHostKeyChecking=no -P ${PORT} ${JWT_PRIVATE_KEY} deploy@${HOST}:site_${BUILD_NUMBER}/secrets/jwt_private_key
	scp -o StrictHostKeyChecking=no -P ${PORT} ${BACKUP_AWS_SECRET_ACCESS_KEY_FILE} deploy@${HOST}:site_${BUILD_NUMBER}/secrets/backup_aws_secret_access_key

	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'cd site_${BUILD_NUMBER} && docker stack deploy --compose-file compose.yml ${PROJECT_NAME} --with-registry-auth --prune'

deploy-clear:
	rm -f compose-prod-env.yml

rollback:
	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'cd site_${BUILD_NUMBER} && docker stack deploy --compose-file compose.yml ${PROJECT_NAME} --with-registry-auth --prune'

##############
## Node Server
##############
node-server-build:
	docker compose build node-server --no-cache

node-server-restart:
	docker compose up node-server --build -d

node-server-logs:
	docker compose logs -f node-server

node-server-bash:
	docker compose exec node-server sh

##########
## System
##########
bash:
	docker compose run --rm ${APP_PHP_CLI} bash

mysql:
	docker compose exec mysql mysql -uapp -p

node:
	docker compose run --rm web-node bash

yarn-install:
	docker compose run --rm -w /app web-node yarn install

yarn-build-development: routes
	docker compose run --rm -w /app web-node yarn encore dev

yarn-build-production: routes
	docker compose run --rm -w /app web-node yarn build

yarn-watch: routes
	docker compose run --rm -w /app web-node yarn dev-watch

build-permissions:
	sudo chmod 777 composer.json composer.lock config/bundles.php package.json symfony.lock
