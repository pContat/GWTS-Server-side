import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  recipeBuilder() {
    /*(async function () {

      const recipeFinder = new RecipeFinder();
      const itemDao = new ItemDAO();
      let idTofind = 9081;
      idTofind = 11351; //armure
      idTofind = 19916; // insigne
      const condition: any = {'id':; ﻿idTofind
    }
      const item = await itemDao.model.findOne(condition);

      if (item) {
        const test = await recipeFinder.getRecipeCraftPrice(item);
        console.log(test)
      } else {
        console.error('item not found')
      }
      return
    })();*/
  }
}
