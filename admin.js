import { $, $$, uniq, toast, setLoading, fmtDT, getUid, clearSess } from "./common.js";
import { getClient } from "./common.js";
import { loadProducts, adminAvailable } from "./catalog.js";

const supabase = getClient();
let ALL_PRODUCTS = [];
let CUR_CAT = null;

function guard(){
  if(!getUid()){ location.replace("./login.html"); return false; }
  return true;
}

function buildCatBar(){
  const bar = $("#catBar"); if(!bar || !ALL_PRODUCTS.length) return;
  const cats = uniq(ALL_PRODUCTS.map(p => p.category || "Uncategorized"));
  bar.innerHTML = ["All", ...cats].map(c => `<button class="chip" data-cat="${c}">${c}</button>`).join("");
  bar.addEventListener("click", e=>{
    const b = e.target.closest(".chip"); if(!b) return;
    CUR_CAT = b.dataset.cat === "All" ? null : b.dataset.cat;
    $$("#catBar .chip").forEach(x=>x.classList.toggle("active", x===b));
    adminRefreshAll();
  });
  $$("#catBar .chip")[0]?.classList.add("active");
}
function filterAvailByCat(rows){
  if(!CUR_CAT) return rows;
  const keys = new Set(ALL_PRODUCTS.filter(p=> (p.category||"Uncategorized")===CUR_CAT).map(p=>p.key));
  return rows.filter(r => keys.has(r.product));
}

async function adminRenderAvailable(){
  const body=$("#adminStocksBody"); if(!body) return;
  body.innerHTML = `<tr><td colspan="4">Fetching…</td></tr>`;
  const rows = filterAvailByCat(await adminAvailable());
  body.innerHTML = rows.length
    ? rows.map(r=>`<tr><td>${r.product}</td><td>${r.account_type}</td><td>${r.duration_code}</td><td>${r.total_qty}</td></tr>`).join("")
    : `<tr><td colspan="4" class="muted">No data yet</td></tr>`;
}

async function adminFillFormOptions(){
  const catSel  = $("#catSelectAdmin");
  const prodSel = $("#productSelectAdmin");
  const typeSel = $("#typeSelectAdmin");
  const durSel  = $("#durSelectAdmin");

  const avail = filterAvailByCat(await adminAvailable());

  const formCat = (catSel?.value && catSel.value !== "All") ? catSel.value : null;
  const allowedKeys = new Set(
    (formCat ? ALL_PRODUCTS.filter(p=>(p.category||"Uncategorized")===formCat) : ALL_PRODUCTS).map(p=>p.key)
  );
  const products = uniq(avail.map(r=>r.product).filter(k=>allowedKeys.has(k)));

  prodSel.innerHTML="";
  products.forEach(p=>{ const o=document.createElement("option"); o.value=p; o.textContent=ALL_PRODUCTS.find(x=>x.key===p)?.label || p; prodSel.appendChild(o); });

  function refresh(){
    const p=prodSel.value; const sub=avail.filter(r=>r.product===p);
    typeSel.innerHTML=""; durSel.innerHTML="";
    uniq(sub.map(r=>r.account_type)).forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;typeSel.appendChild(o);});
    uniq(sub.map(r=>r.duration_code)).forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;durSel.appendChild(o);});
  }
  if(products.length){ prodSel.value=products[0]; refresh(); }
  prodSel.addEventListener("change", refresh, { once:true });

  // cats for form
  const cats = uniq(ALL_PRODUCTS.map(r=>r.category || "Uncategorized"));
  catSel.innerHTML = ["All", ...cats].map(c=>`<option value="${c}">${c}</option>`).join("");
  catSel.addEventListener("change", adminFillFormOptions, { once:true });
}

async function adminGetAccount(){
  const product=$("#productSelectAdmin")?.value,
        type=$("#typeSelectAdmin")?.value,
        duration=$("#durSelectAdmin")?.value;
  if(!product||!type||!duration) return alert("Complete the selections first.");
  const admin_uuid=getUid(); if(!admin_uuid) return alert("Session missing. Please re-login.");

  setLoading(true);
  const res = await supabase.rpc("get_account_v2", {
    p_admin: admin_uuid, p_product: product, p_type: type, p_duration: duration
  });
  setLoading(false);

  if(res.error) return alert("get_account failed: " + res.error.message);
  const data = res.data || [];
  if(!data.length){ $("#adminCreds").textContent = "No matching stock."; return; }

  const r = data[0];
  $("#adminCreds").innerHTML = `
    <div class="card">
      <div><b>Product:</b> ${product} • <b>Type:</b> ${type} • <b>Duration:</b> ${duration}</div>
      <div><b>Email:</b> ${r.email || "-"}</div>
      <div><b>Password:</b> ${r.password || "-"}</div>
      <div><b>Profile:</b> ${r.profile_name || "-"} &nbsp; <b>PIN:</b> ${r.pin || "-"}</div>
      <div><b>Expires:</b> ${r.expires_at ? new Date(r.expires_at).toLocaleString() : "-"}</div>
    </div>`;
  await adminRefreshAll();
}

async function adminRenderMySales(){
  const tbody=$("#adminRecordsTable tbody"); if(!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
  try{
    const {data,error}=await supabase.rpc("list_my_sales",{ p_admin:getUid() });
    if(error) throw error;
    const rows=data||[];
    if(!rows.length){ tbody.innerHTML = `<tr><td colspan="6" class="muted">No records yet.</td></tr>`; return; }
    tbody.innerHTML = rows.map(r=>`
      <tr data-id="${r.id}">
        <td>${r.id}</td><td>${r.product ?? ""}</td><td>${r.account_type ?? ""}</td>
        <td>${fmtDT(r.created_at)}</td><td>${fmtDT(r.expires_at)}</td>
      </tr>`).join("");
  }catch(e){
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="6">Failed to load.</td></tr>`;
  }
}

export async function adminRefreshAll(){
  await adminRenderAvailable();
  await adminFillFormOptions();
  await adminRenderMySales();
}

// boot
window.addEventListener("DOMContentLoaded", async ()=>{
  if(!guard()) return;
  $("#btnLogout")?.addEventListener("click", ()=>{ clearSess(); location.replace("./login.html"); });

  ALL_PRODUCTS = await loadProducts();
  buildCatBar();

  $("#getAccountBtn")?.addEventListener("click", adminGetAccount);
  await adminRefreshAll();
});