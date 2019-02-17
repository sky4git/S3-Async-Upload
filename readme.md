# S3 Async Multipart upload

AWS S3 Multipart upload using NodeJS.

## Run with node
AWS_ACCESS_KEY_ID=access_key AWS_SECRET_ACCESS_KEY=secret_key node index mybucket FOLDER_PATH EXTENSION STORAGE_CLASS S3_FOLDER_NAME

# Examples
AWS_ACCESS_KEY_ID=XXXX AWS_SECRET_ACCESS_KEY=XXX node index mybucket "C:\Desktop" jpg GLACIER "cars"
AWS_ACCESS_KEY_ID=XXXX AWS_SECRET_ACCESS_KEY=XXX node index mybucket "C:\Desktop" . STANDARD "cars"
AWS_ACCESS_KEY_ID=XXXX AWS_SECRET_ACCESS_KEY=XXX node index mybucket "C:\Desktop"