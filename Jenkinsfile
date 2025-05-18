pipeline {
    agent any

    environment {
        // Inject environment variables from Jenkins credentials (type: Secret Text)
        ENV_VARS = credentials('env-file-secret')
    }

    stages {
        stage('Checkout') {
            steps {
                git(
                    branch: 'main',
                    credentialsId: 'github-token',
                    url: 'https://github.com/Rayyan-Imtiaz/colorpalette/'
                )
            }
        }

        stage('Verify Files') {
            steps {
                sh 'ls -la'
            }
        }

        stage('Write .env File') {
            steps {
                script {
                    writeFile file: '.env', text: ENV_VARS
                }
                sh 'echo ".env file contents:" && cat .env'
            }
        }

        stage('Clean Up Existing Containers') {
            steps {
                sh '''
                    echo "Stopping and removing existing container if it exists..."
                    docker rm -f color-palette-web-ci || true
                '''
            }
        }

        stage('Build and Deploy') {
            steps {
                sh '''
                    echo "Building and deploying application with docker-compose..."
                    docker-compose -p colorpalette-ci -f docker-compose.yml up -d --build
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "Cleaning up containers..."
                docker-compose -p colorpalette-ci -f docker-compose.yml down || true
            '''
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
