/*
Created by : Contat Paul
For any information, please contact at : contat.paul@gmail.com

Create one connexion to mongo database
Is imported to every model or when db connexion is needed

Warning here : In test section script are removing a lot of data. 
Take care this database is not the production one and than you have backup
*/

"use strict";
//Connect to database
const mongoose = require('mongoose'),
    conf = require('../config.js'),
    connectionString = conf.db.mongo,
    con = mongoose.connect(connectionString); // connect to local database
    // Use native promises
    mongoose.Promise = global.Promise;
    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on('connected', function () {
        console.log('Mongoose default connection open to ' + connectionString);
    });
module.exports = {
    con
};