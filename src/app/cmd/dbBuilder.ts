import minimist from "minimist";
import {DBBuilder} from "../../business";
import logger from "../../helper/logger";
import {setup} from "./abstractExecutable";

(async function main() {
  try {
    setup();
    const argv = minimist(process.argv.slice(2));
    const dbBuilder = new DBBuilder();
    await dbBuilder.importItems();
    logger.info('import done');

  } catch (e) {
    console.error(e.message);
  }
  return
})();

