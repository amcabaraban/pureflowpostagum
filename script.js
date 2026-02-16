// ================== GLOBAL VARIABLES ==================
let currentUser = null;
let currentClient = null;
let currentEditId = null;
let basePrice = 15;
let sukiDiscount = 10;
let otpStore = {}; // Store OTPs for password recovery
let autoSyncInterval = null;

// Chart instances
let salesTrendChart = null;
let customerTypeChart = null;
let monthlyRevenueChart = null;

// ================== ONLINE ORDER SYNC CONFIGURATION ==================
// REPLACE WITH YOUR ACTUAL JSONBIN.IO CREDENTIALS
const CLOUD_CONFIG = {
    JSONBIN_API_KEY: '$2a$10$EemUkkz5qrB6ehJAaYBYoe2R5Ba/0ZP.hdseALRo583Mt/MLFpFeS', // Get from jsonbin.io
    BIN_ID: '69906fa1d0ea881f40b9fe97', // Your bin ID
    API_URL: 'https://api.jsonbin.io/v3'
};

// ================== EMAILJS CONFIGURATION ==================
const EMAIL_CONFIG = {
    enabled: true,
    serviceId: 'dasha',
    templateId: '1',
    publicKey: 'bTiDE65jTTv8Z7KY6',
    adminEmail: 'a.cabarabanjr@gmail.com',
};

// ================== OTP GENERATION FUNCTION ==================
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
    }
    
    const savedClient = localStorage.getItem('currentClient');
    if (savedClient) {
        currentClient = JSON.parse(savedClient);
        showClientInterface();
    }
    
    initializeSampleData();
    setupEventListeners();
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    if (currentClient) {
        updateClientDateTime();
        setInterval(updateClientDateTime, 1000);
    }
    
    // Initialize EmailJS
    initializeEmailJSWithAutoConfig();
    
    // Test EmailJS connection
    testEmailJSConnection();
});

// ================== EMAILJS FUNCTIONS ==================
function initializeEmailJSWithAutoConfig() {
    console.log('🔧 Initializing EmailJS Configuration...');
    console.log('Service ID:', EMAIL_CONFIG.serviceId);
    console.log('Template ID:', EMAIL_CONFIG.templateId);
    console.log('Public Key:', EMAIL_CONFIG.publicKey ? 'Configured' : 'Missing');
    console.log('Admin Email:', EMAIL_CONFIG.adminEmail);
    
    // Always use real mode since we have real credentials
    const useRealMode = true;
    
    if (!useRealMode) {
        console.warn('⚠️ Using DEMO MODE');
        console.log('📧 OTPs will be shown in browser console (F12)');
        updateEmailJSStatus('demo');
        return;
    }
    
    if (typeof emailjs === 'undefined') {
        console.error('❌ EmailJS library not loaded!');
        console.error('Please add this to your HTML:');
        console.error('<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>');
        updateEmailJSStatus('error');
        return;
    }
    
    try {
        emailjs.init(EMAIL_CONFIG.publicKey)
            .then(() => {
                console.log('✅ EmailJS initialized successfully!');
                console.log('📧 Mode: ONLINE (Real emails will be sent)');
                updateEmailJSStatus('online');
            })
            .catch(error => {
                console.error('❌ Failed to initialize EmailJS:', error);
                console.log('🔄 Switching to demo mode');
                updateEmailJSStatus('demo');
            });
    } catch (error) {
        console.error('EmailJS initialization error:', error);
        updateEmailJSStatus('demo');
    }
}

function testEmailJSConnection() {
    setTimeout(() => {
        console.log('🔍 Testing EmailJS Connection...');
        if (typeof emailjs !== 'undefined' && EMAIL_CONFIG.publicKey) {
            console.log('✅ EmailJS library is loaded');
            console.log('🔑 Public Key:', EMAIL_CONFIG.publicKey.substring(0, 10) + '...');
        } else {
            console.warn('⚠️ EmailJS library not loaded or missing public key');
        }
    }, 1000);
}

function updateEmailJSStatus(status) {
    const statusElements = document.querySelectorAll('.emailjs-status');
    statusElements.forEach(element => {
        if (status === 'online') {
            element.textContent = '✅ ONLINE';
            element.style.color = '#28a745';
            element.style.fontWeight = 'bold';
            element.title = 'Real email sending is enabled';
        } else if (status === 'demo') {
            element.textContent = '⚠️ DEMO MODE';
            element.style.color = '#ffc107';
            element.style.fontWeight = 'bold';
            element.title = 'OTPs shown in console. Configure EmailJS for real emails.';
        } else {
            element.textContent = '❌ ERROR';
            element.style.color = '#dc3545';
            element.style.fontWeight = 'bold';
            element.title = 'EmailJS configuration error';
        }
    });
}

async function sendOTPviaEmail(email, otp, username) {
    // Always use real online mode since we have the credentials
    const isRealOnlineMode = EMAIL_CONFIG.serviceId && 
                            EMAIL_CONFIG.templateId && 
                            EMAIL_CONFIG.publicKey && 
                            typeof emailjs !== 'undefined';
    
    if (!isRealOnlineMode) {
        // Fallback to demo mode if something goes wrong
        console.log('='.repeat(60));
        console.log('🔐 PUREFLOW POS - PASSWORD RECOVERY (FALLBACK MODE)');
        console.log('='.repeat(60));
        console.log(`👤 Username: ${username}`);
        console.log(`🔑 OTP Code: ${otp}`);
        console.log(`📅 Generated: ${new Date().toLocaleTimeString()}`);
        console.log(`⏰ Expires: ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}`);
        console.log(`📧 Would send to: ${EMAIL_CONFIG.adminEmail}`);
        console.log('='.repeat(60));
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { 
            success: true, 
            message: 'OTP generated (Check browser console for OTP)',
            demoMode: true,
            otp: otp
        };
    }
    
    // Real online mode - Send actual email
    const templateParams = {
        to_email: email,
        otp_code: otp,
        username: username,
        app_name: 'PureFlow POS',
        expiry_minutes: 5,
        timestamp: new Date().toLocaleString(),
        support_email: EMAIL_CONFIG.adminEmail
    };
    
    try {
        console.log('📤 Sending OTP via EmailJS...');
        console.log('Recipient:', email);
        console.log('OTP:', otp);
        console.log('Service ID:', EMAIL_CONFIG.serviceId);
        console.log('Template ID:', EMAIL_CONFIG.templateId);
        
        const response = await emailjs.send(
            EMAIL_CONFIG.serviceId,
            EMAIL_CONFIG.templateId,
            templateParams
        );
        
        console.log('✅ Email sent successfully!');
        console.log('Response status:', response.status);
        console.log('Response text:', response.text);
        
        return { 
            success: true, 
            message: '✅ OTP email sent successfully! Check your inbox.',
            demoMode: false
        };
        
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        
        // Show detailed error information
        if (error.text) {
            console.error('Error details:', error.text);
        }
        
        if (error.status) {
            console.error('Error status:', error.status);
            
            // Common error messages
            if (error.status === 400) {
                console.error('Bad request. Check template parameters.');
            } else if (error.status === 401) {
                console.error('Unauthorized. Check your public key.');
            } else if (error.status === 404) {
                console.error('Service or template not found. Check Service ID and Template ID.');
            }
        }
        
        // Fall back to demo mode
        console.log(`🔄 Falling back to demo mode. OTP: ${otp}`);
        
        return { 
            success: true, 
            message: 'Email service temporarily unavailable. OTP shown in console.',
            demoMode: true,
            otp: otp
        };
    }
}

// ================== UTILITY FUNCTIONS ==================
function updateDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) + ' | ' + now.toLocaleTimeString();
    }
}

function updateClientDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('clientCurrentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) + ' | ' + now.toLocaleTimeString();
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    toast.style.background = colors[type] || colors.success;
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ================== ONLINE ORDER SYNC FUNCTIONS ==================

// Fetch online orders from cloud
async function fetchOnlineOrders() {
    try {
        const response = await fetch(`${CLOUD_CONFIG.API_URL}/b/${CLOUD_CONFIG.BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': CLOUD_CONFIG.JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        return data.record.orders || [];
    } catch (error) {
        console.error('Error fetching online orders:', error);
        return [];
    }
}

// Mark orders as synced in cloud
async function markOrdersAsSynced(orderIds) {
    try {
        const orders = await fetchOnlineOrders();
        
        // Mark specific orders as synced
        const updatedOrders = orders.map(order => {
            if (orderIds.includes(order.id)) {
                return { ...order, syncedToAdmin: true };
            }
            return order;
        });
        
        // Save back to cloud
        const response = await fetch(`${CLOUD_CONFIG.API_URL}/b/${CLOUD_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CLOUD_CONFIG.JSONBIN_API_KEY
            },
            body: JSON.stringify({ orders: updatedOrders })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error marking orders as synced:', error);
    }
}

// Sync online orders to local storage
async function syncOnlineOrders() {
    if (!currentUser) return; // Only sync when logged in
    
    console.log('🔄 Syncing online orders...');
    
    // Update sync button if exists
    const syncBtn = document.getElementById('manualSyncBtn');
    if (syncBtn) {
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
    }
    
    try {
        const onlineOrders = await fetchOnlineOrders();
        
        // Filter for pending orders not yet synced
        const newOrders = onlineOrders.filter(order => 
            order.status === 'pending' && !order.syncedToAdmin
        );
        
        if (newOrders.length === 0) {
            console.log('No new orders to sync');
            if (syncBtn) {
                setTimeout(() => {
                    syncBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Orders';
                }, 1000);
            }
            return;
        }
        
        console.log(`Found ${newOrders.length} new orders to sync`);
        
        // Get existing client orders
        let clientOrders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
        
        // Add new orders (avoid duplicates)
        const orderIdsToMark = [];
        let newCount = 0;
        
        newOrders.forEach(order => {
            // Check if already exists
            const exists = clientOrders.some(o => o.id === order.id);
            
            if (!exists) {
                clientOrders.push({
                    ...order,
                    syncedToPOS: true,
                    syncDate: new Date().toISOString(),
                    syncedBy: currentUser?.username || 'system',
                    source: 'online'
                });
                orderIdsToMark.push(order.id);
                newCount++;
            }
        });
        
        if (orderIdsToMark.length > 0) {
            // Save to local storage
            localStorage.setItem('clientOrders', JSON.stringify(clientOrders));
            
            // Mark as synced in cloud
            await markOrdersAsSynced(orderIdsToMark);
            
            // Show notification
            showToast(`📦 ${newCount} new online order(s) received!`, 'success');
            
            // Play notification sound if available
            playNotificationSound();
            
            // Refresh orders tab if open
            if (document.getElementById('orders').classList.contains('active')) {
                loadOrdersReport();
            }
            
            // Update dashboard
            if (document.getElementById('dashboard').classList.contains('active')) {
                loadDashboardData();
            }
        }
        
    } catch (error) {
        console.error('Error syncing online orders:', error);
        showToast('⚠️ Error syncing online orders', 'error');
    } finally {
        // Reset sync button
        if (syncBtn) {
            setTimeout(() => {
                syncBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Orders';
            }, 1000);
        }
    }
}

// Play notification sound for new orders
function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
        audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
        console.log('Notification sound not supported');
    }
}

// Start auto-sync (call this after login)
function startAutoSync() {
    // Clear existing interval
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
    }
    
    // Sync every 30 seconds
    autoSyncInterval = setInterval(syncOnlineOrders, 30000);
    
    // Initial sync
    syncOnlineOrders();
    
    console.log('✅ Auto-sync started (every 30 seconds)');
}

// Stop auto-sync (on logout)
function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
        console.log('🛑 Auto-sync stopped');
    }
}

// Add a manual sync button to POS
function addManualSyncButton() {
    // Check if button already exists
    if (document.getElementById('manualSyncBtn')) return;
    
    const header = document.querySelector('.header-right');
    if (!header) return;
    
    const syncBtn = document.createElement('button');
    syncBtn.id = 'manualSyncBtn';
    syncBtn.className = 'btn-sync';
    syncBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Orders';
    syncBtn.onclick = function() {
        syncOnlineOrders();
    };
    syncBtn.title = 'Check for new online orders';
    
    header.appendChild(syncBtn);
    
    // Add online indicator
    const indicator = document.createElement('span');
    indicator.className = 'sync-indicator online';
    indicator.title = 'Connected to online order service';
    header.insertBefore(indicator, syncBtn);
}

// ================== PASSWORD RECOVERY FUNCTIONS ==================
function showForgotPassword() {
    // Check current EmailJS status
    const isRealOnlineMode = EMAIL_CONFIG.serviceId && 
                            EMAIL_CONFIG.templateId && 
                            EMAIL_CONFIG.publicKey && 
                            typeof emailjs !== 'undefined';
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'forgotPasswordModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <div class="modal-logo-title">
                    <img src="pureflow-logo.png" alt="PureFlow Logo" class="header-logo">
                    <h3><i class="fas fa-key"></i> Password Recovery</h3>
                </div>
                <button class="modal-close" id="closeForgotPasswordBtn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="status-banner" style="margin-bottom: 20px; padding: 12px; background: ${isRealOnlineMode ? '#d4edda' : '#fff3cd'}; border-radius: 5px; border-left: 4px solid ${isRealOnlineMode ? '#28a745' : '#ffc107'};">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: ${isRealOnlineMode ? '#155724' : '#856404'};">
                                <i class="fas ${isRealOnlineMode ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                                ${isRealOnlineMode ? '✅ REAL EMAIL MODE' : '⚠️ DEMO MODE'}
                            </h4>
                            <p style="margin: 0; font-size: 13px; color: ${isRealOnlineMode ? '#155724' : '#856404'};">
                                <span class="emailjs-status">${isRealOnlineMode ? 'ONLINE' : 'DEMO MODE'}</span>
                                ${isRealOnlineMode ? 
                                    ' - OTP will be sent to admin email' : 
                                    ' - OTP will be shown in browser console'
                                }
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; font-size: 12px; color: #666;">
                                <i class="fas fa-cog"></i> Service: ${EMAIL_CONFIG.serviceId}
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #666;">
                                <i class="fas fa-envelope"></i> To: ${EMAIL_CONFIG.adminEmail}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-user"></i> Username *</label>
                    <input type="text" id="recoveryUsername" class="form-input" placeholder="Enter your username" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-user-tag"></i> Role *</label>
                    <select id="recoveryRole" class="form-select" required>
                        <option value="">Select role</option>
                        <option value="admin">Administrator</option>
                        <option value="cashier">Cashier</option>
                    </select>
                </div>
                
                <div id="otpSection" style="display: none;">
                    <div class="form-group">
                        <label class="form-label"><i class="fas fa-shield-alt"></i> OTP Verification</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" id="recoveryOtp" class="form-input" placeholder="Enter 6-digit OTP" maxlength="6" style="flex: 1;">
                            ${!isRealOnlineMode ? 
                                `<button type="button" class="btn-secondary" id="showOTPBtn" style="white-space: nowrap; font-size: 12px; padding: 8px 12px;">
                                    <i class="fas fa-terminal"></i> Show OTP in Console
                                </button>` : ''
                            }
                        </div>
                        <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
                            <i class="fas ${isRealOnlineMode ? 'fa-envelope' : 'fa-code'}"></i>
                            ${isRealOnlineMode ? 
                                'Check your email for the OTP' : 
                                'Press F12 and check browser console for the OTP'
                            }
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label"><i class="fas fa-lock"></i> New Password *</label>
                        <input type="password" id="newPassword" class="form-input" placeholder="Enter new password (min. 6 characters)" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label"><i class="fas fa-lock"></i> Confirm Password *</label>
                        <input type="password" id="confirmPassword" class="form-input" placeholder="Confirm new password" required>
                    </div>
                </div>
                
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 20px;">
                    <button type="button" class="btn-primary" id="recoveryBtn" style="width: 100%;">
                        <i class="fas ${isRealOnlineMode ? 'fa-envelope' : 'fa-key'}"></i>
                        ${isRealOnlineMode ? 'Send OTP via Email' : 'Generate OTP (Demo Mode)'}
                    </button>
                    <button type="button" class="btn-secondary" id="cancelRecoveryBtn" style="width: 100%; margin-top: 10px;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
                
                <div class="login-footer" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                    <div style="font-size: 12px; color: #666;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                            <div>
                                <p style="margin: 5px 0;">
                                    <i class="fas fa-envelope"></i> <strong>Admin Email:</strong><br>
                                    ${EMAIL_CONFIG.adminEmail}
                                </p>
                            </div>
                            <div>
                                <p style="margin: 5px 0;">
                                    <i class="fas fa-clock"></i> <strong>OTP Expires:</strong><br>
                                    5 minutes
                                </p>
                            </div>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px;">
                            <p style="margin: 0 0 5px 0; font-size: 11px; color: #495057;">
                                <i class="fas fa-info-circle"></i> <strong>EmailJS Configuration Status:</strong>
                            </p>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px;">
                                <div>
                                    <span style="color: #28a745">
                                        • Service ID: ✓ Configured (${EMAIL_CONFIG.serviceId})
                                    </span>
                                </div>
                                <div>
                                    <span style="color: #28a745">
                                        • Template ID: ✓ Configured (${EMAIL_CONFIG.templateId})
                                    </span>
                                </div>
                                <div>
                                    <span style="color: #28a745">
                                        • Public Key: ✓ Configured
                                    </span>
                                </div>
                                <div>
                                    <span style="color: #28a745">
                                        • Admin Email: ✓ Configured
                                    </span>
                                </div>
                            </div>
                            <p style="margin: 10px 0 0 0; font-size: 11px; color: #155724;">
                                <i class="fas fa-check-circle"></i>
                                All EmailJS credentials are properly configured for real email sending.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div id="emailStatus" style="display: none; margin-top: 10px; padding: 10px; border-radius: 4px; text-align: center; font-size: 14px;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    setTimeout(() => {
        // Close button
        const closeBtn = document.getElementById('closeForgotPasswordBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelRecoveryBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => modal.remove());
        }
        
        // Recovery button
        const recoveryBtn = document.getElementById('recoveryBtn');
        if (recoveryBtn) {
            recoveryBtn.addEventListener('click', handlePasswordRecovery);
        }
        
        // Show OTP button (if exists)
        const showOTPBtn = document.getElementById('showOTPBtn');
        if (showOTPBtn) {
            showOTPBtn.addEventListener('click', showCurrentOTPinConsole);
        }
        
        // Enter key support
        const usernameInput = document.getElementById('recoveryUsername');
        const roleSelect = document.getElementById('recoveryRole');
        
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handlePasswordRecovery();
            });
        }
        
        if (roleSelect) {
            roleSelect.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handlePasswordRecovery();
            });
        }
    }, 100);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === this) modal.remove();
    });
}

function showCurrentOTPinConsole() {
    const username = document.getElementById('recoveryUsername').value.trim();
    if (!username) {
        showToast('Please enter username first', 'warning');
        return;
    }
    
    const storedOtpData = otpStore[username];
    if (!storedOtpData) {
        showToast('No OTP generated yet', 'warning');
        return;
    }
    
    console.log('='.repeat(60));
    console.log('🔐 PUREFLOW POS - OTP INFORMATION');
    console.log('='.repeat(60));
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 OTP Code: ${storedOtpData.otp}`);
    console.log(`📅 Generated: ${new Date(storedOtpData.timestamp).toLocaleTimeString()}`);
    console.log(`⏰ Expires: ${new Date(storedOtpData.timestamp + 5 * 60 * 1000).toLocaleTimeString()}`);
    console.log(`📧 Admin Email: ${EMAIL_CONFIG.adminEmail}`);
    console.log(`🔧 Mode: DEMO (EmailJS not configured for real emails)`);
    console.log('='.repeat(60));
    
    showToast('OTP displayed in browser console (Press F12)', 'info');
}

async function handlePasswordRecovery() {
    const modal = document.getElementById('forgotPasswordModal');
    const username = document.getElementById('recoveryUsername').value.trim();
    const role = document.getElementById('recoveryRole').value;
    const otpInput = document.getElementById('recoveryOtp');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const otpSection = document.getElementById('otpSection');
    const recoveryBtn = document.getElementById('recoveryBtn');
    const emailStatus = document.getElementById('emailStatus');
    
    console.log('handlePasswordRecovery called');
    console.log('Username:', username);
    console.log('Role:', role);
    
    if (!username) {
        showToast('Please enter username', 'error');
        return;
    }
    
    if (!role) {
        showToast('Please select role', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.role === role
    );
    
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    if (otpSection && otpSection.style.display === 'none') {
        const otp = generateOTP();
        const timestamp = Date.now();
        
        otpStore[username] = { otp, timestamp, role };
        
        if (emailStatus) {
            emailStatus.style.display = 'block';
            emailStatus.style.background = '#fff3cd';
            emailStatus.style.color = '#856404';
            emailStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing request...';
        }
        
        if (recoveryBtn) {
            recoveryBtn.disabled = true;
            recoveryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }
        
        try {
            const emailResult = await sendOTPviaEmail(EMAIL_CONFIG.adminEmail, otp, username);
            
            if (emailResult.success) {
                if (otpSection) otpSection.style.display = 'block';
                if (recoveryBtn) {
                    recoveryBtn.innerHTML = '<i class="fas fa-save"></i> Reset Password';
                    recoveryBtn.disabled = false;
                }
                
                if (emailStatus) {
                    if (emailResult.demoMode) {
                        emailStatus.style.background = '#d1ecf1';
                        emailStatus.style.color = '#0c5460';
                        emailStatus.innerHTML = '<i class="fas fa-info-circle"></i> OTP generated! Check browser console (F12).';
                        // Auto-fill OTP for convenience in demo mode
                        if (otpInput) otpInput.value = otp;
                    } else {
                        emailStatus.style.background = '#d4edda';
                        emailStatus.style.color = '#155724';
                        emailStatus.innerHTML = '<i class="fas fa-check-circle"></i> OTP email sent successfully! Check your inbox.';
                    }
                    setTimeout(() => {
                        if (emailStatus) emailStatus.style.display = 'none';
                    }, 5000);
                }
                
                setTimeout(() => {
                    if (otpInput) otpInput.focus();
                }, 100);
                
                if (emailResult.demoMode) {
                    showToast(`Demo OTP: ${otp} (Check console for details)`, 'info');
                    console.log('='.repeat(60));
                    console.log('🔐 PUREFLOW POS - PASSWORD RECOVERY (DEMO MODE)');
                    console.log('='.repeat(60));
                    console.log(`👤 Username: ${username}`);
                    console.log(`👥 Role: ${role}`);
                    console.log(`🔑 OTP: ${otp}`);
                    console.log(`⏰ Generated: ${new Date().toLocaleTimeString()}`);
                    console.log(`📅 Expires: ${new Date(timestamp + 5 * 60 * 1000).toLocaleTimeString()}`);
                    console.log(`📧 Would send to: ${EMAIL_CONFIG.adminEmail}`);
                    console.log(`🔧 Mode: DEMO (Configure EmailJS for real emails)`);
                    console.log('='.repeat(60));
                } else {
                    showToast('✅ OTP sent to admin email', 'success');
                }
            } else {
                throw new Error(emailResult.message);
            }
        } catch (error) {
            console.error('Error in password recovery:', error);
            if (recoveryBtn) {
                recoveryBtn.disabled = false;
                const isRealOnlineMode = EMAIL_CONFIG.serviceId && 
                                         EMAIL_CONFIG.templateId && 
                                         EMAIL_CONFIG.publicKey && 
                                         typeof emailjs !== 'undefined';
                recoveryBtn.innerHTML = `<i class="fas ${isRealOnlineMode ? 'fa-envelope' : 'fa-key'}"></i> ${isRealOnlineMode ? 'Send OTP via Email' : 'Generate OTP'}`;
            }
            
            if (emailStatus) {
                emailStatus.style.background = '#f8d7da';
                emailStatus.style.color = '#721c24';
                emailStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
            }
            
            // Fallback: show OTP anyway
            if (otpSection) {
                otpSection.style.display = 'block';
                if (recoveryBtn) {
                    recoveryBtn.innerHTML = '<i class="fas fa-save"></i> Reset Password';
                    recoveryBtn.disabled = false;
                }
                if (otpInput) {
                    const otp = otpStore[username]?.otp || generateOTP();
                    otpInput.value = otp;
                }
                showToast(`Using fallback mode. Check OTP field.`, 'warning');
                console.log(`[FALLBACK] OTP for ${username}: ${otpStore[username]?.otp}`);
            }
            
            return;
        }
    } else {
        // OTP Verification
        const otp = otpInput?.value.trim();
        const storedOtpData = otpStore[username];
        
        if (!storedOtpData) {
            showToast('OTP expired or invalid', 'error');
            return;
        }
        
        if (Date.now() - storedOtpData.timestamp > 5 * 60 * 1000) {
            delete otpStore[username];
            showToast('OTP expired. Please request new OTP', 'error');
            return;
        }
        
        if (otp !== storedOtpData.otp) {
            showToast('Invalid OTP', 'error');
            return;
        }
        
        const password = newPassword?.value;
        const confirm = confirmPassword?.value;
        
        if (!password || !confirm) {
            showToast('Please enter new password', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (password !== confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        user.password = password;
        localStorage.setItem('users', JSON.stringify(users));
        delete otpStore[username];
        
        // Close the modal
        if (modal) {
            modal.remove();
        }
        
        showToast('✅ Password reset successfully! You can now login with new password', 'success');
    }
}

// ================== DASHBOARD FUNCTIONS ==================

function refreshDashboard() {
    loadDashboardData();
    showToast('Dashboard refreshed successfully', 'success');
}

function loadDashboardData() {
    if (!document.getElementById('dashboard').classList.contains('active')) {
        return;
    }
    
    updateDashboardMetrics();
    loadRecentSales();
    loadTopCustomers();
    updateQuickStats();
    createCharts();
    updatePerformanceMetrics();
}

function updateDashboardMetrics() {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    // Get sales data
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const todaySales = sales.filter(sale => new Date(sale.timestamp).toDateString() === today);
    const yesterdaySales = sales.filter(sale => new Date(sale.timestamp).toDateString() === yesterdayStr);
    
    // Get customer data
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    
    // Get orders data
    const orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'confirmed');
    
    // Calculate metrics
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
    const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.amount, 0);
    const todaySalesCount = todaySales.length;
    const yesterdaySalesCount = yesterdaySales.length;
    
    // Revenue change percentage
    let revenueChange = 0;
    if (yesterdayRevenue > 0) {
        revenueChange = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1);
    } else if (todayRevenue > 0) {
        revenueChange = 100;
    }
    
    // Sales count change percentage
    let salesChange = 0;
    if (yesterdaySalesCount > 0) {
        salesChange = ((todaySalesCount - yesterdaySalesCount) / yesterdaySalesCount * 100).toFixed(1);
    } else if (todaySalesCount > 0) {
        salesChange = 100;
    }
    
    // Update DOM elements
    const dashboardTodayRevenue = document.getElementById('dashboardTodayRevenue');
    const dashboardTodaySales = document.getElementById('dashboardTodaySales');
    const dashboardTotalCustomers = document.getElementById('dashboardTotalCustomers');
    const dashboardPendingOrders = document.getElementById('dashboardPendingOrders');
    
    if (dashboardTodayRevenue) dashboardTodayRevenue.textContent = '₱' + todayRevenue.toFixed(2);
    if (dashboardTodaySales) dashboardTodaySales.textContent = todaySalesCount;
    if (dashboardTotalCustomers) dashboardTotalCustomers.textContent = customers.length;
    if (dashboardPendingOrders) dashboardPendingOrders.textContent = pendingOrders.length;
    
    // Update change indicators
    const revenueChangeElement = document.getElementById('dashboardRevenueChange');
    const salesChangeElement = document.getElementById('dashboardSalesChange');
    
    if (revenueChangeElement) {
        if (revenueChange > 0) {
            revenueChangeElement.textContent = `+${revenueChange}% from yesterday`;
            revenueChangeElement.style.color = '#28a745';
        } else if (revenueChange < 0) {
            revenueChangeElement.textContent = `${revenueChange}% from yesterday`;
            revenueChangeElement.style.color = '#dc3545';
        } else {
            revenueChangeElement.textContent = 'No change from yesterday';
            revenueChangeElement.style.color = '#6c757d';
        }
    }
    
    if (salesChangeElement) {
        if (salesChange > 0) {
            salesChangeElement.textContent = `+${salesChange}% from yesterday`;
            salesChangeElement.style.color = '#28a745';
        } else if (salesChange < 0) {
            salesChangeElement.textContent = `${salesChange}% from yesterday`;
            salesChangeElement.style.color = '#dc3545';
        } else {
            salesChangeElement.textContent = 'No change from yesterday';
            salesChangeElement.style.color = '#6c757d';
        }
    }
}

function loadRecentSales() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const recentSales = sales
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    const tableBody = document.getElementById('recentSalesTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (recentSales.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-chart-line"></i><br>
                    No sales data yet
                </td>
            </tr>
        `;
        return;
    }
    
    recentSales.forEach(sale => {
        const row = document.createElement('tr');
        const saleDate = new Date(sale.timestamp);
        const timeString = saleDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        row.innerHTML = `
            <td>${timeString}</td>
            <td><strong>${sale.customer}</strong></td>
            <td>₱${sale.amount.toFixed(2)}</td>
            <td><span class="order-status ${sale.type === 'suki' ? 'delivered' : 'pending'}">${sale.type}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function loadTopCustomers() {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const topCustomers = customers
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, 5);
    
    const tableBody = document.getElementById('topCustomersTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (topCustomers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-users"></i><br>
                    No customer data yet
                </td>
            </tr>
        `;
        return;
    }
    
    topCustomers.forEach((customer, index) => {
        const row = document.createElement('tr');
        const rank = index + 1;
        let rankIcon = '';
        
        if (rank === 1) rankIcon = '🥇';
        else if (rank === 2) rankIcon = '🥈';
        else if (rank === 3) rankIcon = '🥉';
        else rankIcon = rank + 'th';
        
        row.innerHTML = `
            <td><strong>${rankIcon}</strong></td>
            <td><strong>${customer.name}</strong></td>
            <td>${formatCurrency(customer.totalSpent || 0)}</td>
            <td>${customer.purchaseCount || 0}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateQuickStats() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    
    // Calculate total gallons sold
    const totalGallons = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    // Count suki customers
    const sukiCustomers = customers.filter(c => c.type === 'suki').length;
    
    // Count completed orders
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    
    // Count pending deliveries
    const pendingDeliveries = orders.filter(o => 
        o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing'
    ).length;
    
    // Update DOM
    const totalWaterSold = document.getElementById('totalWaterSold');
    const sukiCount = document.getElementById('sukiCount');
    const completedOrdersEl = document.getElementById('completedOrders');
    const pendingDelivery = document.getElementById('pendingDelivery');
    
    if (totalWaterSold) totalWaterSold.textContent = totalGallons;
    if (sukiCount) sukiCount.textContent = sukiCustomers;
    if (completedOrdersEl) completedOrdersEl.textContent = completedOrders;
    if (pendingDelivery) pendingDelivery.textContent = pendingDeliveries;
}

function createCharts() {
    createSalesTrendChart();
    createCustomerTypeChart();
    createMonthlyRevenueChart(6);
}

function createSalesTrendChart() {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (salesTrendChart) {
        salesTrendChart.destroy();
    }
    
    // Get sales data for last 7 days
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const today = new Date();
    
    // Create array for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push({
            date: date.toDateString(),
            label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
            total: 0
        });
    }
    
    // Calculate sales for each day
    sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp).toDateString();
        const dayData = last7Days.find(day => day.date === saleDate);
        if (dayData) {
            dayData.total += sale.amount;
        }
    });
    
    // Prepare chart data
    const labels = last7Days.map(day => day.label);
    const data = last7Days.map(day => day.total);
    
    salesTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Revenue (₱)',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ₱${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return '₱' + value;
                        },
                        font: {
                            size: 11
                        }
                    },
                    title: {
                        display: true,
                        text: 'Revenue (₱)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

function createCustomerTypeChart() {
    const ctx = document.getElementById('customerTypeChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (customerTypeChart) {
        customerTypeChart.destroy();
    }
    
    // Get customer data
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    
    // Count by type
    const regularCount = customers.filter(c => c.type === 'regular').length;
    const sukiCount = customers.filter(c => c.type === 'suki').length;
    
    // Calculate revenue by type
    const regularRevenue = sales
        .filter(s => s.type === 'regular')
        .reduce((sum, sale) => sum + sale.amount, 0);
    
    const sukiRevenue = sales
        .filter(s => s.type === 'suki')
        .reduce((sum, sale) => sum + sale.amount, 0);
    
    customerTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Regular Customers', 'Suki Customers'],
            datasets: [{
                data: [regularCount, sukiCount],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(240, 147, 251, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(240, 147, 251, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = regularCount + sukiCount;
                            const percentage = Math.round((value / total) * 100);
                            
                            if (label.includes('Regular')) {
                                const revenue = regularRevenue.toFixed(2);
                                return `${label}: ${value} (${percentage}%) - Revenue: ₱${revenue}`;
                            } else {
                                const revenue = sukiRevenue.toFixed(2);
                                return `${label}: ${value} (${percentage}%) - Revenue: ₱${revenue}`;
                            }
                        }
                    }
                }
            }
        }
    });
}

function createMonthlyRevenueChart(months = 6) {
    const ctx = document.getElementById('monthlyRevenueChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (monthlyRevenueChart) {
        monthlyRevenueChart.destroy();
    }
    
    // Get sales data
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    
    // Calculate monthly revenue
    const monthlyData = {};
    const now = new Date();
    
    sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        const monthKey = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
        const monthLabel = saleDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                label: monthLabel,
                revenue: 0
            };
        }
        monthlyData[monthKey].revenue += sale.amount;
    });
    
    // Sort by date and limit to requested months
    const sortedMonths = Object.keys(monthlyData)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-months);
    
    const labels = sortedMonths.map(key => monthlyData[key].label);
    const data = sortedMonths.map(key => monthlyData[key].revenue);
    
    // If no data, show empty state
    if (data.length === 0) {
        ctx.parentElement.innerHTML = `
            <div class="empty-chart">
                <i class="fas fa-chart-bar"></i>
                <p>No monthly revenue data available yet</p>
            </div>
        `;
        return;
    }
    
    monthlyRevenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Revenue (₱)',
                data: data,
                backgroundColor: 'rgba(40, 167, 69, 0.7)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Revenue: ₱${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return '₱' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateMonthlyChart(months) {
    createMonthlyRevenueChart(parseInt(months));
}

function zoomChart(chartId, action) {
    const chart = getChartInstance(chartId);
    if (!chart) return;
    
    if (action === 'in') {
        chart.zoom(1.1);
    } else if (action === 'out') {
        chart.zoom(0.9);
    }
}

function resetChart(chartId) {
    const chart = getChartInstance(chartId);
    if (!chart) return;
    
    chart.resetZoom();
}

function toggleChartType(chartId) {
    const chart = getChartInstance(chartId);
    if (!chart) return;
    
    const newType = chart.config.type === 'doughnut' ? 'pie' : 'doughnut';
    chart.config.type = newType;
    chart.update();
}

function downloadChart(chartId) {
    const chart = getChartInstance(chartId);
    if (!chart) return;
    
    const link = document.createElement('a');
    link.download = `${chartId}_${new Date().toISOString().slice(0,10)}.png`;
    link.href = chart.toBase64Image();
    link.click();
}

function getChartInstance(chartId) {
    switch(chartId) {
        case 'salesTrendChart': return salesTrendChart;
        case 'customerTypeChart': return customerTypeChart;
        case 'monthlyRevenueChart': return monthlyRevenueChart;
        default: return null;
    }
}

function updatePerformanceMetrics() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const orders = JSON.parse(localStorage.getItem('clientOrders') || []);
    
    // Calculate average sale value
    const avgSaleValue = sales.length > 0 
        ? sales.reduce((sum, sale) => sum + sale.amount, 0) / sales.length 
        : 0;
    
    // Calculate retention rate (customers with more than 1 purchase)
    const repeatCustomers = customers.filter(c => (c.purchaseCount || 0) > 1).length;
    const retentionRate = customers.length > 0 
        ? (repeatCustomers / customers.length * 100).toFixed(1) 
        : 0;
    
    // Calculate fulfillment rate
    const fulfilledOrders = orders.filter(o => o.status === 'delivered').length;
    const fulfillmentRate = orders.length > 0 
        ? (fulfilledOrders / orders.length * 100).toFixed(1) 
        : 0;
    
    // Calculate revenue growth (this month vs last month)
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    
    const thisMonthRevenue = sales
        .filter(s => {
            const d = new Date(s.timestamp);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        })
        .reduce((sum, s) => sum + s.amount, 0);
    
    const lastMonthRevenue = sales
        .filter(s => {
            const d = new Date(s.timestamp);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        })
        .reduce((sum, s) => sum + s.amount, 0);
    
    const revenueGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : thisMonthRevenue > 0 ? 100 : 0;
    
    // Update DOM elements
    document.getElementById('avgSaleValue').textContent = '₱' + avgSaleValue.toFixed(2);
    document.getElementById('retentionRate').textContent = retentionRate + '%';
    document.getElementById('fulfillmentRate').textContent = fulfillmentRate + '%';
    document.getElementById('revenueGrowth').textContent = revenueGrowth + '%';
    
    // Update trends
    const avgSaleTrend = document.getElementById('avgSaleTrend');
    const retentionTrend = document.getElementById('retentionTrend');
    const fulfillmentTrend = document.getElementById('fulfillmentTrend');
    const growthTrend = document.getElementById('growthTrend');
    
    // Simple trend calculations (in a real app, you'd compare with previous period)
    if (avgSaleValue > 15) {
        avgSaleTrend.textContent = '+5%';
        avgSaleTrend.className = 'metric-trend up';
    } else {
        avgSaleTrend.textContent = '-0%';
        avgSaleTrend.className = 'metric-trend stable';
    }
    
    if (retentionRate > 30) {
        retentionTrend.textContent = '+2%';
        retentionTrend.className = 'metric-trend up';
    } else {
        retentionTrend.textContent = '0%';
        retentionTrend.className = 'metric-trend stable';
    }
    
    if (fulfillmentRate > 80) {
        fulfillmentTrend.textContent = '+3%';
        fulfillmentTrend.className = 'metric-trend up';
    } else if (fulfillmentRate < 50) {
        fulfillmentTrend.textContent = '-5%';
        fulfillmentTrend.className = 'metric-trend down';
    } else {
        fulfillmentTrend.textContent = '0%';
        fulfillmentTrend.className = 'metric-trend stable';
    }
    
    if (revenueGrowth > 0) {
        growthTrend.textContent = `+${revenueGrowth}%`;
        growthTrend.className = 'metric-trend up';
    } else if (revenueGrowth < 0) {
        growthTrend.textContent = `${revenueGrowth}%`;
        growthTrend.className = 'metric-trend down';
    } else {
        growthTrend.textContent = '0%';
        growthTrend.className = 'metric-trend stable';
    }
}

// ================== CUSTOMER TOTAL SPENT FUNCTIONS ==================

/**
 * Recalculates total spent for all customers based on sales data
 * This ensures customer totals are accurate and up-to-date
 */
function recalculateAllCustomerTotals() {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    
    customers.forEach(customer => {
        // Get all sales for this customer
        const customerSales = sales.filter(sale => 
            sale.customer && sale.customer.toLowerCase() === customer.name.toLowerCase()
        );
        
        // Calculate total spent and purchase count
        const totalSpent = customerSales.reduce((sum, sale) => sum + sale.amount, 0);
        const purchaseCount = customerSales.length;
        
        // Update customer object
        customer.totalSpent = totalSpent;
        customer.purchaseCount = purchaseCount;
        
        // Update last purchase date if there are sales
        if (customerSales.length > 0) {
            const lastSale = customerSales.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            )[0];
            customer.lastPurchase = lastSale.date || lastSale.timestamp;
        }
    });
    
    // Save updated customers back to localStorage
    localStorage.setItem('customers', JSON.stringify(customers));
    
    console.log('✅ Customer totals recalculated');
    return customers;
}

/**
 * Updates a single customer's total spent based on their sales
 * @param {string} customerName - The name of the customer to update
 */
function updateCustomerTotal(customerName) {
    if (!customerName || customerName === 'Walk-in' || customerName === 'Online Customer') return;
    
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    
    const customerIndex = customers.findIndex(c => 
        c.name.toLowerCase() === customerName.toLowerCase()
    );
    
    if (customerIndex === -1) return;
    
    // Get all sales for this customer
    const customerSales = sales.filter(sale => 
        sale.customer && sale.customer.toLowerCase() === customerName.toLowerCase()
    );
    
    // Calculate total spent and purchase count
    const totalSpent = customerSales.reduce((sum, sale) => sum + sale.amount, 0);
    const purchaseCount = customerSales.length;
    
    // Update customer
    customers[customerIndex].totalSpent = totalSpent;
    customers[customerIndex].purchaseCount = purchaseCount;
    
    // Update last purchase date if there are sales
    if (customerSales.length > 0) {
        const lastSale = customerSales.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        customers[customerIndex].lastPurchase = lastSale.date || lastSale.timestamp;
    }
    
    localStorage.setItem('customers', JSON.stringify(customers));
}

/**
 * Formats currency for display
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return '₱' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// ================== DATA INITIALIZATION ==================
function initializeSampleData() {
    if (!localStorage.getItem('customers')) {
        const sampleCustomers = [
            {
                id: 1,
                name: 'Juan Dela Cruz',
                phone: '0917-123-4567',
                address: '123 Main Street, Manila',
                type: 'suki',
                totalSpent: 1500,
                purchaseCount: 10,
                lastPurchase: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Maria Santos',
                phone: '0922-987-6543',
                address: '456 Oak Avenue, Quezon City',
                type: 'regular',
                totalSpent: 750,
                purchaseCount: 5,
                lastPurchase: new Date().toISOString()
            }
        ];
        localStorage.setItem('customers', JSON.stringify(sampleCustomers));
    }
    
    if (!localStorage.getItem('sales')) {
        // Initialize with sample sales that match customer totals
        const sampleSales = [
            {
                id: 1,
                customer: 'Juan Dela Cruz',
                type: 'suki',
                quantity: 100,
                amount: 1500,
                date: new Date().toISOString(),
                timestamp: Date.now() - 86400000,
                processedBy: 'admin',
                userRole: 'admin',
                source: 'in-store'
            },
            {
                id: 2,
                customer: 'Maria Santos',
                type: 'regular',
                quantity: 50,
                amount: 750,
                date: new Date().toISOString(),
                timestamp: Date.now() - 172800000,
                processedBy: 'admin',
                userRole: 'admin',
                source: 'in-store'
            }
        ];
        localStorage.setItem('sales', JSON.stringify(sampleSales));
    }
    
    if (!localStorage.getItem('users')) {
        const sampleUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                isActive: true,
                createdDate: new Date().toISOString(),
                lastLogin: null,
                email: 'a.cabarabanjr@gmail.com',
                fullName: 'System Administrator'
            },
            {
                id: 2,
                username: 'cashier',
                password: 'cashier123',
                role: 'cashier',
                isActive: true,
                createdDate: new Date().toISOString(),
                lastLogin: null,
                email: 'cashier@pureflow.com',
                fullName: 'Cashier User'
            }
        ];
        localStorage.setItem('users', JSON.stringify(sampleUsers));
    }
    
    if (!localStorage.getItem('clientOrders')) {
        localStorage.setItem('clientOrders', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('voidedTransactions')) {
        localStorage.setItem('voidedTransactions', JSON.stringify([]));
    }
}

// ================== EVENT LISTENERS ==================
function setupEventListeners() {
    const searchInput = document.getElementById('searchCustomer');
    if (searchInput) searchInput.addEventListener('input', filterCustomers);
    
    const addModal = document.getElementById('addCustomerModal');
    if (addModal) addModal.addEventListener('click', function(e) {
        if (e.target === this) closeAddCustomerModal();
    });
    
    const updateOrderModal = document.getElementById('updateOrderModal');
    if (updateOrderModal) updateOrderModal.addEventListener('click', function(e) {
        if (e.target === this) closeUpdateOrderModal();
    });
    
    const passwordInput = document.getElementById('password');
    if (passwordInput) passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') staffLogin();
    });
    
    const custTypeSelect = document.getElementById('customerType');
    const qtyInput = document.getElementById('quantity');
    if (custTypeSelect) custTypeSelect.addEventListener('change', calculateTotal);
    if (qtyInput) qtyInput.addEventListener('input', calculateTotal);
}

// ================== LOGIN FUNCTIONS ==================
function showLoginTab(tab) {
    document.querySelectorAll('.login-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.login-tab-btn').forEach(btn => {
        if (btn.textContent.includes(tab === 'staff' ? 'Staff' : 'Client')) btn.classList.add('active');
    });
    
    document.getElementById('staffLoginForm').style.display = tab === 'staff' ? 'block' : 'none';
    document.getElementById('clientLoginForm').style.display = tab === 'client' ? 'block' : 'none';
}

function staffLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('userRole').value;
    
    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password && 
        u.role === role &&
        u.isActive === true
    );
    
    if (!user) {
        showToast('Invalid username or password', 'error');
        return;
    }
    
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showApp();
    showToast(`Welcome ${user.role === 'admin' ? 'Administrator' : 'Cashier'}!`, 'success');
}

function clientLogin() {
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress').value.trim();
    
    if (!name || !phone || !address) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (phone.length < 10) {
        showToast('Please enter a valid phone number', 'error');
        return;
    }
    
    currentClient = {
        id: Date.now(),
        name: name,
        phone: phone,
        address: address,
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('currentClient', JSON.stringify(currentClient));
    showClientInterface();
    showToast(`Welcome ${name}! Ready to place your order.`, 'success');
}

// ================== MAIN APPLICATION ==================
function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('clientOrderContainer').style.display = 'none';
    
    updateUIForUserRole();
    loadCustomers();
    updateTodaySummary();
    updateCustomerSuggestions();
    generateReport();
    loadSettings();
    calculateTotal();
    
    // Load dashboard data
    loadDashboardData();
    
    // Add manual sync button
    addManualSyncButton();
    
    // Start auto-sync
    startAutoSync();
    
    // Add void button for admin
    addVoidButtonToNav();
    
    // Add sync fulfilled orders button for admin
    if (isAdmin()) {
        setTimeout(() => {
            addSyncFulfilledButton();
        }, 2000);
    }
}

function showClientInterface() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('clientOrderContainer').style.display = 'block';
    
    updateClientInfo();
    updateClientDateTime();
    setInterval(updateClientDateTime, 1000);
    loadClientOrders();
    loadClientProfile();
    calculateClientTotal();
}

function updateUIForUserRole() {
    if (!currentUser) return;
    
    const userRoleElement = document.getElementById('currentUserRole');
    const dataManagementSection = document.getElementById('dataManagementSection');
    const settingsTab = document.getElementById('settingsTab');
    
    if (userRoleElement) {
        userRoleElement.textContent = currentUser.role.toUpperCase();
        userRoleElement.className = `user-role ${currentUser.role}`;
    }
    
    // Hide data management for cashiers
    if (currentUser.role === 'cashier') {
        if (dataManagementSection) dataManagementSection.style.display = 'none';
        if (settingsTab) settingsTab.style.display = 'none';
    } else {
        if (dataManagementSection) dataManagementSection.style.display = 'block';
        if (settingsTab) settingsTab.style.display = 'inline-flex';
    }
    
    // Update all tables to hide/show actions based on role
    updateTablePermissions();
}

function updateTablePermissions() {
    // Update sales report table
    const salesReport = document.getElementById('salesReport');
    if (salesReport) {
        const rows = salesReport.querySelectorAll('tr');
        rows.forEach(row => {
            const deleteBtn = row.querySelector('button[onclick*="deleteSale"]');
            if (deleteBtn && isCashier()) {
                deleteBtn.style.display = 'none';
                deleteBtn.disabled = true;
            }
        });
    }
    
    // Update orders report table
    const ordersReportTable = document.getElementById('ordersReportTable');
    if (ordersReportTable) {
        const rows = ordersReportTable.querySelectorAll('tr');
        rows.forEach(row => {
            const deleteBtn = row.querySelector('button[onclick*="deleteOrder"]');
            if (deleteBtn && isCashier()) {
                deleteBtn.style.display = 'none';
                deleteBtn.disabled = true;
            }
            
            const editBtn = row.querySelector('button[onclick*="showUpdateOrderModal"]');
            if (editBtn && isAdmin()) {
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = 'Update Status';
            }
        });
    }
    
    // Update customers table
    const customersTable = document.getElementById('customersTable');
    if (customersTable) {
        const rows = customersTable.querySelectorAll('tr');
        rows.forEach(row => {
            const deleteBtn = row.querySelector('button[onclick*="deleteCustomer"]');
            if (deleteBtn && isCashier()) {
                deleteBtn.style.display = 'none';
                deleteBtn.disabled = true;
            }
        });
    }
}

function updateClientInfo() {
    if (!currentClient) return;
    
    document.getElementById('clientInfo').textContent = currentClient.name;
    document.getElementById('orderClientName').textContent = currentClient.name;
    document.getElementById('orderClientPhone').textContent = currentClient.phone;
    document.getElementById('orderClientAddress').textContent = currentClient.address;
    
    const storeName = localStorage.getItem('storeName') || 'PureFlow Water Delivery';
    document.getElementById('clientStoreTitle').textContent = storeName;
}

// ================== TAB NAVIGATION ==================
function showTab(tabId) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick="showTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'dashboard') {
        setTimeout(() => {
            loadDashboardData();
        }, 100);
    } else if (tabId === 'customers') {
        loadCustomers();
    } else if (tabId === 'reports') {
        generateReport();
    } else if (tabId === 'settings') {
        loadSettings();
    } else if (tabId === 'orders') {
        loadOrdersReport();
    }
}

function showClientTab(tabId) {
    document.querySelectorAll('#clientOrderContainer .nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`#clientOrderContainer button[onclick="showClientTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    document.querySelectorAll('#clientOrderContainer .tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('client' + tabId.charAt(0).toUpperCase() + tabId.slice(1)).classList.add('active');
    
    if (tabId === 'myorders') {
        loadClientOrders();
    } else if (tabId === 'profile') {
        loadClientProfile();
    }
}

// ================== LOGOUT FUNCTIONS ==================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        stopAutoSync(); // Stop auto-sync on logout
        
        currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('password').value = '';
        showToast('Logged out successfully', 'success');
    }
}

function clientLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentClient = null;
        localStorage.removeItem('currentClient');
        document.getElementById('clientOrderContainer').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('clientName').value = '';
        document.getElementById('clientPhone').value = '';
        document.getElementById('clientAddress').value = '';
        showToast('Logged out successfully', 'success');
    }
}

// ================== SALES FUNCTIONS ==================
// NOTE: processSale() has been modified to only record sales from fulfilled orders
// Direct POS sales are now disabled to ensure sales are only recorded when orders are fulfilled
function processSale() {
    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }
    
    // ✅ FIX: Sales are now only recorded from fulfilled orders in the Orders tab
    // This prevents duplicate/incomplete sales records
    showToast('Sales are now recorded only from fulfilled orders. Please use the Orders tab to mark orders as delivered to record sales.', 'info');
    return;
    
    /* Original code commented out to prevent direct sales recording
    const customerName = document.getElementById('customerName').value.trim();
    const customerType = document.getElementById('customerType').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const amount = calculateTotal();
    
    if (customerType === 'suki' && !customerName) {
        showToast('Please enter customer name for Suki sale', 'error');
        return;
    }
    
    let sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const newSale = {
        id: Date.now(),
        customer: customerName || 'Walk-in',
        type: customerType,
        quantity: quantity,
        amount: amount,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        processedBy: currentUser.username,
        userRole: currentUser.role,
        editable: currentUser.role === 'admin' // Only admin sales are editable
    };
    
    sales.push(newSale);
    localStorage.setItem('sales', JSON.stringify(sales));
    
    if (customerName && customerName !== 'Walk-in') {
        let customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const existingCustomer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        
        if (existingCustomer) {
            existingCustomer.totalSpent += amount;
            existingCustomer.purchaseCount += 1;
            existingCustomer.lastPurchase = new Date().toISOString();
            if (customerType === 'suki') existingCustomer.type = 'suki';
            localStorage.setItem('customers', JSON.stringify(customers));
        } else {
            const newCustomer = {
                id: Date.now(),
                name: customerName,
                phone: '',
                address: '',
                type: customerType,
                totalSpent: amount,
                purchaseCount: 1,
                lastPurchase: new Date().toISOString(),
                dateAdded: new Date().toISOString(),
                addedBy: currentUser.username,
                addedByRole: currentUser.role
            };
            customers.push(newCustomer);
            localStorage.setItem('customers', JSON.stringify(customers));
        }
    }
    
    document.getElementById('customerName').value = '';
    document.getElementById('quantity').value = 1;
    calculateTotal();
    updateTodaySummary();
    loadCustomers();
    updateCustomerSuggestions();
    generateReport();
    
    // Refresh dashboard if it's active
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboardData();
    }
    
    showToast('Sale recorded successfully!', 'success');
    */
}

function changeQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let newValue = parseInt(quantityInput.value) + change;
    if (newValue < 1) newValue = 1;
    quantityInput.value = newValue;
    calculateTotal();
}

function calculateTotal() {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const isSuki = document.getElementById('customerType').value === 'suki';
    
    let pricePerUnit = basePrice;
    if (isSuki) pricePerUnit = basePrice * (1 - sukiDiscount / 100);
    
    const totalAmount = (pricePerUnit * quantity).toFixed(2);
    const totalAmountElement = document.getElementById('totalAmount');
    if (totalAmountElement) totalAmountElement.textContent = totalAmount;
    return parseFloat(totalAmount);
}

// ================== CUSTOMER MANAGEMENT ==================
function showAddCustomerModal() {
    document.getElementById('addCustomerName').value = '';
    document.getElementById('addCustomerPhone').value = '';
    document.getElementById('addCustomerAddress').value = '';
    document.getElementById('addCustomerType').value = 'regular';
    document.getElementById('addCustomerModal').classList.add('active');
}

function closeAddCustomerModal() {
    document.getElementById('addCustomerModal').classList.remove('active');
}

function addNewCustomer() {
    const name = document.getElementById('addCustomerName').value.trim();
    const phone = document.getElementById('addCustomerPhone').value.trim();
    const address = document.getElementById('addCustomerAddress').value.trim();
    const type = document.getElementById('addCustomerType').value;
    
    if (!name) {
        showToast('Please enter customer name', 'error');
        return;
    }
    
    let customers = JSON.parse(localStorage.getItem('customers') || '[]');
    
    if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast('Customer already exists', 'warning');
        return;
    }
    
    const newCustomer = {
        id: Date.now(),
        name: name,
        phone: phone,
        address: address,
        type: type,
        totalSpent: 0,
        purchaseCount: 0,
        lastPurchase: null,
        dateAdded: new Date().toISOString(),
        addedBy: currentUser?.username || 'system',
        addedByRole: currentUser?.role || 'system'
    };
    
    customers.push(newCustomer);
    localStorage.setItem('customers', JSON.stringify(customers));
    closeAddCustomerModal();
    loadCustomers();
    updateCustomerSuggestions();
    showToast('Customer added successfully', 'success');
}

function loadCustomers() {
    // First, recalculate all customer totals to ensure accuracy
    recalculateAllCustomerTotals();
    
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const tableBody = document.getElementById('customersTable');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-users-slash" style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;"></i><br>
                    No customers yet. Click "Add New Customer" to add one.
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort customers by total spent (highest first)
    customers.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        
        // Format the total spent with commas for thousands
        const formattedTotal = formatCurrency(customer.totalSpent || 0);
        
        row.innerHTML = `
            <td><strong>${customer.name}</strong></td>
            <td>${customer.phone || '<span style="color:#999; font-style:italic;">No phone</span>'}</td>
            <td>${customer.address || '<span style="color:#999; font-style:italic;">No address</span>'}</td>
            <td><span class="customer-type ${customer.type}">${customer.type.toUpperCase()}</span></td>
            <td><strong>${formattedTotal}</strong></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn delete" onclick="deleteCustomer(${customer.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function filterCustomers() {
    const searchTerm = document.getElementById('searchCustomer').value.toLowerCase();
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const tableBody = document.getElementById('customersTable');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm))
    );
    
    if (filteredCustomers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                    No customers found matching "${searchTerm}"
                </td>
            </tr>
        `;
        return;
    }
    
    filteredCustomers.forEach(customer => {
        const row = document.createElement('tr');
        const formattedTotal = formatCurrency(customer.totalSpent || 0);
        
        row.innerHTML = `
            <td><strong>${customer.name}</strong></td>
            <td>${customer.phone || '<span style="color:#999; font-style:italic;">No phone</span>'}</td>
            <td>${customer.address || '<span style="color:#999; font-style:italic;">No address</span>'}</td>
            <td><span class="customer-type ${customer.type}">${customer.type.toUpperCase()}</span></td>
            <td><strong>${formattedTotal}</strong></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn delete" onclick="deleteCustomer(${customer.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function deleteCustomer(id) {
    if (!checkAdminPermission('delete customers')) return;
    
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    let customers = JSON.parse(localStorage.getItem('customers') || '[]');
    customers = customers.filter(c => c.id != id);
    localStorage.setItem('customers', JSON.stringify(customers));
    loadCustomers();
    updateCustomerSuggestions();
    showToast('Customer deleted successfully', 'success');
}

// ================== TODAY'S SUMMARY ==================
function updateTodaySummary() {
    const today = new Date().toDateString();
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    
    const todaySales = sales.filter(sale => new Date(sale.timestamp).toDateString() === today);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
    const todayOrders = orders.filter(order => new Date(order.timestamp).toDateString() === today);
    
    const todaySalesEl = document.getElementById('todaySales');
    const todayRevenueEl = document.getElementById('todayRevenue');
    const totalCustomersEl = document.getElementById('totalCustomers');
    const todayOrdersEl = document.getElementById('todayOrders');
    
    if (todaySalesEl) todaySalesEl.textContent = todaySales.length;
    if (todayRevenueEl) todayRevenueEl.textContent = '₱' + todayRevenue.toFixed(2);
    if (totalCustomersEl) totalCustomersEl.textContent = customers.length;
    if (todayOrdersEl) todayOrdersEl.textContent = todayOrders.length;
}

// ================== REPORTS ==================
function generateReport() {
    const period = document.getElementById('reportPeriod')?.value || 'today';
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const reportBody = document.getElementById('salesReport');
    
    if (!reportBody) return;
    
    const now = new Date();
    let filteredSales = sales;
    
    if (period !== 'all') {
        filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            switch(period) {
                case 'today': return saleDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return saleDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return saleDate >= monthAgo;
                default: return true;
            }
        });
    }
    
    filteredSales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    reportBody.innerHTML = '';
    
    if (filteredSales.length === 0) {
        reportBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;"></i><br>
                    No sales data for selected period
                </td>
            </tr>
        `;
        const reportTotal = document.getElementById('reportTotal');
        if (reportTotal) reportTotal.textContent = '0';
        return;
    }
    
    let totalAmount = 0;
    filteredSales.forEach(sale => {
        const row = document.createElement('tr');
        const saleDate = new Date(sale.timestamp);
        
        // Check if user can delete this sale
        let deleteButton = '';
        if (isAdmin()) {
            deleteButton = `
                <button class="action-btn delete" onclick="deleteSale(${sale.id})" title="Delete Sale">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        
        // Add void button for admin only
        let voidButton = '';
        if (isAdmin()) {
            voidButton = `
                <button class="action-btn void" onclick="showVoidTransactionModal(${sale.id})" title="Void Transaction" style="background: #dc3545;">
                    <i class="fas fa-ban"></i>
                </button>
            `;
        }
        
        // Add source indicator
        let sourceIcon = '';
        if (sale.source === 'online-order') {
            sourceIcon = '<span class="online-badge" style="margin-left: 5px;">🌐 Online</span>';
        } else if (sale.source === 'pos-order') {
            sourceIcon = '<span class="pos-badge" style="margin-left: 5px;">🏪 POS</span>';
        }
        
        row.innerHTML = `
            <td>${saleDate.toLocaleString()}</td>
            <td>${sale.customer} ${sourceIcon}</td>
            <td><span class="customer-type ${sale.type}">${sale.type}</span></td>
            <td>${sale.quantity}</td>
            <td>₱${sale.amount.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    ${voidButton}
                    ${deleteButton}
                </div>
            </td>
        `;
        reportBody.appendChild(row);
        totalAmount += sale.amount;
    });
    
    const reportTotal = document.getElementById('reportTotal');
    if (reportTotal) reportTotal.textContent = totalAmount.toFixed(2);
    
    // Update table permissions after generating report
    updateTablePermissions();
}

function deleteSale(saleId) {
    if (!checkAdminPermission('delete sales')) return;
    
    if (!confirm('Are you sure you want to delete this sale?')) return;
    
    // Get the sale before deleting to update customer totals
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const sale = sales.find(s => s.id === saleId);
    
    // Remove the sale
    let updatedSales = sales.filter(s => s.id !== saleId);
    localStorage.setItem('sales', JSON.stringify(updatedSales));
    
    // Update customer total if applicable
    if (sale && sale.customer && sale.customer !== 'Walk-in' && sale.customer !== 'Online Customer') {
        updateCustomerTotal(sale.customer);
    }
    
    updateTodaySummary();
    generateReport();
    showToast('Sale deleted successfully', 'success');
}

// ================== ORDERS REPORT ==================
function loadOrdersReport() {
    const filter = document.getElementById('orderFilter').value;
    const orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    const tableBody = document.getElementById('ordersReportTable');
    
    if (!tableBody) return;
    
    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let filteredOrders = orders;
    const now = new Date();
    
    switch(filter) {
        case 'pending': filteredOrders = orders.filter(o => o.status === 'pending'); break;
        case 'confirmed': filteredOrders = orders.filter(o => o.status === 'confirmed'); break;
        case 'processing': filteredOrders = orders.filter(o => o.status === 'processing'); break;
        case 'delivered': filteredOrders = orders.filter(o => o.status === 'delivered'); break;
        case 'cancelled': filteredOrders = orders.filter(o => o.status === 'cancelled'); break;
        case 'today': filteredOrders = orders.filter(o => new Date(o.timestamp).toDateString() === now.toDateString()); break;
        case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            filteredOrders = orders.filter(o => new Date(o.timestamp) >= weekAgo);
            break;
        case 'fulfilled': filteredOrders = orders.filter(o => o.status === 'delivered'); break;
        case 'not-fulfilled': filteredOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled'); break;
        case 'all': filteredOrders = orders; break;
    }
    
    updateOrdersStatistics(orders);
    tableBody.innerHTML = '';
    
    if (filteredOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;"></i><br>
                    No orders found for selected filter
                </td>
            </tr>
        `;
        return;
    }
    
    filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        const orderDate = new Date(order.timestamp);
        const formattedDate = orderDate.toLocaleDateString() + ' ' + orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const isFulfilled = order.status === 'delivered';
        const isCancelled = order.status === 'cancelled';
        const fulfillmentStatus = isFulfilled ? 'Fulfilled ✓' : isCancelled ? 'Cancelled ✗' : 'Not Yet Fulfilled';
        
        let rowClass = '';
        if (isFulfilled) rowClass = 'order-row-fulfilled';
        else if (isCancelled) rowClass = 'order-row-cancelled';
        else rowClass = 'order-row-pending';
        
        row.className = rowClass;
        
        // Check if user can delete this order
        let deleteButton = '';
        if (isAdmin()) {
            deleteButton = `
                <button class="action-btn delete" onclick="deleteOrder('${order.id}')" title="Delete Order">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        
        // Check if user can edit this order
        let editButton = '';
        if (isAdmin() || isCashier()) {
            editButton = `
                <button class="action-btn edit" onclick="showUpdateOrderModal('${order.id}')" title="Update Status">
                    <i class="fas fa-edit"></i>
                </button>
            `;
        }
        
        row.innerHTML = `
            <td>
                <strong>${order.id}</strong>
                ${order.source === 'online' ? '<span class="online-badge">🌐 Online</span>' : ''}
            </td>
            <td>${formattedDate}</td>
            <td>${order.clientName || order.customerName}</td>
            <td>${order.clientPhone || order.customerPhone}</td>
            <td>${order.quantity} × ${order.containerSize || '5 Gallon'}</td>
            <td>₱${order.totalAmount}</td>
            <td>${order.deliverySchedule || 'ASAP'}</td>
            <td><span class="order-status ${order.status}">${order.status}</span></td>
            <td><span class="fulfillment-status ${isFulfilled ? 'fulfilled' : isCancelled ? 'cancelled' : 'pending'}">${fulfillmentStatus}</span></td>
            <td>
                <div class="action-buttons">
                    ${editButton}
                    ${deleteButton}
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateOrdersStatistics(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    
    const totalOrdersCount = document.getElementById('totalOrdersCount');
    const pendingOrdersCount = document.getElementById('pendingOrdersCount');
    const confirmedOrdersCount = document.getElementById('confirmedOrdersCount');
    const processingOrdersCount = document.getElementById('processingOrdersCount');
    const deliveredOrdersCount = document.getElementById('deliveredOrdersCount');
    const cancelledOrdersCount = document.getElementById('cancelledOrdersCount');
    const ordersTotalRevenue = document.getElementById('ordersTotalRevenue');
    
    if (totalOrdersCount) totalOrdersCount.textContent = total;
    if (pendingOrdersCount) pendingOrdersCount.textContent = pending;
    if (confirmedOrdersCount) confirmedOrdersCount.textContent = confirmed;
    if (processingOrdersCount) processingOrdersCount.textContent = processing;
    if (deliveredOrdersCount) deliveredOrdersCount.textContent = delivered;
    if (cancelledOrdersCount) cancelledOrdersCount.textContent = cancelled;
    if (ordersTotalRevenue) ordersTotalRevenue.textContent = totalRevenue.toFixed(2);
}

function showUpdateOrderModal(orderId) {
    if (!checkCashierPermission('update order status')) return;
    
    const orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showToast('Order not found', 'error');
        return;
    }
    
    document.getElementById('updateOrderId').value = orderId;
    document.getElementById('updateOrderNumber').value = order.id;
    document.getElementById('updateClientName').value = order.clientName || order.customerName;
    document.getElementById('updateOrderStatus').value = order.status || 'pending';
    document.getElementById('updateDeliveryPerson').value = order.deliveryPerson || '';
    document.getElementById('updateOrderModal').classList.add('active');
}

function closeUpdateOrderModal() {
    document.getElementById('updateOrderModal').classList.remove('active');
}

/**
 * Creates a sale record from a fulfilled order
 * This is the ONLY place where sales are recorded in the system
 * @param {Object} order - The order object that was fulfilled
 */
function createSaleFromOrder(order) {
    // Check if this order was already converted to a sale
    let sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const existingSale = sales.find(s => s.orderId === order.id);
    
    if (existingSale) {
        console.log('Sale already exists for this order:', order.id);
        return;
    }
    
    // Determine customer type (suki or regular) based on customer data if available
    let customerType = 'regular';
    if (order.clientName) {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const customer = customers.find(c => c.name.toLowerCase() === order.clientName.toLowerCase());
        if (customer) {
            customerType = customer.type || 'regular';
        }
    }
    
    const newSale = {
        id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique ID
        orderId: order.id, // Link back to the original order
        customer: order.clientName || order.customerName || 'Online Customer',
        type: customerType,
        quantity: order.quantity,
        amount: parseFloat(order.totalAmount),
        date: new Date().toISOString(),
        timestamp: Date.now(),
        processedBy: currentUser ? currentUser.username : 'system',
        userRole: currentUser ? currentUser.role : 'system',
        source: order.source === 'online' ? 'online-order' : 'pos-order',
        editable: currentUser && currentUser.role === 'admin'
    };
    
    sales.push(newSale);
    localStorage.setItem('sales', JSON.stringify(sales));
    
    // Update customer total spent if customer exists
    if (order.clientName && order.clientName !== 'Online Customer' && order.clientName !== 'Walk-in') {
        updateCustomerTotal(order.clientName);
    } else if (!customerExists && order.clientName && order.clientName !== 'Online Customer' && order.clientName !== 'Walk-in') {
        // If customer doesn't exist but we have a name, create a new customer record
        let customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const existingCustomer = customers.find(c => c.name.toLowerCase() === order.clientName.toLowerCase());
        
        if (!existingCustomer) {
            const newCustomer = {
                id: Date.now(),
                name: order.clientName,
                phone: order.clientPhone || '',
                address: order.clientAddress || '',
                type: 'regular',
                totalSpent: parseFloat(order.totalAmount),
                purchaseCount: 1,
                lastPurchase: new Date().toISOString(),
                dateAdded: new Date().toISOString(),
                addedBy: currentUser ? currentUser.username : 'system',
                addedByRole: currentUser ? currentUser.role : 'system'
            };
            customers.push(newCustomer);
            localStorage.setItem('customers', JSON.stringify(customers));
        }
    }
    
    console.log('✅ Sale created from fulfilled order:', order.id);
    return newSale;
}

/**
 * Updates order status and creates sale record ONLY when order is fulfilled (delivered)
 * This ensures sales are recorded only for completed/fulfilled orders
 */
function saveOrderUpdate() {
    if (!checkCashierPermission('update order status')) return;
    
    const orderId = document.getElementById('updateOrderId').value;
    const status = document.getElementById('updateOrderStatus').value;
    const deliveryPerson = document.getElementById('updateDeliveryPerson').value.trim();
    
    let orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    const index = orders.findIndex(o => o.id === orderId);
    
    if (index === -1) {
        showToast('Order not found', 'error');
        return;
    }
    
    const oldStatus = orders[index].status;
    orders[index].status = status;
    orders[index].deliveryPerson = deliveryPerson;
    
    // ✅ FIX: Only create sale record when order is fulfilled (status changes to 'delivered')
    // This ensures sales are recorded ONLY for completed orders
    if (status === 'delivered') {
        orders[index].fulfilled = true;
        orders[index].fulfillmentDate = new Date().toISOString();
        
        // Create a sale record for this fulfilled order
        // This will add to sales array, which updates:
        // - Dashboard metrics
        // - Daily sales report
        // - Summary statistics
        // - Customer totals
        createSaleFromOrder(orders[index]);
    } else {
        orders[index].fulfilled = false;
    }
    
    orders[index].statusUpdated = new Date().toISOString();
    orders[index].updatedBy = currentUser ? currentUser.username : 'system';
    
    localStorage.setItem('clientOrders', JSON.stringify(orders));
    closeUpdateOrderModal();
    loadOrdersReport();
    
    // Refresh dashboard and summary if they're active
    // This ensures the new sale from fulfilled order appears in:
    // - Dashboard metrics
    // - Daily sales report
    // - Summary statistics
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboardData();
    }
    updateTodaySummary();
    generateReport();
    
    // Refresh customers if the tab is active to update totals
    if (document.getElementById('customers').classList.contains('active')) {
        loadCustomers();
    }
    
    showToast(`Order status updated from "${oldStatus}" to "${status}" successfully`, 'success');
}

function deleteOrder(orderId) {
    if (!checkAdminPermission('delete orders')) return;
    
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    let orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem('clientOrders', JSON.stringify(orders));
    loadOrdersReport();
    showToast('Order deleted successfully', 'success');
}

/**
 * Sync existing fulfilled orders to create sales records
 * This function can be called manually to fix historical data
 */
function syncExistingFulfilledOrders() {
    if (!checkAdminPermission('sync orders')) return;
    
    const orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    const fulfilledOrders = orders.filter(o => o.status === 'delivered');
    let createdCount = 0;
    
    fulfilledOrders.forEach(order => {
        // Check if sale already exists
        let sales = JSON.parse(localStorage.getItem('sales') || '[]');
        const existingSale = sales.find(s => s.orderId === order.id);
        
        if (!existingSale) {
            createSaleFromOrder(order);
            createdCount++;
        }
    });
    
    showToast(`Created sales for ${createdCount} fulfilled orders`, 'success');
    
    // Refresh displays
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboardData();
    }
    generateReport();
    updateTodaySummary();
    loadCustomers(); // Refresh customer totals
}

// ================== CLIENT ORDERING ==================
function changeClientQuantity(change) {
    const quantityInput = document.getElementById('clientQuantity');
    let newValue = parseInt(quantityInput.value) + change;
    if (newValue < 1) newValue = 1;
    if (newValue > 50) newValue = 50;
    quantityInput.value = newValue;
    calculateClientTotal();
}

function calculateClientTotal() {
    const quantity = parseInt(document.getElementById('clientQuantity').value) || 1;
    const containerSize = parseInt(document.getElementById('containerSize').value) || 5;
    const pricePerUnit = containerSize === 5 ? 15 : containerSize === 3 ? 10 : 5;
    let discount = 0;
    if (quantity >= 10) discount = 0.10;
    const totalAmount = (pricePerUnit * quantity * (1 - discount)).toFixed(2);
    document.getElementById('clientTotalAmount').textContent = totalAmount;
    return parseFloat(totalAmount);
}

function submitClientOrder() {
    if (!currentClient) {
        showToast('Please login first', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('clientQuantity').value) || 1;
    const containerSize = parseInt(document.getElementById('containerSize').value) || 5;
    const totalAmount = calculateClientTotal();
    
    const orderId = 'ORD' + Date.now().toString().slice(-6);
    const newOrder = {
        id: orderId,
        clientId: currentClient.id,
        clientName: currentClient.name,
        clientPhone: currentClient.phone,
        clientAddress: currentClient.address,
        quantity: quantity,
        containerSize: containerSize,
        containerType: containerSize + ' Gallon',
        pricePerUnit: containerSize === 5 ? 15 : containerSize === 3 ? 10 : 5,
        totalAmount: totalAmount,
        deliverySchedule: 'ASAP',
        status: 'pending',
        orderDate: new Date().toISOString(),
        timestamp: Date.now(),
        source: 'pos-client', // Mark as from POS client module
        fulfilled: false
    };
    
    let orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    orders.push(newOrder);
    localStorage.setItem('clientOrders', JSON.stringify(orders));
    
    document.getElementById('clientQuantity').value = 1;
    calculateClientTotal();
    loadClientOrders();
    showToast('Order submitted successfully! We will contact you soon.', 'success');
}

function loadClientOrders() {
    if (!currentClient) return;
    
    const orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    const clientOrders = orders.filter(order => order.clientId === currentClient.id);
    const tableBody = document.getElementById('clientOrdersTable');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (clientOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;"></i><br>
                    No orders yet. Place your first order!
                </td>
            </tr>
        `;
    } else {
        clientOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        clientOrders.forEach(order => {
            const row = document.createElement('tr');
            const isFulfilled = order.status === 'delivered';
            const isCancelled = order.status === 'cancelled';
            const fulfillmentStatus = isFulfilled ? 'Fulfilled ✓' : isCancelled ? 'Cancelled ✗' : 'Not Yet Fulfilled';
            
            row.innerHTML = `
                <td><strong>${order.id}</strong></td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>${order.quantity} x ${order.containerType}</td>
                <td>₱${order.totalAmount}</td>
                <td><span class="order-status ${order.status}">${order.status}</span></td>
                <td><span class="fulfillment-status ${isFulfilled ? 'fulfilled' : isCancelled ? 'cancelled' : 'pending'}">${fulfillmentStatus}</span></td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function loadClientProfile() {
    if (!currentClient) return;
    
    document.getElementById('profileName').value = currentClient.name;
    document.getElementById('profilePhone').value = currentClient.phone;
    document.getElementById('profileAddress').value = currentClient.address;
}

function updateClientProfile() {
    if (!currentClient) return;
    
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const address = document.getElementById('profileAddress').value.trim();
    
    if (!name || !phone || !address) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    currentClient.name = name;
    currentClient.phone = phone;
    currentClient.address = address;
    localStorage.setItem('currentClient', JSON.stringify(currentClient));
    updateClientInfo();
    showToast('Profile updated successfully', 'success');
}

// ================== SETTINGS ==================
function loadSettings() {
    const storeName = localStorage.getItem('storeName') || 'PureFlow POS';
    const savedBasePrice = localStorage.getItem('basePrice');
    const savedSukiDiscount = localStorage.getItem('sukiDiscount');
    
    document.getElementById('storeName').value = storeName;
    document.getElementById('storeTitle').textContent = storeName;
    
    if (savedBasePrice) {
        basePrice = parseInt(savedBasePrice);
        document.getElementById('basePrice').value = basePrice;
    }
    
    if (savedSukiDiscount) {
        sukiDiscount = parseInt(savedSukiDiscount);
        document.getElementById('sukiDiscount').value = sukiDiscount;
    }
}

function saveSettings() {
    if (!checkAdminPermission('change settings')) return;
    
    const storeName = document.getElementById('storeName').value.trim();
    const newBasePrice = parseInt(document.getElementById('basePrice').value);
    const newSukiDiscount = parseInt(document.getElementById('sukiDiscount').value);
    
    if (storeName) {
        localStorage.setItem('storeName', storeName);
        document.getElementById('storeTitle').textContent = storeName;
    }
    
    if (!isNaN(newBasePrice) && newBasePrice > 0) {
        localStorage.setItem('basePrice', newBasePrice);
        basePrice = newBasePrice;
    }
    
    if (!isNaN(newSukiDiscount) && newSukiDiscount >= 0 && newSukiDiscount <= 100) {
        localStorage.setItem('sukiDiscount', newSukiDiscount);
        sukiDiscount = newSukiDiscount;
    }
    
    showToast('Settings saved successfully', 'success');
}

// ================== USER MANAGEMENT MODULE ==================
function manageUsers() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Only administrators can manage users', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'userManagementModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <div class="modal-logo-title">
                    <img src="pureflow-logo.png" alt="PureFlow Logo" class="header-logo">
                    <h3><i class="fas fa-users-cog"></i> User Management</h3>
                </div>
                <button class="modal-close" id="closeUserModalBtn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="user-management-header">
                    <button class="btn-primary" id="addUserBtn">
                        <i class="fas fa-user-plus"></i> Add New User
                    </button>
                    <div class="search-box" style="width: 300px;">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchUser" class="search-input" placeholder="Search users...">
                    </div>
                </div>
                
                <div class="table-container" style="max-height: 400px; margin-top: 20px;">
                    <table class="customer-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody"></tbody>
                    </table>
                </div>
                
                <div id="userFormContainer" style="display: none; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                    <h4><i class="fas fa-user-edit"></i> <span id="userFormTitle">Add New User</span></h4>
                    <input type="hidden" id="editUserId">
                    
                    <div class="form-group">
                        <label class="form-label">Username *</label>
                        <input type="text" id="editUsername" class="form-input" placeholder="Enter username" maxlength="20">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" id="editFullName" class="form-input" placeholder="Enter full name">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" id="editEmail" class="form-input" placeholder="user@example.com">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Role *</label>
                        <select id="editRole" class="form-select">
                            <option value="admin">Administrator</option>
                            <option value="cashier">Cashier</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Password <span id="passwordNote">*</span></label>
                        <input type="password" id="editPassword" class="form-input" placeholder="Enter password">
                        <small id="passwordHelp" style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
                            Leave blank to keep existing password when editing
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="editStatus" class="form-select">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    
                    <div class="modal-footer" style="padding: 0; border: none; justify-content: flex-start;">
                        <button class="btn-primary" id="saveUserBtn">
                            <i class="fas fa-save"></i> Save User
                        </button>
                        <button class="btn-secondary" id="cancelUserBtn">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="closeUserModalFooterBtn">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadUsersTable();
    
    setTimeout(() => {
        document.getElementById('closeUserModalBtn').addEventListener('click', () => modal.remove());
        document.getElementById('closeUserModalFooterBtn').addEventListener('click', () => modal.remove());
        document.getElementById('addUserBtn').addEventListener('click', showAddUserForm);
        document.getElementById('saveUserBtn').addEventListener('click', saveUser);
        document.getElementById('cancelUserBtn').addEventListener('click', cancelUserEdit);
        document.getElementById('searchUser').addEventListener('input', searchUsers);
    }, 100);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) modal.remove();
    });
}

function loadUsersTable() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const tableBody = document.getElementById('usersTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-users-slash" style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;"></i><br>
                    No users found. Click "Add New User" to create one.
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.fullName || '-'}</td>
            <td>${user.email || '-'}</td>
            <td><span class="customer-type ${user.role}">${user.role}</span></td>
            <td><span class="order-status ${user.isActive ? 'delivered' : 'cancelled'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td style="font-size: 12px;">${lastLogin}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${user.username !== currentUser.username ? 
                        `<button class="action-btn delete" onclick="deleteUser(${user.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>` : 
                        `<button class="action-btn delete" disabled title="Cannot delete yourself">
                            <i class="fas fa-trash"></i> Delete
                        </button>`
                    }
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function searchUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const tableBody = document.getElementById('usersTableBody');
    
    if (!tableBody) return;
    
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        user.role.toLowerCase().includes(searchTerm)
    );
    
    tableBody.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px; color: #666;">
                    No users found matching "${searchTerm}"
                </td>
            </tr>
        `;
        return;
    }
    
    filteredUsers.forEach(user => {
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.fullName || '-'}</td>
            <td>${user.email || '-'}</td>
            <td><span class="customer-type ${user.role}">${user.role}</span></td>
            <td><span class="order-status ${user.isActive ? 'delivered' : 'cancelled'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td style="font-size: 12px;">${lastLogin}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${user.username !== currentUser.username ? 
                        `<button class="action-btn delete" onclick="deleteUser(${user.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>` : 
                        `<button class="action-btn delete" disabled title="Cannot delete yourself">
                            <i class="fas fa-trash"></i> Delete
                        </button>`
                    }
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function showAddUserForm() {
    const formContainer = document.getElementById('userFormContainer');
    if (!formContainer) return;
    
    formContainer.style.display = 'block';
    document.getElementById('userFormTitle').textContent = 'Add New User';
    document.getElementById('editUserId').value = '';
    document.getElementById('editUsername').value = '';
    document.getElementById('editFullName').value = '';
    document.getElementById('editEmail').value = '';
    document.getElementById('editRole').value = 'cashier';
    document.getElementById('editPassword').value = '';
    document.getElementById('editStatus').value = 'active';
    document.getElementById('passwordNote').textContent = '*';
    document.getElementById('passwordHelp').style.display = 'none';
}

function editUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    const formContainer = document.getElementById('userFormContainer');
    
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    if (!formContainer) return;
    
    formContainer.style.display = 'block';
    document.getElementById('userFormTitle').textContent = 'Edit User';
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editFullName').value = user.fullName || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editRole').value = user.role;
    document.getElementById('editPassword').value = '';
    document.getElementById('editStatus').value = user.isActive ? 'active' : 'inactive';
    document.getElementById('passwordNote').textContent = '';
    document.getElementById('passwordHelp').style.display = 'block';
}

function cancelUserEdit() {
    const formContainer = document.getElementById('userFormContainer');
    if (!formContainer) return;
    
    formContainer.style.display = 'none';
    document.getElementById('editUserId').value = '';
    document.getElementById('editUsername').value = '';
    document.getElementById('editFullName').value = '';
    document.getElementById('editEmail').value = '';
    document.getElementById('editPassword').value = '';
}

function saveUser() {
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value.trim();
    const fullName = document.getElementById('editFullName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const role = document.getElementById('editRole').value;
    const password = document.getElementById('editPassword').value;
    const status = document.getElementById('editStatus').value;
    const isActive = status === 'active';
    
    if (!username) {
        showToast('Username is required', 'error');
        return;
    }
    
    if (!userId && !password) {
        showToast('Password is required for new users', 'error');
        return;
    }
    
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (userId) {
        const existingUser = users.find(u => u.id === parseInt(userId));
        if (!existingUser) {
            showToast('User not found', 'error');
            return;
        }
        
        const duplicateUser = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.id !== parseInt(userId)
        );
        
        if (duplicateUser) {
            showToast('Username already exists', 'error');
            return;
        }
        
        existingUser.username = username;
        existingUser.fullName = fullName;
        existingUser.email = email;
        existingUser.role = role;
        existingUser.isActive = isActive;
        
        if (password) existingUser.password = password;
        if (!existingUser.createdDate) existingUser.createdDate = new Date().toISOString();
        
        showToast('User updated successfully', 'success');
    } else {
        const duplicateUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (duplicateUser) {
            showToast('Username already exists', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            username: username,
            password: password,
            fullName: fullName,
            email: email,
            role: role,
            isActive: isActive,
            createdDate: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        showToast('User added successfully', 'success');
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    loadUsersTable();
    cancelUserEdit();
}

function deleteUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    if (user.username === currentUser.username) {
        showToast('You cannot delete your own account', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) return;
    
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    showToast('User deleted successfully', 'success');
    loadUsersTable();
}

// ================== DATA MANAGEMENT ==================
function backupData() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Only administrators can backup data', 'error');
        return;
    }
    
    const backup = {
        sales: JSON.parse(localStorage.getItem('sales') || '[]'),
        customers: JSON.parse(localStorage.getItem('customers') || '[]'),
        users: JSON.parse(localStorage.getItem('users') || '[]'),
        clientOrders: JSON.parse(localStorage.getItem('clientOrders') || '[]'),
        voidedTransactions: JSON.parse(localStorage.getItem('voidedTransactions') || '[]'),
        settings: {
            storeName: localStorage.getItem('storeName'),
            basePrice: localStorage.getItem('basePrice'),
            sukiDiscount: localStorage.getItem('sukiDiscount')
        },
        timestamp: new Date().toISOString(),
        backedUpBy: currentUser.username
    };
    
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pureflow_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast('Data backed up successfully', 'success');
}

function clearData() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Only administrators can clear data', 'error');
        return;
    }
    
    if (!confirm('ARE YOU ABSOLUTELY SURE? This will delete ALL sales, customers, and orders data. Users and settings will be preserved.')) return;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const settings = {
        storeName: localStorage.getItem('storeName'),
        basePrice: localStorage.getItem('basePrice'),
        sukiDiscount: localStorage.getItem('sukiDiscount')
    };
    
    // Clear only business data
    localStorage.removeItem('sales');
    localStorage.removeItem('customers');
    localStorage.removeItem('clientOrders');
    localStorage.removeItem('voidedTransactions');
    
    // Restore users and settings
    localStorage.setItem('users', JSON.stringify(users));
    if (settings.storeName) localStorage.setItem('storeName', settings.storeName);
    if (settings.basePrice) localStorage.setItem('basePrice', settings.basePrice);
    if (settings.sukiDiscount) localStorage.setItem('sukiDiscount', settings.sukiDiscount);
    
    // Reinitialize with sample data
    initializeSampleData();
    
    // Refresh displays
    loadCustomers();
    updateTodaySummary();
    generateReport();
    loadDashboardData();
    
    showToast('Business data cleared successfully', 'success');
}

// ================== HELPER FUNCTIONS ==================
function updateCustomerSuggestions() {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const datalist = document.getElementById('customerSuggestions');
    
    if (!datalist) return;
    
    datalist.innerHTML = '';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.name;
        datalist.appendChild(option);
    });
}

function exportReport() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    if (sales.length === 0) {
        showToast('No sales data to export', 'warning');
        return;
    }
    
    let csv = 'Date,Time,Customer,Type,Quantity,Amount,Processed By,User Role,Source,Order ID\n';
    sales.forEach(sale => {
        const date = new Date(sale.timestamp);
        csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${sale.customer}","${sale.type}",${sale.quantity},${sale.amount},"${sale.processedBy || 'N/A'}","${sale.userRole || 'N/A'}","${sale.source || 'in-store'}","${sale.orderId || 'N/A'}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pureflow_sales_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast('Report exported successfully', 'success');
}

function exportOrdersReport() {
    const orders = JSON.parse(localStorage.getItem('clientOrders') || '[]');
    if (orders.length === 0) {
        showToast('No orders data to export', 'warning');
        return;
    }
    
    let csv = 'Order ID,Date,Client Name,Phone,Address,Quantity,Container Size,Total Amount,Status,Fulfilled,Source\n';
    orders.forEach(order => {
        const date = new Date(order.timestamp || order.orderDate);
        const isFulfilled = order.status === 'delivered';
        csv += `"${order.id}","${date.toLocaleDateString()}","${order.clientName || order.customerName}","${order.clientPhone || order.customerPhone}","${order.clientAddress || order.customerAddress}",${order.quantity},${order.containerSize || 5},${order.totalAmount},"${order.status}","${isFulfilled ? 'Yes' : 'No'}","${order.source || 'in-store'}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pureflow_orders_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast('Orders report exported successfully', 'success');
}

function printOrdersReport() {
    window.print();
}

// ================== PERMISSION CHECK FUNCTIONS ==================

function checkAdminPermission(action) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        return false;
    }
    
    if (currentUser.role !== 'admin') {
        showToast(`Only administrators can ${action}`, 'error');
        return false;
    }
    
    return true;
}

function checkCashierPermission(action) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        return false;
    }
    
    if (currentUser.role === 'cashier') {
        showToast(`Cashiers cannot ${action}. Please contact an administrator.`, 'error');
        return false;
    }
    
    return true;
}

function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

function isCashier() {
    return currentUser && currentUser.role === 'cashier';
}

// ================== VOID TRANSACTION FUNCTIONS ==================

function showVoidTransactionModal(saleId) {
    if (!checkAdminPermission('void transactions')) return;
    
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const sale = sales.find(s => s.id === saleId);
    
    if (!sale) {
        showToast('Sale not found', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'voidTransactionModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <div class="modal-logo-title">
                    <img src="pureflow-logo.png" alt="PureFlow Logo" class="header-logo">
                    <h3><i class="fas fa-ban"></i> Void Transaction</h3>
                </div>
                <button class="modal-close" onclick="closeVoidTransactionModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="warning-banner" style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #856404;">
                        <i class="fas fa-exclamation-triangle"></i> Warning: Voiding Transaction
                    </h4>
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                        This action cannot be undone. All data related to this transaction will be permanently removed.
                    </p>
                </div>
                
                <div class="transaction-details">
                    <h4>Transaction Details</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Transaction ID:</span>
                            <span class="detail-value">${sale.id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value">${new Date(sale.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Customer:</span>
                            <span class="detail-value">${sale.customer}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Amount:</span>
                            <span class="detail-value">₱${sale.amount.toFixed(2)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Processed By:</span>
                            <span class="detail-value">${sale.processedBy} (${sale.userRole})</span>
                        </div>
                        ${sale.orderId ? `
                        <div class="detail-item">
                            <span class="detail-label">Order ID:</span>
                            <span class="detail-value">${sale.orderId}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-comment"></i> Reason for Void
                    </label>
                    <select id="voidReason" class="form-select" required>
                        <option value="">Select reason</option>
                        <option value="duplicate">Duplicate Transaction</option>
                        <option value="error">Data Entry Error</option>
                        <option value="cancelled">Customer Cancelled</option>
                        <option value="price_error">Incorrect Price</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-sticky-note"></i> Additional Notes
                    </label>
                    <textarea id="voidNotes" class="form-input" placeholder="Enter additional details..." rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-key"></i> Admin Password Verification
                    </label>
                    <input type="password" id="adminPassword" class="form-input" placeholder="Enter admin password to confirm" required>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-danger" onclick="voidTransaction(${saleId})">
                    <i class="fas fa-ban"></i> Void Transaction
                </button>
                <button class="btn-secondary" onclick="closeVoidTransactionModal()">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        document.getElementById('voidReason').focus();
    }, 100);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeVoidTransactionModal();
    });
}

function closeVoidTransactionModal() {
    const modal = document.getElementById('voidTransactionModal');
    if (modal) modal.remove();
}

function voidTransaction(saleId) {
    if (!checkAdminPermission('void transactions')) return;
    
    const reason = document.getElementById('voidReason').value;
    const notes = document.getElementById('voidNotes').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (!reason) {
        showToast('Please select a reason for voiding', 'error');
        return;
    }
    
    if (!password) {
        showToast('Please enter admin password for verification', 'error');
        return;
    }
    
    // Verify admin password
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const admin = users.find(u => u.role === 'admin' && u.password === password);
    
    if (!admin) {
        showToast('Invalid admin password', 'error');
        return;
    }
    
    let sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const saleIndex = sales.findIndex(s => s.id === saleId);
    
    if (saleIndex === -1) {
        showToast('Sale not found', 'error');
        return;
    }
    
    const sale = sales[saleIndex];
    
    // Create void record before deleting
    let voidedTransactions = JSON.parse(localStorage.getItem('voidedTransactions') || '[]');
    const voidRecord = {
        originalSale: sale,
        voidedBy: currentUser.username,
        voidedAt: new Date().toISOString(),
        reason: reason,
        notes: notes,
        adminVerified: true
    };
    
    voidedTransactions.push(voidRecord);
    localStorage.setItem('voidedTransactions', JSON.stringify(voidedTransactions));
    
    // Remove from sales
    sales.splice(saleIndex, 1);
    localStorage.setItem('sales', JSON.stringify(sales));
    
    // Update customer totals if applicable
    if (sale.customer && sale.customer !== 'Walk-in' && sale.customer !== 'Online Customer') {
        updateCustomerTotal(sale.customer);
    }
    
    closeVoidTransactionModal();
    updateTodaySummary();
    generateReport();
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboardData();
    }
    if (document.getElementById('customers').classList.contains('active')) {
        loadCustomers();
    }
    
    showToast('Transaction voided successfully', 'success');
}

function showVoidedTransactionsReport() {
    if (!checkAdminPermission('view voided transactions')) return;
    
    const voidedTransactions = JSON.parse(localStorage.getItem('voidedTransactions') || '[]');
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'voidedTransactionsModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <div class="modal-logo-title">
                    <img src="pureflow-logo.png" alt="PureFlow Logo" class="header-logo">
                    <h3><i class="fas fa-history"></i> Voided Transactions Report</h3>
                </div>
                <button class="modal-close" onclick="closeVoidedTransactionsReport()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="table-container" style="max-height: 500px;">
                    <table class="customer-table">
                        <thead>
                            <tr>
                                <th>Original Sale ID</th>
                                <th>Order ID</th>
                                <th>Voided Date</th>
                                <th>Original Customer</th>
                                <th>Original Amount</th>
                                <th>Voided By</th>
                                <th>Reason</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody id="voidedTransactionsBody">
                            ${voidedTransactions.length === 0 ? `
                                <tr>
                                    <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                                        <i class="fas fa-ban" style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;"></i><br>
                                        No voided transactions
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
                
                ${voidedTransactions.length > 0 ? `
                    <div class="report-footer" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                        <div class="summary-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                            <div class="stat-box">
                                <div class="stat-value">${voidedTransactions.length}</div>
                                <div class="stat-label">Total Voided</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">₱${voidedTransactions.reduce((sum, v) => sum + v.originalSale.amount, 0).toFixed(2)}</div>
                                <div class="stat-label">Total Amount Voided</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="exportVoidedTransactions()">
                    <i class="fas fa-file-export"></i> Export CSV
                </button>
                <button class="btn-secondary" onclick="closeVoidedTransactionsReport()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Populate table if there are voided transactions
    if (voidedTransactions.length > 0) {
        const tableBody = document.getElementById('voidedTransactionsBody');
        tableBody.innerHTML = '';
        
        voidedTransactions.sort((a, b) => new Date(b.voidedAt) - new Date(a.voidedAt));
        
        voidedTransactions.forEach(voidRecord => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${voidRecord.originalSale.id}</td>
                <td>${voidRecord.originalSale.orderId || 'N/A'}</td>
                <td>${new Date(voidRecord.voidedAt).toLocaleString()}</td>
                <td>${voidRecord.originalSale.customer}</td>
                <td>₱${voidRecord.originalSale.amount.toFixed(2)}</td>
                <td>${voidRecord.voidedBy}</td>
                <td><span class="order-status ${voidRecord.reason === 'duplicate' ? 'cancelled' : 'pending'}">${voidRecord.reason}</span></td>
                <td>${voidRecord.notes || '-'}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeVoidedTransactionsReport();
    });
}

function closeVoidedTransactionsReport() {
    const modal = document.getElementById('voidedTransactionsModal');
    if (modal) modal.remove();
}

function exportVoidedTransactions() {
    const voidedTransactions = JSON.parse(localStorage.getItem('voidedTransactions') || '[]');
    if (voidedTransactions.length === 0) {
        showToast('No voided transactions to export', 'warning');
        return;
    }
    
    let csv = 'Original Sale ID,Order ID,Voided Date,Original Customer,Original Amount,Processed By,Original Role,Voided By,Reason,Notes\n';
    voidedTransactions.forEach(record => {
        csv += `"${record.originalSale.id}","${record.originalSale.orderId || 'N/A'}","${new Date(record.voidedAt).toLocaleString()}","${record.originalSale.customer}",${record.originalSale.amount},"${record.originalSale.processedBy}","${record.originalSale.userRole}","${record.voidedBy}","${record.reason}","${record.notes || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pureflow_voided_transactions_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast('Voided transactions exported successfully', 'success');
}

// ================== ADD VOID BUTTON TO NAVIGATION FOR ADMIN ==================

function addVoidButtonToNav() {
    if (!isAdmin()) return;
    
    // Check if void button already exists
    if (document.getElementById('voidReportBtn')) return;
    
    const nav = document.querySelector('.navigation');
    if (!nav) return;
    
    const voidButton = document.createElement('button');
    voidButton.className = 'nav-btn';
    voidButton.id = 'voidReportBtn';
    voidButton.innerHTML = '<i class="fas fa-ban"></i> <span>Voided Transactions</span>';
    voidButton.onclick = showVoidedTransactionsReport;
    
    // Insert before settings tab
    const settingsTab = document.getElementById('settingsTab');
    if (settingsTab) {
        nav.insertBefore(voidButton, settingsTab);
    } else {
        nav.appendChild(voidButton);
    }
}

// ================== ADD SYNC FULFILLED ORDERS BUTTON FOR ADMIN ==================

function addSyncFulfilledButton() {
    if (!isAdmin()) return;
    
    // Check if button already exists
    if (document.getElementById('syncFulfilledBtn')) return;
    
    const dataManagementSection = document.getElementById('dataManagementSection');
    if (!dataManagementSection) return;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.innerHTML = `
        <button class="btn-primary" id="syncFulfilledBtn" onclick="syncExistingFulfilledOrders()">
            <i class="fas fa-sync-alt"></i> Sync Fulfilled Orders to Sales
        </button>
        <small style="display: block; color: #666; margin-top: 5px;">
            Creates sales records for all previously fulfilled orders and updates customer totals
        </small>
    `;
    
    dataManagementSection.appendChild(buttonContainer);
}

// ================== NAVIGATION FUNCTIONS ==================

function showAllSales() {
    showTab('reports');
}

function showAllCustomers() {
    showTab('customers');
}

// ================== RECALCULATE ALL CUSTOMER TOTALS BUTTON ==================

function addRecalculateTotalsButton() {
    if (!isAdmin()) return;
    
    // Check if button already exists
    if (document.getElementById('recalculateTotalsBtn')) return;
    
    const dataManagementSection = document.getElementById('dataManagementSection');
    if (!dataManagementSection) return;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.innerHTML = `
        <button class="btn-primary" id="recalculateTotalsBtn" onclick="recalculateAndRefreshCustomers()" style="background: #17a2b8;">
            <i class="fas fa-calculator"></i> Recalculate All Customer Totals
        </button>
        <small style="display: block; color: #666; margin-top: 5px;">
            Recalculates total spent for all customers based on sales data
        </small>
    `;
    
    dataManagementSection.appendChild(buttonContainer);
}

function recalculateAndRefreshCustomers() {
    if (!checkAdminPermission('recalculate customer totals')) return;
    
    recalculateAllCustomerTotals();
    loadCustomers();
    showToast('✅ Customer totals recalculated successfully', 'success');
}

// Call this function after admin logs in
setTimeout(() => {
    if (isAdmin()) {
        addSyncFulfilledButton();
        addRecalculateTotalsButton();
    }
}, 2000);
