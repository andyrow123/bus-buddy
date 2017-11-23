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

      console.log("request type", event.request.type);

      if (event.request.type === 'LaunchRequest') {
        context.succeed(generateResponse(buildSpeechletResponse("Hi, I'm Bus Buddy", true), {}))
      }

      switch (event.request.intent.name) {
        case "getNextBusIntent":
          var busStopCode = 53444;
          getNapTanCode(busStopCode, function(napTanCode) {
            getApiData(napTanCode, function(jsonText) {
                var station = jsonText[0]['stationName'];
                var time = new Date(jsonText[0]['expectedArrival']).toLocaleTimeString();
                context.succeed(
                  generateResponse(
                    buildSpeechletResponse("It will arrive at " + station + " stop at " + time, true), {})
                )
              });
          });
          // var napTanCode = '490010331E';
          
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
    TableName: 'busStopCodeLookupFull',
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
