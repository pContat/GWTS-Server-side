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


export function connect() {
  const connectionString = process.env["MONGO_URI"] || "mongodb://localhost:27017/riviera"

  //Database connexion
  mongoose.connect(connectionString, {useMongoClient: true, promiseLibrary: global.Promise});
  // (<any>mongoose).Promise = global.Promise;
  mongoose.connection.on("error", () => {
    throw "Can't connect to db" + connectionString;
  });

  mongoose.connection.on("connected", () => {
    console.log("Mongoose connection open to " + connectionString);
  });
}
