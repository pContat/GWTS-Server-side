import {mongoSingleConnect} from "../../helper";
import dotenv from "dotenv"

export function setup() {
  dotenv.config({path: ".env.dev"});
  mongoSingleConnect();
}

