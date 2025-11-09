import { $, setSess, isOwner, isAdmin } from "./common.js";

window.addEventListener("DOMContentLoaded", () => {
  const btnOwner   = $("#btnLoginOwner");
  const btnAdmin   = $("#btnLoginAdmin");
  const cardOwner  = $("#ownerLoginCard");
  const cardAdmin  = $("#adminLoginCard");
  const inputOwner = $("#ownerUuid");
  const inputAdmin = $("#adminUuid");

  [btnOwner,btnAdmin].forEach(b=>b&&(b.type="button"));

  btnOwner?.addEventListener("click", () => { cardAdmin?.classList.add("hidden"); cardOwner?.classList.remove("hidden"); inputOwner?.focus(); });
  btnAdmin?.addEventListener("click", () => { cardOwner?.classList.add("hidden"); cardAdmin?.classList.remove("hidden"); inputAdmin?.focus(); });

  $("#continueOwner")?.addEventListener("click", ()=>{
    const id=(inputOwner?.value||"").trim();
    if(!isOwner(id)) return alert("UUID is not an Owner ID.");
    setSess("owner", id);
    location.href="./owner.html";
  });

  $("#continueAdmin")?.addEventListener("click", ()=>{
    const id=(inputAdmin?.value||"").trim();
    if(!(isOwner(id)||isAdmin(id))) return alert("UUID is not an Admin ID.");
    setSess("admin", id);
    location.href="./admin.html";
  });
});