import {DBBuilder} from "../../business";
import logger from "../../lib/logger/logger";
import {setup} from "./abstractExecutable";

(async function main() {
  try {
    setup();
    const dbBuilder = new DBBuilder();
    await dbBuilder.importItems();
    logger.info('import done');

  } catch (e) {
    console.error(e.message);
  }
  return
})();

