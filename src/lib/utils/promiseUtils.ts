/**
 * Chained promise
 * Will chaines all params one by one wih the callback function
 */
export async function pseries(
  params: Array<any>,
  callBack: Function
): Promise<any> {
  return params.reduce((promise, item) => {
    return promise.then((result: any) => callBack(item));
  }, Promise.resolve());
}

export async function pseriesFactory(factory: Function[]) {
}


// do not stop promise.all even if one reject
export function reflect(promise: any) {
  return promise.then(
    function (v: any) {
      return {v: v, status: "resolve"};
    },
    function (e: any) {
      return {e: e.message || e, status: "rejected"};
    }
  );
}
