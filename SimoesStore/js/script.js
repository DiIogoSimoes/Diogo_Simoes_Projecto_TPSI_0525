(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const fmtEUR = n => n.toLocaleString('pt-PT', {style:'currency', currency:'EUR'});

  // Header: hamburger + ano + badge
  const nav = $("#nav");
  const hamburger = $("#hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function getCart(){ return JSON.parse(localStorage.getItem("cart") || "[]"); }
  function setCart(c){ localStorage.setItem("cart", JSON.stringify(c)); }
  function cartCount(){ return getCart().reduce((s,i)=>s+i.qty,0); }
  function updateBadge(){ const b=$("#cart-count"); if(b) b.textContent = cartCount(); }
  updateBadge();

  // Toast helper (UX)
  function toast(msg){
    let t=document.createElement("div");
    t.textContent=msg;
    t.style.cssText="position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:rgba(5,9,20,.9);color:#e6f6ff;padding:10px 14px;border:1px solid rgba(255,255,255,.12);border-radius:12px;z-index:9999";
    document.body.appendChild(t);
    setTimeout(()=>{t.style.transition='opacity .35s';t.style.opacity='0';setTimeout(()=>t.remove(),350)},1200);
  }

  // Index: destaques
  const slider = document.getElementById("slider");
  if (slider) {
    window.PRODUCTS.slice(0, 6).forEach(p => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.img ? p.img : '../img/placeholder.png'}" 
             alt="${p.nome}" 
             style="width:100%;height:auto;object-fit:cover;">
        <div class="body">
          <h3>${p.nome}</h3>
          <p class="muted">${p.desc}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
            <span class="price">${fmtEUR(p.preco)}</span>
            <div style="display:flex;gap:8px">
              <a class="btn btn-ghost" href="product.html?id=${p.id}">Ver</a>
              <button class="btn btn-primary" data-add="${p.id}">Adicionar</button>
            </div>
          </div>
        </div>`;
      slider.appendChild(card);
    });

    slider.addEventListener("click", e => {
      const id = e.target?.dataset?.add;
      if (id) addToCart(parseInt(id), 1);
    });
  }

  // Products: grid + filtros
  const grid = $("#product-grid");
  if (grid) {
    const paramsHash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const initialCat = paramsHash.get("categoria") || "";
    const search = $("#search");
    const category = $("#category");
    const sort = $("#sort");
    if (initialCat) category.value = initialCat;

    function render() {
      const q = (search.value || "").toLowerCase();
      const cat = category.value;
      const ord = sort.value;
      let list = window.PRODUCTS.filter(p =>
        (!cat || p.categoria === cat) &&
        (p.nome.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
      );
      if (ord === "preco-asc") list.sort((a,b)=>a.preco-b.preco);
      if (ord === "preco-desc") list.sort((a,b)=>b.preco-a.preco);
      grid.innerHTML = "";
      list.forEach(p => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <img src="${p.img ? p.img : '../img/placeholder.png'}" 
               alt="${p.nome}" 
               style="width:100%;height:200px;object-fit:cover;">
          <div class="body">
            <h3>${p.nome}</h3>
            <p class="muted">${p.desc}</p>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
              <span class="price">${fmtEUR(p.preco)}</span>
              <div style="display:flex;gap:8px">
                <a class="btn btn-ghost" href="product.html?id=${p.id}">Ver</a>
                <button class="btn btn-primary" data-add="${p.id}">Adicionar</button>
              </div>
            </div>
          </div>`;
        grid.appendChild(card);
      });
    }
    render();
    ["input","change"].forEach(evt=>{
      search.addEventListener(evt, render);
      category.addEventListener(evt, render);
      sort.addEventListener(evt, render);
    });
    grid.addEventListener("click", e => {
      const id = e.target?.dataset?.add;
      if (id) addToCart(parseInt(id), 1);
    });
  }

  // Produto: carregar por id
  const params = new URLSearchParams(location.search);
  const pid = parseInt(params.get("id"));
  if (!isNaN(pid)) {
    const p = window.PRODUCTS.find(x => x.id === pid);
    if (p) {
      $("#prod-name").textContent = p.nome;
      $("#prod-price").textContent = fmtEUR(p.preco);
      $("#prod-desc").textContent = p.desc;
      $("#prod-image").innerHTML = `<img src="${p.img}" alt="${p.nome}" style="width:100%;height:auto;object-fit:cover;border-radius:16px;">`;
      const btn = $("#add-to-cart");
      if (btn) btn.addEventListener("click", () => {
        const qty = Math.max(1, parseInt($("#qty").value || "1"));
        addToCart(p.id, qty);
      });
    }
  }

  // Newsletter (validação simples)
  const newsForm = $("#newsletter-form");
  if (newsForm) {
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("#news-email").value.trim();
      const msg = $("#news-msg");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = "Email inválido.";
        msg.style.color = "#ff5470";
      } else {
        msg.style.color = "var(--accent)";
        msg.textContent = "Subscrição concluída!";
        newsForm.reset();
      }
    });
  }

  // Contacto (validação simples)
  const contactForm = $("#contact-form");
  if (contactForm) {
    const fields = $$(".form-field", contactForm);
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      fields.forEach(f => {
        const input = $("input,textarea", f);
        const msg = $(".form-msg", f);
        if (!input.value.trim()) { ok = false; msg.textContent = "Obrigatório"; }
        else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { ok = false; msg.textContent = "Email inválido"; }
        else msg.textContent = "";
      });
      const result = $("#contact-result");
      if (ok) {
        result.style.color = "var(--accent)";
        result.textContent = "Mensagem enviada com sucesso (simulado).";
        contactForm.reset();
      } else {
        result.style.color = "var(--danger)";
        result.textContent = "Verifica os campos em falta.";
      }
    });
  }

  // Carrinho
  function addToCart(id, qty){
    const p = window.PRODUCTS.find(x=>x.id===id);
    if(!p) return;
    const cart = getCart();
    const i = cart.findIndex(x=>x.id===id);
    if(i>=0) cart[i].qty += qty;
    else cart.push({id, qty});
    setCart(cart);
    updateBadge();
    toast("Adicionado ao carrinho");
  }

  const itemsEl = $("#cart-items");
  if (itemsEl) {
    const emptyEl = $("#cart-empty");
    const summaryEl = $("#cart-summary");
    function renderCart(){
      const cart = getCart();
      itemsEl.innerHTML = "";
      if(cart.length===0){
        emptyEl.style.display = "block";
        summaryEl.style.display = "none";
        return;
      }
      emptyEl.style.display = "none";
      summaryEl.style.display = "block";
      let subtotal = 0;
      cart.forEach(row=>{
        const p = window.PRODUCTS.find(x=>x.id===row.id);
        const total = p.preco * row.qty;
        subtotal += total;
        const line = document.createElement("div");
        line.className = "cart-item";
        line.innerHTML = `
          <img src="${p.img ? p.img : '../img/placeholder.png'}" 
               alt="${p.nome}" 
               style="width:80px;height:60px;object-fit:cover;border-radius:8px;">
          <div>${p.nome}<div class="muted">${fmtEUR(p.preco)}</div></div>
          <div class="qty">
            <button data-dec="${p.id}">−</button>
            <span>${row.qty}</span>
            <button data-inc="${p.id}">+</button>
          </div>
          <div>${fmtEUR(total)}</div>
          <button data-rm="${p.id}" title="Remover" style="margin-left:8px">✕</button>
        `;
        itemsEl.appendChild(line);
      });
      $("#subtotal").textContent = fmtEUR(subtotal);
      $("#total").textContent = fmtEUR(subtotal);
    }
    itemsEl.addEventListener("click",(e)=>{
      const id = parseInt(e.target?.dataset?.inc || e.target?.dataset?.dec || e.target?.dataset?.rm);
      if(isNaN(id)) return;
      const cart = getCart();
      const i = cart.findIndex(x=>x.id===id);
      if(i<0) return;
      if(e.target.dataset.inc){ cart[i].qty++; }
      if(e.target.dataset.dec){ cart[i].qty = Math.max(1, cart[i].qty-1); }
      if(e.target.dataset.rm){ cart.splice(i,1); }
      setCart(cart);
      renderCart(); updateBadge();
    });
    const checkout = $("#checkout");
    if (checkout) checkout.addEventListener("click", () => {
      toast("Checkout simulado. Integração de pagamento não incluída.");
    });
    renderCart();
  }
})();
