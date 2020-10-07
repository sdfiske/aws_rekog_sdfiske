  const AWS = require('aws-sdk')
  var config = require('./config');
  const bucket = config.bucket; //'sdf-rekog-example-images'; // the bucketname without s3://

  AWS.config.getCredentials(function(err) {
    if (err) {
      console.log(err.stack); // credentials not loaded
    } else {
      //console.log("Access key:", AWS.config.credentials.accessKeyId);
    }
  });

  AWS.config.update({region: config.region});

  const s3 = new AWS.S3({
    region: AWS.config.region,
    accessKeyId: AWS.config.credentials.accessKeyId,
    secretAccessKey: AWS.config.credentials.secretAccessKey
  })

  const rekog = new AWS.Rekognition();

  function createCollection(colName) {
    var colParams = {
      CollectionId: colName
    };
    rekog.createCollection(colParams, function(err, data) {
      if (err) {
        console.log('setup.createCollection: ', err, err.stack); // display error
      } else {
      }
    });
  }

  async function indexFaces(colName) {
    var listObjParams = {Bucket: bucket};
    var indFacesParams = {};

    try {
      const listObjResp = await s3.listObjects(listObjParams).promise();

      listObjResp.Contents.forEach(item => {
        console.log(item.Key);

        indFacesParams = {
          CollectionId: colName,
          DetectionAttributes: ["DEFAULT"],
          ExternalImageId: item.Key,
          Image: {
            S3Object: {
              Bucket: bucket,
              Name: item.Key
            }
          },
          MaxFaces: 1,
          QualityFilter: "AUTO"
        };

        rekog.indexFaces(indFacesParams, function(err, data) {
          if (err) {
            console.log('setup.indexFaces: ', err, err.stack); // display error
          } else {
          }
        });
      })
    } catch(error) {
      console.log('setup.indexFaces error: ' + error + ' message: ' + error.message);
    }
  }

  createCollection(config.collectionName);
  indexFaces(config.collectionName);
