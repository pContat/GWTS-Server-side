"use strict";
const request = require("request"),
    conf = require("../config");
class CallHelper {
    //Ajax methode get with promise
    static get(url) {
        if (url.indexOf('?') === -1) {
            url += '?lang=' + conf.lang;
        } else {
            url += '&lang=' + conf.lang;
        }
        return new Promise(function (resolve, reject) {
            const options = {
                method: 'GET',
                url: url
            };
            request(options, function (err, response, body) {
                if (!err) {
                    switch (response.statusCode) {
                        //EveryThing works
                        case 200:
                            if (typeof body !== undefined) {
                                const result = JSON.parse(body);
                                resolve(result);
                            }
                            else {
                                //TODO handle other case
                                //no errreur but 0
                                console.log(body);
                                reject(body);
                            }
                            break;
                        //Conflict
                        case 409:
                            console.log(body.version_conflicts + " conflicted");
                            //TODO : handle error
                            reject(body.failures);
                            break;

                        //bad request
                        case 400:
                            reject("Bad request object");
                            break;

                        //Todo : find
                        case 500:
                            reject("Bad request object");
                            break;
                        default:
                            console.log("default");
                            reject(response.statusCode);
                            break;
                    }
                } else {
                    reject(err);
                }
            });
        });
    }

    static getRecipeDetail(recipeId) {
        return this.get('https://api.guildwars2.com/v2/recipes/' + recipeId);
    }

    static getAllRecipe() {
        return this.get('https://api.guildwars2.com/v2/recipes');
    }

    //Get detail of item_id
    static getItemDetail(item_id) {
        const uri = 'https://api.guildwars2.com/v2/items/' + item_id;
        return this.get(uri);
    }

    //Return information of multiple item
    static getItemsDetail(itemsIds) {
        let ids = '?ids=' + itemsIds[0];
        for (let i = 1; i < itemsIds.length; i++) {
            ids += ',' + itemsIds[i];
        }
        const uri = 'https://api.guildwars2.com/v2/items' + ids;
        return this.get(uri);
    }

    //Search for recipe that create 'item_id''
    static searchRecipeFor(item_id) {
        var uri = 'https://api.guildwars2.com/v2/recipes/search?output=' + item_id;
        return this.get(uri)
            .then(function (body) {           
                if(body.length > 0) {
                    return Promise.resolve(body[0]);
                } else {
                    return Promise.resolve(null);
                }
            });
    }

    /****** Trade Place  ****/
    static getCommerceListings(itemsIds) {
        //If more than 4 listingRequested
        // splite the request into multiple request to avoid partial content status
        const listingRequested = itemsIds.length;
        let ids = '?ids=';
        const arrayKey = Object.keys(itemsIds);
        let promiseArray = [];
        for (let i = 0; i < listingRequested; i++) {
            //build the string
            ids += itemsIds[i] + ',';
            //(X & 3) => x % 4
            //if multiple of 4 or last item
            if ((((i + 1) & 3) === 0) || (i === listingRequested - 1)) {
                //remove the last ','
                ids = ids.substring(0, ids.length - 1);
                let uri = 'https://api.guildwars2.com/v2/commerce/listings' + ids;
                promiseArray.push(this.get(uri));
                //initialise the next request
                ids = '?ids=';
            }
        }
        return Promise.all(promiseArray);
    }


    static getCommerceListing(item_id) {
        const uri = 'https://api.guildwars2.com/v2/commerce/listings/' + item_id;
        return this.get(uri);
    }

    static getCommercePrice(item_id) {
        const uri = 'https://api.guildwars2.com/v2/commerce/prices/' + item_id;
        return this.get(uri);
    }

}

module.exports = CallHelper;