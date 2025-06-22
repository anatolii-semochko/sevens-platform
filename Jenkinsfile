pipeline {
    agent any
    options {
        timestamp()
    }
    environment {
        CI = 'true'
    }
    stages {
        stage('Init') {
            echo 'Init project'
        }
        stage('Build') {
            parallel {
                stage('API') {
                    steps {
                        echo 'Build API'
                    }
                }
                stage('Front') {
                    steps {
                        echo 'Build Frontend'
                    }
                }
            }
        }
        stage('Push') {
             when {
                 branch 'master'
             }
             steps {
                 echo 'Push build'
//                  withCredentials([
//                      usernamePassword(
//                          credentialsId: 'REGISTRY_AUTH',
//                          usernameVariable: 'USER',
//                          passwordVariable: 'PASSWORD'
//                      )
//                  ]) {
//                      sh 'docker login -u=$USER -p=$PASSWORD $REGISTRY'
//                  }
//                  sh 'make push'
             }
        }
        stage ('Prod') {
            when {
                branch 'master'
            }
            steps {
                echo 'Push to prod'
//                 withCredentials([
//                     string(credentialsId: 'PRODUCTION_HOST', variable: 'HOST'),
//                     string(credentialsId: 'PRODUCTION_PORT', variable: 'PORT'),
//                     file(credentialsId: 'DB_PASSWORD_FILE', variable: 'DB_PASSWORD_FILE'),
//                     string(credentialsId: 'MAILER_HOST', variable: 'MAILER_HOST'),
//                     string(credentialsId: 'MAILER_PORT', variable: 'MAILER_PORT'),
//                     string(credentialsId: 'MAILER_USERNAME', variable: 'MAILER_USERNAME'),
//                     file(credentialsId: 'MAILER_PASSWORD_FILE', variable: 'MAILER_PASSWORD_FILE'),
//                     string(credentialsId: 'MAILER_FROM_EMAIL', variable: 'MAILER_FROM_EMAIL'),
//                     file(credentialsId: 'SENTRY_DSN_FILE', variable: 'SENTRY_DSN_FILE'),
//                     file(credentialsId: 'JWT_ENCRYPTION_KEY_FILE', variable: 'JWT_ENCRYPTION_KEY_FILE'),
//                     file(credentialsId: 'JWT_PUBLIC_KEY', variable: 'JWT_PUBLIC_KEY'),
//                     file(credentialsId: 'JWT_PRIVATE_KEY', variable: 'JWT_PRIVATE_KEY'),
//                     string(credentialsId: 'OAUTH_YANDEX_CLIENT_ID', variable: 'OAUTH_YANDEX_CLIENT_ID'),
//                     file(credentialsId: 'OAUTH_YANDEX_CLIENT_SECRET_FILE', variable: 'OAUTH_YANDEX_CLIENT_SECRET_FILE'),
//                     string(credentialsId: 'OAUTH_MAILRU_CLIENT_ID', variable: 'OAUTH_MAILRU_CLIENT_ID'),
//                     file(credentialsId: 'OAUTH_MAILRU_CLIENT_SECRET_FILE', variable: 'OAUTH_MAILRU_CLIENT_SECRET_FILE'),
//                     string(credentialsId: 'BACKUP_AWS_ACCESS_KEY_ID', variable: 'BACKUP_AWS_ACCESS_KEY_ID'),
//                     file(credentialsId: 'BACKUP_AWS_SECRET_ACCESS_KEY_FILE', variable: 'BACKUP_AWS_SECRET_ACCESS_KEY_FILE'),
//                     string(credentialsId: 'BACKUP_AWS_DEFAULT_REGION', variable: 'BACKUP_AWS_DEFAULT_REGION'),
//                     string(credentialsId: 'BACKUP_S3_ENDPOINT', variable: 'BACKUP_S3_ENDPOINT'),
//                     string(credentialsId: 'BACKUP_S3_BUCKET', variable: 'BACKUP_S3_BUCKET')
//                 ]) {
//                     sshagent (credentials: ['PRODUCTION_AUTH']) {
//                         sh 'make deploy'
//                     }
//                 }
            }
        }
    }
    post {
        success {
            echo 'Post success'
            //sh 'mv -f .docker-images-after .docker-images-before'
        }
        always {
            echo 'Post always'
            //sh 'make docker-down-clear || true'
            //sh 'make testing-down-clear || true'
            //sh 'make deploy-clean || true'
        }
        failure {
            echo 'Post failure'
//             emailext (
//                 subject: "FAIL Job ${env.JOB_NAME} ${env.BUILD_NUMBER}",
//                 body: "Check console output at: ${env.BUILD_URL}/console",
//                 recipientProviders: [[$class: 'DevelopersRecipientProvider']]
//             )
        }
    }
}