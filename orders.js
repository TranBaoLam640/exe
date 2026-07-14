/* ============================================
   DORENTME - ĐƠN HÀNG (localStorage)
   Prototype "Hướng A": xác nhận thanh toán thủ công,
   trạng thái đơn cập nhật thủ công qua shop-admin.html.
   Dùng chung cho toàn bộ website.
   Nhúng: <script src="orders.js"></script> (sau cart.js)
   ============================================ */
(function () {
    const ORDERS_KEY = 'dorentme_orders';

    const STATUS_LABELS = {
        pending_confirmation: 'Chờ xác nhận',
        shipping:             'Đang giao hàng',
        delivered:            'Đã giao hàng',
        return_requested:     'Đã yêu cầu trả hàng',
        return_processing:    'Đang xử lý trả hàng',
        returned:             'Đã hoàn tất trả hàng'
    };
    const STATUS_ORDER = ['pending_confirmation', 'shipping', 'delivered', 'return_requested', 'return_processing', 'returned'];

    function parsePrice(str) {
        if (!str) return 0;
        const digits = String(str).replace(/[^\d]/g, '');
        return parseInt(digits, 10) || 0;
    }
    function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + ' vnd'; }

    function genId() {
        return 'DH' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
    }

    function getAll() {
        try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
        catch (e) { return []; }
    }
    function saveAll(list) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
        document.dispatchEvent(new CustomEvent('orders:changed', { detail: list }));
    }
    function getById(id) { return getAll().find(o => o.id === id) || null; }

    function pushHistory(order, status, note) {
        order.history = order.history || [];
        order.history.push({ status, note: note || '', at: new Date().toISOString() });
    }

    function update(id, patch) {
        const list = getAll();
        const idx = list.findIndex(o => o.id === id);
        if (idx === -1) return null;
        Object.assign(list[idx], patch);
        saveAll(list);
        return list[idx];
    }

    function setStatus(id, status, extra, note) {
        const list = getAll();
        const order = list.find(o => o.id === id);
        if (!order) return null;
        order.status = status;
        if (extra) Object.assign(order, extra);
        pushHistory(order, status, note);
        saveAll(list);
        return order;
    }

    const DoOrders = {
        STATUS_LABELS,
        STATUS_ORDER,
        parsePrice,
        formatVnd,
        genId,

        getAll,
        getById,
        update,

        // Tạo đơn mới ngay sau khi khách bấm "Tôi đã thanh toán"
        create({ id, items, customer, totals, customerEmail }) {
            const list = getAll();
            const order = {
                id: id || genId(),
                createdAt: new Date().toISOString(),
                items: items || [],
                customer: customer || {},
                customerEmail: customerEmail || null,
                totals: totals || { rent: 0, deposit: 0, total: 0 },
                status: 'pending_confirmation',
                deliveryConfirmed: false,
                shipper: null,
                returnRequestedAt: null,
                history: []
            };
            pushHistory(order, 'pending_confirmation', 'Khách đặt đơn & xác nhận đã chuyển khoản');
            list.unshift(order);
            saveAll(list);
            return order;
        },

        // ==== Hành động phía khách hàng ====
        confirmDelivery(id) {
            const o = getById(id);
            if (!o || o.status !== 'delivered') return o;
            return update(id, { deliveryConfirmed: true });
        },
        requestReturn(id) {
            const o = getById(id);
            if (!o || o.status !== 'delivered') return o;
            return setStatus(id, 'return_requested', { returnRequestedAt: new Date().toISOString() }, 'Khách yêu cầu trả hàng');
        },

        // ==== Hành động phía shop (dùng trong shop-admin.html) ====
        shopConfirm(id, shipper) {
            return setStatus(id, 'shipping', { shipper: shipper || null }, 'Shop xác nhận đơn, bắt đầu giao hàng');
        },
        markDelivered(id) {
            return setStatus(id, 'delivered', {}, 'Shipper đã giao hàng thành công');
        },
        shopConfirmReturn(id) {
            return setStatus(id, 'return_processing', {}, 'Shop xác nhận yêu cầu, đang sắp xếp lấy đồ trả');
        },
        markReturned(id) {
            return setStatus(id, 'returned', {}, 'Đã nhận lại đồ, hoàn tất & hoàn cọc');
        },
        remove(id) {
            saveAll(getAll().filter(o => o.id !== id));
        }
    };
    window.DoOrders = DoOrders;

    // ---- Tự chèn icon đơn hàng vào header (cạnh icon giỏ hàng) ----
    function injectStyles() {
        if (document.getElementById('doOrdersStyles')) return;
        const css = document.createElement('style');
        css.id = 'doOrdersStyles';
        css.textContent = `
            .orders-link {
                display: flex; align-items: center; justify-content: center;
                width: 42px; height: 42px;
                border-radius: 50%;
                border: 2px solid #8de9be;
                color: #8de9be;
                text-decoration: none;
                font-size: 1.15rem;
                transition: 0.3s;
            }
            .orders-link:hover { background: #8de9be; color: #0a1e14; }
        `;
        document.head.appendChild(css);
    }

    function injectIcon() {
        const navRight = document.querySelector('header .nav-right');
        if (!navRight || navRight.querySelector('.orders-link')) return;
        const a = document.createElement('a');
        a.href = 'orders.html';
        a.className = 'orders-link';
        a.title = 'Đơn hàng của tôi';
        a.textContent = '📦';
        const cartLink = navRight.querySelector('.cart-link');
        if (cartLink && cartLink.nextSibling) {
            navRight.insertBefore(a, cartLink.nextSibling);
        } else if (cartLink) {
            navRight.appendChild(a);
        } else {
            navRight.insertBefore(a, navRight.firstChild);
        }
    }

    function init() {
        injectStyles();
        injectIcon();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('storage', e => {
        if (e.key === ORDERS_KEY) document.dispatchEvent(new CustomEvent('orders:changed', { detail: getAll() }));
    });
})();
