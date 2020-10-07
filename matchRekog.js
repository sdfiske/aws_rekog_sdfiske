  const AWS = require('aws-sdk')
  var config = require('./config');
  const bucket = config.bucket; //sdf-rekog-example-images'; // the bucketname without s3://
  var imageCompList = [];

  module.exports = (function () {

    var mine = {};

    AWS.config.getCredentials(function(err) {
      if (err) {
        console.log('matchRekog.getCredentials error: ' + err.stack); // credentials not loaded
      }
    });

    AWS.config.update({region: config.region});

    const s3 = new AWS.S3({
      region: AWS.config.region,
      accessKeyId: AWS.config.credentials.accessKeyId,
      secretAccessKey: AWS.config.credentials.secretAccessKey
    })

    const rekog = new AWS.Rekognition();

    // return image match JSON
    mine.getimageCompList = function() {
      return imageCompList;
    }

    // Image matching implementation using AWS Rekognition listFaces function to get FaceId for each
    // image previously indexed with AWS Rekognation indexFaces function and then calling 
    // AWS Rekognition searchFaces function to get image matching information
    mine.searchFaces = async function (colName) {
      imageCompList = []; // init image match JSON return data

      var comparisonList = [];
      var imageCount = 0;
      var imagesCompared = 0;
      var listFacesParams = {};
      var searchFacesParams = {};

      try {
        listFacesParams = {
          CollectionId: colName
        };

        //const listFacesResp = await rekog.listFaces(listFacesParams).promise();
        // get FaceId for each image in collection
        rekog.listFaces(listFacesParams, function(err, data) {
          if (err) {
            console.log('matchRekog.searchFaces->ListFaces error: ', err, err.stack); // display error
          } else {
            data.Faces.forEach(face => {
              imageCount++;
            });

            data.Faces.forEach(face => {
              searchFacesParams = {
                CollectionId: colName,
                FaceId: face.FaceId,
                FaceMatchThreshold: 0 // get match score for ALL image compares
              };

              //await rekog.searchFaces(searchFacesParams, function(err, data) {
              // get image matching information from AWS Rekognition comparing image to all other images in collection
              rekog.searchFaces(searchFacesParams, function(err, data) {                
                if (err) {
                  console.log('matchRekog.searchFaces error: ', err, err.stack); // display error
                } else {
                  // format image match data into JSON format
                  data.FaceMatches.forEach(facematch => {
                    comparisonList.push(
                      {
                        'compareImage': facematch.Face.ExternalImageId,
                        'Score': (Math.round(facematch.Similarity * 100) / 100).toFixed(2), 
                        'NormalizedScore': (Math.round(facematch.Similarity * 100) / 10000).toFixed(4),
                      });
                  });

                  imageCompList.push(
                    {
                      'image': face.ExternalImageId,
                      'comparison': comparisonList
      
                    });
                  comparisonList = [];

                  imagesCompared++;
                  if (imagesCompared >= imageCount) {
                    console.log("\nmatchRekog.js searchFaces RETURN imageCompList: " + JSON.stringify(imageCompList));
                    return imageCompList;  
                  }
                }
              });
            });
          }
        });
      } catch(error) {
        console.log('matchRekog.searchFaces error: ' + error);
      }
    }

    // alternate matching implementation using AWS S3 listObjects function to get objects in S3 bucket
    // and AWS Rekognition searchFacesByImage function to get image matching information
    mine.searchFacesByImage = async function (colName) {
      imageCompList = []; // init image match JSON return data
      var listObjParams = {Bucket: bucket};

      var comparisonList = [];
      var imageCount = 0;
      var imagesCompared = 0;

      try {
        // get list of images in S3 bucket
        const listObjResp = await s3.listObjects(listObjParams).promise();
        listObjResp.Contents.forEach(item => {
          imageCount++;
        });

        listObjResp.Contents.forEach(item => {
          searchFacesByImageParams = {
            CollectionId: colName,
            FaceMatchThreshold: 0,
            Image: {
              S3Object: {
                Bucket: bucket,
                Name: item.Key 
              } 
            }
          };
               
          // compare selected image to all images in S3 bucket
          rekog.searchFacesByImage(searchFacesByImageParams, function(err, data) {
            if (err) {
              console.log('matchRekog.searchFacesByImage error: ', err, err.stack); // display error
            } else {         
              // format image match data into JSON format        
              data.FaceMatches.forEach(matchItem => {
                comparisonList.push(
                  {
                      'compareImage': matchItem.Face.ExternalImageId,
                      'Score': (Math.round(matchItem.Similarity * 100) / 100).toFixed(4),
                      'NormalizedScore': (Math.round(matchItem.Similarity * 100) / 10000).toFixed(4),
                  });
              });

              imageCompList.push(
                {
                  'image': item.Key,
                  'comparison': comparisonList

                });
              comparisonList = [];

              imagesCompared++;
              if (imagesCompared >= imageCount) {
                //console.log('searchFacesByImage RETURN imageCompList: ' + JSON.stringify(imageCompList));
                return imageCompList;
              }         
            }
          });   
        });
      } catch(error) {
        console.log('matchRekog.searchFacesByImage error: ' + error);
      }
    }

    return mine;

  })
    ();
