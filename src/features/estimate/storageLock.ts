// IndexedDB сериализует readwrite-транзакции между вкладками.
// Здесь хранится только маркер блокировки; сами снимки остаются в localStorage.
export function withStorageTransaction<T>(commit: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("osnova.storage-locks", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("locks");
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Хранилище занято"));
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("locks", "readwrite");
      const store = transaction.objectStore("locks");
      let result: T;
      store.get("saved-estimates").onsuccess = () => {
        try {
          result = commit();
          store.put(Date.now(), "saved-estimates");
        } catch {
          transaction.abort();
        }
      };
      transaction.oncomplete = () => {
        database.close();
        resolve(result);
      };
      transaction.onerror = transaction.onabort = () => {
        database.close();
        reject(transaction.error ?? new Error("Запись прервана"));
      };
    };
  });
}
