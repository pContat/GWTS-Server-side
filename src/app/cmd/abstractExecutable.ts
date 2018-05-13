import {mongoSingleConnect} from "../../lib/index";
import dotenv from "dotenv"

export function setup() {
  dotenv.config({path: ".env.dev"});
  mongoSingleConnect();
}

