import { $, $$, toast, setLoading, fmtDT, durMs, addDays, getUid, clearSess } from "./common.js";
import { getClient } from "./common.js";
import { loadProducts, loadAccountTypes, loadDurations } from "./catalog.js";

const supabase = getClient();

function guard(){
  if(!getUid()){ location.replace("./login.html"); return false; }
  return true;
}

function fillSelect(sel, items){
  const el=$(sel); if(!el) return;
  el.innerHTML="";
  (items||[]).forEach(it=>{
    let label,value;
    if(Array.isArray(it)) [label,value]=it;
    else if(typeof it==="string"){ label=value=it; }
    else if(it && it.label!=null && it.key!=null){ label=it.label; value=it.key; }
    else return;
    const o=document.createElement("option"); o.value=value; o.textContent=label; el.appendChild(o);
  });
}

async function prime(){
  const [prods, types, durs] = await Promise.all([loadProducts(), loadAccountTypes(), loadDurations()]);
  fillSelect("#productSelectOwner", prods.map(r=>[r.label, r.key]));
  fillSelect("#typeSelectOwner", types);
  fillSelect("#durSelectOwner", durs);
}

// ==== OWNER stock CRUD ====
async function ownerAddStock(){
  const owner_id = getUid();
  const product       = $('#productSelectOwner')?.value||'';
  const account_type  = $('#typeSelectOwner')?.value||'';
  const duration_code = $('#durSelectOwner')?.value||'';
  const quantity      = parseInt($('#oaQty')?.value||'1',10);

  const email        = ($('#oaEmail')?.value||'').trim();
  const password     = ($('#oaPass')?.value||'').trim();
  const profile_name = ($('#oaProfile')?.value||'').trim();
  const pin          = ($('#oaPin')?.value||'').trim();
  const notes        = ($('#oaNotes')?.value||'').trim();
  const premiumed_at_raw = ($('#oaPremiumedAt')?.value||'').trim();
  const auto_expire_raw  = ($('#oaAutoExpireDays')?.value||'').trim();

  if (!product)       return alert('Select a product');
  if (!account_type)  return alert('Select account type');
  if (!duration_code) return alert('Select duration');
  if (!quantity || quantity < 1) return alert('Quantity must be at least 1');

  const payload = { owner_id, product, account_type, duration_code, quantity };
  if (email)        payload.email = email;
  if (password)     payload.password = password;
  if (profile_name) payload.profile_name = profile_name;
  if (pin)          payload.pin = pin;
  if (notes)        payload.notes = notes;
  if (premiumed_at_raw) {
    const d = new Date(premiumed_at_raw);
    if (!isNaN(d)) payload.premiumed_at = d.toISOString();
  }
  if (auto_expire_raw && !isNaN(parseInt(auto_expire_raw,10))) {
    payload.auto_expire_days = parseInt(auto_expire_raw,10);
  }

  setLoading(true);
  const { error } = await supabase.from('stocks').insert([payload]);
  setLoading(false);
  if (error) { console.error(error); alert('Add stock failed: ' + (error.message||'unknown')); return; }
  toast('Stock added');
  $('#oaQty').value = '1';
  ['oaEmail','oaPass','oaProfile','oaPin','oaNotes','oaPremiumedAt','oaAutoExpireDays'].forEach(id => { const el = $('#'+id); if (el) el.value = ''; });
  ownerRenderStocks();
}

function ownerStocksSelect(showArchived){
  return supabase.from("stocks")
    .select("id,product,account_type,duration_code,quantity,premiumed_at,created_at,auto_expire_days,archived,owner_id")
    .eq("owner_id", getUid())
    .eq("archived", !!showArchived);
}

async function ownerRenderStocks(){
  const tbody = $("#ownerStocksTable tbody"); if(!tbody) return;
  const showArchived = $("#chkShowArchived")?.checked || false;
  tbody.innerHTML = `<tr><td colspan="10">Loading…</td></tr>`;
  const { data, error } = await ownerStocksSelect(showArchived).order("created_at",{ascending:false});
  if(error){ console.error(error); tbody.innerHTML = `<tr><td colspan="10">Failed to load.</td></tr>`; return; }
  if(!data?.length){ tbody.innerHTML = `<tr><td colspan="10" class="muted">No stocks${showArchived?" (archived)":""}.</td></tr>`; return; }

  tbody.innerHTML = data.map(r=>`
    <tr data-id="${r.id}">
      <td>${r.id}</td><td>${r.product}</td><td>${r.account_type}</td><td>${r.duration_code}</td>
      <td>${r.quantity}</td><td>${fmtDT(r.premiumed_at)}</td><td>${fmtDT(r.created_at)}</td>
      <td>${r.auto_expire_days ?? ""}</td><td>${r.archived ? "yes" : ""}</td>
      <td>
        <button class="btn-outline btnEdit">Edit</button>
        <button class="btn-outline btnRemove">Remove</button>
        ${r.archived ? `<button class="btn-outline btnUnarchive">Unarchive</button>` : `<button class="btn-outline btnArchive">Archive</button>`}
      </td>
    </tr>`).join("");

  $$(".btnRemove", tbody).forEach(b=>b.addEventListener("click", async ()=>{
    const id = b.closest("tr").dataset.id;
    if(!confirm(`Delete stock #${id}?`)) return;
    setLoading(true);
    const { error } = await supabase.from("stocks").delete().eq("id", id);
    setLoading(false);
    if(error){ alert("Remove failed"); console.error(error); return; }
    ownerRenderStocks();
  }));

  $$(".btnEdit", tbody).forEach(b=>b.addEventListener("click", async ()=>{
    const tr = b.closest("tr"); const id = tr.dataset.id;
    const cur = {
      quantity: parseInt(tr.children[4].textContent||"0",10),
      premiumed_at: tr.children[5].textContent,
      auto_expire_days: tr.children[7].textContent
    };
    const quantity = parseInt(prompt("Quantity:", cur.quantity) ?? cur.quantity, 10);
    const premiumed_at_str = prompt("Premiumed at (yyyy-mm-dd hh:mm, blank to clear):", cur.premiumed_at||"") || "";
    const auto_days_str = prompt("Auto-archive if unsold (days, blank to clear):", cur.auto_expire_days||"") || "";
    const premiumed_at = premiumed_at_str ? new Date(premiumed_at_str).toISOString() : null;
    const auto_expire_days = auto_days_str ? parseInt(auto_days_str,10) : null;

    setLoading(true);
    const { error } = await supabase.from("stocks")
      .update({ quantity, premiumed_at, auto_expire_days }).eq("id", id);
    setLoading(false);
    if(error){ alert("Edit failed"); console.error(error); return; }
    ownerRenderStocks();
  }));

  $$(".btnArchive", tbody).forEach(b=>b.addEventListener("click", async ()=>{
    const id = b.closest("tr").dataset.id;
    const { error } = await supabase.from("stocks").update({ archived:true }).eq("id", id);
    if(error){ alert("Archive failed"); console.error(error); return; }
    ownerRenderStocks();
  }));
  $$(".btnUnarchive", tbody).forEach(b=>b.addEventListener("click", async ()=>{
    const id = b.closest("tr").dataset.id;
    const { error } = await supabase.from("stocks").update({ archived:false }).eq("id", id);
    if(error){ alert("Unarchive failed"); console.error(error); return; }
    ownerRenderStocks();
  }));
}

async function ownerPurgeExpired(){
  const { data, error } = await supabase
    .from("stocks")
    .select("id,created_at,auto_expire_days,quantity,archived,owner_id")
    .eq("owner_id", getUid())
    .eq("archived", false)
    .gt("auto_expire_days", 0);
  if(error){ console.error(error); return; }
  const now = Date.now();
  const toArchive = (data||[]).filter(r => r.quantity>0 && r.auto_expire_days && (now - new Date(r.created_at).getTime()) > r.auto_expire_days*86400000).map(r=>r.id);
  if(!toArchive.length){ toast("Nothing to archive"); return; }
  const { error:err2 } = await supabase.from("stocks").update({ archived:true }).in("id", toArchive);
  if(err2){ console.error(err2); alert("Auto-archive failed"); return; }
  toast(`Archived ${toArchive.length}`);
  ownerRenderStocks();
}

// records
async function ownerAddRecord(){
  const product = $("#recProduct")?.value.trim();
  const account_type = $("#recType")?.value.trim();
  const expires_in_ui = $("#recExpires")?.value.trim();
  const buyer_link = $("#recBuyer")?.value.trim() || null;
  const priceStr   = $("#recPrice")?.value.trim() || "";
  const withWarranty = $("#recWarranty")?.checked || false;
  const extraDays = parseInt($("#recExtraDays")?.value || "0", 10) || 0;

  if(!product || !account_type){ return alert("Product and Account type are required."); }

  setLoading(true);
  const { data:rows, error:errFind } = await supabase
    .from("stocks").select("*")
    .eq("owner_id", getUid()).eq("product", product).eq("account_type", account_type)
    .eq("archived", false).gt("quantity", 0).order("created_at",{ascending:true}).limit(1);
  if(errFind){ setLoading(false); return alert("Lookup failed"); }

  let duration_code = null, decOk = false, expiresBase;
  if(rows?.length){
    const s = rows[0]; duration_code = s.duration_code;
    const { error:decErr } = await supabase
      .from("stocks").update({ quantity: (s.quantity||1)-1 }).eq("id", s.id).gt("quantity",0);
    decOk = !decErr;
  }

  const now = new Date();
  if(expires_in_ui){ expiresBase = new Date(expires_in_ui); }
  else if(duration_code){ expiresBase = new Date(now.getTime() + durMs(duration_code)); }
  else{ expiresBase = now; }
  if(withWarranty && extraDays>0) expiresBase = addDays(expiresBase, extraDays);

  const price = priceStr === "" ? null : Number(priceStr);

  const { error:insErr } = await supabase.from("sales").insert([{
    product, account_type, created_at: now.toISOString(), expires_at: expiresBase.toISOString(),
    admin_uuid: getUid(), owner_uuid: getUid(), buyer_link, price, warranty_days: withWarranty?extraDays:0
  }]);
  setLoading(false);

  if(insErr){ console.error(insErr); return alert("Insert failed"); }
  toast(decOk ? "Record added (stock decremented)" : "Record added (no matching stock to decrement)");
  ["recBuyer","recPrice","recExtraDays"].forEach(id=>{ const el=$("#"+id); if(el) el.value=""; });
  $("#recWarranty")?.checked=false;
  ownerRenderRecords();
}

async function ownerRenderRecords(){
  const tbody = $("#ownerRecordsTable tbody"); if(!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9">Loading…</td></tr>`;
  let rows = [];
  try{
    const {data,error}=await supabase
      .from("sales")
      .select("id,product,account_type,created_at,expires_at,price,buyer_link,admin_uuid,owner_uuid,warranty_days")
      .eq("owner_uuid",getUid()).order("id",{ascending:false}).limit(500);
    if(error) throw error; rows = data||[];
  }catch(e){ console.error(e); tbody.innerHTML = `<tr><td colspan="9">Failed to load.</td></tr>`; return; }

  if(!rows.length){ tbody.innerHTML = `<tr><td colspan="9" class="muted">No records yet.</td></tr>`; return; }

  tbody.innerHTML = rows.map(r=>`
    <tr data-id="${r.id}">
      <td>${r.id}</td><td>${r.product ?? ""}</td><td>${r.account_type ?? ""}</td>
      <td>${fmtDT(r.created_at)}</td><td>${fmtDT(r.expires_at)}</td>
      <td>${r.admin_uuid ? r.admin_uuid.slice(0,8) : ""}</td>
      <td>${r.buyer_link || ""}</td><td>${r.price ?? ""}</td>
      <td><button class="btn-outline btnRecEdit">Edit</button>
          <button class="btn-outline btnRecDel">Delete</button></td>
    </tr>`).join("");

  $$(".btnRecEdit", tbody).forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const tr = btn.closest("tr"); const id = tr.dataset.id;
      const cur = {
        product      : tr.children[1].textContent.trim(),
        type         : tr.children[2].textContent.trim(),
        expires_at   : tr.children[4].textContent.trim(),
        buyer_link   : tr.children[6].textContent.trim(),
        price        : tr.children[7].textContent.trim()
      };
      const product = prompt("Product:", cur.product) ?? cur.product;
      const type    = prompt("Account type:", cur.type) ?? cur.type;
      const buyer   = prompt("Buyer link (blank to clear):", cur.buyer_link) || null;
      const priceIn = prompt("Price (blank to clear):", cur.price) || "";
      const price   = priceIn ? Number(priceIn) : null;

      const addDaysStr = prompt("Add warranty days (0 to keep):", "0") || "0";
      const extraDays  = parseInt(addDaysStr,10) || 0;
      let expires = cur.expires_at ? new Date(cur.expires_at) : new Date();
      if(extraDays>0) expires = addDays(expires, extraDays);

      setLoading(true);
      const { error } = await supabase.from("sales")
        .update({ product, account_type: type, buyer_link: buyer, price, expires_at: expires.toISOString() })
        .eq("id", id).eq("owner_uuid", getUid());
      setLoading(false);
      if(error){ console.error(error); return alert("Update failed"); }
      toast("Record updated");
      ownerRenderRecords();
    });
  });

  $$(".btnRecDel", tbody).forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const tr = btn.closest("tr"); const id = tr.dataset.id;
      if(!confirm(`Delete record #${id}?`)) return;
      setLoading(true);
      const { error } = await supabase.from("sales").delete().eq("id", id).eq("owner_uuid", getUid());
      setLoading(false);
      if(error){ console.error(error); return alert("Delete failed"); }
      ownerRenderRecords();
    });
  });

  $("#btnExportCSV")?.addEventListener("click", ()=>{
    if(!rows.length) return;
    const head = Object.keys(rows[0]);
    const esc = v => v==null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    const csv = [head.join(","), ...rows.map(r=>head.map(k=>esc(r[k])).join(","))].join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "owner_records.csv"; a.click();
    URL.revokeObjectURL(url);
  }, { once:true });
}

function wireTabs(){
  const tabs=$$(".tab");
  tabs.forEach(t=>t.addEventListener("click",()=>{
    tabs.forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    const target=t.dataset.target;
    $$(".tab-page").forEach(p=>p.classList.add("hidden"));
    $("#"+target)?.classList.remove("hidden");
  }));
}

// boot
window.addEventListener("DOMContentLoaded", async ()=>{
  if(!guard()) return;
  $("#btnLogout")?.addEventListener("click", ()=>{ clearSess(); location.replace("./login.html"); });

  $("#btnOwnerRefresh")?.addEventListener("click", ownerRenderStocks);
  $("#btnOwnerPurge")?.addEventListener("click", ownerPurgeExpired);
  $("#chkShowArchived")?.addEventListener("change", ownerRenderStocks);
  $("#oaAddBtn")?.addEventListener("click", ownerAddStock);
  $("#btnAddRecord")?.addEventListener("click", ownerAddRecord);

  wireTabs();
  await prime();
  ownerRenderStocks();
  ownerRenderRecords();
});