(() => {
  const $ = (s) => document.querySelector(s);
  const screens = ["lockScreen","homeScreen","appScreen","finalScreen","winScreen"];
  const state = {
    seconds:720,
    timer:null,
    fragments:{},
    opened:{},
    hints:3,
    galleryUnlocked:false,
    notesUnlocked:false
  };

  const apps = {
    messages:{title:"Messages",render:renderMessages},
    notes:{title:"Notes",render:renderNotes},
    gallery:{title:"Gallery",render:renderGallery},
    browser:{title:"Browser",render:renderBrowser},
    bible:{title:"Bible",render:renderBible},
    arcade:{title:"Arcade",render:renderArcade},
    files:{title:"Files",render:renderFiles},
    settings:{title:"Settings",render:renderSettings},
  };

  function showScreen(id){
    screens.forEach(s => $("#"+s).classList.toggle("active",s===id));
  }
  function toast(msg){
    const t=$("#toast");t.textContent=msg;t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"),2200);
  }
  function fmt(sec){
    const m=Math.floor(Math.max(sec,0)/60),s=Math.max(sec,0)%60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
  function startTimer(){
    clearInterval(state.timer);
    state.timer=setInterval(()=>{
      state.seconds--;
      $("#countdown").textContent=fmt(state.seconds);
      if(state.seconds<=0){
        clearInterval(state.timer);
        toast("MIDNIGHT LOCK — waktu habis, tapi game tetap bisa diselesaikan.");
      }
    },1000);
  }
  function addFragment(key,value){
    if(!state.fragments[key]){
      state.fragments[key]=value;
      toast(`Fragmen ditemukan: ${value}`);
      if(Object.keys(state.fragments).length===4){
        setTimeout(openFinal,900);
      }
    }
  }
  function openApp(name){
    const app=apps[name]; if(!app)return;
    $("#appTitle").textContent=app.title;
    $("#appContent").innerHTML="";
    app.render($("#appContent"));
    showScreen("appScreen");
  }
  function el(tag,cls,html){
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(html!==undefined)n.innerHTML=html;
    return n;
  }

  function renderMessages(root){
    const chat=el("div","chat");
    [
      ["them","Malachi","Udah siap? Besok kelompok kita presentasi."],
      ["me","Kamu","Iya. Lagi beresin semuanya."],
      ["them","Malachi","Btw Felizio bilang dia nyimpen clue di foto yang diambil jam 19:32."],
      ["them","Malachi","Katanya nama filenya aneh: IMG_1511."],
      ["me","Kamu","1511?"],
      ["them","Malachi","Mungkin bukan random."]
    ].forEach(([who,name,text])=>{
      const b=el("div","bubble "+who,`<b>${name}</b><br>${text}`);
      chat.appendChild(b);
    });
    root.appendChild(chat);
  }

  function renderNotes(root){
    const paper=el("div","note-paper",`
      <b>things i keep saying i'll do later</b><br><br>
      • siapin tas<br>
      • balas Malachi<br>
      • doa<br>
      • baca Lukas 15<br>
      • "cuma satu match lagi"<br><br>
      <i>kalau lupa kode: angka pertama dari pasal + jumlah huruf kata PULANG.</i>
    `);
    root.appendChild(paper);
    const box=el("div","lockbox",`
      <b>Catatan terkunci</b>
      <p style="color:#9aa7bc">Masukkan kode 4 digit.</p>
      <input id="noteCode" inputmode="numeric" maxlength="4" placeholder="••••">
      <button id="noteUnlock" class="primary-btn">Unlock</button>
      <p id="noteFeedback" class="feedback"></p>
    `);
    root.appendChild(box);
    $("#noteUnlock").addEventListener("click",()=>{
      const v=$("#noteCode").value.trim();
      // 15 + PULANG(6) => 156, padded as 0156
      if(v==="0156"){
        $("#noteFeedback").textContent="Unlocked: “Urutan bukan selalu kiri → kanan. Cari arah untuk kembali.”";
        $("#noteFeedback").style.color="#50d5a5";
        state.notesUnlocked=true;
        addFragment("F2","5-13");
      }else{
        $("#noteFeedback").textContent="Kode salah.";
        $("#noteFeedback").style.color="#ff6f86";
      }
    });
  }

  function renderGallery(root){
    const info=el("p","",`Cari foto yang disebut di Messages. Tap foto untuk melihat metadata.`);
    info.style.color="#9aa7bc";root.appendChild(info);
    const grid=el("div","gallery-grid");
    const photos=[
      ["🌆","18:05","IMG_1470"],
      ["📚","19:32","IMG_1511"],
      ["🍜","20:14","IMG_1518"],
      ["🎮","22:46","IMG_1532"]
    ];
    photos.forEach(([emoji,time,name])=>{
      const b=el("button","photo",`${emoji}<span>${time}</span>`);
      b.type="button";
      b.addEventListener("click",()=>{
        if(name==="IMG_1511"){
          toast("Metadata: IMG_1511 • 19:32 • note: 'first = 11'");
          addFragment("F1","11");
        } else toast(`Metadata: ${name} • ${time} • tidak ada catatan.`);
      });
      grid.appendChild(b);
    });
    root.appendChild(grid);
  }

  function renderBrowser(root){
    const bar=el("div","browser-bar",`
      <input id="urlBox" value="reconnect.local/" aria-label="alamat">
      <button id="goBtn" class="primary-btn" style="width:auto">Go</button>
    `);
    const page=el("div","browser-page",`
      <small style="color:#839dff">RECONNECT.LOCAL</small>
      <h2 style="margin:6px 0">You don't need more content.</h2>
      <p style="color:#9aa7bc">You need a way out of the loop.</p>
      <div class="lockbox">
        <b>Search archive</b>
        <p style="color:#9aa7bc">Hint: tiga huruf yang muncul sebelum algoritma mulai mengulang.</p>
        <input id="archiveCode" maxlength="3" placeholder="___">
        <button id="archiveBtn" class="primary-btn">Search</button>
        <p id="archiveFeedback" class="feedback"></p>
      </div>
    `);
    root.append(bar,page);
    $("#goBtn").addEventListener("click",()=>toast("Hanya reconnect.local yang tersedia pada perangkat ini."));
    $("#archiveBtn").addEventListener("click",()=>{
      const v=$("#archiveCode").value.trim().toUpperCase();
      if(v==="KEM"){
        $("#archiveFeedback").textContent="Archive hit: KEM → angka 2-1.";
        $("#archiveFeedback").style.color="#50d5a5";
        addFragment("F3","2-1");
      }else{
        $("#archiveFeedback").textContent="Tidak ditemukan.";
        $("#archiveFeedback").style.color="#ff6f86";
      }
    });
  }

  function renderBible(root){
    const c=el("div","verse-card",`
      <small>LUKAS 15:17–20</small>
      <p>“Lalu ia menyadari keadaannya ... Aku akan bangkit dan pergi kepada bapaku ... Maka bangkitlah ia dan pergi kepada bapanya.”</p>
    `);
    root.appendChild(c);
    const q=el("div","lockbox",`
      <b>Susun logika cerita</b>
      <p style="color:#9aa7bc">Apa pola yang paling tepat?</p>
      <button class="row-card bible-choice">pergi → sadar → kembali</button>
      <button class="row-card bible-choice" data-ok="1">menjauh → sadar → bangkit → kembali</button>
      <button class="row-card bible-choice">sadar → menjauh → kembali</button>
      <p id="bibleFeedback" class="feedback"></p>
    `);
    root.appendChild(q);
    root.querySelectorAll(".bible-choice").forEach(b=>b.addEventListener("click",()=>{
      if(b.dataset.ok){
        $("#bibleFeedback").textContent="Benar. Posisi 'bangkit → kembali' = 12-9.";
        $("#bibleFeedback").style.color="#50d5a5";
        addFragment("F4","12-9");
      }else{
        $("#bibleFeedback").textContent="Belum tepat.";
        $("#bibleFeedback").style.color="#ff6f86";
      }
    }));
  }

  function renderArcade(root){
    const p=el("p","",`Arcade sengaja terlihat penting. Coba lihat apa yang terjadi.`);
    p.style.color="#9aa7bc"; root.appendChild(p);
    const grid=el("div","arcade-grid");
    ["DAILY QUEST","ONE MORE?","RANKED","LUCKY DRAW"].forEach((name,i)=>{
      const b=el("button","game-tile",`<b>${name}</b><br><small style="color:#c6badc">Tap to play</small>`);
      b.addEventListener("click",()=>{
        toast(i===1 ? "Video 1: K • Video 2: E • Video 3: M • setelah itu loop." : "Distraksi. Tidak ada fragmen di sini.");
      });
      grid.appendChild(b);
    });
    root.appendChild(grid);
  }

  function renderFiles(root){
    const files=[
      ["mission.txt","1 KB"],
      ["fragment.tmp","0 KB"],
      ["screen_time.log","4 KB"]
    ];
    files.forEach(([name,size])=>{
      const r=el("div","file-item",`<span>${name}</span><small>${size}</small>`);
      r.addEventListener("click",()=>{
        if(name==="mission.txt") toast("mission.txt: 4 fragmen → satu kata.");
        else if(name==="screen_time.log") toast("screen_time.log: Arcade 2h 47m • Bible 0h 06m");
        else toast("fragment.tmp kosong.");
      });
      root.appendChild(r);
    });
  }

  function renderSettings(root){
    [
      ["Device","RECONNECT-01"],
      ["Owner","UNKNOWN"],
      ["Focus Mode","OFF"],
      ["Midnight Lock","ON"],
      ["Hints left",String(state.hints)]
    ].forEach(([a,b])=>root.appendChild(el("div","setting",`<b>${a}</b><span>${b}</span>`)));
  }

  function openFinal(){
    $("#fragmentSlots").innerHTML="";
    ["F1","F2","F3","F4"].forEach(k=>{
      const slot=el("div","fragment-slot",state.fragments[k]||"?");
      $("#fragmentSlots").appendChild(slot);
    });
    showScreen("finalScreen");
  }

  $("#unlockBtn").addEventListener("click",()=>{
    showScreen("homeScreen");
    startTimer();
  });
  $("#backHome").addEventListener("click",()=>showScreen("homeScreen"));
  document.querySelectorAll("[data-app]").forEach(b=>b.addEventListener("click",()=>openApp(b.dataset.app)));
  $("#hintBtn").addEventListener("click",()=>{
    if(state.hints<=0){toast("Hint habis.");return;}
    state.hints--;
    const title=$("#appTitle").textContent;
    const hint={
      Messages:"Nama file dan waktu foto bukan dekorasi.",
      Notes:"Pasal = 15. PULANG punya 6 huruf. Coba jadikan kode 4 digit.",
      Gallery:"Messages menyebut foto jam 19:32.",
      Browser:"Arcade memberi tiga huruf sebelum masuk loop.",
      Bible:"Fokus pada urutan: menjauh → sadar → bangkit → kembali.",
      Arcade:"Tidak semua app punya fragmen. Tapi satu app bisa punya clue untuk app lain.",
      Files:"Log bisa memberi konteks, bukan selalu jawaban.",
      Settings:"Settings tidak menyimpan fragmen."
    }[title]||"Cari hubungan antar-app.";
    toast(hint);
  });

  $("#submitFinal").addEventListener("click",()=>{
    const v=$("#finalCode").value.trim().toUpperCase().replace(/[^A-Z]/g,"");
    if(v==="KEMBALI"){
      clearInterval(state.timer);
      showScreen("winScreen");
    }else{
      $("#finalFeedback").textContent="Password salah. Ubah 11 | 5-13 | 2-1 | 12-9 dengan A=1, B=2, ...";
      $("#finalFeedback").style.color="#ff6f86";
    }
  });
  $("#restartBtn").addEventListener("click",()=>location.reload());

  // clock from fictional timeline; not real device time
  $("#clock").textContent="23:48";
  $("#lockTime").textContent="23:48";

  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
})();