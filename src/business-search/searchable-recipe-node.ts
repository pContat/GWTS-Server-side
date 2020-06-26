// transform treeNodeToSearchableTreeNode
import {TreeNode} from "../business-receipt/type";
import {BuyableIngredient} from "./type";
import {PriceFinder} from "./service/price-finder.service";
import {isNil} from "lodash";
import {GWAPI} from "../gw-api/gw-api-type";
import Price = GWAPI.Price;
import {RecipeFinderService} from "./service/recipe-finder.service";


export class SearchableRecipeNode<T> extends TreeNode<T> {
  public parent: SearchableRecipeNode<T> | undefined;
  public children: SearchableRecipeNode<T>[];



    constructor(rootTreeNode: TreeNode<T>, parent: SearchableRecipeNode<T> | undefined = undefined) {
    super(rootTreeNode.data);
    this.parent = parent;
    this.children = rootTreeNode.children.map((childTreeNode) => new SearchableRecipeNode<T>(childTreeNode, this))
  }

   // WTF TYPESCRIPT
    toString() {
        return this.data.toString();
    }


}

export function nodeToString(node: SearchableRecipeNode<BuyableIngredient>): string {

  const buyPrice = node.data.originalBuyPrice ? node.data.originalBuyPrice : node.data.buyPrice;
  let craft = (node.data.craftPrice === PriceFinder.CANTCRAFT || node.data.craftPrice === PriceFinder.CANTBUY || isNil(node.data.craftPrice)) ? "KO" : node.data.craftPrice;
  if(node.data.craftPrice === RecipeFinderService.DONTCRAFT){
    craft = "Not Worse"
  }

  return `${node.data.itemId } X ${node.data.count} (buy : ${buyPrice} | craft : ${craft}})`
}
