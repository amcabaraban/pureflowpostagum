// client-online.js - PureFlow Online Client Ordering
// CONFIGURATION - REPLACE WITH YOUR OWN!
const CONFIG = {
    JSONBIN_API_KEY: '$2a$10$YourActualAPIKeyHere', // Get from jsonbin.io
    BIN_ID: 'your-bin-id-here', // Your bin ID
    API_URL: 'https://api.jsonbin.io/v3'
};

// ================== INITIALIZATION ==================
let customerId = localStorage.getItem('pureflow_customer_id');
if (!customerId) {
    customerId = 'CUST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    localStorage.setItem('pureflow_customer_id', customerId);
}

// Load saved customer info
let customerInfo = JSON.parse(localStorage.getItem('pureflow_customer') || '{}');
if (customerInfo.name) {
    document.getElementById('clientName').value = customerInfo.name;
    document.getElementById('clientPhone').value = customerInfo.phone;
    document.getElementById('clientAddress').value = customerInfo.address;
}

// ================== UI FUNCTIONS ==================
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showSuccess(show) {
    document.getElementById('successMessage').style.display = show ? 'block' : 'none';
    document.querySelector('.order-card').style.display = show ? 'none' : 'block';
}

function calculateTotal() {
    const qty = parseInt(document.getElementById('quantity').value) || 1;
    const size = parseInt(document.getElementById('containerSize').value);
    const price = size === 5 ? 15 : size === 3 ? 10 : 5;
    document.getElementById('totalAmount').textContent = price * qty;
}

function changeQty(delta) {
    const input = document.getElementById('quantity');
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    if (val > 20) val = 20;
    input.value = val;
    calculateTotal();
}

function saveCustomerInfo() {
    customerInfo = {
        name: document.getElementById('clientName').value.trim(),
        phone: document.getElementById('clientPhone').value.trim(),
        address: document.getElementById('clientAddress').value.trim()
    };
    localStorage.setItem('pureflow_customer', JSON.stringify(customerInfo));
}

// ================== CLOUD SYNC FUNCTIONS ==================

// Get all orders from cloud
async function getCloudOrders() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': CONFIG.JSONBIN_API_KEY
            }
        });
        const data = await response.json();
        return data.record.orders || [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// Save orders to cloud
async function saveCloudOrders(orders) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.JSONBIN_API_KEY
            },
            body: JSON.stringify({ orders: orders })
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving orders:', error);
        throw error;
    }
}

// Submit new order
async function submitOrder() {
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress').value.trim();
    const size = document.getElementById('containerSize').value;
    const qty = parseInt(document.getElementById('quantity').value);
    const total = calculateTotal();
    
    // Validation
    if (!name || !phone || !address) {
        alert('Please fill in all your details');
        return;
    }
    
    if (phone.length < 10) {
        alert('Please enter a valid phone number');
        return;
    }
    
    // Save locally
    saveCustomerInfo();
    
    // Show loading
    showLoading(true);
    
    try {
        // Get existing orders
        const existingOrders = await getCloudOrders();
        
        // Create new order
        const newOrder = {
            id: 'ORD_' + Date.now().toString().slice(-8),
            customerId: customerId,
            customerName: name,
            customerPhone: phone,
            customerAddress: address,
            containerSize: size + ' Gallon',
            containerValue: parseInt(size),
            quantity: qty,
            totalAmount: total,
            status: 'pending',
            orderDate: new Date().toISOString(),
            timestamp: Date.now(),
            source: 'online',
            syncedToAdmin: false
        };
        
        // Add to orders array
        existingOrders.push(newOrder);
        
        // Save to cloud
        await saveCloudOrders(existingOrders);
        
        // Also save to customer's local storage for reference
        let myOrders = JSON.parse(localStorage.getItem('pureflow_my_orders') || '[]');
        myOrders.push({
            ...newOrder,
            savedLocally: true
        });
        localStorage.setItem('pureflow_my_orders', JSON.stringify(myOrders));
        
        // Show success
        showLoading(false);
        showSuccess(true);
        
    } catch (error) {
        showLoading(false);
        alert('Error placing order. Please try again or call us directly.');
        console.error('Order submission error:', error);
    }
}

function placeAnotherOrder() {
    showSuccess(false);
    document.querySelector('.order-card').style.display = 'block';
    document.getElementById('quantity').value = 1;
    calculateTotal();
}

// ================== EVENT LISTENERS ==================
document.getElementById('clientName').addEventListener('input', saveCustomerInfo);
document.getElementById('clientPhone').addEventListener('input', saveCustomerInfo);
document.getElementById('clientAddress').addEventListener('input', saveCustomerInfo);
document.getElementById('containerSize').addEventListener('change', calculateTotal);

// Initialize
calculateTotal();
console.log('✅ PureFlow Online Client Ready');// client.js - PureFlow Client Ordering System

// ================== INITIALIZATION ==================
let customerId = localStorage.getItem('pureflow_customer_id');
if (!customerId) {
    customerId = 'CUST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    localStorage.setItem('pureflow_customer_id', customerId);
}

// Load saved data
let myOrders = JSON.parse(localStorage.getItem('pureflow_orders') || '[]');
let customerInfo = JSON.parse(localStorage.getItem('pureflow_customer') || '{}');

// ================== LOAD SAVED CUSTOMER INFO ==================
if (customerInfo.name) {
    document.getElementById('clientName').value = customerInfo.name || '';
    document.getElementById('clientPhone').value = customerInfo.phone || '';
    document.getElementById('clientAddress').value = customerInfo.address || '';
}

// ================== FUNCTIONS ==================
function calculateTotal() {
    const qty = parseInt(document.getElementById('quantity').value) || 1;
    const size = parseInt(document.getElementById('containerSize').value);
    const price = size === 5 ? 15 : size === 3 ? 10 : 5;
    const total = price * qty;
    document.getElementById('totalAmount').textContent = total;
    return total;
}

function changeQty(delta) {
    const input = document.getElementById('quantity');
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    if (val > 20) val = 20;
    input.value = val;
    calculateTotal();
}

// Auto-save customer info
function saveCustomerInfo() {
    customerInfo = {
        name: document.getElementById('clientName').value.trim(),
        phone: document.getElementById('clientPhone').value.trim(),
        address: document.getElementById('clientAddress').value.trim(),
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('pureflow_customer', JSON.stringify(customerInfo));
}

// Submit order
function submitOrder() {
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress').value.trim();
    const size = document.getElementById('containerSize').value;
    const qty = parseInt(document.getElementById('quantity').value);
    const total = calculateTotal();
    
    // Validation
    if (!name) {
        alert('⚠️ Please enter your name');
        document.getElementById('clientName').focus();
        return;
    }
    
    if (!phone) {
        alert('⚠️ Please enter your phone number');
        document.getElementById('clientPhone').focus();
        return;
    }
    
    if (phone.length < 10) {
        alert('⚠️ Please enter a valid phone number');
        document.getElementById('clientPhone').focus();
        return;
    }
    
    if (!address) {
        alert('⚠️ Please enter your delivery address');
        document.getElementById('clientAddress').focus();
        return;
    }
    
    // Save customer info
    saveCustomerInfo();
    
    // Create order
    const order = {
        id: 'ORD_' + Date.now().toString().slice(-8),
        customerId: customerId,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        containerSize: size + ' Gallon',
        containerValue: parseInt(size),
        quantity: qty,
        totalAmount: total,
        status: 'pending',
        orderDate: new Date().toISOString(),
        timestamp: Date.now(),
        synced: false
    };
    
    myOrders.push(order);
    localStorage.setItem('pureflow_orders', JSON.stringify(myOrders));
    
    // Reset quantity
    document.getElementById('quantity').value = 1;
    calculateTotal();
    
    // Show success message
    showNotification('✅ Order placed successfully!', 'success');
    
    // Refresh order history
    displayOrderHistory();
    
    // Scroll to order history
    setTimeout(() => {
        document.querySelector('.order-history').scrollIntoView({ behavior: 'smooth' });
    }, 500);
}

// Display order history
function displayOrderHistory() {
    const historyDiv = document.getElementById('orderHistory');
    
    if (!historyDiv) return;
    
    if (myOrders.length === 0) {
        historyDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>No orders yet</p>
                <small>Place your first order above</small>
            </div>
        `;
        return;
    }
    
    // Show recent orders (last 10)
    const recentOrders = [...myOrders].reverse().slice(0, 10);
    
    let html = '';
    recentOrders.forEach(order => {
        const date = new Date(order.orderDate).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        let statusBadge = '';
        let statusClass = '';
        
        if (order.status === 'delivered') {
            statusBadge = '<span class="status-badge delivered">✓ Delivered</span>';
            statusClass = 'order-delivered';
        } else if (order.status === 'cancelled') {
            statusBadge = '<span class="status-badge cancelled">✗ Cancelled</span>';
            statusClass = 'order-cancelled';
        } else {
            statusBadge = '<span class="status-badge pending">⏳ Pending</span>';
            statusClass = 'order-pending';
        }
        
        const syncBadge = !order.synced ? '<span class="sync-badge">📱 Not synced</span>' : '';
        
        html += `
            <div class="order-item ${statusClass}">
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-date">${date}</span>
                </div>
                <div class="order-details">
                    <span><i class="fas fa-tint"></i> ${order.quantity} x ${order.containerSize}</span>
                    <span class="order-total">₱${order.totalAmount}</span>
                </div>
                <div class="order-footer">
                    ${statusBadge}
                    ${syncBadge}
                </div>
            </div>
        `;
    });
    
    historyDiv.innerHTML = html;
    
    // Add total count if more than 10
    if (myOrders.length > 10) {
        historyDiv.innerHTML += `
            <div class="order-summary">
                <small>Showing 10 of ${myOrders.length} orders</small>
            </div>
        `;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Generate sync QR code (for in-store scanning)
function generateSyncQR() {
    const qrSection = document.getElementById('qrSyncSection');
    if (!qrSection) return;
    
    // Check if there are unsynced orders
    const unsyncedCount = myOrders.filter(o => !o.synced).length;
    
    if (unsyncedCount === 0) {
        qrSection.style.display = 'none';
        return;
    }
    
    qrSection.style.display = 'block';
    
    // Create sync data
    const syncData = {
        customerId: customerId,
        customerInfo: customerInfo,
        orders: myOrders.filter(o => !o.synced).map(o => ({
            id: o.id,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerAddress: o.customerAddress,
            containerSize: o.containerSize,
            quantity: o.quantity,
            totalAmount: o.totalAmount,
            orderDate: o.orderDate,
            status: o.status
        }))
    };
    
    // Generate QR code if QRCode library is available
    if (typeof QRCode !== 'undefined') {
        const qrContainer = document.getElementById('syncQR');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: JSON.stringify(syncData),
            width: 200,
            height: 200,
            colorDark: "#28a745",
            colorLight: "#ffffff"
        });
    }
}

// ================== EVENT LISTENERS ==================
document.getElementById('clientName').addEventListener('input', saveCustomerInfo);
document.getElementById('clientPhone').addEventListener('input', saveCustomerInfo);
document.getElementById('clientAddress').addEventListener('input', saveCustomerInfo);
document.getElementById('containerSize').addEventListener('change', calculateTotal);

// ================== INITIAL DISPLAY ==================
displayOrderHistory();
calculateTotal();

// Check for unsynced orders and show QR
setTimeout(() => {
    generateSyncQR();
}, 1000);

// Auto-refresh order history every 30 seconds (for status updates)
setInterval(() => {
    myOrders = JSON.parse(localStorage.getItem('pureflow_orders') || '[]');
    displayOrderHistory();
    generateSyncQR();
}, 30000);

console.log('✅ PureFlow Client ready! Customer ID:', customerId);