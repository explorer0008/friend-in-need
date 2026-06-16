const DB_NAME="friendInNeedDB", DB_VERSION=1;
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);
req.onupgradeneeded=e=>{const db=e.target.result;if(!db.objectStoreNames.contains("users")){const s=db.createObjectStore("users",{keyPath:"id",autoIncrement:true});s.createIndex("email","email",{unique:true});s.createIndex("phone","phone",{unique:true});}
if(!db.objectStoreNames.contains("requests"))db.createObjectStore("requests",{keyPath:"id",autoIncrement:true});};
req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function tx(store,mode,work){const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction(store,mode),s=t.objectStore(store),r=work(s);t.oncomplete=()=>resolve(r?.result);t.onerror=()=>reject(t.error);});}
function setMsg(text,ok=false){const el=document.getElementById("message");if(el){el.textContent=text;el.className=ok?"message success":"message";}}
function currentUser(){return JSON.parse(localStorage.getItem("currentUser")||"null")}
function requireLogin(){if(!currentUser()&&!location.pathname.endsWith("index.html")&&!location.pathname.endsWith("login.html"))location.href="login.html"}
document.addEventListener("DOMContentLoaded",()=>{requireLogin();wireSignup();wireLogin();wireLogout();wireHelpForm();renderRequests();prefillUser();});

function wireSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirmPassword");

    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (password !== confirm) {
      return setMsg("Passwords do not match.");
    }

    const user = {
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      password,
      createdAt: new Date().toISOString()
    };

    try {
      const id = await tx("users", "readwrite", s => s.add(user));
      localStorage.setItem("currentUser", JSON.stringify({ ...user, id }));
      location.href = "home.html";
    } catch (error) {
      console.error(error);
      setMsg("Email or phone already exists. Try logging in.");
    }
  });
}

function wireLogin(){const form=document.getElementById("loginForm");if(!form)return;form.addEventListener("submit",async e=>{e.preventDefault();
const idf=identifier.value.trim().toLowerCase(), pwd=loginPassword.value;const db=await openDB();
const found=await new Promise(resolve=>{const t=db.transaction("users"),s=t.objectStore("users"),users=[];s.openCursor().onsuccess=e=>{const c=e.target.result;if(c){users.push(c.value);c.continue();}else resolve(users.find(u=>(u.email===idf||u.phone===idf)&&u.password===pwd));};});
if(!found)return setMsg("Invalid credentials.");localStorage.setItem("currentUser",JSON.stringify(found));location.href="home.html";});}

function wireLogout(){const btn=document.getElementById("logoutBtn");if(btn)btn.onclick=()=>{localStorage.removeItem("currentUser");location.href="login.html";};}

function prefillUser(){const u=currentUser();if(!u)return;if(document.getElementById("requestName"))requestName.value=u.name||"";if(document.getElementById("requestPhone"))requestPhone.value=u.phone||"";}

function wireHelpForm(){const form=document.getElementById("helpForm");const gps=document.getElementById("gpsBtn");
if(gps)gps.onclick=()=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>requestLocation.value=`Lat ${p.coords.latitude.toFixed(4)}, Lon ${p.coords.longitude.toFixed(4)}`,()=>setMsg("Could not get GPS location.")):setMsg("GPS is not supported.");
if(!form)return;form.addEventListener("submit",async e=>{e.preventDefault();const u=currentUser();if(!u)return location.href="login.html";
const request={name:requestName.value.trim(),phone:requestPhone.value.trim(),location:requestLocation.value.trim(),emergency:emergency.value,details:details.value.trim(),status:"Open",userId:u.id,createdAt:new Date().toISOString()};
await tx("requests","readwrite",s=>s.add(request));setMsg("Help request submitted successfully.",true);form.reset();prefillUser();});}

async function getAllRequests(){const db=await openDB();return new Promise(resolve=>{const out=[],r=db.transaction("requests").objectStore("requests").openCursor(null,"prev");r.onsuccess=e=>{const c=e.target.result;if(c){out.push(c.value);c.continue();}else resolve(out);};});}

async function renderRequests(){const list=document.getElementById("requestList");if(!list)return;const requests=await getAllRequests();
list.innerHTML=requests.length?"":"<p>No help requests yet.</p>";
requests.forEach(r=>{const card=document.createElement("article");card.className="request-card";card.innerHTML=`<h3>${escapeHtml(r.emergency)}</h3><p>${escapeHtml(r.details||"No extra details added.")}</p><p><b>${escapeHtml(r.name)}</b> · <a href="tel:${escapeHtml(r.phone)}">${escapeHtml(r.phone)}</a></p><p>${escapeHtml(r.location)}</p><p class="meta">${new Date(r.createdAt).toLocaleString()} · ${r.status}</p>`;list.appendChild(card);});}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
