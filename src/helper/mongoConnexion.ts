/*
Created by : Contat Paul
For any information, please contact at : contat.paul@gmail.com

Create one connexion to mongo database
Is imported to every _model or when db connexion is needed

Warning here : In test section script are removing a lot of data.
Take care this database is not the production one and than you have backup
*/

//Connect to database
import {connect, connection} from "mongoose";


export function mongoSingleConnect() {

  if (!process.env["MONGO_URI"]) {
    throw  new Error("MONGO_URI not found in env ")
  }

  const connectionString = process.env["MONGO_URI"] as string;

  //Database connexion
  connect(connectionString, {promiseLibrary: global.Promise});
  // (<any>mongoose).Promise = global.Promise;
  connection.on("error", () => {
    throw "Can't connect to db " + connectionString;
  });

  connection.on("connected", () => {
    console.log("Mongoose connection open to " + connectionString);
  });
}
