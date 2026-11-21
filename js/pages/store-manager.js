/* ============================================================
   NewMart — Store Manager
   Wires up: Overview, Products, Orders, Wallets & Payouts,
   Your Team tabs + Add Product, View Orders, Withdraw buttons.
   Data is saved in the browser (localStorage) for now.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function load(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function money(n) { return '₦' + Number(n || 0).toLocaleString(); }
  function norm(s) { return (s || '').toLowerCase().replace(/[^a-z]/g, ''); }

  /* ---------- store data ---------- */
  var products = load('newmart_products', []);
  var orders   = load('newmart_orders', []);
  var team     = load('newmart_team', []);
  var wallet   = load('newmart_wallet', { balance: 0, withdrawals: [] });

  var panel = null;
  var tabButtons = {};

  /* ---------- find the tab buttons already on the page ---------- */
  function findTabs() {
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

  /* ---------- small display pieces ---------- */
  function card(label, value) {
    return '<div style="display:inline-block;background:#f4f4f8;border:1px solid #e2e2ea;border-radius:10px;padding:14px 18px;margin:0 10px 10px 0;min-width:120px;text-align:center;">'
      + '<div style="font-size:22px;font-weight:700;">' + esc(value) + '</div>'
      + '<div style="font-size:13px;color:#666;">' + esc(label) + '</div></div>';
  }
  function box(inner) {
    return '<div style="border:1px solid #e2e2ea;border-radius:10px;padding:12px 14px;margin-bottom:10px;">' + inner + '</div>';
  }
  function redBtn(attr, i, label) {
    return '<button type="button" ' + attr + '="' + i + '" style="color:#c00;background:none;border:1px solid #c00;border-radius:6px;padding:4px 10px;cursor:pointer;">' + label + '</button>';
  }

  /* ---------- what each tab shows ---------- */
  function renderOverview() {
    panel.innerHTML = '<h2 style="margin:0 0 12px;">Overview</h2>'
      + card('Products', products.length)
      + card('Orders', orders.length)
      + card('Wallet balance', money(wallet.balance))
      + card('Team members', team.length);
  }

  function renderProducts() {
    var html = '<h2 style="margin:0 0 12px;">Products</h2>';
    if (products.length === 0) html += '<p>No products yet. Tap <b>Add Product</b> to add your first one.</p>';
    for (var i = 0; i < products.length; i++) {
      html += box('<b>' + esc(products[i].name) + '</b> — ' + money(products[i].price)
        + '<div style="color:#666;font-size:14px;margin:4px 0;">' + esc(products[i].desc || '') + '</div>'
        + redBtn('data-del-product', i, 'Delete'));
    }
    panel.innerHTML = html;
  }

  function renderOrders() {
    var html = '<h2 style="margin:0 0 12px;">Orders</h2>';
    if (orders.length === 0) html += '<p>No orders yet. When a customer buys from your store, orders will appear here.</p>';
    for (var i = 0; i < orders.length; i++) {
      html += box('<b>Order #' + (i + 1) + '</b> — ' + esc(orders[i].item || '') + ' — ' + money(orders[i].total)
        + '<div style="color:#666;font-size:14px;">' + esc(orders[i].status || 'New') + '</div>');
    }
    panel.innerHTML = html;
  }

  function renderWallets() {
    var html = '<h2 style="margin:0 0 12px;">Wallets &amp; Payouts</h2>'
      + card('Available balance', money(wallet.balance))
      + '<h3 style="margin:14px 0 8px;">Withdrawal history</h3>';
    if (wallet.withdrawals.length === 0) html += '<p>No withdrawals yet. Tap <b>Withdraw</b> to make one.</p>';
    for (var i = wallet.withdrawals.length - 1; i >= 0; i--) {
      html += box(money(wallet.withdrawals[i].amount)
        + ' <span style="color:#666;font-size:14px;">— ' + esc(wallet.withdrawals[i].date) + '</span>');
    }
    panel.innerHTML = html;
  }

  function renderTeam() {
    var html = '<h2 style="margin:0 0 12px;">Your Team</h2>'
      + '<p><button type="button" data-add-member style="background:#111;color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;">+ Add team member</button></p>';
    if (team.length === 0) html += '<p>No team members yet.</p>';
    for (var i = 0; i < team.length; i++) {
      html += box('<b>' + esc(team[i].name) + '</b> <span style="color:#666;">— ' + esc(team[i].role) + '</span><br>'
        + redBtn('data-del-member', i, 'Remove'));
    }
    panel.innerHTML = html;
  }

  var renders = { overview: renderOverview, products: renderProducts, orders: renderOrders, wallets: renderWallets, team: renderTeam };

  function show(name) {
    if (!renders[name] || !panel) return;
    renders[name]();
    for (var key in tabButtons) {
      tabButtons[key].style.fontWeight = (key === name) ? '700' : '400';
      tabButtons[key].style.opacity = (key === name) ? '1' : '0.6';
    }
  }

  /* ---------- button actions ---------- */
  function addProduct() {
    var name = prompt('Product name:');
    if (!name) return;
    var price = parseFloat(prompt('Price in naira (numbers only):') || '0') || 0;
    var desc = prompt('Short description (optional):') || '';
    products.push({ name: name, price: price, desc: desc });
    save('newmart_products', products);
    show('products');
  }

  function withdraw() {
    var amt = parseFloat(prompt('Your balance is ' + money(wallet.balance) + '.\nHow much do you want to withdraw?') || '0') || 0;
    if (amt <= 0) return;
    if (amt > wallet.balance) {
      alert('That is more than your balance of ' + money(wallet.balance) + '.');
      return;
    }
    wallet.balance -= amt;
    wallet.withdrawals.push({ amount: amt, date: new Date().toLocaleString() });
    save('newmart_wallet', wallet);
    show('wallets');
    alert(money(amt) + ' withdrawal recorded. (Real money transfers come later, when you connect a payment provider.)');
  }

  function addMember() {
    var name = prompt('Team member name:');
    if (!name) return;
    var role = prompt('Their role (e.g. Manager, Packer):') || 'Staff';
    team.push({ name: name, role: role });
    save('newmart_team', team);
    show('team');
  }

  /* ---------- one listener handles taps inside the panel ---------- */
  function panelClick(e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var dp = t.getAttribute('data-del-product');
    var dm = t.getAttribute('data-del-member');
    if (dp !== null) {
      products.splice(Number(dp), 1);
      save('newmart_products', products);
      renderProducts();
    } else if (dm !== null) {
      team.splice(Number(dm), 1);
      save('newmart_team', team);
      renderTeam();
    } else if (t.hasAttribute('data-add-member')) {
      addMember();
    }
  }

  /* ---------- wire everything up ---------- */
  function init() {
    findTabs();

    /* create the display panel under the tab row */
    panel = document.getElementById('store-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'store-panel';
      panel.style.padding = '16px';
      var anchor = tabButtons.overview || tabButtons.products;
      if (anchor && anchor.parentNode && anchor.parentNode.parentNode) {
        var row = anchor.parentNode;
        if (row.nextSibling) row.parentNode.insertBefore(panel, row.nextSibling);
        else row.parentNode.appendChild(panel);
      } else {
        document.body.appendChild(panel);
      }
    }
    panel.addEventListener('click', panelClick);

    /* tab buttons */
    for (var key in tabButtons) {
      (function (name) {
        tabButtons[name].addEventListener('click', function (e) {
          e.preventDefault();
          show(name);
        });
      })(key);
    }

    /* action buttons already on the page */
    var all = document.querySelectorAll('button, a');
    for (var i = 0; i < all.length; i++) {
      (function (btn) {
        var t = norm(btn.textContent);
        if (t === 'addproduct') btn.addEventListener('click', function (e) { e.preventDefault(); addProduct(); });
        else if (t === 'vieworders') btn.addEventListener('click', function (e) { e.preventDefault(); show('orders'); });
        else if (t === 'withdraw') btn.addEventListener('click', function (e) { e.preventDefault(); withdraw(); });
      })(all[i]);
    }

    show('overview');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
