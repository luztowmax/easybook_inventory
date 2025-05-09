let inventory = []; 
let cart = [];

const authToken = "44bc34e1bc06b7334c7e51aeb9f1d4060dce5fd5";

async function loadInventory() {
  try {
    const response = await fetch("/api/inventory/", {
      method: "GET",
      headers: {
        "Authorization": `Token ${authToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error("Failed to load inventory:", response.statusText);
      inventory = [];
      updateInventoryTable();
      populateSaleItems();
      return;
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error("Inventory data is not an array:", data);
      inventory = [];
    } else {
      inventory = data;
    }
    updateInventoryTable();
    populateSaleItems();
  } catch (error) {
    console.error("Error loading inventory:", error);
    inventory = [];
    updateInventoryTable();
    populateSaleItems();
  }
}

function updateInventoryTable() {
  const tableBody = document.getElementById("inventory-table");
  tableBody.innerHTML = "";
  inventory.forEach((item) => {
    const row = `
      <tr>
        <td>${item.name}</td>
        <td>${item.size}</td>
        <td>₦${item.price}</td>
        <td>${item.quantity}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})">Delete</button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const csrftoken = getCookie("csrftoken");

function populateSaleItems() {
  const select = document.getElementById("sale-item");
  select.innerHTML = '<option value="">Select an item...</option>';
  inventory.forEach((item) => {
    select.innerHTML += `<option value="${item.id}">${item.name} (${item.size})</option>`;
  });
}

document.getElementById("add-item-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("item-name").value;
  const size = document.getElementById("item-size").value;
  const price = parseFloat(document.getElementById("item-price").value);
  const quantity = parseInt(document.getElementById("item-quantity").value);

  const response = await fetch("/api/inventory/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
      "Authorization": `Token ${authToken}`
    },
    credentials: "include",
    body: JSON.stringify({ name, size, price, quantity }),
  });

  const result = await response.json();
  console.log("Add item response:", result);

  if (response.ok) {
    await loadInventory();
    e.target.reset();
  }
});

// Add item to cart
document.getElementById("sale-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const itemId = parseInt(document.getElementById("sale-item").value);
  const quantity = parseInt(document.getElementById("sale-quantity").value);
  const item = inventory.find((i) => i.id === itemId);

  if (!item || quantity > item.quantity) return alert("Invalid quantity");

  const existing = cart.find((i) => i.id === item.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }
  updateCart();
  e.target.reset();
});

function updateCart() {
  const cartBody = document.getElementById("cart-items");
  cartBody.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    const row = `
      <tr>
        <td>${item.name}</td>
        <td>${item.size}</td>
        <td>${item.quantity}</td>
        <td>₦${item.price}</td>
        <td>₦${itemTotal}</td>
      </tr>
    `;
    cartBody.innerHTML += row;
  });

  document.getElementById("cart-total").textContent = `₦${total.toFixed(2)}`;
}

// Complete sale and get receipt
async function completeSale() {
  if (cart.length === 0) return alert("Cart is empty");

  const customerName = prompt("Enter customer's name:") || "Walk-in Customer";
  const items = cart.map((item) => ({ item_id: item.id, quantity: item.quantity }));

  const response = await fetch("/api/sales/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${authToken}`
    },
    body: JSON.stringify({ items, customer_name: customerName }),
  });

  if (response.ok) {
    const receipt = await response.json();
    displayReceipt(receipt);
    cart = [];
    updateCart();
    await loadInventory();
  }
}

function displayReceipt(receipt) {
  let content = `Receipt ID: ${receipt.id}\n`;
  content += `Customer: ${receipt.customer_name || 'Walk-in Customer'}\n`;
  content += `Date: ${new Date(receipt.date).toLocaleString()}\n`;
  content += `----------------------------------\n`;
  receipt.items.forEach((item) => {
    const unitPrice = item.total_price / item.quantity;
    content += `${item.name} (${item.quantity} x ₦${unitPrice.toFixed(2)}) = ₦${item.total_price.toFixed(2)}\n`;
  });
  content += `----------------------------------\n`;
  content += `Total: ₦${receipt.total.toFixed(2)}`;

  document.getElementById("receipt-content").textContent = content;
  const modal = new bootstrap.Modal(document.getElementById("receiptModal"));
  modal.show();
}

// Print receipt
function printReceipt() {
  const receiptText = document.getElementById("receipt-content").textContent;
  const win = window.open("", "Print", "width=600,height=600");
  win.document.write(`<pre>${receiptText}</pre>`);
  win.document.close();
  win.print();
}

function showInventory() {
  document.getElementById("inventory-section").style.display = "block";
  document.getElementById("sales-section").style.display = "none";
  document.getElementById("reports-section").style.display = "none";
}

window.showInventory = showInventory;

function showSales() {
  document.getElementById("inventory-section").style.display = "none";
  document.getElementById("sales-section").style.display = "block";
  document.getElementById("reports-section").style.display = "none";
}

window.showSales = showSales;

function showReports() {
  document.getElementById("inventory-section").style.display = "none";
  document.getElementById("sales-section").style.display = "none";
  document.getElementById("reports-section").style.display = "block";
}

window.showReports = showReports;

// Initial load
loadInventory();

async function deleteItem(id) {
  const password = prompt("Enter admin password to delete item:");
  if (!password) return alert("Deletion cancelled. Password is required.");

  const response = await fetch(`/api/inventory/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${authToken}`
    },
    body: JSON.stringify({ password }),
  });

  if (response.ok) {
    await loadInventory();
    alert("Item deleted successfully.");
  } else {
    const result = await response.json();
    alert(result.error || "Failed to delete item.");
  }
}
