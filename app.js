/* 魔法藥草筆記 · 前端邏輯（無框架，GitHub Pages 直接可用） */

const PLANET_SYMBOLS = { "太陽":"☉", "月亮":"☽", "水星":"☿", "金星":"♀", "火星":"♂", "木星":"♃", "土星":"♄" };
const ELEMENT_SYMBOLS = { "火":"🜂", "水":"🜄", "風":"🜁", "土":"🜃" };
const sym = (map, key) => map[key] || "✶";

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function uniqueValues(key){
  const set = new Set();
  HERBS.forEach(h => (Array.isArray(h[key]) ? h[key] : [h[key]]).forEach(v => set.add(v)));
  return [...set].sort((a,b)=>a.localeCompare(b,"zh-Hant"));
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
      b.innerHTML = symbolMap
        ? `<span class="sym">${sym(symbolMap,v)}</span>${esc(v)}`
        : esc(v);
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

  function renderGrid(){
    const list = HERBS.filter(match);
    document.getElementById("result-count").textContent = `共 ${list.length} 筆條目`;
    grid.innerHTML = list.map(h=>`
      <a class="herb-card" href="herb.html?id=${encodeURIComponent(h.id)}">
        <div class="paper">
          <div class="card-head">
            <div class="card-sigil">${sym(ELEMENT_SYMBOLS,h.element)}</div>
            <div>
              <div class="card-name">${esc(h.name)}</div>
              <div class="card-latin">${esc(h.latin)}</div>
            </div>
          </div>
          <div class="card-meta">
            <span><b>${sym(PLANET_SYMBOLS,h.planet)}</b> ${esc(h.planet)}</span>
            <span><b>${sym(ELEMENT_SYMBOLS,h.element)}</b> ${esc(h.element)}元素</span>
          </div>
          <div class="card-props">
            ${h.magicProperties.slice(0,6).map(p=>`<span class="tag">${esc(p)}</span>`).join("")}
            ${h.magicProperties.length>6?`<span class="tag">+${h.magicProperties.length-6}</span>`:""}
          </div>
        </div>
      </a>`).join("");
  }
  renderGrid();
}

/* ================= 詳情頁 ================= */
function initHerb(){
  const id = new URLSearchParams(location.search).get("id");
  const h = HERBS.find(x=>x.id===id) || HERBS[0];
  document.title = `${h.name} ${h.english} · 魔法藥草筆記`;
  const a = document.getElementById("herb-article");

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
        <div><span class="herb-name">${esc(h.name)}</span><span class="herb-en">${esc(h.english)}</span></div>
        <div class="herb-latin">${esc(h.latin)}</div>
      </div>
    </div>
    <div class="divider-orn">✦ ✦ ✦</div>

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

/* ================= 啟動 ================= */
document.addEventListener("DOMContentLoaded", ()=>{
  const page = document.body.dataset.page;
  if (page === "index") initIndex();
  else if (page === "herb") initHerb();
});
