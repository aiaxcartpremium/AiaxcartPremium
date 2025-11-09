// owner.js
// Ensure Supabase -> config.js -> common.js are loaded before this file.

const toast = (m) => alert(m);

// Resolve admin/owner UUID from sessionStorage
const UID_KEY = 'aiax.uid';
const ROLE_KEY = 'aiax.role';
const adminUUID = sessionStorage.getItem(UID_KEY);
const role = sessionStorage.getItem(ROLE_KEY);

if (!adminUUID || !role) {
  toast('App not loaded: missing role/uuid. Going back to login.');
  location.href = './login.html';
}

// Create client (works even if common.js already created one)
const supa =
  (window.supabaseClient) ??
  window.supabase.createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_ANON_KEY);

// ---------- UI helpers
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const showPanel = (name) => {
  $$('.panel').forEach(p => p.classList.remove('is-visible'));
  $(`#panel-${name}`).classList.add('is-visible');
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
};

function fillSelect(selectId, rows, valueKey, labelKey) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '';
  rows.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r[valueKey];
    opt.textContent = r[labelKey];
    sel.appendChild(opt);
  });
}

// ---------- Load lookups
async function loadLookups() {
  const [{ data: products, error: e1 },
         { data: types,     error: e2 },
         { data: durs,      error: e3 }] = await Promise.all([
    supa.rpc('list_products'),
    supa.rpc('list_account_types'),
    supa.rpc('list_durations')
  ]);

  if (e1 || e2 || e3) {
    console.error(e1 || e2 || e3);
    toast('Failed loading lookups. Check SQL/RPC grants.');
    return;
  }

  fillSelect('selProduct',  products, 'key',   'label');
  fillSelect('selType',     types,    'label', 'label');
  fillSelect('selDuration', durs,     'code',  'label');
}

// ---------- Tabs
function wireTabs() {
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.tab));
  });
}

// ---------- Add Stock
async function onAddStock(ev) {
  ev.preventDefault();
  const row = {
    admin_uuid: adminUUID,
    product_key: $('#selProduct').value,
    account_type: $('#selType').value,
    duration_code: $('#selDuration').value,
    qty: parseInt($('#qty').value || '1', 10),
    login_email: $('#email').value || null,
    login_password: $('#password').value || null,
    profile_name: $('#profile').value || null,
    profile_pin: $('#pin').value || null,
    premiummed_at: $('#premAt').value || null,
    auto_archive_days: $('#archDays').value ? parseInt($('#archDays').value, 10) : null,
    status: 'available'
  };

  const { error } = await supa.from('stocks').insert(row);
  if (error) {
    console.error(error);
    toast('Failed to save stock.');
    return;
  }
  toast('Stock saved ✅');
  loadStocks();
}

// ---------- Load Stocks/Records (simple)
async function loadStocks() {
  const { data, error } = await supa
    .from('stocks')
    .select('id, product_key, account_type, duration_code, status, created_at')
    .eq('admin_uuid', adminUUID)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) { console.error(error); return; }

  const host = $('#stocksTable');
  host.innerHTML = `
    <div class="row head"><div>ID</div><div>Product</div><div>Type</div><div>Duration</div><div>Status</div><div>Created</div></div>
    ${data.map(r => `
      <div class="row">
        <div>${r.id}</div>
        <div>${r.product_key}</div>
        <div>${r.account_type}</div>
        <div>${r.duration_code}</div>
        <div>${r.status}</div>
        <div>${new Date(r.created_at).toLocaleString()}</div>
      </div>
    `).join('')}
  `;
}

async function loadRecords() {
  const { data, error } = await supa
    .from('records')
    .select('id, buyer_name, product_key, account_type, duration_code, price, created_at')
    .eq('admin_uuid', adminUUID)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) { console.error(error); return; }

  const host = $('#recordsTable');
  host.innerHTML = `
    <div class="row head"><div>ID</div><div>Buyer</div><div>Product</div><div>Type</div><div>Duration</div><div>Price</div><div>Created</div></div>
    ${data.map(r => `
      <div class="row">
        <div>${r.id}</div>
        <div>${r.buyer_name ?? ''}</div>
        <div>${r.product_key}</div>
        <div>${r.account_type}</div>
        <div>${r.duration_code}</div>
        <div>${r.price ?? ''}</div>
        <div>${new Date(r.created_at).toLocaleString()}</div>
      </div>
    `).join('')}
  `;
}

// ---------- Boot
function boot() {
  wireTabs();
  $('#frm-add').addEventListener('submit', onAddStock);
  loadLookups();
  loadStocks();
  loadRecords();
}
boot();
