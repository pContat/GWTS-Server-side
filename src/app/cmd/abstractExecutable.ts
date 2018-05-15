import {mongoSingleConnect} from "../../lib";
import dotenv from "dotenv"
import minimist from "minimist";

export function setup() {
  dotenv.config({path: ".env.dev"});
  mongoSingleConnect();
}

export function parseParameter() {
  return minimist(process.argv.slice(2));
}

