// client.js - PureFlow Online Client
// ================== CONFIGURATION ==================
const CONFIG = {
    JSONBIN_API_KEY: '$2a$10$EemUkkz5qrB6ehJAaYBYoe2R5Ba/0ZP.hdseALRo583Mt/MLFpFeS',
    BIN_ID: '699089c0d0ea881f40ba2fcf',
    API_URL: 'https://api.jsonbin.io/v3',
    DEBUG: true
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
    } else {
        alert('Error: ' + message);
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
    const total = price * qty;
    const totalEl = document.getElementById('totalAmount');
    if (totalEl) totalEl.textContent = total;
    return total;
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
    debugLog('Customer info saved', customerInfo);
}

// ================== CLOUD FUNCTIONS ==================
function getHeaders() {
    return {
        'X-Master-Key': CONFIG.JSONBIN_API_KEY,
        'Content-Type': 'application/json',
        'X-Bin-Meta': 'false'
    };
}

async function testConnection() {
    const testResult = document.getElementById('testResult');
    if (!testResult) return;
    
    testResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing connection...';
    
    try {
        const headers = getHeaders();
        debugLog('Request headers:', headers);
        
        const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: headers
        });
        
        debugLog('Response status:', response.status);
        
        if (response.status === 200) {
            testResult.innerHTML = '✅ Connection successful!';
            testResult.style.color = '#28a745';
        } else if (response.status === 401) {
            testResult.innerHTML = '❌ Invalid API Key - Check your Master Key';
            testResult.style.color = '#dc3545';
        } else if (response.status === 404) {
            testResult.innerHTML = '❌ Bin not found - Check your Bin ID';
            testResult.style.color = '#dc3545';
        } else {
            testResult.innerHTML = `❌ Error ${response.status}`;
            testResult.style.color = '#dc3545';
        }
    } catch (error) {
        testResult.innerHTML = `❌ Connection error: ${error.message}`;
        testResult.style.color = '#dc3545';
        debugLog('Connection error:', error);
    }
}

async function getCloudOrders() {
    debugLog('Fetching orders from cloud...');
    
    try {
        const headers = getHeaders();
        const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: headers
        });
        
        debugLog('Fetch response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) throw new Error('Invalid API Key - Check your Master Key');
            if (response.status === 404) throw new Error('Bin not found - Check your Bin ID');
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        debugLog('Orders fetched:', Array.isArray(data) ? data.length : 0);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        debugLog('Error fetching orders:', error);
        throw error;
    }
}

async function saveCloudOrders(orders) {
    debugLog('Saving orders to cloud...', orders.length);
    
    try {
        const headers = getHeaders();
        const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(orders)
        });
        
        debugLog('Save response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) throw new Error('Invalid API Key - Check your Master Key');
            if (response.status === 404) throw new Error('Bin not found - Check your Bin ID');
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        debugLog('Error saving orders:', error);
        throw error;
    }
}

// ================== CREATE NEW BIN FUNCTION ==================
async function createNewBin() {
    const apiKey = prompt("Enter your JSONBin.io Master Key (from Profile → API Keys):");
    
    if (!apiKey) return;
    
    try {
        const response = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey,
                'X-Bin-Name': 'PureFlow Orders',
                'X-Bin-Private': 'false'
            },
            body: JSON.stringify([])
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const message = `✅ New Bin Created!\n\nBin ID: ${data.metadata.id}\n\nCopy this to your client.js:\n\nconst CONFIG = {\n    JSONBIN_API_KEY: '${apiKey}',\n    BIN_ID: '${data.metadata.id}',\n    API_URL: 'https://api.jsonbin.io/v3',\n    DEBUG: true\n};`;
            
            alert(message);
            console.log(message);
            
            const testResult = document.getElementById('testResult');
            if (testResult) {
                testResult.innerHTML = `✅ New Bin ID: ${data.metadata.id}`;
                testResult.style.color = '#28a745';
            }
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to create bin'));
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
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
        showError('Please enter a valid phone number');
        return;
    }
    
    saveCustomerInfo();
    showLoading(true);
    
    try {
        debugLog('Starting order submission...');
        
        let existingOrders = [];
        try {
            existingOrders = await getCloudOrders();
        } catch {
            existingOrders = [];
        }
        
        const orderId = 'ORD_' + Date.now().toString().slice(-8) + '_' + 
                       Math.random().toString(36).substr(2, 4).toUpperCase();
        
        const newOrder = {
            id: orderId,
            customerId: customerId,
            customerName: name,
            customerPhone: cleanPhone,
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
        
        debugLog('New order:', newOrder);
        
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
        debugLog('Order submission error:', error);
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
    debugLog('Page loaded, initializing...');
    
    // Load saved customer info
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
    
    // Test connection
    setTimeout(testConnection, 2000);
    
    console.log('✅ PureFlow Online Client Ready');
    console.log('📱 Customer ID:', customerId);
    console.log('🔑 API Key:', CONFIG.JSONBIN_API_KEY ? '✓ Configured' : '✗ Missing');
    console.log('📦 Bin ID:', CONFIG.BIN_ID ? '✓ Configured' : '✗ Missing');
});

// Make functions global
window.testConnection = testConnection;
window.submitOrder = submitOrder;
window.placeAnotherOrder = placeAnotherOrder;
window.changeQty = changeQty;
window.calculateTotal = calculateTotal;
window.createNewBin = createNewBin;
