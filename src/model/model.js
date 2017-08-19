"use strict";
//Create a conection with testDatabase in case of test environement or create the classic connection
class Model {
    constructor(schema) {
        if (process.env.NODE_ENV === 'test') {
            const connectTest = require('../helper/dbTest.js');
        } else {
            const connect = require('../helper/db.js');
        }
        this.schema = schema;
    }   
}


module.exports = Model;