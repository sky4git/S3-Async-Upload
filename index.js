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
var ext = '.' + process.argv[4]

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
          // check the extension param 
          if( path.extname(dirent.name) === ext || ext === '.' ){
               console.log(dirent.name)
               // do fileupload
               //doUpload( folder+"/"+dirent.name )
          }
       }
    })

});

/**
 * Get multipart upload ID with starintg multipart upload
 * @param {string} filepath 
 */
function createMultiPartUpload( filepath ){
     var params = {
        Bucket: bucket, // put
        Key: "largeobject",
        ACL: "private",
        ServerSideEncryption: 'AES256'
   };
   s3.createMultipartUpload( params, function( err, data ) {
     if (err) console.log(err, err.stack); // an error occurred
     else {
          console.log(data);           // successful response
          // create streams
     }    createStreams( filepath, UploadId );
     /*
     data = {
          Bucket: "examplebucket", 
          Key: "largeobject", 
          UploadId: "ibZBv_75gd9r8lH_gqXatLdxMVpAlj6ZQjEs.OwyF3953YdwbcQnMA2BLGn8Lx12fQNICtMw5KyteFeHw.Sjng--"
     }
     */
   });
}

/**
 * Create stream for each file
 * @param {string} filepath 
 * @param {string} UploadId 
 */
function createStreams( filepath, UploadId ){
     const stream = fs.createReadStream( filepath );
     /* setTimeout(() => {
          stream.close(); // This may not close the stream.
          // Artificially marking end-of-stream, as if the underlying resource had
          // indicated end-of-file by itself, allows the stream to close.
          // This does not cancel pending read operations, and if there is such an
          // operation, the process may still not be able to exit successfully
          // until it finishes.
          stream.push(null);
          stream.read(0);
     }, 100); */
     stream.on('data', (chunk) => {
          console.log( 'Received ${chunk.length} bytes of data for '+filepath );
          // do multipart upload
          doMultiPartUpload( chunk, UploadId );
     });

     stream.on('end', () => {
          console.log('End stream: '+filepath);

     });

     stream.on('close', () => {
          console.log('Close stream: '+filepath);
     });

     stream.on('error', () => {
          console.log('Error on: '+filepath);
     });
}//end func

/**
 * Do multipart upload
 * @param {binary} data 
 * @param {string} UploadId 
 */
function doMultiPartUpload( data, uploadId ){

}// end func

/**
 * finish multipart upload
 * @param {string} params 
 * @param {string} params 
 */
function finishMultiPartUpload( params, uploadId) {
     var params = {
          Bucket: bucket, 
          Key: "largeobject", 
           
          UploadId: ""
         };
         s3.completeMultipartUpload(params, function(err, data) {
           if (err) console.log(err, err.stack); // an error occurred
           else     console.log(data);           // successful response
           /*
           data = {
            Bucket: "acexamplebucket", 
            ETag: "\"4d9031c7644d8081c2829f4ea23c55f7-2\"", 
            Key: "bigobject", 
            Location: "https://examplebucket.s3.amazonaws.com/bigobject"
           }
           */
         });
}

