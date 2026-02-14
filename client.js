// client-online.js - PureFlow Online Client
// ================== CONFIGURATION ==================
// !!! IMPORTANT: REPLACE WITH YOUR ACTUAL JSONBIN.IO CREDENTIALS !!!
const CONFIG = {
    JSONBIN_API_KEY: '$2a$10$U8BrH5EcRobDpvnrqoD2UecdqTerHvqEMbH.xkf9IO8HYL3ICvhAC', // Get from jsonbin.io
    BIN_ID: '699089c0d0ea881f40ba2fcf', // Your bin ID
    API_URL: 'https://api.jsonbin.io/v3',
    DEBUG: true // <-- Make sure there's a comma after API_URL line
};

// ================== GLOBAL VARIABLES ==================
let customerId = localStorage.getItem('pureflow_customer_id');
if (!customerId) {
    customerId = 'CUST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    localStorage.setItem('pureflow_customer_id', customerId);
}

let customerInfo = JSON.parse(localStorage.getItem('pureflow_customer') || '{}');

// ================== DEBUG FUNCTION ==================
function debugLog(message, data) {
    if (CONFIG.DEBUG) {
        console.log(`🔍 [DEBUG] ${message}`, data || '');
    }
}

// ================== UI FUNCTIONS ==================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorDisplay');
    const errorText = document.getElementById('errorText');
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

function showSuccess(show, orderId = '', phone = '') {
    const successMsg = document.getElementById('successMessage');
    const orderCard = document.querySelector('.order-card');
    if (successMsg && orderCard) {
        successMsg.style.display = show ? 'block' : 'none';
        orderCard.style.display = show ? 'none' : 'block';
        if (show) {
            const orderIdEl = document.getElementById('successOrderId');
            const phoneEl = document.getElementById('successPhone');
            if (orderIdEl) orderIdEl.textContent = `Order #: ${orderId}`;
            if (phoneEl) phoneEl.textContent = phone;
        }
    }
}

function calculateTotal() {
    const qty = parseInt(document.getElementById('quantity')?.value) || 1;
    const size = parseInt(document.getElementById('containerSize')?.value) || 5;
    const price = size === 5 ? 15 : size === 3 ? 10 : 5;
    document.getElementById('totalAmount').textContent = price * qty;
    return price * qty;
}

function changeQty(delta) {
    const input = document.getElementById('quantity');
    if (input) {
        let val = parseInt(input.value) + delta;
        if (val < 1) val = 1;
        if (val > 20) val = 20;
        input.value = val;
        calculateTotal();
    }
}

function saveCustomerInfo() {
    customerInfo = {
        name: document.getElementById('clientName')?.value.trim() || '',
        phone: document.getElementById('clientPhone')?.value.trim() || '',
        address: document.getElementById('clientAddress')?.value.trim() || ''
    };
    localStorage.setItem('pureflow_customer', JSON.stringify(customerInfo));
}

// ================== CLOUD FUNCTIONS ==================
async function testConnection() {
    const testResult = document.getElementById('testResult');
    if (!testResult) return;
    
    testResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}/latest`, {
            headers: { 'X-Master-Key': CONFIG.JSONBIN_API_KEY }
        });
        
        if (response.ok) {
            testResult.innerHTML = '✅ Connection successful!';
            testResult.style.color = '#28a745';
        } else {
            testResult.innerHTML = `❌ Failed: ${response.status}`;
            testResult.style.color = '#dc3545';
        }
    } catch (error) {
        testResult.innerHTML = `❌ Error: ${error.message}`;
        testResult.style.color = '#dc3545';
    }
}

async function getCloudOrders() {
    const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}/latest`, {
        headers: { 'X-Master-Key': CONFIG.JSONBIN_API_KEY }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.record.orders || [];
}

async function saveCloudOrders(orders) {
    const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': CONFIG.JSONBIN_API_KEY
        },
        body: JSON.stringify({ orders })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

// ================== ORDER SUBMISSION ==================
async function submitOrder() {
    const name = document.getElementById('clientName')?.value.trim();
    const phone = document.getElementById('clientPhone')?.value.trim();
    const address = document.getElementById('clientAddress')?.value.trim();
    const size = document.getElementById('containerSize')?.value;
    const qty = parseInt(document.getElementById('quantity')?.value) || 1;
    const total = calculateTotal();
    
    if (!name || !phone || !address) {
        showError('Please fill in all fields');
        return;
    }
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
        showError('Invalid phone number');
        return;
    }
    
    saveCustomerInfo();
    showLoading(true);
    
    try {
        let existingOrders = [];
        try {
            existingOrders = await getCloudOrders();
        } catch {
            existingOrders = [];
        }
        
        const orderId = 'ORD_' + Date.now().toString().slice(-8);
        const newOrder = {
            id: orderId,
            customerId,
            customerName: name,
            customerPhone: cleanPhone,
            customerAddress: address,
            containerSize: size + ' Gallon',
            quantity: qty,
            totalAmount: total,
            status: 'pending',
            orderDate: new Date().toISOString(),
            timestamp: Date.now(),
            source: 'online',
            syncedToAdmin: false
        };
        
        existingOrders.push(newOrder);
        await saveCloudOrders(existingOrders);
        
        let myOrders = JSON.parse(localStorage.getItem('pureflow_my_orders') || '[]');
        myOrders.push(newOrder);
        localStorage.setItem('pureflow_my_orders', JSON.stringify(myOrders));
        
        showLoading(false);
        showSuccess(true, orderId, phone);
        
    } catch (error) {
        showLoading(false);
        showError('Order failed: ' + error.message);
        debugLog('Error:', error);
    }
}

function placeAnotherOrder() {
    showSuccess(false);
    const orderCard = document.querySelector('.order-card');
    if (orderCard) orderCard.style.display = 'block';
    document.getElementById('quantity').value = 1;
    calculateTotal();
}

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', function() {
    // Load saved customer info (using the existing customerId, not redeclaring)
    if (customerInfo.name) {
        document.getElementById('clientName').value = customerInfo.name || '';
        document.getElementById('clientPhone').value = customerInfo.phone || '';
        document.getElementById('clientAddress').value = customerInfo.address || '';
    }
    
    // Event listeners
    document.getElementById('clientName')?.addEventListener('input', saveCustomerInfo);
    document.getElementById('clientPhone')?.addEventListener('input', saveCustomerInfo);
    document.getElementById('clientAddress')?.addEventListener('input', saveCustomerInfo);
    document.getElementById('containerSize')?.addEventListener('change', calculateTotal);
    
    calculateTotal();
    setTimeout(testConnection, 2000);
    
    console.log('✅ PureFlow Online Client Ready');
    console.log('📱 Customer ID:', customerId);
});

// Make functions global
window.testConnection = testConnection;
window.submitOrder = submitOrder;
window.placeAnotherOrder = placeAnotherOrder;
window.changeQty = changeQty;
window.calculateTotal = calculateTotal;
