import { isEmpty, isNil } from 'lodash';
import { CraftCriteria, DealCriteria, Flip, RecipeResult } from '../../../type';

export class PostFilter {
  craftCriteria: CraftCriteria;

  constructor(private readonly criteriaList: DealCriteria) {
    this.craftCriteria = this.criteriaList.craft;
  }

  buyPriceFilter = (el: RecipeResult | Flip) => {
    if (this.criteriaList.maxInvestmentPrice <= 0) {
      return true;
    }
    const isFlip = !isNil((<Flip>el).saleIndex);
    return isFlip
      ? el.buyPrice < this.criteriaList.maxInvestmentPrice
      : (<RecipeResult>el).craftPrice < this.criteriaList.maxInvestmentPrice;
  };

  itemLvlFilter = (el: RecipeResult | Flip) => {
    if (this.criteriaList.minItemLevel <= 0) {
      return true;
    }
    return el.item.itemLvl >= this.criteriaList.minItemLevel;
  };

  compoFilter = (el: RecipeResult) => {
    if (this.craftCriteria.maxCompo <= 0) {
      return true;
    }
    return el.ingredients.length <= this.craftCriteria.maxCompo;
  };

  disciplinesFilter = (el: RecipeResult) => {
    if (this.craftCriteria.autoLearnedOnly && !el.autoLearned) {
      return false;
    }
    if (isEmpty(this.craftCriteria.allowedDisciplines)) {
      return true;
    }
    return this.craftCriteria.allowedDisciplines.some(
      (allowedDiscipline) =>
        el.maxLvl <= allowedDiscipline.maxLvl &&
        el.disciplines.includes(allowedDiscipline.discipline),
    );
  };
}
