// client-online.js - PureFlow Online Client
// ================== CONFIGURATION ==================
// !!! IMPORTANT: REPLACE WITH YOUR ACTUAL JSONBIN.IO CREDENTIALS !!!
const CONFIG = {
    JSONBIN_API_KEY: '$2a$10$3mqRHpEXrn2wWNe1K2h4cuHjnlNzZP8HdJZeEvczm1LPTT/0nJoVK', // Get from jsonbin.io
    BIN_ID: '69906fa1d0ea881f40b9fe97', // Your bin ID
    API_URL: 'https://api.jsonbin.io/v3'
    DEBUG: true // Set to false in production
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
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorDisplay');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(show, orderId = '', phone = '') {
    document.getElementById('successMessage').style.display = show ? 'block' : 'none';
    document.querySelector('.order-card').style.display = show ? 'none' : 'block';
    if (show) {
        document.getElementById('successOrderId').textContent = `Order #: ${orderId}`;
        document.getElementById('successPhone').textContent = phone;
    }
}

function calculateTotal() {
    const qty = parseInt(document.getElementById('quantity').value) || 1;
    const size = parseInt(document.getElementById('containerSize').value);
    const price = size === 5 ? 15 : size === 3 ? 10 : 5;
    document.getElementById('totalAmount').textContent = price * qty;
    return price * qty;
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
        name: document.getElementById('Name').value.trim(),
        phone: document.getElementById('Phone').value.trim(),
        address: document.getElementById('Address').value.trim()
    };
    localStorage.setItem('pureflow_customer', JSON.stringify(customerInfo));
    debugLog('Customer info saved', customerInfo);
}

// ================== CLOUD FUNCTIONS ==================
async function testConnection() {
    const testResult = document.getElementById('testResult');
    testResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': CONFIG.JSONBIN_API_KEY
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            testResult.innerHTML = '✅ Connection successful! Server is reachable.';
            testResult.style.color = '#28a745';
            debugLog('Connection test successful', data);
        } else {
            testResult.innerHTML = `❌ Connection failed: ${response.status} ${response.statusText}`;
            testResult.style.color = '#dc3545';
        }
    } catch (error) {
        testResult.innerHTML = `❌ Connection error: ${error.message}`;
        testResult.style.color = '#dc3545';
        debugLog('Connection test error', error);
    }
}

async function getCloudOrders() {
    debugLog('Fetching orders from cloud...');
    try {
        const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': CONFIG.JSONBIN_API_KEY
            }
        });
        
        debugLog('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        debugLog('Cloud data received', data);
        return data.record.orders || [];
    } catch (error) {
        debugLog('Error fetching orders:', error);
        throw error;
    }
}

async function saveCloudOrders(orders) {
    debugLog('Saving orders to cloud...', orders);
    try {
        const response = await fetch(`${CONFIG.API_URL}/b/${CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.JSONBIN_API_KEY
            },
            body: JSON.stringify({ orders: orders })
        });
        
        debugLog('Save response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        debugLog('Error saving orders:', error);
        throw error;
    }
}

// ================== ORDER SUBMISSION ==================
async function submitOrder() {
    const name = document.getElementById('Name').value.trim();
    const phone = document.getElementById('Phone').value.trim();
    const address = document.getElementById('Address').value.trim();
    const size = document.getElementById('containerSize').value;
    const qty = parseInt(document.getElementById('quantity').value);
    const total = calculateTotal();
    
    // Validation
    if (!name) {
        showError('Please enter your name');
        document.getElementById('Name').focus();
        return;
    }
    
    if (!phone) {
        showError('Please enter your phone number');
        document.getElementById('Phone').focus();
        return;
    }
    
    if (phone.replace(/[^0-9]/g, '').length < 10) {
        showError('Please enter a valid 10-11 digit phone number');
        document.getElementById('Phone').focus();
        return;
    }
    
    if (!address) {
        showError('Please enter your delivery address');
        document.getElementById('Address').focus();
        return;
    }
    
    // Save locally
    saveCustomerInfo();
    
    // Show loading
    showLoading(true);
    
    try {
        debugLog('Starting order submission...');
        
        // Get existing orders
        let existingOrders = [];
        try {
            existingOrders = await getCloudOrders();
            debugLog('Existing orders:', existingOrders);
        } catch (fetchError) {
            debugLog('Could not fetch existing orders, creating new bin');
            // If bin doesn't exist, we'll create it with this order
        }
        
        // Create new order
        const orderId = 'ORD_' + Date.now().toString().slice(-8) + '_' + Math.random().toString(36).substr(2, 4).toUpperCase();
        
        const newOrder = {
            id: orderId,
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
        
        debugLog('New order created:', newOrder);
        
        // Add to orders array
        existingOrders.push(newOrder);
        
        // Save to cloud
        await saveCloudOrders(existingOrders);
        debugLog('Order saved to cloud successfully');
        
        // Save to local storage for backup
        let myOrders = JSON.parse(localStorage.getItem('pureflow_my_orders') || '[]');
        myOrders.push({
            ...newOrder,
            savedLocally: true
        });
        localStorage.setItem('pureflow_my_orders', JSON.stringify(myOrders));
        
        // Hide loading
        showLoading(false);
        
        // Show success
        showSuccess(true, orderId, phone);
        
    } catch (error) {
        showLoading(false);
        showError('Error placing order: ' + error.message + '. Please try again or call us directly.');
        debugLog('Order submission error:', error);
    }
}

function placeAnotherOrder() {
    showSuccess(false);
    document.querySelector('.order-card').style.display = 'block';
    document.getElementById('quantity').value = 1;
    calculateTotal();
}

// ================== INITIALIZATION ==================
window.onload = function() {
    debugLog('Page loaded, initializing...');
    
    // Load saved customer info
    if (customerInfo.name) {
        document.getElementById('Name').value = customerInfo.name;
        document.getElementById('Phone').value = customerInfo.phone;
        document.getElementById('Address').value = customerInfo.address;
        debugLog('Loaded saved customer info', customerInfo);
    }
    
    // Set up event listeners
    document.getElementById('Name').addEventListener('input', saveCustomerInfo);
    document.getElementById('Phone').addEventListener('input', saveCustomerInfo);
    document.getElementById('Address').addEventListener('input', saveCustomerInfo);
    document.getElementById('containerSize').addEventListener('change', calculateTotal);
    
    // Calculate initial total
    calculateTotal();
    
    // Test connection automatically
    setTimeout(testConnection, 1000);
    
    console.log('✅ PureFlow Online  Ready - Customer ID:', customerId);
    console.log('🌐 API URL:', CONFIG.API_URL);
    console.log('🔑 API Key:', CONFIG.JSONBIN_API_KEY ? 'Configured' : 'MISSING');
    console.log('📦 Bin ID:', CONFIG.BIN_ID ? 'Configured' : 'MISSING');
};
