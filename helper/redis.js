"use strict";

//Connect to redis
const redis = require('redis'),
//will use 127.0.0.1 and 6379 by default
client = redis.createClient(); //creates a new client
client.on('connect', function() {
    console.log('redis connected');
});

module.exports = {
    client
};