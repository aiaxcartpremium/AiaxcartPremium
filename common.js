// tiny DOM helpers
export const $  = (s, el=document) => el.querySelector(s);
export const $$ = (s, el=document) => [...el.querySelectorAll(s)];
export const uniq = a => [...new Set(a)];

// ui helpers
export const toast = (msg) => { const t=$(".toast"); if(!t) return; t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1500); };
export const setLoading = (on) => { const L=$(".loading-overlay"); if(!L) return; L.classList.toggle("hidden", !on); L.style.pointerEvents="none"; };
export const fmtDT = (d) => d ? new Date(d).toLocaleString() : "";
export const addDays = (date, days) => new Date(date.getTime() + (days||0)*86400000);
export const norm = (s) => (s||"").replace(/\s+/g,"").toLowerCase();

// durations
export const durMs = (code) => {
  if (!code) return 0;
  if (/^\d+d$/.test(code)) return parseInt(code,10)*86400000;
  if (/^\d+m$/.test(code)) { const m=parseInt(code,10); return (m===12?365:30*m)*86400000; }
  return 0;
};

// session
const SKEY_ROLE = "aiax.role";
const SKEY_UID  = "aiax.uid";
export const setSess   = (role, uid) => { sessionStorage.setItem(SKEY_ROLE, role); sessionStorage.setItem(SKEY_UID, uid); };
export const getRole   = () => sessionStorage.getItem(SKEY_ROLE);
export const getUid    = () => sessionStorage.getItem(SKEY_UID);
export const clearSess = () => { sessionStorage.removeItem(SKEY_ROLE); sessionStorage.removeItem(SKEY_UID); };

// supabase client
export function getClient(){
  const APP = window.APP || {};
  if (!APP.url || !APP.key) { console.warn("Missing APP.url / APP.key"); return null; }
  return window.supabase.createClient(APP.url, APP.key);
}

// role helpers
export const isOwner = (uid) => {
  const APP = window.APP || {};
  return APP.ownerId ? norm(uid) === norm(APP.ownerId) : false;
};
export const isAdmin = (uid) => {
  const APP = window.APP || {};
  return Array.isArray(APP.admins) ? APP.admins.map(norm).includes(norm(uid)) : false;
};