import {setup} from "./abstractExecutable";
import {RecipeFinder} from "../../business/business-search/recipeFinder";
import {ItemDAO} from "../../model";


(async function () {
  setup();
  const recipeFinder = new RecipeFinder();
  const itemDao = new ItemDAO();
  const id = 9081;
  const item = await itemDao.model.findOne({id:; ﻿id
})
  if (item) {
    await recipeFinder.getRecipeCraftPrice(item)
  } else {
    console.error('item not found')
  }
  return
})();
