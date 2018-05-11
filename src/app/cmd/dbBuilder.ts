import minimist from "minimist";
import dotenv from "dotenv";
import {DBBuilder} from "../../business";
import {mongoSingleConnect} from "../../helper";
import logger from "../../helper/logger";

(async function main() {
  try {
    dotenv.config({path: ".env.dev"});
    mongoSingleConnect();
    const argv = minimist(process.argv.slice(2));
    const dbBuilder = new DBBuilder();
    await dbBuilder.importItems();
    logger.info('import done');

  } catch (e) {
    console.error(e.message);
  }
})();

