/* ============================================================
   NewMart — Store Manager
   Makes the store management buttons work:
   Overview | Products | Orders | Wallets & Payouts | Your Team
   Add Product | View Orders | Withdraw
   ============================================================ */
(function () {
  'use strict';

  /* ---------- small helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function load(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function money(n) { return '₦' + Number(n || 0).toLocaleString(); }
  function norm(s) { return (s || '').toLowerCase().replace(/[^a-z]/g, ''); }

  /* ---------- the store's data (saved in the browser for now) ---------- */
  var products = load('newmart_products', []);
  var orders   = load('newmart_orders', []);
  var team     = load('newmart_team', []);
  var wallet   = load('newmart_wallet', { balance: 0, withdrawals: [] });

  var panel = null;
  var activeTab = 'overview';
  var tabButtons = {};

  /* ---------- find the buttons already on the page ---------- */
  function findTabButtons() {
    var all = document.querySelectorAll('button, a');
    for (var i = 0; i < all.length; i++) {
      var t = norm(all[i].textContent);
      if (t === 'overview') tabButtons.overview = all[i];
      else if (t === 'products') tabButtons.products = all[i];
      else if (t === 'orders') tabButtons.orders = all[i];
      else if (t.indexOf('wallet') !== -1 || t.indexOf('payout') !== -1) tabButtons.wallets = all[i];
      else if (t === 'yourteam' || t === 'team') tabButtons.team = all[i];
    }
  }

  /* ---------- little building blocks ---------- */
  function card(label, value) {
    return '<div style="display:inline-block;background:#f4f4f8;border:1px solid #e2e2ea;border-radius:10px;padding:14px 18px;margin:0 10px 10px 0;min-width:120px;">' +
      '<div style="font-size:22px;font-weight:700;">' + esc(value) + '</div>' +
      '<div style="font-size:13px;color:#666;">' + esc(label) + '</div></div>';
  }
  function box(inner) {
    return '<div style="border:1px solid #e2e2ea;border-radius:10px;padding:12px 14px;margin-bottom:10px;">' + inner + '</div>';
  }
  function redBtn(attr, i, label) {
    return '<button type="button" ' + attr + '="' + i + '" style="color:#c00;background:none;border:1px solid #c00;border-radius:6px;padding:4px 10px;cursor:pointer;">' + label + '</button>';
  }

  /* ---------- what each tab shows ---------- */
  function renderOverview() {
    panel.innerHTML = '<h2 style="margin:0 0 12px;">Overview</h2>' +
      card('Products', products.length) +
      card('Orders', orders.length) +
      card('Wallet balance', money(wallet.balance)) +
      card('Team members', team.length);
  }

  function renderProducts() {
    var html = '<h2 style="margin:0 0 12px;">Products</h2>';
    if (products.length === 0) {
      html += '<p>No products yet. Tap <b>Add Product</b> to add your first one.</p>';
    }
    for (var i = 0; i < products.length; i++) {
      html += box('<b>' + esc(products[i].name) + '</b> — ' + money(products[i].price) +
        '<div style="color:#666;font-size:14px;margin:4px 0;">' + esc(products[i].desc) + '</div>' +
        redBtn('data-del-product', i, 'Delete'));
    }
    panel.innerHTML = html;
  }

  function renderOrders() {
    var html = '<h2 style="margin:0 0 12px;">Orders</h2>';
    if (orders.length === 0) {
      html += '<p>No orders yet. When a customer buys from your store, the order will appear here.</p>';
    }
    for (var i = 0; i < orders.length; i++) {
      html += box('<b>Order #' + (i + 1) + '</b> — ' + esc(orders[i].item || '') +
        ' — ' + money(orders[i].total) +
        '<div style="color:#666;font-size:14px;">' + esc(orders[i].status || 'New') + '</div>');
    }
    panel.innerHTML = html;
  }

  function renderWallet() {
    var html = '<h2 style="margin:0 0 12px;">Wallets &amp;
