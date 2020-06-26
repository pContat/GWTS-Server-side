export class CollectionUtils {
  static upsertInArray(collection: Map<any, any[]>, key: any, entry: any) {
    const arrayExist = collection.get(key);
    if (arrayExist) {
      arrayExist.push(entry);
    } else {
      collection.set(key, [entry]);
    }
  }

  /*
 usage :
 {
   docs: users,
   keys: ids,
   prop: "id",
   error: id => `User does not exist (${id})`
 }
  */
  static ensureOrder<T>(options: {
    docs: T[];
    keys: any[];
    prop: string;
    error?: (key: any) => any | null;
  }): T[] {
    const { prop, keys, error, docs } = options;
    // Put documents (docs) into a map where key is a document's ID or some
    // property (prop) of a document and value is a document.
    const docsMap = new Map();
    docs.forEach((doc: any) => docsMap.set(doc[prop], doc));
    // Loop through the keys and for each one retrieve proper document. For not
    // existing documents generate an error.
    return keys.map(key => {
      return docsMap.get(key) || undefined
    });
  }
}
