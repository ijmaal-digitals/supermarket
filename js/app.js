/* ============================================================
   Ijmaal FreshMart — shared app logic
   (cart, language toggle, rendering, WhatsApp checkout)
   ============================================================ */

/* ---------- State ---------- */
let LANG = localStorage.getItem("fm_lang") || "en";
let cart = JSON.parse(localStorage.getItem("fm_cart") || "{}"); // {productId: qty}

/* ---------- Product overrides (admin edits) ---------- */
function productOverrides() { return JSON.parse(localStorage.getItem("fm_products") || "{}"); }
function saveProductOverrides(o) { localStorage.setItem("fm_products", JSON.stringify(o)); }
function allProducts() {
  const o = productOverrides();
  const base = PRODUCTS.map(p => ({ ...p, ...(o[p.id] || {}) })).filter(p => !o[p.id] || !o[p.id].deleted);
  const custom = Object.values(o).filter(p => p && p.custom && !p.deleted);
  return base.concat(custom);
}

/* ---------- Customer accounts ---------- */
function getUsers() { return JSON.parse(localStorage.getItem("fm_users") || "[]"); }
function saveUsers(u) { localStorage.setItem("fm_users", JSON.stringify(u)); }
function currentUser() {
  const phone = localStorage.getItem("fm_session");
  return phone ? getUsers().find(u => u.phone === phone) || null : null;
}
function registerUser(name, phone, password) {
  const users = getUsers();
  if (users.some(u => u.phone === phone)) return { error: t("register_error") };
  users.push({ name, phone, password });
  saveUsers(users);
  localStorage.setItem("fm_session", phone);
  return { ok: true };
}
function loginUser(phone, password) {
  const u = getUsers().find(u => u.phone === phone && u.password === password);
  if (!u) return { error: t("login_error") };
  localStorage.setItem("fm_session", phone);
  return { ok: true, user: u };
}
function logoutUser() { localStorage.removeItem("fm_session"); renderPage(); }

/* ---------- Orders ---------- */
function getOrders() { return JSON.parse(localStorage.getItem("fm_orders") || "[]"); }
function saveOrders(o) { localStorage.setItem("fm_orders", JSON.stringify(o)); }
function createOrder(data) {
  const orders = getOrders();
  const order = {
    id: "FM-" + String(orders.length + 1).padStart(4, "0"),
    date: new Date().toISOString(),
    status: "pending",
    ...data
  };
  orders.unshift(order);
  saveOrders(orders);
  return order;
}
function setOrderStatus(id, status) {
  const orders = getOrders();
  const o = orders.find(x => x.id === id);
  if (o) { o.status = status; saveOrders(orders); }
}

/* ---------- Helpers ---------- */
const $  = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const t  = key => (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
const money = n => STORE.currency + n.toFixed(2);
const pName = p => (LANG === "ar" ? p.ar : p.en);
const cName = c => (LANG === "ar" ? c.ar : c.en);
const unitLabel = u => (UNITS[u] ? UNITS[u][LANG] : u);
const getProduct = id => allProducts().find(p => p.id === Number(id));
const getCategory = id => CATEGORIES.find(c => c.id === id);
const catColor = id => (getCategory(id) || {}).color || "#eef1f5";
const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
const cartSubtotal = () =>
  Object.entries(cart).reduce((sum, [id, q]) => {
    const p = getProduct(id);
    return p ? sum + p.price * q : sum;
  }, 0);

function saveCart() {
  localStorage.setItem("fm_cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  $$(".cart-count").forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}

/* ---------- Cart actions ---------- */
function addToCart(id, qty = 1, btn) {
  cart[id] = (cart[id] || 0) + qty;
  saveCart();
  if (btn) {
    const original = btn.dataset.label || btn.textContent;
    btn.dataset.label = original;
    btn.textContent = t("added");
    btn.classList.add("added");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("added");
    }, 1200);
  }
  toast(t("added"));
}

function setQty(id, qty) {
  if (qty <= 0) delete cart[id];
  else cart[id] = qty;
  saveCart();
  if (document.body.dataset.page === "cart") renderCartPage();
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1500);
}

/* ---------- Language ---------- */
function toggleLang() {
  LANG = LANG === "en" ? "ar" : "en";
  localStorage.setItem("fm_lang", LANG);
  applyLang();
}

function applyLang() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = t("dir");
  document.title = (LANG === "ar" ? STORE.nameAr : STORE.nameEn) + " — " + t("nav_home");
  $$("[data-i18n]").forEach(el => (el.textContent = t(el.dataset.i18n)));
  $$("[data-i18n-ph]").forEach(el => (el.placeholder = t(el.dataset.i18nPh)));
  $$(".lang-toggle").forEach(el => (el.textContent = t("langName")));
  renderPage(); // re-render dynamic content in the new language
}

/* ---------- Shared chrome (header / footer / bottom nav) ---------- */
function buildChrome() {
  const page = document.body.dataset.page;
  const header = $("#app-header");
  header.innerHTML = `
    <div class="container header-inner">
      <a href="index.html" class="logo">
        <img src="images/logo.png" alt="${LANG === "ar" ? STORE.nameAr : STORE.nameEn}" class="logo-img">
        <span class="logo-text">${LANG === "ar" ? STORE.nameAr : STORE.nameEn}</span>
      </a>
      <form class="search-bar" id="search-form" role="search">
        <input type="search" id="search-input" data-i18n-ph="search_placeholder" placeholder="${t("search_placeholder")}">
        <button type="submit" aria-label="Search">🔍</button>
      </form>
      <div class="header-actions">
        <a href="account.html" class="account-btn" aria-label="Account">👤</a>
        <button class="lang-toggle" onclick="toggleLang()">${t("langName")}</button>
        <a href="cart.html" class="cart-btn" aria-label="Cart">
          🛒<span class="cart-count">0</span>
        </a>
      </div>
    </div>`;

  $("#app-footer").innerHTML = `
    <div class="container footer-grid">
      <div>
        <div class="logo footer-logo"><img src="images/logo.png" alt="${LANG === "ar" ? STORE.nameAr : STORE.nameEn}" class="logo-img"> ${LANG === "ar" ? STORE.nameAr : STORE.nameEn}</div>
        <p class="footer-about" data-i18n="footer_about">${t("footer_about")}</p>
      </div>
      <div>
        <h4 data-i18n="footer_links">${t("footer_links")}</h4>
        <a href="index.html" data-i18n="nav_home">${t("nav_home")}</a>
        <a href="categories.html" data-i18n="nav_categories">${t("nav_categories")}</a>
        <a href="about.html" data-i18n="nav_about">${t("nav_about")}</a>
        <a href="contact.html" data-i18n="nav_contact">${t("nav_contact")}</a>
      </div>
      <div>
        <h4 data-i18n="footer_contact">${t("footer_contact")}</h4>
        <a href="tel:${STORE.phone.replace(/\s/g, "")}">📞 ${STORE.phone}</a>
        <a href="https://wa.me/${STORE.whatsapp}" target="_blank" rel="noopener">💬 WhatsApp</a>
        <p>🕐 ${LANG === "ar" ? STORE.hoursAr : STORE.hoursEn}</p>
      </div>
    </div>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} ${LANG === "ar" ? STORE.nameAr : STORE.nameEn}. ${t("footer_rights")}
    </div>`;

  $("#bottom-nav").innerHTML = `
    <a href="index.html" class="${page === "home" ? "active" : ""}"><span>🏠</span>${t("nav_home")}</a>
    <a href="categories.html" class="${page === "categories" ? "active" : ""}"><span>🗂️</span>${t("nav_categories")}</a>
    <a href="cart.html" class="${page === "cart" ? "active" : ""}"><span>🛒</span>${t("nav_cart")} <span class="cart-count">0</span></a>
    <a href="account.html" class="${page === "account" ? "active" : ""}"><span>👤</span>${t("nav_account")}</a>`;

  // Floating WhatsApp button (not on admin page)
  if (page !== "admin" && !$("#wa-float")) {
    const wa = document.createElement("a");
    wa.id = "wa-float";
    wa.href = "https://wa.me/" + STORE.whatsapp;
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.setAttribute("aria-label", "WhatsApp");
    wa.innerHTML = `<svg viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.5c1.2.6 2.5.9 3.8.9 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.2 0-2.4-.3-3.5-.8l-.8-.4-4.9.9 1-4.7-.5-.8c-.9-1.5-1.4-3.2-1.4-5 0-5.2 4.2-9.4 9.4-9.4s9.4 4.2 9.4 9.4-4.2 10.8-8.7 10.8zm5.2-7c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>`;
    document.body.appendChild(wa);
  }

  $("#search-form").addEventListener("submit", e => {
    e.preventDefault();
    const q = $("#search-input").value.trim();
    location.href = "products.html" + (q ? "?q=" + encodeURIComponent(q) : "");
  });

  updateCartBadge();
}

/* ---------- Product card ---------- */
function productMedia(p, cls) {
  return p.emoji && p.emoji.startsWith("http")
    ? `<img src="${p.emoji}" alt="${pName(p)}" class="${cls}" loading="lazy">`
    : `<span class="${cls}">${p.emoji}</span>`;
}

function productCard(p) {
  const offer = p.old && p.old > p.price;
  const stock = inStock(p);
  return `
  <article class="product-card ${stock ? "" : "is-out"}">
    <a href="product.html?id=${p.id}" class="product-img" style="background:${catColor(p.cat)}">
      ${offer ? `<span class="badge-offer">${t("in_offer")}</span>` : ""}
      ${stock ? "" : `<span class="badge-out">${t("out_of_stock")}</span>`}
      ${productMedia(p, "product-emoji")}
    </a>
    <div class="product-info">
      <a href="product.html?id=${p.id}" class="product-name">${pName(p)}</a>
      <div class="product-price">
        <strong>${money(p.price)}</strong>
        ${offer ? `<s>${money(p.old)}</s>` : ""}
        <span class="product-unit">/ ${unitLabel(p.unit)}</span>
      </div>
      ${stock
        ? `<button class="btn-add" onclick="addToCart(${p.id}, 1, this)"><span>＋</span> ${t("add_to_cart")}</button>`
        : `<button class="btn-add" disabled>${t("out_of_stock")}</button>`}
    </div>
  </article>`;
}

function categoryCard(c) {
  const count = allProducts().filter(p => p.cat === c.id).length;
  return `
  <a href="products.html?cat=${c.id}" class="category-card" style="background:${c.color}">
    <span class="category-emoji">${c.emoji}</span>
    <span class="category-name">${cName(c)}</span>
    <span class="category-count">${count} ${t("items")}</span>
  </a>`;
}

/* ============================================================
   PAGE RENDERERS
   ============================================================ */

/* ---------- Home ---------- */
function renderHome() {
  const all = allProducts();
  const offers = all.filter(p => p.old && p.old > p.price && inStock(p)).slice(0, 8);
  const featured = all.filter(p => p.featured).slice(0, 8);

  $("#page").innerHTML = `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-text">
          <span class="hero-badge" data-i18n="hero_badge">${t("hero_badge")}</span>
          <h1>${t("hero_title_1")}<br><span class="text-gold">${t("hero_title_2")}</span></h1>
          <p>${t("hero_sub")}</p>
          <div class="hero-ctas">
            <a href="categories.html" class="btn btn-primary">${t("hero_cta")}</a>
            <a href="#offers" class="btn btn-outline">${t("hero_cta2")}</a>
          </div>
          <div class="hero-stats">
            <div><strong>${all.length}+</strong><span>${t("stat_products")}</span></div>
            <div><strong>${CATEGORIES.length}</strong><span>${t("stat_categories")}</span></div>
            <div><strong>45</strong><span>${t("stat_delivery")}</span></div>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="hero-basket">
            <span>🥦</span><span>🍎</span><span>🥛</span><span>🍞</span><span>🧀</span><span>🍊</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="offers">
      <div class="container">
        <div class="section-head">
          <div><h2>${t("offers_title")}</h2><p>${t("offers_sub")}</p></div>
          <a href="products.html?offers=1" class="link-more">${t("view_all")} ←</a>
        </div>
        <div class="product-grid">${offers.map(productCard).join("")}</div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <div><h2>${t("categories_title")}</h2><p>${t("categories_sub")}</p></div>
          <a href="categories.html" class="link-more">${t("view_all")} ←</a>
        </div>
        <div class="category-grid">${CATEGORIES.map(categoryCard).join("")}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div><h2>${t("featured_title")}</h2><p>${t("featured_sub")}</p></div>
          <a href="products.html" class="link-more">${t("view_all")} ←</a>
        </div>
        <div class="product-grid">${featured.map(productCard).join("")}</div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <h2 class="center-title">${t("why_title")}</h2>
        <div class="why-grid">
          <div class="why-card"><span>🥬</span><h3>${t("why_1_t")}</h3><p>${t("why_1_d")}</p></div>
          <div class="why-card"><span>🚚</span><h3>${t("why_2_t")}</h3><p>${t("why_2_d")}</p></div>
          <div class="why-card"><span>🏷️</span><h3>${t("why_3_t")}</h3><p>${t("why_3_d")}</p></div>
          <div class="why-card"><span>📱</span><h3>${t("why_4_t")}</h3><p>${t("why_4_d")}</p></div>
        </div>
      </div>
    </section>`;
}

/* ---------- Categories ---------- */
function renderCategories() {
  $("#page").innerHTML = `
    <section class="page-head">
      <div class="container">
        <h1>${t("cat_page_title")}</h1>
        <p>${t("cat_page_sub")}</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="category-grid category-grid-large">${CATEGORIES.map(categoryCard).join("")}</div>
      </div>
    </section>`;
}

/* ---------- Products (list / search / filter / sort) ---------- */
function renderProducts() {
  const params = new URLSearchParams(location.search);
  const catId = params.get("cat");
  const q = (params.get("q") || "").toLowerCase();
  const offersOnly = params.get("offers") === "1";
  const sort = params.get("sort") || "featured";

  let list = allProducts();
  if (catId) list = list.filter(p => p.cat === catId);
  if (offersOnly) list = list.filter(p => p.old && p.old > p.price);
  if (q) list = list.filter(p =>
    p.en.toLowerCase().includes(q) || p.ar.includes(q) ||
    cName(getCategory(p.cat)).toLowerCase().includes(q));

  if (sort === "price_low") list.sort((a, b) => a.price - b.price);
  else if (sort === "price_high") list.sort((a, b) => b.price - a.price);
  else if (sort === "name") list.sort((a, b) => pName(a).localeCompare(pName(b), LANG));
  else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  const cat = catId ? getCategory(catId) : null;
  const title = q ? `${t("results_for")} "${params.get("q")}"` : cat ? cName(cat) : t("all_products");

  $("#page").innerHTML = `
    <section class="page-head">
      <div class="container">
        <nav class="breadcrumb">
          <a href="index.html">${t("nav_home")}</a> ‹
          <a href="categories.html">${t("nav_categories")}</a>
          ${cat ? ` ‹ <span>${cName(cat)}</span>` : ""}
        </nav>
        <h1>${cat ? cat.emoji + " " : ""}${title}</h1>
        <p>${list.length} ${t("items")}</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="toolbar">
          <div class="chip-row">
            <a class="chip ${!catId ? "active" : ""}" href="products.html">${t("all_products")}</a>
            ${CATEGORIES.map(c =>
              `<a class="chip ${catId === c.id ? "active" : ""}" href="products.html?cat=${c.id}">${c.emoji} ${cName(c)}</a>`
            ).join("")}
          </div>
          <select id="sort-select" class="sort-select" onchange="onSort(this.value)">
            <option value="featured" ${sort === "featured" ? "selected" : ""}>${t("sort_featured")}</option>
            <option value="price_low" ${sort === "price_low" ? "selected" : ""}>${t("sort_price_low")}</option>
            <option value="price_high" ${sort === "price_high" ? "selected" : ""}>${t("sort_price_high")}</option>
            <option value="name" ${sort === "name" ? "selected" : ""}>${t("sort_name")}</option>
          </select>
        </div>
        ${list.length
          ? `<div class="product-grid">${list.map(productCard).join("")}</div>`
          : `<div class="empty-state"><span>🔍</span><h2>${t("no_results")}</h2><p>${t("no_results_sub")}</p>
             <a href="categories.html" class="btn btn-primary">${t("nav_categories")}</a></div>`}
      </div>
    </section>`;
}

function onSort(value) {
  const params = new URLSearchParams(location.search);
  params.set("sort", value);
  location.search = params.toString();
}

/* ---------- Product detail ---------- */
function renderProduct() {
  const id = new URLSearchParams(location.search).get("id");
  const p = getProduct(id);
  if (!p) { location.href = "products.html"; return; }
  const cat = getCategory(p.cat);
  const offer = p.old && p.old > p.price;
  const stock = inStock(p);
  const related = allProducts().filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);

  $("#page").innerHTML = `
    <section class="section">
      <div class="container">
        <nav class="breadcrumb">
          <a href="index.html">${t("nav_home")}</a> ‹
          <a href="products.html?cat=${cat.id}">${cName(cat)}</a> ‹
          <span>${pName(p)}</span>
        </nav>
        <div class="product-detail">
          <div class="detail-img" style="background:${catColor(p.cat)}">
            ${offer ? `<span class="badge-offer">${t("in_offer")}</span>` : ""}
            ${stock ? "" : `<span class="badge-out">${t("out_of_stock")}</span>`}
            ${productMedia(p, "detail-emoji")}
          </div>
          <div class="detail-info">
            <a href="products.html?cat=${cat.id}" class="detail-cat">${cat.emoji} ${cName(cat)}</a>
            <h1>${pName(p)}</h1>
            <div class="detail-price">
              <strong>${money(p.price)}</strong>
              ${offer ? `<s>${money(p.old)}</s>` : ""}
              <span>${t("per")} ${unitLabel(p.unit)}</span>
            </div>
            ${stock ? `
            <div class="qty-row">
              <div class="qty-control">
                <button onclick="detailQty(-1)" aria-label="decrease">−</button>
                <span id="detail-qty">1</span>
                <button onclick="detailQty(1)" aria-label="increase">＋</button>
              </div>
              <button class="btn btn-primary btn-big" onclick="addToCart(${p.id}, Number($('#detail-qty').textContent), this)">
                🛒 ${t("order_now")}
              </button>
            </div>` : `
            <div class="out-notice">😔 ${t("out_of_stock")}</div>`}
            <ul class="detail-perks">
              <li>🚚 ${t("why_2_d")}</li>
              <li>🥬 ${t("why_1_d")}</li>
              <li>💵 ${t("opt_cash")}</li>
            </ul>
          </div>
        </div>
        ${related.length ? `
          <div class="section-head related-head"><div><h2>${t("related")}</h2></div></div>
          <div class="product-grid">${related.map(productCard).join("")}</div>` : ""}
      </div>
    </section>`;
}

function detailQty(delta) {
  const el = $("#detail-qty");
  el.textContent = Math.max(1, Number(el.textContent) + delta);
}

/* ---------- Cart & Checkout ---------- */
function renderCartPage() {
  const ids = Object.keys(cart);
  const subtotal = cartSubtotal();
  const freeOver = STORE.freeDeliveryOver;
  const deliveryFee = subtotal === 0 || subtotal >= freeOver ? 0 : getDeliveryFee();
  const total = subtotal + deliveryFee;
  const remaining = Math.max(0, freeOver - subtotal);
  const user = currentUser();

  if (!ids.length) {
    $("#page").innerHTML = `
      <section class="section">
        <div class="container">
          <div class="empty-state">
            <span>🛒</span>
            <h1>${t("cart_empty")}</h1>
            <p>${t("cart_empty_sub")}</p>
            <a href="categories.html" class="btn btn-primary">${t("start_shopping")}</a>
          </div>
        </div>
      </section>`;
    return;
  }

  $("#page").innerHTML = `
    <section class="page-head">
      <div class="container"><h1>🛒 ${t("cart_title")}</h1></div>
    </section>
    <section class="section">
      <div class="container cart-layout">
        <div class="cart-items">
          ${ids.map(id => {
            const p = getProduct(id);
            const q = cart[id];
            return `
            <div class="cart-item">
              <a href="product.html?id=${p.id}" class="cart-item-img" style="background:${catColor(p.cat)}">${p.emoji}</a>
              <div class="cart-item-info">
                <a href="product.html?id=${p.id}" class="cart-item-name">${pName(p)}</a>
                <span class="cart-item-price">${money(p.price)} / ${unitLabel(p.unit)}</span>
              </div>
              <div class="qty-control">
                <button onclick="setQty(${p.id}, ${q - 1})">−</button>
                <span>${q}</span>
                <button onclick="setQty(${p.id}, ${q + 1})">＋</button>
              </div>
              <strong class="cart-item-total">${money(p.price * q)}</strong>
              <button class="btn-remove" onclick="setQty(${p.id}, 0)" title="${t("remove")}">🗑️</button>
            </div>`;
          }).join("")}
        </div>

        <aside class="cart-summary">
          <h2>${t("checkout_title")}</h2>
          <p class="summary-sub">${t("checkout_sub")}</p>
          ${remaining > 0 ? `<div class="free-delivery-note">🚚 ${t("free_delivery_note").replace("{x}", money(remaining))}</div>` : ""}
          <div class="summary-row"><span>${t("subtotal")}</span><strong>${money(subtotal)}</strong></div>
          <div class="summary-row"><span>${t("delivery")}</span><strong>${deliveryFee === 0 ? t("free") : money(deliveryFee)}</strong></div>
          <div class="summary-row summary-total"><span>${t("total")}</span><strong>${money(total)}</strong></div>

          <form id="checkout-form" class="checkout-form">
            ${user ? "" : `<p class="guest-note">👤 ${t("guest_note")} <a href="account.html">${t("login_btn")}</a></p>`}
            <label>${t("form_name")} *<input type="text" id="f-name" value="${user ? user.name : ""}" required></label>
            <label>${t("form_phone")} *<input type="tel" id="f-phone" value="${user ? user.phone : ""}" required></label>
            <label>${t("form_address")} *<input type="text" id="f-address" value="${user && user.address ? user.address : ""}" required></label>
            <label>${t("form_notes")}<input type="text" id="f-notes" placeholder="${t("form_notes_ph")}"></label>
            <div class="form-group">
              <span>${t("delivery_method")}</span>
              <div class="radio-row">
                <label><input type="radio" name="delivery" value="delivery" checked> 🚚 ${t("opt_delivery")}</label>
                <label><input type="radio" name="delivery" value="pickup"> 🏪 ${t("opt_pickup")}</label>
              </div>
            </div>
            <div class="form-group">
              <span>${t("payment_method")}</span>
              <div class="radio-row">
                <label><input type="radio" name="payment" value="cash" checked onchange="toggleBankBox()"> 💵 ${t("opt_cash")}</label>
                <label><input type="radio" name="payment" value="bank" onchange="toggleBankBox()"> 🏦 ${t("opt_bank")}</label>
              </div>
            </div>
            <div id="bank-box" class="bank-box" style="display:none">
              <p>${t("bank_note")}</p>
              <pre>${LANG === "ar" ? STORE.bankDetailsAr : STORE.bankDetailsEn}</pre>
            </div>
            <button type="submit" class="btn btn-whatsapp btn-big">💬 ${t("place_order")}</button>
            <p id="checkout-msg" class="checkout-msg"></p>
          </form>
        </aside>
      </div>
    </section>`;

  $("#checkout-form").addEventListener("submit", submitOrder);
}

function toggleBankBox() {
  const isBank = $('input[name="payment"]:checked').value === "bank";
  $("#bank-box").style.display = isBank ? "block" : "none";
}

function submitOrder(e) {
  e.preventDefault();
  const name = $("#f-name").value.trim();
  const phone = $("#f-phone").value.trim();
  const address = $("#f-address").value.trim();
  const notes = $("#f-notes").value.trim();
  const msg = $("#checkout-msg");

  if (!name || !phone || !address) {
    msg.textContent = t("fill_required");
    msg.className = "checkout-msg error";
    return;
  }

  const deliveryMethod = $('input[name="delivery"]:checked').value;
  const paymentMethod = $('input[name="payment"]:checked').value;
  const subtotal = cartSubtotal();
  const fee = deliveryMethod === "pickup" || subtotal >= STORE.freeDeliveryOver ? 0 : getDeliveryFee();
  const total = subtotal + fee;
  const user = currentUser();

  const items = Object.entries(cart).map(([id, q]) => {
    const p = getProduct(id);
    return { id: p.id, en: p.en, ar: p.ar, qty: q, price: p.price, unit: p.unit };
  });

  // Save order to the store's order list (admin dashboard) + customer history
  const order = createOrder({
    name, phone, address, notes,
    delivery: deliveryMethod,
    payment: paymentMethod,
    items, subtotal, fee, total,
    userPhone: user ? user.phone : null
  });

  // Remember address for next checkout
  if (user && !user.address) {
    const users = getUsers();
    const u = users.find(x => x.phone === user.phone);
    if (u) { u.address = address; saveUsers(users); }
  }

  const lines = items.map(i => `• ${pName(i)} × ${i.qty} = ${money(i.price * i.qty)}`);
  const text =
    `🛒 *${LANG === "ar" ? STORE.nameAr : STORE.nameEn} — ${t("order_no")} ${order.id}*\n\n` +
    lines.join("\n") +
    `\n\n${t("subtotal")}: ${money(subtotal)}` +
    `\n${t("delivery")}: ${fee === 0 ? t("free") : money(fee)}` +
    `\n*${t("total")}: ${money(total)}*` +
    `\n\n👤 ${name}\n📞 ${phone}\n📍 ${address}` +
    `\n🚚 ${deliveryMethod === "pickup" ? t("opt_pickup") : t("opt_delivery")} | ${paymentMethod === "bank" ? "🏦 " + t("opt_bank") : "💵 " + t("opt_cash")}` +
    (notes ? `\n📝 ${notes}` : "");

  window.open("https://wa.me/" + STORE.whatsapp + "?text=" + encodeURIComponent(text), "_blank");

  msg.textContent = t("order_success");
  msg.className = "checkout-msg success";
  cart = {};
  saveCart();
  setTimeout(() => { location.href = user ? "account.html" : "index.html"; }, 2200);
}

/* ---------- About ---------- */
function renderAbout() {
  $("#page").innerHTML = `
    <section class="page-head">
      <div class="container"><h1>${t("about_title")}</h1><p>${t("about_sub")}</p></div>
    </section>
    <section class="section">
      <div class="container about-grid">
        <div class="about-story">
          <h2>${t("about_story_t")}</h2>
          <p>${t("about_story_p1")}</p>
          <p>${t("about_story_p2")}</p>
          <div class="why-grid about-perks">
            <div class="why-card"><span>🥬</span><h3>${t("why_1_t")}</h3></div>
            <div class="why-card"><span>🚚</span><h3>${t("why_2_t")}</h3></div>
            <div class="why-card"><span>🏷️</span><h3>${t("why_3_t")}</h3></div>
            <div class="why-card"><span>📱</span><h3>${t("why_4_t")}</h3></div>
          </div>
        </div>
        <aside class="store-card">
          <h2>🏪 ${t("about_visit_t")}</h2>
          <div class="store-row"><span>📍</span><div><strong>${t("about_location_t")}</strong><p>${LANG === "ar" ? STORE.addressAr : STORE.addressEn}</p></div></div>
          <div class="store-row"><span>🕐</span><div><strong>${t("about_hours_t")}</strong><p>${LANG === "ar" ? STORE.hoursAr : STORE.hoursEn}</p></div></div>
          <div class="store-row"><span>📞</span><div><strong>${t("contact_call")}</strong><p dir="ltr">${STORE.phone}</p></div></div>
          <a class="btn btn-primary" target="_blank" rel="noopener"
             href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.mapsQuery)}">
             🗺️ ${t("get_directions")}</a>
        </aside>
      </div>
    </section>`;
}

/* ---------- Contact ---------- */
function renderContact() {
  $("#page").innerHTML = `
    <section class="page-head">
      <div class="container"><h1>${t("contact_title")}</h1><p>${t("contact_sub")}</p></div>
    </section>
    <section class="section">
      <div class="container">
        <div class="contact-grid">
          <a class="contact-card" href="tel:${STORE.phone.replace(/\s/g, "")}">
            <span>📞</span><h3>${t("contact_call")}</h3><p dir="ltr">${STORE.phone}</p>
            <em>${t("call_now")}</em>
          </a>
          <a class="contact-card contact-whatsapp" href="https://wa.me/${STORE.whatsapp}" target="_blank" rel="noopener">
            <span>💬</span><h3>${t("contact_whatsapp")}</h3><p dir="ltr">+${STORE.whatsapp}</p>
            <em>${t("chat_now")}</em>
          </a>
          <a class="contact-card" href="mailto:${STORE.email}">
            <span>✉️</span><h3>${t("contact_email")}</h3><p>${STORE.email}</p>
            <em>${t("send_email")}</em>
          </a>
          <div class="contact-card">
            <span>📍</span><h3>${t("contact_visit")}</h3><p>${LANG === "ar" ? STORE.addressAr : STORE.addressEn}</p>
            <em>${LANG === "ar" ? STORE.hoursAr : STORE.hoursEn}</em>
          </div>
        </div>
        <div class="map-wrap">
          <iframe title="Store location" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=${encodeURIComponent(STORE.mapsQuery)}&output=embed"></iframe>
        </div>
      </div>
    </section>`;
}

/* ---------- Account (login / register / order history) ---------- */
function statusBadge(status) {
  return `<span class="status-badge status-${status}">${t("status_" + status)}</span>`;
}

function renderAccount() {
  const user = currentUser();

  if (!user) {
    $("#page").innerHTML = `
      <section class="page-head">
        <div class="container"><h1>👤 ${t("nav_account")}</h1><p>${t("login_sub")}</p></div>
      </section>
      <section class="section">
        <div class="container auth-wrap">
          <div class="auth-card">
            <div class="auth-tabs">
              <button class="auth-tab active" id="tab-login" onclick="switchAuth('login')">${t("login_btn")}</button>
              <button class="auth-tab" id="tab-register" onclick="switchAuth('register')">${t("register_btn")}</button>
            </div>
            <form id="login-form" class="checkout-form">
              <h2>${t("login_title")}</h2>
              <label>${t("form_phone")} *<input type="tel" id="l-phone" required></label>
              <label>${t("form_password")} *<input type="password" id="l-pass" required></label>
              <button type="submit" class="btn btn-primary btn-big">${t("login_btn")}</button>
              <p class="auth-switch">${t("need_account")} → <a href="#" onclick="switchAuth('register'); return false;">${t("register_btn")}</a></p>
              <p id="login-msg" class="checkout-msg"></p>
            </form>
            <form id="register-form" class="checkout-form" style="display:none">
              <h2>${t("register_title")}</h2>
              <p class="summary-sub">${t("register_sub")}</p>
              <label>${t("form_name")} *<input type="text" id="r-name" required></label>
              <label>${t("form_phone")} *<input type="tel" id="r-phone" required></label>
              <label>${t("form_password")} *<input type="password" id="r-pass" required minlength="4"></label>
              <button type="submit" class="btn btn-primary btn-big">${t("register_btn")}</button>
              <p class="auth-switch">${t("have_account")} → <a href="#" onclick="switchAuth('login'); return false;">${t("login_btn")}</a></p>
              <p id="register-msg" class="checkout-msg"></p>
            </form>
          </div>
        </div>
      </section>`;

    $("#login-form").addEventListener("submit", e => {
      e.preventDefault();
      const res = loginUser($("#l-phone").value.trim(), $("#l-pass").value);
      const m = $("#login-msg");
      if (res.error) { m.textContent = res.error; m.className = "checkout-msg error"; }
      else { toast(t("login_success").replace("{name}", res.user.name)); renderAccount(); buildChrome(); }
    });

    $("#register-form").addEventListener("submit", e => {
      e.preventDefault();
      const res = registerUser($("#r-name").value.trim(), $("#r-phone").value.trim(), $("#r-pass").value);
      const m = $("#register-msg");
      if (res.error) { m.textContent = res.error; m.className = "checkout-msg error"; }
      else { toast(t("register_success").replace("{name}", $("#r-name").value.trim())); renderAccount(); buildChrome(); }
    });
    return;
  }

  const myOrders = getOrders().filter(o => o.userPhone === user.phone);
  $("#page").innerHTML = `
    <section class="page-head">
      <div class="container account-head">
        <div><h1>👤 ${user.name}</h1><p dir="ltr">${user.phone}</p></div>
        <button class="btn btn-outline-dark" onclick="logoutUser()">${t("logout")}</button>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="orders-title">${t("my_orders")} (${myOrders.length})</h2>
        ${myOrders.length ? `<div class="orders-list">${myOrders.map(orderCard).join("")}</div>` : `
          <div class="empty-state"><span>📦</span><h2>${t("no_orders")}</h2><p>${t("no_orders_sub")}</p>
          <a href="categories.html" class="btn btn-primary">${t("start_shopping")}</a></div>`}
      </div>
    </section>`;
}

function switchAuth(which) {
  const login = which === "login";
  $("#login-form").style.display = login ? "grid" : "none";
  $("#register-form").style.display = login ? "none" : "grid";
  $("#tab-login").classList.toggle("active", login);
  $("#tab-register").classList.toggle("active", !login);
}

function orderCard(o) {
  const date = new Date(o.date).toLocaleDateString(LANG === "ar" ? "ar" : "en", { day: "numeric", month: "short", year: "numeric" });
  return `
  <div class="order-card">
    <div class="order-top">
      <div><strong>${t("order_no")} ${o.id}</strong><span class="order-date">${date}</span></div>
      ${statusBadge(o.status)}
    </div>
    <div class="order-items">
      ${o.items.map(i => `<span>${LANG === "ar" ? i.ar : i.en} × ${i.qty}</span>`).join("")}
    </div>
    <div class="order-bottom">
      <span>${o.delivery === "pickup" ? "🏪 " + t("opt_pickup") : "🚚 " + t("opt_delivery")} · ${o.payment === "bank" ? "🏦 " + t("opt_bank") : "💵 " + t("opt_cash")}</span>
      <strong>${money(o.total)}</strong>
    </div>
  </div>`;
}

/* ============================================================
   BOOT
   ============================================================ */
function renderPage() {
  const page = document.body.dataset.page;
  if (!$("#page")) return;
  const renderers = {
    home: renderHome,
    categories: renderCategories,
    products: renderProducts,
    product: renderProduct,
    cart: renderCartPage,
    about: renderAbout,
    contact: renderContact,
    account: renderAccount
  };
  if (typeof renderAdmin === "function") renderers.admin = renderAdmin;
  (renderers[page] || (() => {}))();
  buildChrome(); // rebuild chrome so it matches current language
}

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.lang = LANG;
  document.documentElement.dir = t("dir");
  renderPage();
});
