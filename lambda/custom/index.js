/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';
const http = require('http');
const request = require('request');
// const Alexa = require('alexa-sdk');
var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient({
  region: "eu-west-1"
});

exports.handler = function(event, context, callback) {
  try {
    if (event.session.new) {

    //   console.log("Request Type: ", event.request.type);

    //   console.log("Intent: ", event.request.intent.name);

      if (event.request.type === 'LaunchRequest') {
        context.succeed(generateResponse(buildSpeechletResponse("Hi, I'm Bus Buddy", true), {}))
      }

      switch (event.request.intent.name) {

        case "GetNextBusIntent":
        // console.log("Intent: ", event.request.intent.slots);
        //   var busStopCode = event.request.intent.slots.busStopCode.value;
        //   var busStopCode = 53444;
        var napTanCode; 
        var params = {
            TableName: 'userNaptanCode', 
            Key: {
                'userId': event.session.user.userId
            }
        }; 
        dynamodb.get(params, function(err, data) {
            if (err) {
                console.log("Failed to save naptan code" + err)
            } else {
                napTanCode = data.Item.napTanCode; 
                getApiData(napTanCode, function(jsonText) {
                    var station = jsonText[0]['stationName'];
                    var time = new Date(jsonText[0]['expectedArrival']).toLocaleTimeString();
                    context.succeed(
                      generateResponse(
                        buildSpeechletResponse("It will arrive at " + station + " stop at " + time, true), {})
                    )
                  });

            }
        }); 
          // var napTanCode = '490010331E';
        break;

        case "SetBusStopIntent":
            var busStopCode = parseInt(event.request.intent.slots.busStopCode.value);
            // var busStopCode = 53444;
            getNapTanCode(busStopCode, function(napTanCode) {
            getApiData(napTanCode, function(jsonText) {
                var station = jsonText[0]['stationName'];
                var time = new Date(jsonText[0]['expectedArrival']).toLocaleTimeString();
                context.succeed(
                    generateResponse(
                    buildSpeechletResponse("It will arrive at " + station + " stop at " + time, true), {})
                )
                });

                var params = {
                    TableName: 'userNaptanCode', 
                    Item: {
                        userId: event.session.user.userId, 
                        napTanCode: napTanCode
                    }
                }; 
                dynamodb.put(params, function(err, data) {
                    if (err) {
                        console.log("Failed to save naptan code" + err)
                    } else {
                        console.log("Saved correctly")
                    }
                
                }); 
            });
      break;

        default:
          context.fail('INVALID REQUEST TYPE: ${event.request.type}')
      }
    }
  } catch (error) {
    context.fail('exception ${error}' + error)
  }
};


var buildSpeechletResponse = (outputTest, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputTest
    },
    shouldEndSession: shouldEndSession
  }
}

var generateResponse = (speechletResponse, sessionAttributes) => {
  return {
    version: "1.0",
    sesionAttributes: sessionAttributes,
    response: speechletResponse
  }
}

function getNapTanCode(busStopCode, callAPI) {
  var result = false;

  var params = {
    TableName: 'busStopCodeLookupFull_v3',
    Key:{
        "busStopCode": busStopCode
    }
  };

  dynamodb.get(params, function(err, data) {
    if (err) {
      console.log(err + ' : ' + response.statusCode);
    } else {
      result = data.Item.naptanAtco;
      callAPI(result);
    }
  });
}

function getApiData(napTanCode, callback) {
    var url = 'https://api.tfl.gov.uk/StopPoint/' + napTanCode + '/arrivals'
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      // from within the callback, write data to response, essentially returning it.
      var jsonText = JSON.parse(body);
      callback(jsonText);
    } else {
      console.log(error + ' : ' + response.statusCode);
    }
  });
}
