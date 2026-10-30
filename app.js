/* 魔法藥草筆記 · 前端邏輯（無框架，GitHub Pages 直接可用）
   內建資料：herbs.js 的 HERBS（書籍內容，唯讀）
   使用者編纂資料：localStorage "gh_user_herbs_v1"（可增刪改、含圖片）
*/

const PLANET_SYMBOLS = { "太陽":"☉", "月亮":"☽", "水星":"☿", "金星":"♀", "火星":"♂", "木星":"♃", "土星":"♄" };
const ELEMENT_SYMBOLS = { "火":"🜂", "水":"🜄", "風":"🜁", "土":"🜃" };
const LS_KEY = "gh_user_herbs_v1";
const sym = (map,key) => map[key] || "✶";

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

/* ---------- 資料存取 ---------- */
function loadUser(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)) || []; }catch(e){ return []; } }
function saveUser(list){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(list));
    return true;
  }catch(e){
    alert("儲存失敗：瀏覽器儲存空間不足。\n請刪除一些條目或改用較小的圖片，並記得先「導出備份」。");
    return false;
  }
}
function allHerbs(){ return HERBS.concat(loadUser()); }
function getHerb(id){ return allHerbs().find(h=>h.id===id); }
function isUserHerb(id){ return loadUser().some(h=>h.id===id); }
function uniqueValues(key){
  const set = new Set();
  allHerbs().forEach(h => (Array.isArray(h[key]) ? h[key] : [h[key]]).forEach(v => set.add(v)));
  return [...set].sort((a,b)=>a.localeCompare(b,"zh-Hant"));
}

/* ---------- 圖片壓縮 ---------- */
function compressImage(file, cb){
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const max = 900;
      let w = img.width, h = img.height;
      if (w > max || h > max){ const s = max/Math.max(w,h); w = Math.round(w*s); h = Math.round(h*s); }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(c.toDataURL("image/jpeg", 0.82));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ---------- 備份 ---------- */
function exportBackup(){
  const data = loadUser();
  if (!data.length){ alert("目前沒有自行編纂的條目可備份。"); return; }
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "herbarium-backup-" + new Date().toISOString().slice(0,10) + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
}
function importBackup(file){
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw 0;
      if (!confirm(`備份內含 ${data.length} 筆條目，匯入將【取代】目前本機全部自訂條目，確定？`)) return;
      if (saveUser(data)) location.reload();
    }catch(err){ alert("匯入失敗：檔案格式不正確。"); }
  };
  reader.readAsText(file);
}

/* ================= 目錄頁 ================= */
function initIndex(){
  const state = { planet:new Set(), element:new Set(), magicProperties:new Set(), q:"" };
  const grid = document.getElementById("herb-grid");

  function buildChips(key, mountId, symbolMap){
    const mount = document.getElementById(mountId);
    mount.innerHTML = "";
    uniqueValues(key).forEach(v=>{
      const b = document.createElement("button");
      b.className = "chip";
      b.innerHTML = symbolMap ? `<span class="sym">${sym(symbolMap,v)}</span>${esc(v)}` : esc(v);
      b.onclick = ()=>{
        state[key].has(v) ? state[key].delete(v) : state[key].add(v);
        b.classList.toggle("active");
        renderGrid();
      };
      mount.appendChild(b);
    });
  }
  buildChips("planet","chips-planet",PLANET_SYMBOLS);
  buildChips("element","chips-element",ELEMENT_SYMBOLS);
  buildChips("magicProperties","chips-magicProperties",null);

  document.getElementById("search").addEventListener("input", e=>{
    state.q = e.target.value.trim().toLowerCase(); renderGrid();
  });
  document.getElementById("clear-filters").addEventListener("click", ()=>{
    state.planet.clear(); state.element.clear(); state.magicProperties.clear(); state.q = "";
    document.getElementById("search").value = "";
    document.querySelectorAll(".chip.active").forEach(c=>c.classList.remove("active"));
    renderGrid();
  });
  document.getElementById("btn-export").addEventListener("click", exportBackup);
  document.getElementById("import-file").addEventListener("change", e=>{
    if (e.target.files[0]) importBackup(e.target.files[0]);
    e.target.value = "";
  });

  function match(h){
    if (state.planet.size && !state.planet.has(h.planet)) return false;
    if (state.element.size && !state.element.has(h.element)) return false;
    if (state.magicProperties.size && !h.magicProperties.some(p=>state.magicProperties.has(p))) return false;
    if (state.q){
      const hay = [h.name,h.english,h.latin,h.planet,h.element,(h.deities||[]).join(" "),h.magicProperties.join(" ")].join(" ").toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }

  function cardHtml(h){
    const edit = isUserHerb(h.id)
      ? `<a class="mini-link" href="edit.html?id=${encodeURIComponent(h.id)}" data-stop>✎ 編輯</a>` : "";
    return `
    <div class="herb-card" data-id="${esc(h.id)}">
      <div class="paper">
        <div class="card-head">
          <div class="card-sigil">${sym(ELEMENT_SYMBOLS,h.element)}</div>
          <div>
            <div class="card-name">${esc(h.name)}</div>
            <div class="card-latin">${esc(h.latin||"")}</div>
          </div>
        </div>
        <div class="card-meta">
          <span><b>${sym(PLANET_SYMBOLS,h.planet)}</b> ${esc(h.planet)}</span>
          <span><b>${sym(ELEMENT_SYMBOLS,h.element)}</b> ${esc(h.element)}元素</span>
          ${edit}
        </div>
        <div class="card-props">
          ${h.magicProperties.slice(0,6).map(p=>`<span class="tag">${esc(p)}</span>`).join("")}
          ${h.magicProperties.length>6?`<span class="tag">+${h.magicProperties.length-6}</span>`:""}
        </div>
      </div>
    </div>`;
  }

  function renderGrid(){
    const list = allHerbs().filter(match);
    document.getElementById("result-count").textContent = `共 ${list.length} 筆條目`;
    grid.innerHTML = list.map(cardHtml).join("");
    grid.querySelectorAll(".herb-card").forEach(el=>{
      el.addEventListener("click", e=>{
        if (e.target.closest("[data-stop]")) return; // 編輯連結不跳轉
        location.href = "herb.html?id=" + encodeURIComponent(el.dataset.id);
      });
    });
  }
  renderGrid();
}

/* ================= 詳情頁 ================= */
function initHerb(){
  const id = new URLSearchParams(location.search).get("id");
  const h = getHerb(id) || HERBS[0];
  document.title = `${h.name} ${h.english||""} · 魔法藥草筆記`;
  const a = document.getElementById("herb-article");

  if (isUserHerb(h.id)){
    document.getElementById("herb-actions").innerHTML = `
      <a class="mini-link" href="edit.html?id=${encodeURIComponent(h.id)}">✎ 編輯此條目</a>
      <button type="button" class="mini-link danger" id="btn-delete">✕ 刪除</button>`;
    document.getElementById("btn-delete").addEventListener("click", ()=>{
      if (!confirm(`確定刪除「${h.name}」？此操作無法復原，建議先導出備份。`)) return;
      saveUser(loadUser().filter(x=>x.id!==h.id));
      location.href = "index.html";
    });
  }

  const photo = h.image ? `<img class="herb-photo" src="${h.image}" alt="${esc(h.name)}">` : "";

  const sectionsHtml = (h.sections||[]).map(s=>`
    <h2 class="section-title">${esc(s.title)}</h2>
    <div class="herb-section">${(s.paragraphs||[]).map(p=>`<p>${esc(p)}</p>`).join("")}</div>
  `).join("");

  const recipesHtml = (h.recipes&&h.recipes.length) ? `
    <h2 class="section-title">配方 RECIPES</h2>
    ${h.recipes.map(r=>`
      <div class="recipe">
        <div><span class="recipe-name">${esc(r.name)}</span><span class="recipe-en">${esc(r.english||"")}</span></div>
        <ul class="recipe-ing">
          ${(r.ingredients||[]).map(i=>`
            <li><span class="ing-amt">${esc(i.amount)}</span><span class="ing-dots"></span><span>${esc(i.item)}</span></li>`).join("")}
        </ul>
        <p class="recipe-steps">${esc(r.steps||"")}</p>
        ${r.note?`<div class="note-box">${esc(r.note)}</div>`:""}
      </div>`).join("")}
  ` : "";

  a.innerHTML = `
    <div class="herb-title-row">
      <div class="herb-sigil">${sym(ELEMENT_SYMBOLS,h.element)}</div>
      <div>
        <div><span class="herb-name">${esc(h.name)}</span><span class="herb-en">${esc(h.english||"")}</span></div>
        <div class="herb-latin">${esc(h.latin||"")}</div>
      </div>
    </div>
    <div class="divider-orn">✦ ✦ ✦</div>
    ${photo}
    <dl class="meta-table">
      <dt>掌管行星</dt><dd>${sym(PLANET_SYMBOLS,h.planet)} ${esc(h.planet)}</dd>
      <dt>代表元素</dt><dd>${sym(ELEMENT_SYMBOLS,h.element)} ${esc(h.element)}元素</dd>
      <dt>相關神靈</dt><dd>${(h.deities||[]).map(esc).join("、")}</dd>
      <dt>魔法屬性</dt><dd>${h.magicProperties.map(p=>`<span class="tag" style="font-size:13.5px">${esc(p)}</span>`).join(" ")}</dd>
    </dl>
    <div class="divider-orn">❦ ❦ ❦</div>
    ${sectionsHtml}
    ${recipesHtml}
  `;
}

/* ================= 編輯頁 ================= */
function initEdit(){
  const params = new URLSearchParams(location.search);
  const editId = params.get("id");
  const editing = editId ? loadUser().find(x=>x.id===editId) : null;
  if (editId && !editing){
    alert("只能編輯自行編纂的條目（書籍內建條目為唯讀）。");
    location.href = "index.html"; return;
  }
  if (editing) document.getElementById("editor-title").textContent = "✎ 修訂「" + editing.name + "」";

  let pendingImage = editing ? (editing.image || null) : null;

  /* --- 圖片 --- */
  const imgInput = document.getElementById("f-image");
  const preview = document.getElementById("img-preview");
  function renderPreview(){
    preview.innerHTML = pendingImage
      ? `<img src="${pendingImage}" alt="圖片預覽">
         <button type="button" class="mini-link danger" id="btn-remove-img">移除圖片</button>`
      : "";
    const rm = document.getElementById("btn-remove-img");
    if (rm) rm.addEventListener("click", ()=>{ pendingImage = null; imgInput.value=""; renderPreview(); });
  }
  imgInput.addEventListener("change", e=>{
    const f = e.target.files[0];
    if (f) compressImage(f, dataUrl=>{ pendingImage = dataUrl; renderPreview(); });
  });
  renderPreview();

  /* --- 預填 --- */
  if (editing){
    const set = (id,v)=>document.getElementById(id).value = v||"";
    set("f-name",editing.name); set("f-english",editing.english); set("f-latin",editing.latin);
    document.getElementById("f-planet").value = editing.planet;
    document.getElementById("f-element").value = editing.element;
    set("f-deities",(editing.deities||[]).join("、"));
    set("f-props",editing.magicProperties.join("、"));
    (editing.sections||[]).forEach(addSection);
    (editing.recipes||[]).forEach(addRecipe);
  }

  /* --- 章節 --- */
  function addSection(data){
    const div = document.createElement("div");
    div.className = "subitem";
    div.innerHTML = `
      <button type="button" class="remove-btn" title="移除此章節">✕</button>
      <div class="field"><label>章節標題</label><input type="text" class="s-title" value="${esc(data?data.title:"")}" placeholder="神話與傳說"></div>
      <div class="field"><label>內文（段落之間空一行）</label><textarea class="s-text" rows="6">${esc((data?(data.paragraphs||[]).join("\n\n"):""))}</textarea></div>`;
    div.querySelector(".remove-btn").addEventListener("click", ()=>div.remove());
    document.getElementById("sections-list").appendChild(div);
  }
  document.getElementById("add-section").addEventListener("click", ()=>addSection(null));

  /* --- 配方 --- */
  function addRecipe(data){
    const div = document.createElement("div");
    div.className = "subitem";
    const ingLines = (data&&data.ingredients||[]).map(i=>`${i.amount}｜${i.item}`).join("\n");
    div.innerHTML = `
      <button type="button" class="remove-btn" title="移除此配方">✕</button>
      <div class="form-row two-col">
        <div class="field"><label>配方名稱</label><input type="text" class="r-name" value="${esc(data?data.name:"")}" placeholder="羅勒葉片茶"></div>
        <div class="field"><label>英文名</label><input type="text" class="r-english" value="${esc(data?data.english||"":"")}" placeholder="Basil Tea"></div>
      </div>
      <div class="field"><label>材料（每行一筆，格式：份量｜材料）</label>
        <textarea class="r-ing" rows="3" placeholder="250ml（1杯）｜滾水&#10;4–5片｜新鮮羅勒葉片">${esc(ingLines)}</textarea></div>
      <div class="field"><label>作法</label><textarea class="r-steps" rows="3">${esc(data?data.steps||"":"")}</textarea></div>`;
    div.querySelector(".remove-btn").addEventListener("click", ()=>div.remove());
    document.getElementById("recipes-list").appendChild(div);
  }
  document.getElementById("add-recipe").addEventListener("click", ()=>addRecipe(null));

  /* --- 儲存 --- */
  document.getElementById("editor-form").addEventListener("submit", e=>{
    e.preventDefault();
    const name = document.getElementById("f-name").value.trim();
    if (!name){ alert("請填寫中文名稱。"); return; }

    const splitList = s => s.split(/[、,，]/).map(x=>x.trim()).filter(Boolean);

    const herb = {
      id: editing ? editing.id : "u" + Date.now().toString(36),
      name,
      english: document.getElementById("f-english").value.trim(),
      latin: document.getElementById("f-latin").value.trim(),
      planet: document.getElementById("f-planet").value,
      element: document.getElementById("f-element").value,
      deities: splitList(document.getElementById("f-deities").value),
      magicProperties: splitList(document.getElementById("f-props").value),
      image: pendingImage || undefined,
      sections: [...document.querySelectorAll("#sections-list .subitem")].map(div=>({
        title: div.querySelector(".s-title").value.trim() || "未命名章節",
        paragraphs: div.querySelector(".s-text").value.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean)
      })).filter(s=>s.paragraphs.length),
      recipes: [...document.querySelectorAll("#recipes-list .subitem")].map(div=>({
        name: div.querySelector(".r-name").value.trim() || "未命名配方",
        english: div.querySelector(".r-english").value.trim(),
        ingredients: div.querySelector(".r-ing").value.split("\n").map(line=>{
          const parts = line.split(/[｜|]/);
          return parts.length >= 2 ? { amount: parts[0].trim(), item: parts.slice(1).join("｜").trim() } : null;
        }).filter(Boolean),
        steps: div.querySelector(".r-steps").value.trim()
      }))
    };

    const list = loadUser();
    const idx = list.findIndex(x=>x.id===herb.id);
    if (idx >= 0) list[idx] = herb; else list.push(herb);
    if (saveUser(list)) location.href = "herb.html?id=" + encodeURIComponent(herb.id);
  });
}

/* ================= 啟動 ================= */
document.addEventListener("DOMContentLoaded", ()=>{
  const page = document.body.dataset.page;
  if (page === "index") initIndex();
  else if (page === "herb") initHerb();
  else if (page === "edit") initEdit();
});
