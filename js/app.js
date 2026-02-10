// Simple username/password authentication system
// No Firebase required - uses localStorage

// Application State
let currentUser = null;
let scenes = [];
let uniqueLocations = new Set();
let uniqueCast = new Set();
let uniqueVehicles = new Set();

// DOM Elements
const elements = {
    header: document.getElementById('main-header'),
    authContainer: document.getElementById('auth-container'),
    appInterface: document.getElementById('app-interface'),
    // Auth inputs
    usernameInput: document.getElementById('username-input'),
    passwordInput: document.getElementById('password-input'),
    loginUsernameBtn: document.getElementById('login-username-btn'),
    registerBtn: document.getElementById('register-btn'),

    logoutBtn: document.getElementById('logout-btn'),
    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    sceneForm: document.getElementById('scene-form'),
    sceneNoInput: document.getElementById('scene-no'),
    locationInput: document.getElementById('location'),
    dayNightInput: document.getElementById('day-night'),
    pageCountInput: document.getElementById('page-count'),
    descriptionInput: document.getElementById('description'),
    vehiclesInput: document.getElementById('vehicles'),
    castInput: document.getElementById('cast-input'),
    addCastBtn: document.getElementById('add-cast-btn'),
    castList: document.getElementById('cast-list'),

    // Suggestions
    locationSuggestions: document.getElementById('location-suggestions'),
    castSuggestions: document.getElementById('cast-suggestions'),
    vehiclesSuggestions: document.getElementById('vehicles-suggestions'),

    // Stats
    totalScenesEl: document.getElementById('total-scenes'),
    totalLocationsEl: document.getElementById('total-locations'),

    // Tabs & Views
    tabMaster: document.getElementById('tab-master'),
    tabBreakdown: document.getElementById('tab-breakdown'),
    viewMaster: document.getElementById('view-master'),
    viewBreakdown: document.getElementById('view-breakdown'),

    // Master Table
    masterTableBody: document.getElementById('master-table-body'),
    downloadMasterBtn: document.getElementById('download-master-btn'),

    // Breakdown
    breakdownLocationSelect: document.getElementById('breakdown-location-select'),
    downloadBreakdownBtn: document.getElementById('download-breakdown-btn'),
    downloadAllBreakdownsBtn: document.getElementById('download-all-breakdowns-btn'),
    breakdownContent: document.getElementById('breakdown-content'),
    breakdownTableBody: document.getElementById('breakdown-table-body'),
    breakdownTitle: document.getElementById('breakdown-title'),
    breakdownPrintArea: document.getElementById('breakdown-print-area')
};

// Temp Cast State for Form
let currentFormCast = [];

// ==========================================
// Authentication Service
// ==========================================

const AuthService = {
    login: async (username, password) => {
        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[username] && users[username].password === password) {
            return {
                uid: username,
                displayName: username,
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
            };
        } else {
            throw new Error('Invalid username or password');
        }
    },

    register: async (username, password) => {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[username]) {
            throw new Error('Username already exists');
        }

        users[username] = { password };
        localStorage.setItem('users', JSON.stringify(users));

        return {
            uid: username,
            displayName: username,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
        };
    },

    checkAuth: () => {
        const savedUser = sessionStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    },

    logout: () => {
        sessionStorage.removeItem('currentUser');
    }
};

// ==========================================
// Data Service
// ==========================================

const DataService = {
    getScenes: (username) => {
        const key = `scenes_${username}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    saveScenes: (username, scenes) => {
        const key = `scenes_${username}`;
        localStorage.setItem(key, JSON.stringify(scenes));
    },

    addScene: (username, scene) => {
        const scenes = DataService.getScenes(username);
        scene.id = 'scene_' + Date.now();
        scenes.push(scene);
        scenes.sort((a, b) => a.sceneNo - b.sceneNo);
        DataService.saveScenes(username, scenes);
        return scenes;
    },

    deleteScene: (username, sceneId) => {
        let scenes = DataService.getScenes(username);
        scenes = scenes.filter(s => s.id !== sceneId);
        DataService.saveScenes(username, scenes);
        return scenes;
    }
};

// ==========================================
// Authentication Logic
// ==========================================

// Check if user is already logged in
const savedUser = AuthService.checkAuth();
if (savedUser) {
    currentUser = savedUser;
    showApp();
    loadData();
} else {
    showAuth();
}

function showAuth() {
    elements.header.classList.add('hidden');
    elements.authContainer.classList.remove('hidden');
    elements.appInterface.classList.add('hidden');
}

function showApp() {
    elements.userName.textContent = currentUser.displayName;
    elements.userAvatar.src = currentUser.photoURL;
    elements.header.classList.remove('hidden');
    elements.authContainer.classList.add('hidden');
    elements.appInterface.classList.remove('hidden');
}

// Login
elements.loginUsernameBtn.addEventListener('click', async () => {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value;

    if (!username || !password) {
        showAuthError("Please enter username and password");
        return;
    }

    try {
        const user = await AuthService.login(username, password);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
        showApp();
        loadData();
    } catch (error) {
        showAuthError(error.message);
    }
});

// Register
elements.registerBtn.addEventListener('click', async () => {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value;

    if (!username || !password) {
        showAuthError("Please enter username and password");
        return;
    }

    try {
        const user = await AuthService.register(username, password);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
        showApp();
        loadData();
    } catch (error) {
        showAuthError(error.message);
    }
});

// Logout
elements.logoutBtn.addEventListener('click', () => {
    AuthService.logout();
    currentUser = null;
    scenes = [];
    window.location.reload();
});

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

// ==========================================
// Data Management
// ==========================================

function loadData() {
    if (!currentUser) return;
    scenes = DataService.getScenes(currentUser.uid);
    updateUI();
}

function updateUI() {
    updateStats();
    updateSuggestions();
    renderMasterTable();
    updateBreakdownSelect();
    if (activeTab === 'breakdown') renderBreakdown();
}

async function addSceneHandler(sceneData) {
    try {
        scenes = DataService.addScene(currentUser.uid, sceneData);
        updateUI();

        // Reset Form
        elements.sceneForm.reset();
        currentFormCast = [];
        renderCastTags();
        elements.locationInput.value = '';
        elements.castInput.value = '';
        elements.descriptionInput.value = '';
        elements.vehiclesInput.value = '';
        elements.sceneNoInput.focus();
    } catch (error) {
        console.error("Error adding scene:", error);
        alert("Failed to save scene: " + error.message);
    }
}

window.deleteScene = function (id) {
    if (confirm("Are you sure you want to delete this scene?")) {
        try {
            scenes = DataService.deleteScene(currentUser.uid, id);
            updateUI();
        } catch (error) {
            console.error("Error deleting scene:", error);
        }
    }
}

function updateStats() {
    elements.totalScenesEl.textContent = scenes.length;
    const locs = new Set(scenes.map(s => s.location));
    elements.totalLocationsEl.textContent = locs.size;
}

function updateSuggestions() {
    uniqueLocations.clear();
    uniqueCast.clear();
    uniqueVehicles.clear();

    scenes.forEach(scene => {
        if (scene.location) uniqueLocations.add(scene.location);
        if (scene.cast && Array.isArray(scene.cast)) {
            scene.cast.forEach(c => uniqueCast.add(c));
        }
        if (scene.vehicles) {
            scene.vehicles.split(',').forEach(v => {
                const trimmed = v.trim();
                if (trimmed) uniqueVehicles.add(trimmed);
            });
        }
    });

    elements.locationSuggestions.innerHTML = '';
    uniqueLocations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        elements.locationSuggestions.appendChild(option);
    });

    elements.castSuggestions.innerHTML = '';
    uniqueCast.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        elements.castSuggestions.appendChild(option);
    });

    elements.vehiclesSuggestions.innerHTML = '';
    uniqueVehicles.forEach(v => {
        const option = document.createElement('option');
        option.value = v;
        elements.vehiclesSuggestions.appendChild(option);
    });
}

// ==========================================
// Form Handling
// ==========================================

elements.addCastBtn.addEventListener('click', addCastMember);
elements.castInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addCastMember();
    }
});

function addCastMember() {
    const name = elements.castInput.value.trim();
    if (!name) return;

    if (currentFormCast.length >= 10) {
        alert("Maximum 10 cast members allowed per scene.");
        return;
    }

    if (!currentFormCast.includes(name)) {
        currentFormCast.push(name);
        renderCastTags();
    }
    elements.castInput.value = '';
    elements.castInput.focus();
}

window.removeCastMember = function (index) {
    currentFormCast.splice(index, 1);
    renderCastTags();
}

function renderCastTags() {
    elements.castList.innerHTML = '';
    currentFormCast.forEach((member, index) => {
        const tag = document.createElement('span');
        tag.className = 'cast-tag';
        tag.innerHTML = `${member} <span style="cursor:pointer; margin-left:4px;" onclick="window.removeCastMember(${index})">&times;</span>`;
        elements.castList.appendChild(tag);
    });
}

elements.sceneForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const sceneNo = parseInt(elements.sceneNoInput.value);
    const location = elements.locationInput.value.trim();
    const dayNight = elements.dayNightInput.value;
    const pageCount = parseFloat(elements.pageCountInput.value) || 0;
    const description = elements.descriptionInput.value.trim();
    const vehicles = elements.vehiclesInput.value.trim();

    if (!location) {
        alert("Please enter a location.");
        return;
    }

    const newScene = {
        sceneNo,
        location,
        dayNight,
        pageCount,
        description,
        vehicles,
        cast: [...currentFormCast],
        createdAt: new Date().toISOString()
    };

    addSceneHandler(newScene);
});

// ==========================================
// UI Rendering
// ==========================================

let activeTab = 'master';

elements.tabMaster.addEventListener('click', () => switchTab('master'));
elements.tabBreakdown.addEventListener('click', () => switchTab('breakdown'));

function switchTab(tab) {
    activeTab = tab;
    if (tab === 'master') {
        elements.tabMaster.classList.add('active');
        elements.tabBreakdown.classList.remove('active');
        elements.tabMaster.style.borderBottom = "2px solid var(--primary-color)";
        elements.tabBreakdown.style.borderBottom = "none";
        elements.viewMaster.classList.remove('hidden');
        elements.viewBreakdown.classList.add('hidden');
    } else {
        elements.tabMaster.classList.remove('active');
        elements.tabBreakdown.classList.add('active');
        elements.tabBreakdown.style.borderBottom = "2px solid var(--primary-color)";
        elements.tabMaster.style.borderBottom = "none";
        elements.viewMaster.classList.add('hidden');
        elements.viewBreakdown.classList.remove('hidden');
        updateBreakdownSelect();
    }
}

function renderMasterTable() {
    elements.masterTableBody.innerHTML = '';
    scenes.forEach(scene => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${scene.sceneNo}</td>
            <td>${scene.location}</td>
            <td>${scene.dayNight}</td>
            <td>${scene.cast ? scene.cast.join(', ') : '-'}</td>
            <td>${scene.description || '-'}</td>
            <td>${scene.vehicles || '-'}</td>
            <td>${scene.pageCount || '-'}</td>
            <td>
                <button class="btn btn-danger" style="padding: 0.25rem 0.5rem;" onclick="window.deleteScene('${scene.id}')">
                    <i class="ph ph-trash"></i>
                </button>
            </td>
        `;
        elements.masterTableBody.appendChild(tr);
    });
}

function updateBreakdownSelect() {
    const currentVal = elements.breakdownLocationSelect.value;
    elements.breakdownLocationSelect.innerHTML = '<option value="">Select a Location...</option>';

    const sortedLocs = Array.from(uniqueLocations).sort();
    sortedLocs.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc;
        elements.breakdownLocationSelect.appendChild(option);
    });

    if (sortedLocs.includes(currentVal)) {
        elements.breakdownLocationSelect.value = currentVal;
    }
}

elements.breakdownLocationSelect.addEventListener('change', renderBreakdown);

function renderBreakdown() {
    const loc = elements.breakdownLocationSelect.value;
    if (!loc) {
        elements.breakdownContent.classList.add('hidden');
        elements.downloadBreakdownBtn.disabled = true;
        return;
    }

    elements.breakdownContent.classList.remove('hidden');
    elements.downloadBreakdownBtn.disabled = false;
    elements.breakdownTitle.textContent = loc;

    const locScenes = scenes.filter(s => s.location === loc).sort((a, b) => a.sceneNo - b.sceneNo);

    elements.breakdownTableBody.innerHTML = '';
    locScenes.forEach(scene => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${scene.sceneNo}</td>
            <td>${scene.dayNight}</td>
            <td>${scene.cast ? scene.cast.join(', ') : '-'}</td>
            <td>${scene.description || '-'}</td>
            <td>${scene.vehicles || '-'}</td>
            <td>${scene.pageCount || '-'}</td>
        `;
        elements.breakdownTableBody.appendChild(tr);
    });
}

// ==========================================
// PDF Generation
// ==========================================

elements.downloadMasterBtn.addEventListener('click', (e) => {
    const btn = e.target.closest('button') || e.target;
    generatePDF('master-schedule-container', `Master_Schedule_${new Date().toISOString().split('T')[0]}.pdf`, btn);
});

elements.downloadBreakdownBtn.addEventListener('click', (e) => {
    const loc = elements.breakdownLocationSelect.value;
    if (!loc) return;
    const btn = e.target.closest('button') || e.target;
    generatePDF('breakdown-print-area', `Breakdown_${loc}_${new Date().toISOString().split('T')[0]}.pdf`, btn);
});

async function generatePDF(elementId, filename, button) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalText = button ? button.innerHTML : '';
    if (button) {
        button.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Generating...';
        button.disabled = true;
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: "#1e293b",
            logging: false,
            useCORS: true
        });

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        const pdf = new jspdf.jsPDF({
            orientation: imgWidth > imgHeight ? 'l' : 'p',
            unit: 'px',
            format: [imgWidth, imgHeight]
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(filename);

    } catch (error) {
        console.error("PDF Error:", error);
        alert("Error generating PDF: " + error.message);
    } finally {
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

// ==========================================
// Batch PDF Generation (Download All)
// ==========================================

elements.downloadAllBreakdownsBtn.addEventListener('click', async (e) => {
    const btn = e.target.closest('button') || e.target;
    const sortedLocs = Array.from(uniqueLocations).sort();

    if (sortedLocs.length === 0) {
        alert("No locations to breakdown.");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Generating All...';
    btn.disabled = true;

    try {
        const pdf = new jspdf.jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();

        // Create temporary container
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '800px';
        tempContainer.style.background = '#1e293b';
        tempContainer.style.color = '#fff';
        tempContainer.style.fontFamily = 'Inter, Noto Sans Sinhala, sans-serif';
        document.body.appendChild(tempContainer);

        for (let i = 0; i < sortedLocs.length; i++) {
            const loc = sortedLocs[i];
            const locScenes = scenes.filter(s => s.location === loc).sort((a, b) => a.sceneNo - b.sceneNo);

            tempContainer.innerHTML = `
                <div style="padding: 20px; font-family: Inter, 'Noto Sans Sinhala', sans-serif; background: #1e293b; color: #fff;">
                    <h2 style="color: #60a5fa; margin-bottom: 20px; font-size: 24px;">${loc}</h2>
                    <table style="width: 100%; border-collapse: collapse; text-align: left; background: #1e293b;">
                        <thead>
                            <tr style="background: #1e293b;">
                                <th style="border-bottom: 1px solid #475569; padding: 10px; color: #94a3b8; background: #1e293b;">Scene #</th>
                                <th style="border-bottom: 1px solid #475569; padding: 10px; color: #94a3b8; background: #1e293b;">Time</th>
                                <th style="border-bottom: 1px solid #475569; padding: 10px; color: #94a3b8; background: #1e293b;">Cast</th>
                                <th style="border-bottom: 1px solid #475569; padding: 10px; color: #94a3b8; background: #1e293b;">Description</th>
                                <th style="border-bottom: 1px solid #475569; padding: 10px; color: #94a3b8; background: #1e293b;">Vehicles</th>
                                <th style="border-bottom: 1px solid #475569; padding: 10px; color: #94a3b8; background: #1e293b;">Pages</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${locScenes.map(scene => `
                                <tr style="background: #1e293b;">
                                    <td style="border-bottom: 1px solid #334155; padding: 10px; background: #1e293b; color: #e2e8f0;">${scene.sceneNo}</td>
                                    <td style="border-bottom: 1px solid #334155; padding: 10px; background: #1e293b; color: #e2e8f0;">${scene.dayNight}</td>
                                    <td style="border-bottom: 1px solid #334155; padding: 10px; background: #1e293b; color: #e2e8f0;">${scene.cast ? scene.cast.join(', ') : '-'}</td>
                                    <td style="border-bottom: 1px solid #334155; padding: 10px; background: #1e293b; color: #e2e8f0;">${scene.description || '-'}</td>
                                    <td style="border-bottom: 1px solid #334155; padding: 10px; background: #1e293b; color: #e2e8f0;">${scene.vehicles || '-'}</td>
                                    <td style="border-bottom: 1px solid #334155; padding: 10px; background: #1e293b; color: #e2e8f0;">${scene.pageCount || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            await new Promise(r => setTimeout(r, 100));

            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                backgroundColor: "#1e293b",
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pdfHeight);
        }

        document.body.removeChild(tempContainer);
        pdf.save(`All_Breakdowns_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Batch PDF Error:", error);
        alert("Error generating all breakdowns: " + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
