// Initialize inventory and sales cart arrays
let inventory = [];
let salesCart = [];

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', () => {
    // Load inventory from localStorage if available
    loadInventory();
    
    // Initialize event listeners
    document.getElementById('addProductForm').addEventListener('submit', addProduct);
    document.getElementById('addToCartForm').addEventListener('submit', addSaleItem);
    document.getElementById('completeSaleButton').addEventListener('click', completeSale);
    document.getElementById('editProductForm').addEventListener('submit', saveEditProduct);
    
    // Add change event listener for product select
    const productSelect = document.getElementById('productSelect');
    productSelect.addEventListener('change', (event) => {
        const selectedProduct = inventory.find(p => p.id === event.target.value);
        if (selectedProduct) {
            document.getElementById('saleQuantity').value = '1';
        }
    });
    
    // Initial render
    renderInventory();
    updateProductSelect();
    
    // Show sales section if URL has #sales
    if (window.location.hash === '#sales') {
        showSection('sales');
    }
});

// Navigation Functions
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
    
    // Show selected section
    document.getElementById(section + 'Section').classList.remove('hidden');
    
    // Update active tab styling
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[onclick="showSection('${section}')"]`).classList.add('active');
    
    // Update product select if showing sales section
    if (section === 'sales') {
        updateProductSelect();
    }
}

// Inventory Management Functions
function addProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);
    
    try {
        // Validate inputs
        if (!name) throw new Error('Product name is required');
        if (isNaN(price) || price < 0) throw new Error('Price must be a positive number');
        if (isNaN(quantity) || quantity < 0) throw new Error('Quantity must be a non-negative number');
        
        // Create new product
        const product = {
            id: Date.now().toString(),
            name,
            price,
            quantity
        };
        
        // Add to inventory
        inventory.push(product);
        saveInventory();
        
        // Clear form
        event.target.reset();
        
        // Update UI
        renderInventory();
        updateProductSelect();
        showToast('Product added successfully', 'success');
        
    } catch (error) {
        showError('inventoryError', error.message);
    }
}

function editProduct(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    
    // Populate edit form
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductQuantity').value = product.quantity;
    
    // Show modal
    document.getElementById('editModal').classList.remove('hidden');
}

function saveEditProduct(event) {
    event.preventDefault();
    
    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('editProductName').value.trim();
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const quantity = parseInt(document.getElementById('editProductQuantity').value);
    
    try {
        // Validate inputs
        if (!name) throw new Error('Product name is required');
        if (isNaN(price) || price < 0) throw new Error('Price must be a positive number');
        if (isNaN(quantity) || quantity < 0) throw new Error('Quantity must be a non-negative number');
        
        // Update product
        const index = inventory.findIndex(p => p.id === id);
        if (index !== -1) {
            inventory[index] = { id, name, price, quantity };
            saveInventory();
            
            // Update UI
            renderInventory();
            updateProductSelect();
            closeEditModal();
            showToast('Product updated successfully', 'success');
        }
    } catch (error) {
        showError('editError', error.message);
    }
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        inventory = inventory.filter(p => p.id !== productId);
        saveInventory();
        renderInventory();
        updateProductSelect();
        showToast('Product deleted successfully', 'success');
    }
}

function renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';
    
    inventory.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${product.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">${product.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">$${product.price.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${product.quantity}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="editProduct('${product.id}')" 
                    class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct('${product.id}')" 
                    class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Sales Management Functions
function addSaleItem(event) {
    event.preventDefault();
    
    const select = document.getElementById('productSelect');
    const productId = select.options[select.selectedIndex]?.value;
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    
    try {
        // Validate inputs
        if (!productId || productId === "") throw new Error('Please select a product');
        if (isNaN(quantity) || quantity <= 0) throw new Error('Quantity must be a positive number');
        
        const product = inventory.find(p => p.id === productId);
        if (!product) throw new Error('Product not found');
        if (product.quantity < quantity) throw new Error('Insufficient stock');
        
        // Check if product already in cart
        const existingItem = salesCart.find(item => item.productId === productId);
        if (existingItem) {
            if (product.quantity < existingItem.quantity + quantity) {
                throw new Error('Insufficient stock');
            }
            existingItem.quantity += quantity;
        } else {
            salesCart.push({
                productId,
                name: product.name,
                price: product.price,
                quantity
            });
        }
        
        // Update UI
        renderSalesCart();
        
        // Reset form
        select.selectedIndex = 0;
        document.getElementById('saleQuantity').value = '1';
        
        showToast('Item added to cart', 'success');
        
    } catch (error) {
        showError('salesError', error.message);
    }
}

function removeFromCart(index) {
    salesCart.splice(index, 1);
    renderSalesCart();
    showToast('Item removed from cart', 'success');
}

function renderSalesCart() {
    const tbody = document.getElementById('salesCartTableBody');
    const totalSpan = document.getElementById('cartTotal');
    tbody.innerHTML = '';
    
    let total = 0;
    
    salesCart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${item.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">$${item.price.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${item.quantity}</td>
            <td class="px-6 py-4 whitespace-nowrap">$${subtotal.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="removeFromCart(${index})" 
                    class="text-red-600 hover:text-red-900">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    totalSpan.textContent = total.toFixed(2);
    document.getElementById('completeSaleButton').disabled = salesCart.length === 0;
}

function completeSale() {
    try {
        // Update inventory
        salesCart.forEach(item => {
            const product = inventory.find(p => p.id === item.productId);
            if (!product) throw new Error(`Product ${item.name} not found in inventory`);
            if (product.quantity < item.quantity) throw new Error(`Insufficient stock for ${item.name}`);
            product.quantity -= item.quantity;
        });
        
        // Save inventory
        saveInventory();
        
        // Generate receipt
        generateReceipt();
        
        // Clear cart
        salesCart = [];
        renderSalesCart();
        renderInventory();
        showToast('Sale completed successfully', 'success');
        
    } catch (error) {
        showError('salesError', error.message);
    }
}

// Utility Functions
function updateProductSelect() {
    const select = document.getElementById('productSelect');
    select.innerHTML = '<option value="">Choose a product...</option>';
    
    inventory.forEach(product => {
        if (product.quantity > 0) {  // Only show products with stock
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} ($${product.price.toFixed(2)} - ${product.quantity} in stock)`;
            select.appendChild(option);
        }
    });
    
    // Set default quantity
    document.getElementById('saleQuantity').value = '1';
}

function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.classList.add('error-shake');
    
    setTimeout(() => {
        errorDiv.classList.remove('error-shake');
    }, 400);
    
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 3000);
}

function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle text-green-500' : 'exclamation-circle text-red-500'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// Local Storage Functions
function saveInventory() {
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
}

function loadInventory() {
    const saved = localStorage.getItem('pos_inventory');
    if (saved) {
        inventory = JSON.parse(saved);
    }
}

function generateReceipt() {
    const receiptDate = new Date().toLocaleString();
    const receiptNumber = Date.now();
    
    let receiptHTML = `
        <div id="receipt" class="p-4">
            <h2 class="text-xl font-bold mb-4">Sales Receipt</h2>
            <p>Date: ${receiptDate}</p>
            <p>Receipt #: ${receiptNumber}</p>
            <hr class="my-4">
            <table class="w-full mb-4">
                <thead>
                    <tr>
                        <th class="text-left">Item</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let total = 0;
    salesCart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        receiptHTML += `
            <tr>
                <td>${item.name}</td>
                <td class="text-right">$${item.price.toFixed(2)}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${subtotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    receiptHTML += `
                </tbody>
            </table>
            <hr class="my-4">
            <div class="text-right">
                <p class="font-bold">Total: $${total.toFixed(2)}</p>
            </div>
            <p class="mt-8 text-center text-sm">Thank you for your business!</p>
        </div>
    `;
    
    // Create a new window for the receipt
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt #${receiptNumber}</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
            ${receiptHTML}
            <script>
                window.onload = () => {
                    window.print();
                    setTimeout(() => window.close(), 500);
                };
            </script>
        </body>
        </html>
    `);
}
