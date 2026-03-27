// ==========================================
// 1. UTILITÁRIOS DE UI (LOADER, TOAST, MODAL)
// ==========================================
window.showLoader = function() {
    let loader = document.getElementById('globalLoader');
    if(!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        loader.innerHTML = `<div class="solid-spinner"></div><div class="loader-text" data-i18n="app.processing">Processing...</div>`;
        document.body.appendChild(loader);
    }
    loader.classList.add('active');
};

window.hideLoader = function() {
    const loader = document.getElementById('globalLoader');
    if(loader) loader.classList.remove('active');
};

window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ph:check-circle-fill';
    let iconColor = 'var(--success)';
    if (type === 'error') { icon = 'ph:warning-circle-fill'; iconColor = 'var(--danger)'; } 
    else if (type === 'info') { icon = 'ph:info-fill'; iconColor = 'var(--info)'; }
    else if (type === 'warning') { icon = 'ph:warning-fill'; iconColor = 'var(--warning)'; }

    toast.innerHTML = `<span class="iconify toast-icon" data-icon="${icon}" style="color:${iconColor}"></span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
};

window.customConfirm = function(message, title = "Confirm", isPt = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        if (!modal) return resolve(false);

        document.getElementById('confirmTitle').innerText = title;
        document.getElementById('confirmMessage').innerText = message;
        
        const btnCancel = document.getElementById('btnConfirmCancel');
        const btnAccept = document.getElementById('btnConfirmAccept');
        
        btnCancel.innerText = isPt ? "Cancelar" : "Cancel";
        if(title.includes("Delete") || title.includes("Eliminar") || title.includes("Remover")) {
            btnAccept.innerText = isPt ? "Eliminar" : "Delete";
        } else {
            btnAccept.innerText = isPt ? "Confirmar" : "Confirm";
        }

        modal.classList.add('active');

        const cleanup = () => {
            btnCancel.onclick = null;
            btnAccept.onclick = null;
            modal.classList.remove('active');
        };

        btnCancel.onclick = () => { cleanup(); resolve(false); };
        btnAccept.onclick = () => { cleanup(); resolve(true); };
    });
};

// ==========================================
// 2. INJEÇÃO DINÂMICA DE COMPONENTES HTML
// ==========================================
window.loadComponents = async function() {
    try {
        // 1. Sidebar Dinâmica
        const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
        if (sidebarPlaceholder) {
            const res = await fetch('components/sidebar.html');
            sidebarPlaceholder.outerHTML = await res.text();

            // Identificar a página atual e ativar o link correto
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.classList.remove('active');
                if(link.getAttribute('data-page') === currentPath) link.classList.add('active');
            });
        }

        // 2. Topbar Dinâmica
        const topbarPlaceholder = document.getElementById('topbar-placeholder');
        if (topbarPlaceholder) {
            const res = await fetch('components/topbar.html');
            topbarPlaceholder.outerHTML = await res.text();
        }

        // 3. Modal de Confirmação Global (injetado via JS para não poluir o HTML)
        if (!document.getElementById('confirmModal')) {
            const modalHtml = `
            <div class="modal-overlay" id="confirmModal">
                <div class="modal-content" style="height: auto; border-radius: 24px; transform: scale(0.9); transition: all 0.3s ease; text-align: center; max-width: 400px; padding: 32px 24px; justify-content: center; align-self: center; margin: 0 auto;">
                    <span class="iconify" id="confirmIcon" data-icon="ph:warning-circle-fill" style="font-size: 56px; color: var(--danger); margin-bottom: 16px;"></span>
                    <h3 style="font-size: 18px; margin-bottom: 8px; color: var(--text-main);" id="confirmTitle">Are you sure?</h3>
                    <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;" id="confirmMessage">This action cannot be undone.</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn-outline" id="btnConfirmCancel" style="padding: 10px 24px;">Cancel</button>
                        <button class="btn-primary" id="btnConfirmAccept" style="background: var(--danger); border-color: var(--danger); padding: 10px 24px;">Confirm</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

    } catch (err) {
        console.error("Erro ao carregar componentes:", err);
    }
};

// ==========================================
// 3. DROPDOWNS CUSTOMIZADOS
// ==========================================
window.initCustomDropdowns = function() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    dropdowns.forEach(dropdown => {
        const header = dropdown.querySelector('.dropdown-header');
        const list = dropdown.querySelector('.dropdown-list');
        if(!header || !list) return;

        const newHeader = header.cloneNode(true);
        header.replaceWith(newHeader);

        newHeader.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-list').forEach(l => { if (l !== list) l.classList.remove('show'); });
            list.classList.toggle('show');
        };

        const items = list.querySelectorAll('div');
        items.forEach(item => {
            const newItem = item.cloneNode(true);
            item.replaceWith(newItem);
            newItem.onclick = (e) => {
                e.stopPropagation();
                const value = newItem.getAttribute('data-value');
                const text = newItem.innerText;
                newHeader.querySelector('span:first-child').innerText = text;
                list.classList.remove('show');
                dropdown.setAttribute('data-current-value', value);

                const hiddenInputId = dropdown.id.replace('Dropdown', '');
                const hiddenInput = document.getElementById(hiddenInputId);
                if(hiddenInput) hiddenInput.value = value;

                dropdown.dispatchEvent(new CustomEvent('dropdownChange', { detail: { value, text } }));
            };
        });
    });

    document.removeEventListener('click', window.closeAllDropdowns);
    document.addEventListener('click', window.closeAllDropdowns);
};

window.closeAllDropdowns = function() {
    document.querySelectorAll('.dropdown-list').forEach(l => l.classList.remove('show'));
};

// ==========================================
// 4. NOTIFICAÇÕES GLOBAIS
// ==========================================
window.refreshNotificationsList = async function() {
    const list = document.getElementById('notifList');
    if(!list) return;
    const activities = await window.db.getAllData('activities');
    const lang = window.app ? window.app.currentLang : 'en';

    list.innerHTML = '';
    if(activities.length === 0) { list.innerHTML = `<li style="text-align:center; color:var(--text-muted);">No notifications</li>`; return; }

    const recent = activities.slice().reverse().slice(0, 6);
    recent.forEach(act => {
        const text = act.text[lang] || act.text['en'] || act.text; 
        list.innerHTML += `<li><strong style="color:var(--primary)">Update:</strong> ${text} <span>${act.date}</span></li>`;
    });
};

window.addNotificationTrigger = function() {
    const badge = document.getElementById('notifBadge');
    if(badge) badge.classList.add('show');
    window.refreshNotificationsList();
};

window.bindNotificationsPanel = async function() {
    const btnNotif = document.getElementById('btnNotifications');
    const panelNotif = document.getElementById('notificationsPanel');
    const badgeNotif = document.getElementById('notifBadge');
    
    if(btnNotif && panelNotif) {
        btnNotif.addEventListener('click', (e) => { e.stopPropagation(); panelNotif.classList.toggle('active'); });
        document.addEventListener('click', (e) => { if (!panelNotif.contains(e.target) && e.target !== btnNotif) panelNotif.classList.remove('active'); });
    }

    const markBtn = document.getElementById('markAllReadBtn');
    if(markBtn) {
        markBtn.addEventListener('click', () => {
            if(badgeNotif) badgeNotif.classList.remove('show');
            window.showToast(window.app.currentLang === 'pt' ? "Notificações lidas." : "Notifications marked as read.", "info");
        });
    }
    await window.refreshNotificationsList();
};

// ==========================================
// 5. BUSCA GLOBAL
// ==========================================
window.bindGlobalSearch = function() {
    const input = document.getElementById('globalSearchInput');
    const resultsBox = document.getElementById('globalSearchResults');
    if(!input || !resultsBox) return;

    input.addEventListener('input', async (e) => {
        const query = e.target.value.toLowerCase().trim();
        if(query.length < 2) { resultsBox.classList.remove('active'); return; }

        const clients = await window.db.getAllData('clients');
        const leads = await window.db.getAllData('leads');
        const deals = await window.db.getAllData('deals');
        const tasks = await window.db.getAllData('tasks');

        const fClients = clients.filter(c => (c.name || '').toLowerCase().includes(query) || (c.contact || '').toLowerCase().includes(query));
        const fLeads = leads.filter(l => (l.name || '').toLowerCase().includes(query) || (l.company || '').toLowerCase().includes(query));
        const fDeals = deals.filter(d => (d.title || '').toLowerCase().includes(query));
        const fTasks = tasks.filter(t => (t.title || '').toLowerCase().includes(query));

        let html = '';
        
        if(fClients.length) html += `<div class="search-category">Clients</div>` + fClients.slice(0,3).map(c => `<div class="search-item" onclick="window.location.href='client-detail.html?id=${c.id}'"><div class="search-icon-wrapper search-icon-client"><span class="iconify" data-icon="ph:buildings-fill"></span></div><div class="search-item-info"><div class="search-item-title">${c.name}</div><div class="search-item-meta">${c.contact} • ${c.status}</div></div></div>`).join('');
        if(fLeads.length) html += `<div class="search-category">Leads</div>` + fLeads.slice(0,3).map(l => `<div class="search-item" onclick="window.location.href='leads.html?search=${encodeURIComponent(l.name)}'"><div class="search-icon-wrapper search-icon-lead"><span class="iconify" data-icon="ph:magnet-fill"></span></div><div class="search-item-info"><div class="search-item-title">${l.name}</div><div class="search-item-meta">${l.company} • ${l.status}</div></div></div>`).join('');
        if(fDeals.length) html += `<div class="search-category">Deals</div>` + fDeals.slice(0,3).map(d => `<div class="search-item" onclick="window.location.href='deals.html?search=${encodeURIComponent(d.title)}'"><div class="search-icon-wrapper search-icon-deal"><span class="iconify" data-icon="ph:handshake-fill"></span></div><div class="search-item-info"><div class="search-item-title">${d.title}</div><div class="search-item-meta">Value: $${d.value} • ${d.stage}</div></div></div>`).join('');
        if(fTasks.length) html += `<div class="search-category">Tasks</div>` + fTasks.slice(0,3).map(t => `<div class="search-item" onclick="window.location.href='tasks.html?search=${encodeURIComponent(t.title)}'"><div class="search-icon-wrapper search-icon-task"><span class="iconify" data-icon="ph:check-square-fill"></span></div><div class="search-item-info"><div class="search-item-title">${t.title}</div><div class="search-item-meta">Due: ${t.dueDate} • ${t.priority}</div></div></div>`).join('');
        
        if(!html) html = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;"><span class="iconify" data-icon="ph:magnifying-glass-fill" style="font-size: 32px; color: var(--border); margin-bottom: 8px;"></span><br>No results found for "${query}"</div>`;

        resultsBox.innerHTML = html;
        resultsBox.classList.add('active');
    });

    document.addEventListener('click', (e) => {
        if(!input.contains(e.target) && !resultsBox.contains(e.target)) resultsBox.classList.remove('active');
    });
};

// ==========================================
// 6. OBJETO PRINCIPAL (APP INIT)
// ==========================================
window.app = {
    currentLang: 'en',
    currentTheme: 'light',

    init: async function() {
        window.showLoader();

        // Aguarda a injeção do HTML partilhado (Sidebar, Topbar, Modais)
        await window.loadComponents();

        this.initTheme();
        this.initLanguage();
        this.initSidebar();
        this.bindEvents();
        this.setManagerAvatar(); 
        
        window.initCustomDropdowns();
        window.bindGlobalSearch();
        window.bindNotificationsPanel();

        // Dispara um evento para avisar as páginas (ex: clients.js) que o HTML está pronto!
        window.dispatchEvent(new Event('componentsLoaded'));
    },

    getUnsplashAvatar: function(seedText, type = 'person') {
        const personIds =['1535713875002-d1d0cf377fde', '1580489944761-15a19d654956', '1527980965255-d3b416303d12', '1438761681033-6461ffad8d80', '1472099645785-5658abf4ff4e', '1507003211169-0a1dd7228f2d', '1544005313-94ddf0286df2', '1506794778202-cad84cf45f1d', '1534528741775-53994a69daeb'];
        const companyIds =['1486406146926-c627a92ad1ab', '1497366216548-37526070297c', '1431540015110-80f1cb04179d', '1554469384-e58fac16e23a', '1497215968147-3ba829149ed3', '1556761175-5973dc0f32e7', '1560179707-240167571a67', '1496568816309-51d7c20e3b21', '1497366854016-3221ed903823'];
        let charCodeSum = 0;
        if (seedText) { for(let i=0; i<seedText.length; i++) charCodeSum += seedText.charCodeAt(i); } 
        else { charCodeSum = Math.floor(Math.random() * 100); }
        const list = type === 'company' ? companyIds : personIds;
        const imgId = list[charCodeSum % list.length];
        const crop = type === 'person' ? 'faces' : 'entropy';
        return `https://images.unsplash.com/photo-${imgId}?w=150&h=150&fit=crop&crop=${crop}&auto=format&q=80`;
    },

    setManagerAvatar: function() {
        document.querySelectorAll('.avatar').forEach(av => {
            av.innerHTML = `<img src="${this.getUnsplashAvatar('Gestor Principal', 'person')}" alt="Manager" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        });
    },

    initTheme: function() {
        const savedTheme = localStorage.getItem('crm_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        if (savedTheme) { this.currentTheme = savedTheme; } 
        else { this.currentTheme = systemPrefersDark.matches ? 'dark' : 'light'; }
        this.applyTheme();
        systemPrefersDark.addEventListener('change', (e) => {
            this.currentTheme = e.matches ? 'dark' : 'light';
            localStorage.removeItem('crm_theme'); 
            this.applyTheme();
        });
    },

    applyTheme: function() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) themeBtn.innerHTML = this.currentTheme === 'dark' ? '<span class="iconify" data-icon="ph:sun-fill"></span>' : '<span class="iconify" data-icon="ph:moon-fill"></span>';
    },

    toggleTheme: function() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('crm_theme', this.currentTheme);
        this.applyTheme();
    },

    initLanguage: function() {
        const savedLang = localStorage.getItem('crm_lang');
        if (savedLang) { this.currentLang = savedLang; } 
        else { this.currentLang = (navigator.language || navigator.userLanguage).toLowerCase().startsWith('pt') ? 'pt' : 'en'; }
        this.applyTranslations();
    },

    applyTranslations: function() {
        localStorage.setItem('crm_lang', this.currentLang);
        const flagIcon = document.getElementById('langFlagIcon');
        if (flagIcon) { flagIcon.setAttribute('data-icon', this.currentLang === 'pt' ? 'flag:br-4x3' : 'flag:us-4x3'); }

        if (!window.crmData || !window.crmData.translations) return;
        const dict = window.crmData.translations[this.currentLang];

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.innerText = dict[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) el.placeholder = dict[key];
        });
        window.dispatchEvent(new Event('languageChanged'));
    },

    toggleLanguage: async function() {
        window.showLoader();
        await new Promise(r => setTimeout(r, 400));
        this.currentLang = this.currentLang === 'en' ? 'pt' : 'en';
        this.applyTranslations();
        
        // Refresca o Dashboard se ele existir, senão esconde o loader
        if (typeof initDashboard === 'function') initDashboard(); else window.hideLoader();
    },

    initSidebar: function() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            });
        }
    },

    bindEvents: function() {
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());
        const langBtn = document.getElementById('langToggle');
        if (langBtn) langBtn.addEventListener('click', () => this.toggleLanguage());
    }
};

document.addEventListener('DOMContentLoaded', () => { window.app.init(); });