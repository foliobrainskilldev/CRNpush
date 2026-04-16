window.db = {
    name: "NexusCRM_DB",
    version: 3, 
    instance: null,
    stores:['clients', 'leads', 'deals', 'tasks', 'activities', 'multiLineData', 'barChartData', 'products'],

    init: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                    }
                });
            };

            request.onsuccess = async (event) => {
                this.instance = event.target.result;
                await this.seedIfNeeded();
                resolve(this.instance);
            };
            request.onerror = (event) => reject(event.target.error);
        });
    },

    seedIfNeeded: async function() {
        if (!window.crmData) return;
        for (const storeName of this.stores) {
            const currentData = await this.getAllData(storeName);
            if (currentData.length === 0 && window.crmData[storeName]) {
                const transaction = this.instance.transaction([storeName], "readwrite");
                const store = transaction.objectStore(storeName);
                window.crmData[storeName].forEach(item => store.add(item));
            }
        }
    },

    getAllData: function(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.instance) return resolve([]);
            const transaction = this.instance.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    updateItem: function(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    deleteItem: function(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    clearStore: function(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

window.db.init();