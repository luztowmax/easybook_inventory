// export class StorageManager {
//   constructor() {
//     this.initializeStorage();
//   }

//   initializeStorage() {
//     try {
//       if (!localStorage.getItem("inventory")) {
//         localStorage.setItem("inventory", JSON.stringify([]));
//       }
//       if (!localStorage.getItem("sales")) {
//         localStorage.setItem("sales", JSON.stringify([]));
//       }
//     } catch (error) {
//       console.error("Error initializing local storage:", error);
//       alert("Failed to initialize storage. Please refresh the page.");
//     }
//   }

//   getItems() {
//     return JSON.parse(localStorage.getItem("inventory"));
//   }

//   addItem(item) {
//     const items = this.getItems();
//     // Find existing item by both name and size
//     const existingItem = items.find((i) => i.name === item.name && i.size === item.size);

//     if (existingItem) {
//       existingItem.quantity += item.quantity;
//       existingItem.price = item.price;
//     } else {
//       items.push(item);
//     }

//     localStorage.setItem("inventory", JSON.stringify(items));
//   }

//   updateItemQuantity(itemName, size, change) {
//     const items = this.getItems();
//     const item = items.find((i) => i.name === itemName && i.size === size);
//     if (item) {
//       item.quantity += change;
//       localStorage.setItem("inventory", JSON.stringify(items));
//     }
//   }

//   deleteItem(itemName, size) {
//     const items = this.getItems();
//     const filteredItems = items.filter((i) => !(i.name === itemName && i.size === size));
//     localStorage.setItem("inventory", JSON.stringify(filteredItems));
//   }

//   getSales() {
//     return JSON.parse(localStorage.getItem("sales"));
//   }

//   recordSale(sale) {
//     const sales = this.getSales();
//     sales.push(sale);
//     localStorage.setItem("sales", JSON.stringify(sales));
//   }
// }
export class ApiManager {
  constructor(apiBaseUrl, token) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }

  async request(url, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${this.apiBaseUrl}${url}`, options);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API Error: ${res.status} ${errorText}`);
    }
    return await res.json();
  }

  // Inventory
  async getItems() {
    return await this.request('/inventory/');
  }

  async addItem(item) {
    return await this.request('/inventory/', 'POST', item);
  }

  async updateItem(id, updatedItem) {
    return await this.request(`/inventory/${id}/`, 'PUT', updatedItem);
  }

  async deleteItem(id) {
    return await this.request(`/inventory/${id}/`, 'DELETE');
  }

  // Sales
  async getSales() {
    return await this.request('/sales/');
  }

  async recordSale(sale) {
    return await this.request('/sales/', 'POST', sale);
  }
}

