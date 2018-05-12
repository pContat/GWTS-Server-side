import {ItemDAO} from "../../model";
import {setup} from "./abstractExecutable";


(async function () {
  setup();
  const itemDao = new ItemDAO();
  const item = await itemDao.model.findOne({id: 12562});
  if (item) {
    // await buildRecipeTree(item)
  } else {
    console.error('item not found')
  }
  return
})();
