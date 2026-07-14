/* ============================================
   DORENTME - TÀI KHOẢN (localStorage)
   Prototype "tạm thời": KHÔNG có backend thật.
   Mật khẩu chỉ được băm (SHA-256) phía trình duyệt,
   không có máy chủ xác thực => không phải bảo mật thật sự,
   chỉ đủ để tránh lưu mật khẩu dạng chữ thường (plaintext).
   Dùng chung: <script src="auth.js"></script> (sau cart.js, orders.js)
   ============================================ */
(function () {
    const USERS_KEY = 'dorentme_users';
    const SESSION_KEY = 'dorentme_session';

    async function sha256(text) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function getUsers() {
        try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
        catch (e) { return []; }
    }
    function saveUsers(list) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }

    function getSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
        catch (e) { return null; }
    }
    function setSession(user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email, phone: user.phone }));
        document.dispatchEvent(new CustomEvent('auth:changed', { detail: getSession() }));
    }
    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
        document.dispatchEvent(new CustomEvent('auth:changed', { detail: null }));
    }

    const DoAuth = {
        getSession,

        async register({ name, email, phone, password }) {
            name = (name || '').trim();
            email = (email || '').trim().toLowerCase();
            phone = (phone || '').trim();

            if (name.length < 2) return { ok: false, error: 'Vui lòng nhập họ tên.' };
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Email không hợp lệ.' };
            if (!/^[0-9]{9,11}$/.test(phone.replace(/[\s.\-]/g, ''))) return { ok: false, error: 'Số điện thoại không hợp lệ.' };
            if (!password || password.length < 6) return { ok: false, error: 'Mật khẩu cần tối thiểu 6 ký tự.' };

            const users = getUsers();
            if (users.some(u => u.email === email)) {
                return { ok: false, error: 'Email này đã được đăng ký. Vui lòng đăng nhập.' };
            }

            const passwordHash = await sha256(password);
            const user = { name, email, phone, passwordHash, createdAt: new Date().toISOString() };
            users.push(user);
            saveUsers(users);
            setSession(user);
            return { ok: true, user: getSession() };
        },

        async login(email, password) {
            email = (email || '').trim().toLowerCase();
            const users = getUsers();
            const user = users.find(u => u.email === email);
            if (!user) return { ok: false, error: 'Email hoặc mật khẩu không đúng.' };

            const passwordHash = await sha256(password || '');
            if (passwordHash !== user.passwordHash) return { ok: false, error: 'Email hoặc mật khẩu không đúng.' };

            setSession(user);
            return { ok: true, user: getSession() };
        },

        logout() {
            clearSession();
            window.location.href = 'index.html';
        }
    };
    window.DoAuth = DoAuth;

    // ---- Cập nhật header theo trạng thái đăng nhập ----
    function injectStyles() {
        if (document.getElementById('doAuthStyles')) return;
        const css = document.createElement('style');
        css.id = 'doAuthStyles';
        css.textContent = `
            .auth-greeting {
                color: #8de9be;
                font-size: 0.88rem;
                font-weight: 600;
                white-space: nowrap;
                max-width: 140px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `;
        document.head.appendChild(css);
    }

    // Chuẩn bị 1 lần: giữ cả cặp nút khách (outline/fill) VÀ cặp đã đăng nhập
    // (greeting/logout) luôn nằm trong DOM, chỉ ẩn/hiện theo trạng thái —
    // để có thể đổi qua lại 2 chiều bất cứ lúc nào (kể cả khi đăng xuất từ tab khác).
    function setupAuthSlot(navRight) {
        const outline = navRight.querySelector('a.nav-btn.outline');
        const fill = navRight.querySelector('a.nav-btn.fill');
        if (!outline || !fill) return null;

        const greet = document.createElement('span');
        greet.className = 'auth-greeting';
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'nav-btn outline';
        logoutBtn.textContent = 'Đăng xuất';
        logoutBtn.onclick = (e) => { e.preventDefault(); DoAuth.logout(); };

        outline.insertAdjacentElement('beforebegin', greet);
        fill.insertAdjacentElement('afterend', logoutBtn);

        outline.setAttribute('href', 'login.html');
        fill.setAttribute('href', 'register.html');

        navRight._doAuthSlot = { outline, fill, greet, logoutBtn };
        return navRight._doAuthSlot;
    }

    function renderHeader() {
        const navRight = document.querySelector('header .nav-right');
        if (!navRight) return;
        const slot = navRight._doAuthSlot || setupAuthSlot(navRight);
        if (!slot) return;

        const session = getSession();
        const loggedIn = !!session;
        slot.outline.style.display = loggedIn ? 'none' : '';
        slot.fill.style.display = loggedIn ? 'none' : '';
        slot.greet.style.display = loggedIn ? '' : 'none';
        slot.logoutBtn.style.display = loggedIn ? '' : 'none';
        if (loggedIn) slot.greet.textContent = '👋 ' + session.name;
    }

    function init() {
        injectStyles();
        renderHeader();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('auth:changed', renderHeader);
    window.addEventListener('storage', e => {
        if (e.key === SESSION_KEY) document.dispatchEvent(new CustomEvent('auth:changed', { detail: getSession() }));
    });
})();
