import { uniq } from "./common.js";
import { getClient } from "./common.js";

const APP = () => window.APP || {};
const supabase = () => getClient();

export async function loadProducts(){
  try {
    const { data, error } = await supabase()
      .from("products").select("key,label,category").order("label");
    if(error) throw error;
    if(data?.length) return data;
  } catch {}
  return (APP().PRODUCTS||[]).map(x => typeof x==="string"
    ? { key:x.toLowerCase(), label:x, category:"Entertainment" } : x);
}
export async function loadAccountTypes(){
  try{
    const { data, error } = await supabase().from("account_types").select("label").order("label");
    if(error) throw error;
    if(data?.length) return data.map(r=>r.label);
  }catch{}
  return APP().ACCOUNT_TYPES || [];
}
export async function loadDurations(){
  try{
    const { data, error } = await supabase().from("durations").select("label,code,seq").order("seq",{ascending:true});
    if(error) throw error;
    if(data?.length) return data.map(r=>[r.label,r.code]);
  }catch{}
  return APP().DURATIONS || [];
}

// admin available
export async function adminAvailable(){
  const c = supabase();
  try{
    const {data,error} = await c.from("stocks_available_for_admin")
      .select("product,account_type,duration_code,total_qty").order("product");
    if(error) throw error;
    if(data?.length) return data;
  }catch{}
  const {data,error} = await c.from("stocks")
    .select("product,account_type,duration_code,quantity,archived")
    .gt("quantity",0).eq("archived",false);
  if(error) return [];
  const map=new Map();
  for(const r of data){
    const k=`${r.product}|${r.account_type}|${r.duration_code}`;
    map.set(k,(map.get(k)||0)+(r.quantity||0));
  }
  return [...map.entries()].map(([k,qty])=>{
    const [product,account_type,duration_code]=k.split("|");
    return {product,account_type,duration_code,total_qty:qty};
  });
}