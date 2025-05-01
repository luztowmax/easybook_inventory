import { StorageManager } from "./storage.js";
import { ReportManager } from "./reports.js";

const storage = new StorageManager();
const reports = new ReportManager();

// Chart configurations
const chartConfigs = {
  topProducts: {
    type: "bar",
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Top Selling Products",
        },
      },
    },
  },
  salesTrend: {
    type: "line",
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Sales Trends",
        },
      },
    },
  },
  inventory: {
    type: "pie",
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Inventory Levels",
        },
      },
    },
  },
  revenue: {
    type: "doughnut",
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Revenue Breakdown",
        },
      },
    },
  },
};

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  refreshInventoryTable();
  refreshSaleItems();
  setupEventListeners();
  reports.updateCharts();
});

function setupEventListeners() {
  const addItemForm = document.getElementById("add-item-form");
  if (addItemForm) {
    addItemForm.addEventListener("submit", handleAddItem);
  }
  const saleForm = document.getElementById("sale-form");
  if (saleForm) {
    saleForm.addEventListener("submit", handleAddToCart);
  }
}

function handleAddItem(e) {
  e.preventDefault();
  try {
    const nameInput = document.getElementById("item-name");
    const priceInput = document.getElementById("item-price");
    const quantityInput = document.getElementById("item-quantity");
    const sizeInput = document.getElementById("item-size");

    if (!nameInput || !priceInput || !quantityInput || !sizeInput) {
      throw new Error("Inventory form elements not found on this page.");
    }

    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const quantity = parseInt(quantityInput.value);
    const size = sizeInput.value.trim();

    validateItemInput(name, price, quantity, size);

    storage.addItem({ name, price, quantity, size });
    refreshInventoryTable();
    refreshSaleItems();
    e.target.reset();
  } catch (error) {
    alert(error.message);
  }
}

function validateItemInput(name, price, quantity, size) {
  if (!name || typeof name !== "string" || name === "") {
    throw new Error("Item name is required and must be a valid string.");
  }
  if (isNaN(price) || price <= 0) {
    throw new Error("Price must be a positive number.");
  }
  if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error("Quantity must be a positive integer.");
  }
  if (!size || typeof size !== "string" || size === "") {
    throw new Error("Size is required and must be a valid string.");
  }
}

function validateSaleInput(itemName, quantity, availableQuantity) {
  if (!itemName) {
    throw new Error("Please select an item.");
  }
  if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error("Quantity must be a positive integer.");
  }
  if (quantity > availableQuantity) {
    throw new Error("Insufficient stock for the selected item.");
  }
}

function refreshInventoryTable() {
  const items = storage.getItems();
  const tbody = document.getElementById("inventory-table");
  tbody.innerHTML = "";

  items.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.size || ""}</td>
      <td>N${item.price.toFixed(2)}</td>
      <td>${item.quantity}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('${
          item.name
        }', '${item.size}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function refreshSaleItems() {
  const select = document.getElementById("sale-item");
  const items = storage.getItems();
  select.innerHTML = '<option value="">Select an item...</option>';

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.name + "|" + item.size; // include size in value for uniqueness
    option.textContent = `${item.name} (Size: ${
      item.size || "N/A"
    }) - N${item.price.toFixed(2)}`;
    select.appendChild(option);
  });
}

let currentCart = [];

function handleAddToCart(e) {
  e.preventDefault();
  try {
    const itemValue = document.getElementById("sale-item").value;
    if (!itemValue) throw new Error("Please select an item.");
    const [itemName, itemSize] = itemValue.split("|");
    const quantity = parseInt(document.getElementById("sale-quantity").value);
    // Removed customerName input reference as it is now prompted on completeSale
    const item = storage
      .getItems()
      .find((i) => i.name === itemName && i.size === itemSize);

    if (!item) {
      throw new Error("Selected item not found in inventory.");
    }

    validateSaleInput(itemName, quantity, item.quantity);

    currentCart.push({
      name: item.name,
      size: item.size,
      quantity,
      price: item.price,
      total: item.price * quantity,
    });

    updateCartDisplay();
    e.target.reset();
  } catch (error) {
    alert(error.message);
  }
}

function updateCartDisplay() {
  const tbody = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  tbody.innerHTML = "";

  let total = 0;
  currentCart.forEach((item) => {
    total += item.total;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.size || ""}</td>
      <td>${item.quantity}</td>
      <td>N${item.price.toFixed(2)}</td>
      <td>N${item.total.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  totalElement.textContent = `N${total.toFixed(2)}`;
}

window.completeSale = function () {
  try {
    if (currentCart.length === 0) {
      throw new Error("Cart is empty. Add items to complete the sale.");
    }

    // Read customer name
    const customerNameInput = document.getElementById("customer-name");
    let customerName = customerNameInput ? customerNameInput.value.trim() : "";

    // If no customer name, prompt for it
    if (!customerName) {
      customerName = prompt("Please enter Customer Name:");
      if (!customerName || customerName.trim() === "") {
        throw new Error("Customer name is required to complete the sale.");
      }
      customerName = customerName.trim();
    }

    // Update inventory
    currentCart.forEach((item) => {
      storage.updateItemQuantity(item.name, item.size, -item.quantity);
    });

    // Record sale
    const sale = {
      items: currentCart,
      total: currentCart.reduce((sum, item) => sum + item.total, 0),
      timestamp: new Date().toISOString(),
      customerName: customerName,
    };

    storage.recordSale(sale);
    currentCart = [];
    updateCartDisplay();
    refreshInventoryTable();
    reports.updateCharts();
    showReceipt(sale, customerName);
    printReceipt();

    // Clear customer name input after sale completion
    if (customerNameInput) {
      customerNameInput.value = "";
    }
  } catch (error) {
    alert(error.message);
  }
};

window.showReceipt = function (sale, customerName) {
  const receiptContent = document.getElementById("receipt-content");
  const date = new Date(sale.timestamp);

  let receipt = `
    EASYBOOK STORE RECEIPT
    ------------------------------
    Customer Name: ${customerName || sale.customerName || "Guest"}
    Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
    ------------------------------
    
    Items:
  `;

  sale.items.forEach((item) => {
    receipt += `
    ${item.name} (Size: ${item.size || "N/A"})
    ${item.quantity} x N${item.price.toFixed(2)} = N${item.total.toFixed(2)}`;
  });

  receipt += `
    ------------------------------
    Total: N${sale.total.toFixed(2)}
    
    Thank you for patronizing us☺️\n    Hope to see you next time🌾!
  `;

  receiptContent.innerHTML = receipt;

  const receiptModal = new bootstrap.Modal(
    document.getElementById("receiptModal"),
    {
      backdrop: "static",
      keyboard: false,
    }
  );

  receiptModal.show();
  document
    .getElementById("receiptModal")
    .addEventListener("shown.bs.modal", function () {
      document.querySelector("#receiptModal .btn-primary").focus();
    });
};

window.printReceipt = function () {
  window.print();
};

window.deleteItem = function (itemName, size) {
  if (confirm("Are you sure you want to delete this item?")) {
    storage.deleteItem(itemName, size);
    refreshInventoryTable();
    refreshSaleItems();
  }
};

window.showInventory = function () {
  document.getElementById("inventory-section").style.display = "block";
  document.getElementById("sales-section").style.display = "none";
  document.getElementById("reports-section").style.display = "none";
};

window.showSales = function () {
  document.getElementById("inventory-section").style.display = "none";
  document.getElementById("sales-section").style.display = "block";
  document.getElementById("reports-section").style.display = "none";
};

window.showReports = function () {
  document.getElementById("inventory-section").style.display = "none";
  document.getElementById("sales-section").style.display = "none";
  document.getElementById("reports-section").style.display = "block";

  initCharts();
  reports.updateCharts();
  reports.updateSalesSummaryTable(JSON.parse(localStorage.getItem('sales')) || []);
};

function initCharts() {
  const topProductsCtx = document
    .getElementById("topProductsChart")
    .getContext("2d");
  new Chart(topProductsCtx, {
    type: chartConfigs.topProducts.type,
    data: {
      labels: [],
      datasets: [
        {
          label: "Quantity Sold",
          data: [],
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: chartConfigs.topProducts.options,
  });

  const salesTrendCtx = document
    .getElementById("salesTrendChart")
    .getContext("2d");
  new Chart(salesTrendCtx, {
    type: chartConfigs.salesTrend.type,
    data: {
      labels: [],
      datasets: [
        {
          label: "Sales",
          data: [],
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    },
    options: chartConfigs.salesTrend.options,
  });

  const inventoryCtx = document
    .getElementById("inventoryChart")
    .getContext("2d");
  new Chart(inventoryCtx, {
    type: chartConfigs.inventory.type,
    data: {
      labels: [],
      datasets: [
        {
          label: "Inventory",
          data: [],
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: chartConfigs.inventory.options,
  });

  const revenueCtx = document.getElementById("revenueChart").getContext("2d");
  new Chart(revenueCtx, {
    type: chartConfigs.revenue.type,
    data: {
      labels: [],
      datasets: [
        {
          label: "Revenue",
          data: [],
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: chartConfigs.revenue.options,
  });
}
