/* ============================================
   DORENTME - GIỎ HÀNG (localStorage)
   Dùng chung cho toàn bộ website.
   Nhúng: <script src="cart.js"></script>
   ============================================ */
(function () {
    const CART_KEY = 'dorentme_cart';

    // ---- Lưu trữ ----
    function getCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch (e) { return []; }
    }
    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateBadge();
        document.dispatchEvent(new CustomEvent('cart:changed', { detail: cart }));
    }

    // ---- Tiện ích giá ----
    function parsePrice(str) {
        if (!str) return 0;
        const digits = String(str).replace(/[^\d]/g, '');
        return parseInt(digits, 10) || 0;
    }
    function formatVnd(n) {
        return (n || 0).toLocaleString('vi-VN') + ' vnd';
    }

    // ---- API giỏ hàng ----
    const DoCart = {
        get: getCart,
        count() { return getCart().reduce((s, i) => s + (i.qty || 1), 0); },

        totals() {
            const cart = getCart();
            let rent = 0, deposit = 0, qty = 0;
            cart.forEach(item => {
                rent += parsePrice(item.price3day) * item.qty;
                deposit += parsePrice(item.priceDeposit) * item.qty;
                qty += item.qty;
            });
            return { qty, rent, deposit, total: rent + deposit };
        },

        add(item, qty) {
            qty = Math.max(1, parseInt(qty, 10) || 1);
            const cart = getCart();
            const existing = cart.find(i => i.name === item.name);
            if (existing) {
                existing.qty += qty;
            } else {
                cart.push({
                    name: item.name,
                    image: item.image || '',
                    category: item.category || item.categoryLabel || '',
                    price3day: item.price3day || '',
                    price1day: item.price1day || '',
                    priceTag: item.priceTag || '',
                    priceDeposit: item.priceDeposit || '',
                    priceExtra: item.priceExtra || '',
                    qty: qty
                });
            }
            saveCart(cart);
            showToast('Đã thêm vào giỏ: ' + item.name);
        },

        remove(name) { saveCart(getCart().filter(i => i.name !== name)); },

        setQty(name, qty) {
            const cart = getCart();
            const it = cart.find(i => i.name === name);
            if (it) it.qty = Math.max(1, parseInt(qty, 10) || 1);
            saveCart(cart);
        },

        clear() { saveCart([]); },

        parsePrice,
        formatVnd
    };
    window.DoCart = DoCart;

    // ---- Cập nhật số đếm trên icon giỏ ----
    function updateBadge() {
        const n = DoCart.count();
        document.querySelectorAll('.cart-badge').forEach(b => {
            b.textContent = n;
            b.style.display = n > 0 ? 'flex' : 'none';
        });
    }

    // ---- Toast thông báo ----
    let toastTimer = null;
    function showToast(msg) {
        let toast = document.getElementById('doCartToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'doCartToast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = '<span style="font-size:1.1rem">🛒</span> ' + msg +
            ' <a href="cart.html" style="color:#0a1e14;font-weight:800;text-decoration:underline;margin-left:6px">Xem giỏ</a>';
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
    }

    // ---- CSS chèn động (icon giỏ + toast) ----
    function injectStyles() {
        if (document.getElementById('doCartStyles')) return;
        const css = document.createElement('style');
        css.id = 'doCartStyles';
        css.textContent = `
            .cart-link {
                position: relative;
                display: flex; align-items: center; justify-content: center;
                width: 42px; height: 42px;
                border-radius: 50%;
                border: 2px solid #8de9be;
                color: #8de9be;
                text-decoration: none;
                font-size: 1.15rem;
                transition: 0.3s;
            }
            .cart-link:hover { background: #8de9be; color: #0a1e14; }
            .cart-badge {
                position: absolute;
                top: -6px; right: -6px;
                min-width: 20px; height: 20px;
                padding: 0 5px;
                background: #e05f8a;
                color: white;
                border-radius: 10px;
                font-size: 0.72rem;
                font-weight: 800;
                display: none;
                align-items: center; justify-content: center;
                border: 2px solid #0a1e14;
                box-sizing: border-box;
            }
            #doCartToast {
                position: fixed;
                bottom: 24px; left: 50%;
                transform: translate(-50%, 120%);
                background: #8de9be;
                color: #0a1e14;
                padding: 14px 22px;
                border-radius: 12px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 0.9rem;
                font-weight: 600;
                box-shadow: 0 8px 30px rgba(0,0,0,0.35);
                z-index: 3000;
                display: flex; align-items: center; gap: 8px;
                max-width: 90vw;
                opacity: 0;
                transition: transform 0.4s ease, opacity 0.4s ease;
            }
            #doCartToast.show { transform: translate(-50%, 0); opacity: 1; }
        `;
        document.head.appendChild(css);
    }

    // ---- Tự chèn icon giỏ vào header ----
    function injectCartIcon() {
        const navRight = document.querySelector('header .nav-right');
        if (!navRight || navRight.querySelector('.cart-link')) return;
        const a = document.createElement('a');
        a.href = 'cart.html';
        a.className = 'cart-link';
        a.title = 'Giỏ hàng';
        a.innerHTML = '🛒<span class="cart-badge">0</span>';
        navRight.insertBefore(a, navRight.firstChild);
    }

    // ---- Khởi tạo ----
    function init() {
        injectStyles();
        injectCartIcon();
        updateBadge();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Đồng bộ giữa các tab
    window.addEventListener('storage', e => { if (e.key === CART_KEY) updateBadge(); });
})();
