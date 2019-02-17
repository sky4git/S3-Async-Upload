/* ENVIRONMENT VARIABLES 
*  AWS_ACCESS_KEY_ID = <YOUR_ACCESS_KEY>
*  AWS_SECRET_ACCESS_KEY = <YOUR SECRET ACCESS KEY>
*  AWS_SESSION_TOKEN (optional)
*  Run this file with following command
*  AWS_ACCESS_KEY_ID = <your_access_key_id> AWS_SECRET_ACCESS_KEY = <your_secret_access_key> node index.js YOUR_BUCKET_NAME YOUR_FOLDER_NAME STORAGE_CLASS S3_FOLDER_NAME
*
*  @ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
*/

const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path');
const EventEmitter = require('events');
const AssociativeArray = require('associative-array');

// define new custom emitter
const customEmitter = new EventEmitter();

// bucket you want the files to be uploaded
var bucket = process.argv[2]
if( typeof bucket === 'undefined' || bucket === '' ){
     console.log('Please provide the bucket name to upload.');
     return;
}
console.log('BUCKET = '+bucket)

// folder from which you want to sync files
var folder = process.argv[3]
if( typeof folder === 'undefined' || folder === '' ){
     console.log('Please provide local folder path.');
     return;
}
console.log('DIRECTORY = '+ folder)

// check the extension argument
var ext =  process.argv[4]
// check if extension is not *
if( typeof ext !== 'undefined' && ext !== '' && ext !== '.' ){   ext = '.'+ ext;   }else{ ext = '.'; }
console.log('EXTENSION ='+ext);

// set storage class
var StorageClass = ( (process.argv[5]) ? process.argv[5] : 'GLACIER' );
console.log('StorageClass ='+StorageClass);
// set empty total parts collector object
var totalPartsCollector = {};

// set empty data collector array
var dataCollectorArr = new AssociativeArray();

// Set the region 
AWS.config.update( { region: 'ap-southeast-2' } );

// get the S3 object
var s3 = new AWS.S3( { apiVersion: '2006-03-01' } );

// set S3 foldername
var s3Folder = process.argv[6];
// check if we have foldername in argument
if( s3Folder ){
     console.log('FOLDER ='+s3Folder )
     // add forward slash to  foldername
     s3Folder = s3Folder + "/";
     //call the function to create the folder
     createFolder(s3Folder);
}else{
     s3Folder = '';
}// end if


/**
 * create new folder in bucket if folder parameter has passed
 * @param s3Folder foldername
 */
function createFolder(s3Folder){

     s3.putObject({ Body: '', Bucket: bucket, StorageClass: StorageClass, Key: s3Folder }, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else{
               //console.log(data);           // successful response
               console.log(s3Folder + " - FOLDER CREATED SUCCESSFULLY");
          }
          /*
          data = {
          ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"", 
          VersionId: "tpf3zF08nBplQK1XLOefGskR7mGDwcDk"
          }
          */
     })/*.on('httpUploadProgress',function (progress) {
          // Log Progress Information
          console.log(Math.round(progress.loaded / progress.total * 100) + '% done');
     });*/
}//end func

// list current objects
/* s3.listObjectsV2({ MaxKeys: 10, Bucket: bucket }, function(err, data) {
     if (err) console.log(err, err.stack); // an error occurred
     else{
          //console.log(data);           // successful response
     }
}); */


// loop through the directory
fs.readdir( folder, { encoding: 'utf-8', withFileTypes: true}, (err, files) => {
    // if error
    if(err) return console.error(err)

    var fileCount = 0;
    files.forEach( function(dirent){
        // double check that it is a file
       if( dirent.isFile() ){
          // check the extension param 
          if( path.extname(dirent.name) === ext || ext === '.' ){
              console.log(folder + "/" +dirent.name)
              // inclrease file count
              fileCount = fileCount + 1;
              // get more info
              fs.stat( folder + "/" +dirent.name, function(err, stats,) {
                    //console.log("fs.stats file size  : " + stats.size )
                    // if file size is less than 5mb
                   /*  if( stats.size < 5000000 ){
                         fs.readFile( folder+"/"+dirent.name, (err, data) => {
                              if (err) throw err;
                              //console.log(data);
                              // upload file
                              uploadFile( data, dirent.name )
                         });
                    }else{ */
                         // create multipart fileupload - ALWAYS
                        createMultiPartUpload( folder+"/"+dirent.name, dirent.name );
                    //}
              })
          }
       }
    })// end foreach

    console.log('Total files to upload: '+ fileCount);

});

/** Get multipart upload ID with starintg multipart upload
* @param {string} filedata 
* @param {string} filename 
*/
function uploadFile( filedata, filename ){
     var params = {
          Body: filedata, 
          Bucket: bucket, 
          Key: s3Folder + filename,
          StorageClass: StorageClass
     };
     s3.putObject(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else{
               //console.log(data);           // successful response
               console.log(filename + " uploaded succesfully");
          }
          /*
          data = {
          ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"", 
          VersionId: "tpf3zF08nBplQK1XLOefGskR7mGDwcDk"
          }
          */
     }).on('httpUploadProgress',function (progress) {
          // Log Progress Information
          console.log(Math.round(progress.loaded / progress.total * 100) + '% done');
     });
}

/**
 * Get multipart upload ID with starintg multipart upload
 * @param {string} filepath 
 * @param {string} filename 
 */
function createMultiPartUpload( filepath, filename ){
   //set params
   var params = {
        Bucket: bucket, // put
        Key: s3Folder + filename, // filename is the key
      //  ACL: "private",
        ServerSideEncryption: 'AES256',
        StorageClass: StorageClass
   };
   // create multipart upload
   s3.createMultipartUpload( params, function( err, data ) {
     if (err){ console.log('ERROR'); console.log( err, err.stack ); // an error occurred
     } else {
          //console.log( data );           // successful response
          // add uploadID to data collector AssociativeArray
          dataCollectorArr.push( data.UploadId, { value: [] } )
          // create streams
     }    createStreams( filepath, data );
     /**
      * data object eample 
      *
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
 * @param {object} uploadPartData
 */
function createStreams( filepath, uploadPartData ){
     // set stream object
     const stream = fs.createReadStream( filepath, { highWaterMark: 5 * 1024 * 1024 } );
     // start with part number 1
     var partNumber = 1;
     // on data event
     stream.on('data', (chunk) => {
          //console.log( partNumber + ': Received '+ chunk.length + ' bytes of data for :'+ filepath );
          // add to upload part data object
          uploadPartData.chunk = chunk;
          uploadPartData.partNumber = partNumber;
          // do multipart upload
          doMultiPartUpload( uploadPartData );
          // increase the part Number
          partNumber++;
     })
     // on end
     stream.on('end', () => {
          //console.log( 'End stream: '+ filepath );
          //console.log( 'total parts:'+ (partNumber -1) );
          // emit setTotalPartsNumber event
          customEmitter.emit( 'setTotalPartsNumber', ( partNumber - 1 ), uploadPartData.UploadId );
     })
     // on close
     stream.on('close', () => {
          //console.log( 'Close stream: '+filepath );
     })
     // on error
     stream.on('error', () => {
          //console.log( 'Error on: '+filepath );
     })
}//end func

/**
 * Do multipart upload
 * @param {array} uploadPartData collection of chunks and object data
 */
function doMultiPartUpload( uploadPartData ){     
     // set params
     var params = {
          Body: uploadPartData.chunk, 
          Bucket: uploadPartData.Bucket, 
          Key: uploadPartData.Key, 
          PartNumber: uploadPartData.partNumber, 
          UploadId: uploadPartData.UploadId
     };
     
     // upload part
     s3.uploadPart( params, function( err, data ) {
           if (err) { //console.log( err, err.stack ); // an error occurred
           } else {   
                // add part number in returned response object
                data.PartNumber = params.PartNumber
                // add uploadId in returned response object
                data.UploadId = params.UploadId
                // add Buclet name in data
                data.Bucket = params.Bucket
                // add key in data
                data.Key = params.Key
                // push eTag to data collector
                dataCollector( data )
           } // successful response
           /**
            * data object example 
            *
           data = {
            ETag: "\"d8c2eafd90c266e19ab9dcacc479f8af\""
           }
           */
     });
}// end func


/**
 * Catch setTotalPartsNumber event
 * @param {int} totalPartsNumber number of total parts for the upload id
 * @param {string} uploadId uploadID of the object
 */
customEmitter.on( 'setTotalPartsNumber', ( totalPartsNumber, uploadId ) => {
     //console.log( 'set Total Parts occurred!' );
     // set array values
     totalPartsCollector[uploadId] = totalPartsNumber   
});

/**
 * Collect eTag data to complete the multipart upload
 * @param {int} dataObj data object of multipart upload
 */
function dataCollector( dataObj ){
     //set the upload id in the array
     var UploadId = dataObj.UploadId
     // check and compare UploadId key exists in dataCollector associative array
     if( dataCollectorArr.has( UploadId ) ){
          // get the value object of associative array
          var vals = dataCollectorArr.get(UploadId)
          // push new value in the values
          vals.value.push( { ETag: dataObj.ETag, PartNumber: dataObj.PartNumber } )
          // check if values array item count is equal to total parts number
          if( totalPartsCollector[UploadId] == vals.value.length ){
               // sort by value
               vals.value.sort(function (a, b) {
                    return a.PartNumber - b.PartNumber;
               });
               // add sorted array to data object
               //dataObj.Parts = vals.value
               // finish mulitpart upload
               finishMultiPartUpload( dataObj )
              //console.log(dataCollectorArr.get(UploadId).value)
          }
     }
}


/**
 * Finish multipart upload
 * @param {object} dataObj data object
 */
function finishMultiPartUpload( dataObj ) {
     var params = {
          Bucket: dataObj.Bucket, 
          Key: dataObj.Key, 
          MultipartUpload: {
               /*Parts: [
                    {
                    ETag: "\"d8c2eafd90c266e19ab9dcacc479f8af\"", 
                    PartNumber: 1
                    }, 
                    {
                    ETag: "\"d8c2eafd90c266e19ab9dcacc479f8af\"", 
                    PartNumber: 2
                    }
               ]*/
               Parts: dataCollectorArr.get(dataObj.UploadId).value
          },  
          UploadId: dataObj.UploadId
     }
    // console.log(params.MultipartUpload.Parts)
     s3.completeMultipartUpload(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else{   
               //  console.log(data);           // successful response
               console.log(data.Key + ' - UPLOADED SUCCESSFULLY')
          }
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