/* authentication app */

// include libraries
const path = require('path')  
const bodyParser = require("body-parser");   // to be able to parse post request bodies
const express = require('express')  
const _ = require('lodash');
const jwt = require('jsonwebtoken')
const Promise = require("bluebird")
var config = require('config');

// library initialization
const app = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));



/*
 authentication functions 
*/
const ultraSecretKey = config.get("ultraSecretKey")
// nunca jamas poner una clave plana en un repo de codigo

function generateToken(userName) {
  const payload = {userName: userName}
  return Promise.promisify(jwt.sign)(payload, ultraSecretKey, {})
}

function verifyToken(token) {
 return Promise.promisify(jwt.verify)(token, ultraSecretKey, {}) 
}

// opción: transformar a promisify en vivo
function generateTokenVerboseStyle(userName) {
  return new Promise(function(fulfill,reject) {
    const payload = {userName: userName}
    jwt.sign(payload, ultraSecretKey, {}, function(err, token) {
      if (err) { 
        reject(err) 
      } else {
        fulfill(token)
      }
    })
  })
}



// authentication app - services
// token generation -- OJO que cambie /loginUser por /token
app.post('/token',function(request,response) {
  const theUserName = request.body.userName
  generateToken(theUserName)
    .then(function(theToken) {
      response.status(200)
      response.json( { token: theToken } )
    })
    .catch(function(err) {
      response.status(500)    // internal server error
      response.json( { error: err} )
    })
})

// previously post /checkUser
app.get('/token',function(request,response) {
  const theToken = request.get("Authorization")
  verifyToken(theToken)
    .then(function(decodedPayload) {
      response.status(200)
      response.json( decodedPayload )
    })
    .catch(function(theError) {
      response.status(401)    // unauthorized
      response.json( { error: 'Invalid token'} )
    })
})


console.log('authentication app ready')
app.listen(8081)
