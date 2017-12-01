/* arithmetic app */

// include libraries
const path = require('path')  
const bodyParser = require("body-parser");   // to be able to parse post request bodies
const express = require('express')  
const _ = require('lodash');
const request = require('request')
const Promise = require("bluebird")
const config = require('config');

// library initialization
const app = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));

// urls
const authURL = config.get("authURL")

// authentication service
function checkAuthToken(token) {
  return new Promise(function(fulfill,reject) {
    request({
      url: (authURL + '/token'), 
      method: 'GET', json: true,
      headers: {'Authorization': token}
    }, 
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        if (body.iat) {
          fulfill()
        } else {
          reject({authStatus: body.status, errorMessage: 'unusual status'})
        }
      } else if (error) {
        reject({errorMessage: 'communication error', authError: error})
      } else {  // response.statusCode != 200
        reject({authStatusCode: response.statusCode, errorMessage: 'authorization rejected'})
      }
    })
  })
}

//arithmetic app - services
app.post('/add',function(request,response) {
  const op1 = Number(request.body.op1)
  const op2 = Number(request.body.op2)
  const authToken = request.get('Authorization')

  console.log(authURL)
  console.log(authToken)
  
  checkAuthToken(authToken).then(function() {
    response.status(200)
    response.json({result: op1 + op2})
  })
  .catch(function(failedAuthData) {
    console.error('Authentication failed: ' + failedAuthData.errorMessage)
    if (failedAuthData.authStatusCode >= 400 && failedAuthData.authStatusCode < 500) {
      response.status(failedAuthData.authStatusCode)
    } else {
      response.status(500)
    }
    response.json(failedAuthData)
  })
})
  
app.listen(8081, null, null, () => console.log('arithmetic app ready'))
