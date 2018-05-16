import {parseParameter, setup} from "./abstractExecutable";
import {DealFinder} from "../../business/business-search/dealFinder";


(async function () {
  setup();
  const param = parseParameter();
  const dealFinder = new DealFinder();
  const test = await dealFinder.findDeal();
  return
})();
