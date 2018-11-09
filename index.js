/* ENVIRONMENT VARIABLES 
*  AWS_ACCESS_KEY_ID = <YOUR_ACCESS_KEY>
*  AWS_SECRET_ACCESS_KEY = <YOUR SECRET ACCESS KEY>
*  AWS_SESSION_TOKEN (optional)
*  Run this file with following command
*  AWS_ACCESS_KEY_ID = <your_access_key_id> AWS_SECRET_ACCESS_KEY = <your_secret_access_key> node index.js YOUR_BUCKET_NAME YOUR_FOLDER_NAME
*
*  @ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
*/

const AWS = require('aws-sdk')
const uuid = require('uuid')
const fs = require('fs')
const path = require('path');

// bucket you want the files to be uploaded
var bucket = process.argv[2]
// folder from which you want to sync files
var folder = process.argv[3]


// Set the region 
AWS.config.update( { region: 'ap-southeast-2' } );

// get the S3 object
var s3 = new AWS.S3( { apiVersion: '2006-03-01' } );

console.log('BUCKET = '+bucket)
console.log('DIRECTORY = '+ folder)
// console.log(s3)

// loop through the directory
fs.readdir( folder, { encoding: 'utf-8', withFileTypes: true}, (err, files) => {
    // if error
    if(err) return console.error(err)

    files.forEach( function(dirent){
        // double check that it is a file
       if( dirent.isFile() ){
            console.log(dirent.name)
       }
    })

})


/* The following example initiates a multipart upload. */
/*var params = {
        Bucket: bucket, // put
        Key: "largeobject"
   };
   s3.createMultipartUpload(params, function(err, data) {
     if (err) console.log(err, err.stack); // an error occurred
     else     console.log(data);           // successful response
     /*
     data = {
      Bucket: "examplebucket", 
      Key: "largeobject", 
      UploadId: "ibZBv_75gd9r8lH_gqXatLdxMVpAlj6ZQjEs.OwyF3953YdwbcQnMA2BLGn8Lx12fQNICtMw5KyteFeHw.Sjng--"
     }
     */
//});