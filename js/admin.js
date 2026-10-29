/* ============================================================
   Ijmaal FreshMart — Admin dashboard
   (orders, products, settings — all stored in localStorage)
   ============================================================ */

function adminPass() { return localStorage.getItem("fm_admin_pass") || STORE.adminPass; }
function isAdmin() { return sessionStorage.getItem("fm_admin") === "1"; }

let adminTab = "orders";

function renderAdmin() {
  if (!isAdmin()) { renderAdminLogin(); return; }
  $("#page").innerHTML = `
    <section class="page-head">
      <div class="container account-head">
        <div><h1>⚙️ ${t("admin_title")}</h1><p>${getOrders().length} ${t("admin_orders_count")} · ${allProducts().length} ${t("stat_products")}</p></div>
        <button class="btn btn-outline-dark" onclick="adminLogout()">${t("logout")}</button>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="admin-tabs">
          <button class="auth-tab ${adminTab === "orders" ? "active" : ""}" onclick="switchAdminTab('orders')">📦 ${t("admin_tab_orders")}</button>
          <button class="auth-tab ${adminTab === "products" ? "active" : ""}" onclick="switchAdminTab('products')">🛍️ ${t("admin_tab_products")}</button>
          <button class="auth-tab ${adminTab === "settings" ? "active" : ""}" onclick="switchAdminTab('settings')">⚙️ ${t("admin_tab_settings")}</button>
        </div>
        <div id="admin-body"></div>
      </div>
    </section>`;
  ({ orders: renderAdminOrders, products: renderAdminProducts, settings: renderAdminSettings })[adminTab]();
}

function switchAdminTab(tab) { adminTab = tab; renderAdmin(); }
function adminLogout() { sessionStorage.removeItem("fm_admin"); renderAdmin(); }

/* ---------- Login ---------- */
function renderAdminLogin() {
  $("#page").innerHTML = `
    <section class="section">
      <div class="container auth-wrap">
        <div class="auth-card">
          <form id="admin-login-form" class="checkout-form">
            <h2>⚙️ ${t("admin_title")}</h2>
            <p class="summary-sub">${t("admin_login_sub")}</p>
            <label>${t("form_password")} *<input type="password" id="a-pass" placeholder="${t("admin_pass_ph")}" required></label>
            <button type="submit" class="btn btn-primary btn-big">${t("admin_login_btn")}</button>
            <p id="admin-login-msg" class="checkout-msg"></p>
          </form>
        </div>
      </div>
    </section>`;
  $("#admin-login-form").addEventListener("submit", e => {
    e.preventDefault();
    if ($("#a-pass").value === adminPass()) {
      sessionStorage.setItem("fm_admin", "1");
      renderAdmin();
    } else {
      const m = $("#admin-login-msg");
      m.textContent = t("admin_pass_error");
      m.className = "checkout-msg error";
    }
  });
}

/* ---------- Orders tab ---------- */
const STATUS_FLOW = ["pending", "preparing", "out", "delivered"];

function renderAdminOrders() {
  const orders = getOrders();
  $("#admin-body").innerHTML = !orders.length
    ? `<div class="empty-state"><span>📦</span><p>${t("admin_no_orders")}</p></div>`
    : `<div class="orders-list">${orders.map(adminOrderCard).join("")}</div>`;
}

function adminOrderCard(o) {
  const date = new Date(o.date).toLocaleString(LANG === "ar" ? "ar" : "en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const next = STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1];
  return `
  <div class="order-card admin-order">
    <div class="order-top">
      <div><strong>${o.id}</strong><span class="order-date">${date}</span></div>
      ${statusBadge(o.status)}
    </div>
    <div class="admin-order-grid">
      <div>
        <strong>${t("customer")}</strong>
        <p>👤 ${o.name}<br>📞 <a href="tel:${o.phone}" dir="ltr">${o.phone}</a><br>📍 ${o.address}</p>
        ${o.notes ? `<p>📝 ${o.notes}</p>` : ""}
        <p>${o.delivery === "pickup" ? "🏪 " + t("opt_pickup") : "🚚 " + t("opt_delivery")} · ${o.payment === "bank" ? "🏦 " + t("opt_bank") : "💵 " + t("opt_cash")}</p>
      </div>
      <div>
        <strong>${t("items_col")}</strong>
        <p>${o.items.map(i => `${LANG === "ar" ? i.ar : i.en} × ${i.qty}`).join("<br>")}</p>
        <p>${t("subtotal")}: ${money(o.subtotal)} · ${t("delivery")}: ${o.fee === 0 ? t("free") : money(o.fee)}<br>
        <strong>${t("total")}: ${money(o.total)}</strong></p>
      </div>
    </div>
    <div class="admin-order-actions">
      ${next ? `<button class="btn btn-primary" onclick="advanceOrder('${o.id}', '${next}')">${t("admin_mark")}: ${t("status_" + next)} →</button>` : `<span class="done-chip">✅ ${t("status_delivered")}</span>`}
      <a class="btn btn-whatsapp" target="_blank" rel="noopener"
         href="https://wa.me/${o.phone.replace(/\D/g, "")}?text=${encodeURIComponent(t("order_no") + " " + o.id + ": " + t("status_" + o.status))}">💬 WhatsApp</a>
    </div>
  </div>`;
}

function advanceOrder(id, status) {
  setOrderStatus(id, status);
  renderAdmin();
}

/* ---------- Products tab ---------- */
function renderAdminProducts() {
  const list = allProducts();
  $("#admin-body").innerHTML = `
    <div class="admin-products-head">
      <p class="summary-sub">${t("admin_products_sub")}</p>
      <button class="btn btn-primary" onclick="editProductForm()">＋ ${t("admin_add_product")}</button>
    </div>
    <div id="product-form-slot"></div>
    <div class="admin-product-list">
      ${list.map(p => `
        <div class="admin-product-row">
          <span class="admin-product-img" style="background:${catColor(p.cat)}">${productMedia(p, "admin-emoji")}</span>
          <div class="admin-product-info">
            <strong>${LANG === "ar" ? p.ar : p.en}</strong>
            <span>${money(p.price)} / ${unitLabel(p.unit)} · ${cName(getCategory(p.cat))}</span>
          </div>
          <button class="stock-toggle ${inStock(p) ? "in" : "out"}" onclick="toggleStock(${p.id})">
            ${inStock(p) ? "✓ " + t("admin_in_stock") : "✕ " + t("admin_out_stock")}
          </button>
          <button class="btn btn-small" onclick="editProductForm(${p.id})">✏️</button>
        </div>`).join("")}
    </div>`;
}

function toggleStock(id) {
  setStock(id, !inStock(getProduct(id)));
  renderAdmin();
}

function editProductForm(id) {
  const p = id ? getProduct(id) : { id: "c" + Date.now(), cat: "fruits", en: "", ar: "", price: "", old: "", unit: "pc", emoji: "🛒", featured: false, custom: true };
  $("#product-form-slot").innerHTML = `
    <form id="product-form" class="checkout-form product-form">
      <h3>${id ? t("admin_edit_product") : t("admin_add_product")}</h3>
      <div class="form-2col">
        <label>${t("admin_name_en")} *<input type="text" id="p-en" value="${p.en}" required></label>
        <label>${t("admin_name_ar")} *<input type="text" id="p-ar" value="${p.ar}" required></label>
        <label>${t("admin_price")} *<input type="number" step="0.01" min="0" id="p-price" value="${p.price}" required></label>
        <label>${t("admin_old_price")}<input type="number" step="0.01" min="0" id="p-old" value="${p.old || ""}"></label>
        <label>${t("admin_unit")}
          <select id="p-unit">${Object.keys(UNITS).map(u => `<option value="${u}" ${p.unit === u ? "selected" : ""}>${unitLabel(u)}</option>`).join("")}</select>
        </label>
        <label>${t("admin_category")}
          <select id="p-cat">${CATEGORIES.map(c => `<option value="${c.id}" ${p.cat === c.id ? "selected" : ""}>${c.emoji} ${cName(c)}</option>`).join("")}</select>
        </label>
      </div>
      <label>${t("admin_emoji")}<input type="text" id="p-emoji" value="${p.emoji}" placeholder="${t("admin_emoji_hint")}"></label>
      <label class="check-row"><input type="checkbox" id="p-featured" ${p.featured ? "checked" : ""}> ⭐ ${t("admin_featured")}</label>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">💾 ${t("admin_save")}</button>
        ${id ? `<button type="button" class="btn btn-danger" onclick="deleteProduct(${p.id})">🗑️ ${t("admin_delete")}</button>` : ""}
        <button type="button" class="btn btn-outline-dark" onclick="$('#product-form-slot').innerHTML=''">✕</button>
      </div>
    </form>`;
  $("#product-form-slot").scrollIntoView({ behavior: "smooth" });

  $("#product-form").addEventListener("submit", e => {
    e.preventDefault();
    const o = productOverrides();
    o[p.id] = {
      ...(o[p.id] || {}),
      id: p.id,
      custom: !!p.custom,
      en: $("#p-en").value.trim(),
      ar: $("#p-ar").value.trim(),
      price: parseFloat($("#p-price").value),
      old: $("#p-old").value ? parseFloat($("#p-old").value) : undefined,
      unit: $("#p-unit").value,
      cat: $("#p-cat").value,
      emoji: $("#p-emoji").value.trim() || "🛒",
      featured: $("#p-featured").checked
    };
    saveProductOverrides(o);
    renderAdmin();
  });
}

function deleteProduct(id) {
  if (!confirm(t("admin_delete_confirm"))) return;
  const o = productOverrides();
  o[id] = { ...(o[id] || {}), id, deleted: true };
  saveProductOverrides(o);
  renderAdmin();
}

/* ---------- Settings tab ---------- */
function renderAdminSettings() {
  $("#admin-body").innerHTML = `
    <div class="admin-settings">
      <p class="summary-sub">${t("admin_settings_sub")}</p>
      <form id="fee-form" class="checkout-form settings-card">
        <h3>🚚 ${t("admin_fee_label")}</h3>
        <div class="fee-row">
          <input type="number" step="0.5" min="0" id="s-fee" value="${getDeliveryFee()}">
          <button type="submit" class="btn btn-primary">${t("admin_fee_save")}</button>
        </div>
        <p id="fee-msg" class="checkout-msg"></p>
      </form>
      <form id="pass-form" class="checkout-form settings-card">
        <h3>🔑 ${t("admin_pass_label")}</h3>
        <div class="fee-row">
          <input type="text" id="s-pass" value="${adminPass()}">
          <button type="submit" class="btn btn-primary">${t("admin_pass_save")}</button>
        </div>
        <p id="pass-msg" class="checkout-msg"></p>
      </form>
    </div>`;

  $("#fee-form").addEventListener("submit", e => {
    e.preventDefault();
    setDeliveryFee(parseFloat($("#s-fee").value) || 0);
    const m = $("#fee-msg");
    m.textContent = t("admin_fee_saved");
    m.className = "checkout-msg success";
  });

  $("#pass-form").addEventListener("submit", e => {
    e.preventDefault();
    localStorage.setItem("fm_admin_pass", $("#s-pass").value);
    const m = $("#pass-msg");
    m.textContent = t("admin_pass_saved");
    m.className = "checkout-msg success";
  });
}
