/*
Created by : Contat Paul
For any information, please contact at : contat.paul@gmail.com

Create one connexion to mongo database
Is imported to every model or when db connexion is needed

Warning here : In test section script are removing a lot of data.
Take care this database is not the production one and than you have backup
*/

//Connect to database
import * as mongoose from "mongoose";
import * as configuration from "../config";

const connectionString = configuration.default.db.mongo;
const connection: mongoose.Connection = mongoose.createConnection(
  connectionString
);
// Use native promises
(<any>mongoose).Promise = global.Promise;

connection.on("connected", function() {
  console.log("Mongoose default connection open to " + connectionString);
});
connection.on("error", () => {
  throw "Can't connect to db" + connectionString;
});

export { connection };
