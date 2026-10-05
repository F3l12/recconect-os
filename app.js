(() => {
  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const screens = [
    "lockScreen",
    "homeScreen",
    "appScreen",
    "finalScreen",
    "winScreen"
  ];

  const GAME_START_TIME = (23 * 3600) + (48 * 60);
  const TIMER_LENGTH = 12 * 60;

  const state = {
    unlockedAt: null,
    gameTicker: null,
    timerExpiredNotified: false,

    fragments: {},

    feedIndex: 0,
    feedLetters: []
  };


  /* =========================================================
     BASIC UI
  ========================================================= */

  function showScreen(id) {
    screens.forEach(screenId => {
      const screen = $("#" + screenId);

      if (screen) {
        screen.classList.toggle(
          "active",
          screenId === id
        );
      }
    });
  }


  function toast(message) {
    const toastBox = $("#toast");

    if (!toastBox) return;

    toastBox.textContent = message;
    toastBox.classList.add("show");

    setTimeout(() => {
      toastBox.classList.remove("show");
    }, 2200);
  }


  /* =========================================================
     TIME SYSTEM
  ========================================================= */

  function getElapsedSeconds() {
    if (!state.unlockedAt) {
      return 0;
    }

    return Math.floor(
      (Date.now() - state.unlockedAt) / 1000
    );
  }


  function formatClock(totalSeconds) {
    totalSeconds =
      ((totalSeconds % 86400) + 86400) % 86400;

    const h = Math.floor(totalSeconds / 3600);

    const m = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const s = totalSeconds % 60;

    return {
      h: String(h).padStart(2, "0"),
      m: String(m).padStart(2, "0"),
      s: String(s).padStart(2, "0")
    };
  }


  function formatCountdown(totalSeconds) {
    totalSeconds = Math.max(0, totalSeconds);

    const h = Math.floor(totalSeconds / 3600);

    const m = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const s = totalSeconds % 60;

    return (
      `${String(h).padStart(2, "0")}:` +
      `${String(m).padStart(2, "0")}:` +
      `${String(s).padStart(2, "0")}`
    );
  }


  function updateTimeUI() {
    const elapsed = getElapsedSeconds();

    const normalTime =
      GAME_START_TIME + elapsed;

    const normal =
      formatClock(normalTime);


    /* status bar */

    const statusClock = $("#clock");

    if (statusClock) {
      statusClock.textContent =
        `${normal.h}:${normal.m}`;
    }


    /* lock screen */

    const lockTime = $("#lockTime");

    if (lockTime && !state.unlockedAt) {
      lockTime.textContent = "23:48";
    }


    /* Clock app */

    const normalClock =
      $("#normalClock");

    if (normalClock) {
      normalClock.textContent =
        `${normal.h}:${normal.m}:${normal.s}`;
    }


    const remaining =
      Math.max(
        0,
        TIMER_LENGTH - elapsed
      );


    const countdownClock =
      $("#countdownClock");

    if (countdownClock) {
      countdownClock.textContent =
        formatCountdown(remaining);
    }


    /* timer finished */

    if (
      state.unlockedAt &&
      remaining === 0 &&
      !state.timerExpiredNotified
    ) {
      state.timerExpiredNotified = true;

      toast(
        "00:00:00 — Waktu yang direncanakan sudah habis."
      );
    }
  }


  function startGameClock() {
    if (!state.unlockedAt) {
      state.unlockedAt = Date.now();
    }

    updateTimeUI();

    if (state.gameTicker) {
      clearInterval(state.gameTicker);
    }

    state.gameTicker =
      setInterval(
        updateTimeUI,
        250
      );
  }



  /* =========================================================
     APPS
  ========================================================= */

  const apps = {

    messages: {
      title: "Messages",
      render: renderMessages
    },

    notes: {
      title: "Notes",
      render: renderNotes
    },

    gallery: {
      title: "Gallery",
      render: renderGallery
    },

    clock: {
      title: "Clock",
      render: renderClockApp
    },

    browser: {
      title: "Browser",
      render: renderBrowser
    },

    bible: {
      title: "Bible",
      render: renderBible
    },

    arcade: {
      title: "Arcade",
      render: renderArcade
    },

    files: {
      title: "Files",
      render: renderFiles
    },

    settings: {
      title: "Settings",
      render: renderSettings
    }
  };


  function openApp(name) {
    const app = apps[name];

    if (!app) return;

    $("#appTitle").textContent =
      app.title;

    const root =
      $("#appContent");

    root.innerHTML = "";

    app.render(root);

    showScreen("appScreen");
  }



  /* =========================================================
     CLOCK APP
  ========================================================= */

  function renderClockApp(root) {

    root.innerHTML = `
      <div
        style="
          display:flex;
          gap:8px;
          margin-bottom:24px;
        "
      >
        <button
          id="clockTab"
          class="primary-btn"
          type="button"
        >
          Jam
        </button>

        <button
          id="timerTab"
          class="secondary-btn"
          type="button"
        >
          Timer
        </button>
      </div>


      <div
        id="clockView"
        style="
          text-align:center;
          padding:44px 0;
        "
      >
        <div
          id="normalClock"
          style="
            font-size:44px;
            font-weight:300;
            letter-spacing:-1px;
          "
        >
          23:48:00
        </div>

        <div
          style="
            color:#9aa1ab;
            margin-top:8px;
          "
        >
          Sabtu
        </div>
      </div>


      <div
        id="timerView"
        style="
          display:none;
          text-align:center;
          padding:44px 0;
        "
      >
        <div
          id="countdownClock"
          style="
            font-size:44px;
            font-weight:300;
            letter-spacing:-1px;
          "
        >
          00:12:00
        </div>

        <div
          style="
            color:#9aa1ab;
            margin-top:8px;
          "
        >
          Waktu tersisa
        </div>
      </div>
    `;


    const clockTab =
      $("#clockTab", root);

    const timerTab =
      $("#timerTab", root);

    const clockView =
      $("#clockView", root);

    const timerView =
      $("#timerView", root);


    clockTab.addEventListener(
      "click",
      () => {

        clockView.style.display = "";

        timerView.style.display =
          "none";

        clockTab.className =
          "primary-btn";

        timerTab.className =
          "secondary-btn";
      }
    );


    timerTab.addEventListener(
      "click",
      () => {

        clockView.style.display =
          "none";

        timerView.style.display = "";

        timerTab.className =
          "primary-btn";

        clockTab.className =
          "secondary-btn";
      }
    );


    updateTimeUI();
  }



  /* =========================================================
     MESSAGES
     masih versi lama dulu — nanti kita rombak
  ========================================================= */

  function renderMessages(root) {

    const chat =
      document.createElement("div");

    chat.className = "chat";


    const messages = [
      [
        "them",
        "Malachi",
        "Udah siap? Besok kelompok kita presentasi."
      ],

      [
        "me",
        "Kamu",
        "Iya. Lagi beresin semuanya."
      ],

      [
        "them",
        "Malachi",
        "Btw Felizio bilang dia nyimpen clue di foto yang diambil jam 19:32."
      ],

      [
        "them",
        "Malachi",
        "Katanya nama filenya IMG_1511."
      ],

      [
        "me",
        "Kamu",
        "1511?"
      ],

      [
        "them",
        "Malachi",
        "Mungkin bukan random."
      ]
    ];


    messages.forEach(
      ([who, name, text]) => {

        const bubble =
          document.createElement("div");

        bubble.className =
          "bubble " + who;

        bubble.innerHTML =
          `<b>${name}</b><br>${text}`;

        chat.appendChild(bubble);
      }
    );


    root.appendChild(chat);
  }



  /* =========================================================
     NOTES
     masih versi lama dulu — nanti kita rombak
  ========================================================= */

  function renderNotes(root) {

    const paper =
      document.createElement("div");

    paper.className =
      "note-paper";

    paper.innerHTML = `
      <b>things i keep saying i'll do later</b>
      <br><br>

      • siapin tas<br>
      • balas Malachi<br>
      • doa<br>
      • baca Lukas 15<br>
      • "cuma satu match lagi"

      <br><br>

      <i>
        kalau lupa kode:
        angka pertama dari pasal
        + jumlah huruf kata PULANG
      </i>
    `;

    root.appendChild(paper);


    const box =
      document.createElement("div");

    box.className =
      "lockbox";

    box.innerHTML = `
      <b>Catatan terkunci</b>

      <p style="color:#9aa7bc">
        Masukkan kode 4 digit.
      </p>

      <input
        id="noteCode"
        inputmode="numeric"
        maxlength="4"
        placeholder="••••"
      >

      <button
        id="noteUnlock"
        class="primary-btn"
        type="button"
      >
        Unlock
      </button>

      <p
        id="noteFeedback"
        class="feedback"
      ></p>
    `;

    root.appendChild(box);


    $("#noteUnlock", root)
      .addEventListener(
        "click",
        () => {

          const value =
            $("#noteCode", root)
              .value
              .trim();

          const feedback =
            $("#noteFeedback", root);


          if (value === "0156") {

            feedback.textContent =
              "Unlocked: 'Urutan bukan selalu kiri → kanan. Cari arah untuk kembali.'";

            feedback.style.color =
              "#50d5a5";

            addFragment(
              "F2",
              "5-13"
            );

          } else {

            feedback.textContent =
              "Kode salah.";

            feedback.style.color =
              "#ff6f86";
          }
        }
      );
  }



  /* =========================================================
     GALLERY
  ========================================================= */

  function renderGallery(root) {

    const info =
      document.createElement("p");

    info.textContent =
      "Cari foto yang disebut di Messages. Tap foto untuk melihat metadata.";

    info.style.color =
      "#9aa7bc";

    root.appendChild(info);


    const grid =
      document.createElement("div");

    grid.className =
      "gallery-grid";


    const photos = [

      [
        "🌆",
        "18:05",
        "IMG_1470"
      ],

      [
        "📚",
        "19:32",
        "IMG_1511"
      ],

      [
        "🍜",
        "20:14",
        "IMG_1518"
      ],

      [
        "🎮",
        "22:46",
        "IMG_1532"
      ]
    ];


    photos.forEach(
      ([emoji, time, name]) => {

        const button =
          document.createElement("button");

        button.className =
          "photo";

        button.type =
          "button";

        button.innerHTML =
          `${emoji}<span>${time}</span>`;


        button.addEventListener(
          "click",
          () => {

            if (name === "IMG_1511") {

              toast(
                "Metadata: IMG_1511 • 19:32 • note: first = 11"
              );

              addFragment(
                "F1",
                "11"
              );

            } else {

              toast(
                `Metadata: ${name} • ${time} • tidak ada catatan.`
              );
            }
          }
        );


        grid.appendChild(button);
      }
    );


    root.appendChild(grid);
  }



  /* =========================================================
     BROWSER
  ========================================================= */

  function renderBrowser(root) {

    root.innerHTML = `
      <div class="browser-bar">

        <input
          id="urlBox"
          value="reconnect.local/"
          aria-label="alamat"
        >

        <button
          id="goBtn"
          class="primary-btn"
          style="width:auto"
          type="button"
        >
          Go
        </button>

      </div>


      <div class="browser-page">

        <small style="color:#839dff">
          RECONNECT.LOCAL
        </small>

        <h2 style="margin:6px 0">
          You don't need more content.
        </h2>

        <p style="color:#9aa7bc">
          You need a way out of the loop.
        </p>


        <div class="lockbox">

          <b>Search archive</b>

          <p style="color:#9aa7bc">
            Hint: tiga huruf yang muncul
            sebelum algoritma mulai mengulang.
          </p>

          <input
            id="archiveCode"
            maxlength="3"
            placeholder="___"
          >

          <button
            id="archiveBtn"
            class="primary-btn"
            type="button"
          >
            Search
          </button>

          <p
            id="archiveFeedback"
            class="feedback"
          ></p>

        </div>

      </div>
    `;


    $("#goBtn", root)
      .addEventListener(
        "click",
        () => {

          toast(
            "Hanya reconnect.local yang tersedia pada perangkat ini."
          );
        }
      );


    $("#archiveBtn", root)
      .addEventListener(
        "click",
        () => {

          const value =
            $("#archiveCode", root)
              .value
              .trim()
              .toUpperCase();

          const feedback =
            $("#archiveFeedback", root);


          if (value === "KEM") {

            feedback.textContent =
              "Archive hit: KEM → angka 2-1.";

            feedback.style.color =
              "#50d5a5";

            addFragment(
              "F3",
              "2-1"
            );

          } else {

            feedback.textContent =
              "Tidak ditemukan.";

            feedback.style.color =
              "#ff6f86";
          }
        }
      );
  }



  /* =========================================================
     BIBLE
  ========================================================= */

  function renderBible(root) {

    const verse =
      document.createElement("div");

    verse.className =
      "verse-card";

    verse.innerHTML = `
      <small>
        LUKAS 15:17–20
      </small>

      <p>
        “Lalu ia menyadari keadaannya ...
        Aku akan bangkit dan pergi kepada bapaku ...
        Maka bangkitlah ia dan pergi kepada bapanya.”
      </p>
    `;

    root.appendChild(verse);


    const box =
      document.createElement("div");

    box.className =
      "lockbox";

    box.innerHTML = `
      <b>Susun logika cerita</b>

      <p style="color:#9aa7bc">
        Apa pola yang paling tepat?
      </p>

      <button
        class="row-card bible-choice"
        type="button"
      >
        pergi → sadar → kembali
      </button>

      <button
        class="row-card bible-choice"
        data-ok="1"
        type="button"
      >
        menjauh → sadar → bangkit → kembali
      </button>

      <button
        class="row-card bible-choice"
        type="button"
      >
        sadar → menjauh → kembali
      </button>

      <p
        id="bibleFeedback"
        class="feedback"
      ></p>
    `;

    root.appendChild(box);


    $$(".bible-choice", root)
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const feedback =
              $("#bibleFeedback", root);


            if (button.dataset.ok) {

              feedback.textContent =
                "Benar. Posisi 'bangkit → kembali' = 12-9.";

              feedback.style.color =
                "#50d5a5";

              addFragment(
                "F4",
                "12-9"
              );

            } else {

              feedback.textContent =
                "Belum tepat.";

              feedback.style.color =
                "#ff6f86";
            }
          }
        );
      });
  }



  /* =========================================================
     ARCADE
  ========================================================= */

  function renderArcade(root) {

    const text =
      document.createElement("p");

    text.textContent =
      "Arcade sengaja terlihat penting. Coba lihat apa yang terjadi.";

    text.style.color =
      "#9aa7bc";

    root.appendChild(text);


    const grid =
      document.createElement("div");

    grid.className =
      "arcade-grid";


    const games = [
      "DAILY QUEST",
      "ONE MORE?",
      "RANKED",
      "LUCKY DRAW"
    ];


    games.forEach(
      (name, index) => {

        const button =
          document.createElement("button");

        button.className =
          "game-tile";

        button.type =
          "button";

        button.innerHTML =
          `<b>${name}</b><br>
           <small style="color:#c6badc">
             Tap to play
           </small>`;


        button.addEventListener(
          "click",
          () => {

            if (index === 1) {

              toast(
                "Video 1: K • Video 2: E • Video 3: M • setelah itu loop."
              );

            } else {

              toast(
                "Distraksi. Tidak ada fragmen di sini."
              );
            }
          }
        );


        grid.appendChild(button);
      }
    );


    root.appendChild(grid);
  }



  /* =========================================================
     FILES
  ========================================================= */

  function renderFiles(root) {

    const files = [

      [
        "mission.txt",
        "1 KB",
        "mission.txt: 4 fragmen → satu kata."
      ],

      [
        "fragment.tmp",
        "0 KB",
        "fragment.tmp kosong."
      ],

      [
        "screen_time.log",
        "4 KB",
        "screen_time.log: Arcade 2h 47m • Bible 0h 06m"
      ]
    ];


    files.forEach(
      ([name, size, message]) => {

        const row =
          document.createElement("div");

        row.className =
          "file-item";

        row.innerHTML =
          `<span>${name}</span>
           <small>${size}</small>`;


        row.addEventListener(
          "click",
          () => toast(message)
        );


        root.appendChild(row);
      }
    );
  }



  /* =========================================================
     SETTINGS
  ========================================================= */

  function renderSettings(root) {

    const settings = [

      ["Device", "RECONNECT-01"],

      ["Owner", "UNKNOWN"],

      ["Focus Mode", "OFF"],

      ["Midnight Lock", "ON"],

      ["Battery", "83%"]
    ];


    settings.forEach(
      ([name, value]) => {

        const row =
          document.createElement("div");

        row.className =
          "setting";

        row.innerHTML =
          `<b>${name}</b>
           <span>${value}</span>`;

        root.appendChild(row);
      }
    );
  }



  /* =========================================================
     FRAGMENTS + FINAL
  ========================================================= */

  function addFragment(key, value) {

    if (state.fragments[key]) {
      return;
    }

    state.fragments[key] =
      value;

    toast(
      `Informasi ditemukan: ${value}`
    );


    if (
      Object.keys(state.fragments)
        .length === 4
    ) {
      setTimeout(
        openFinal,
        700
      );
    }
  }


  function openFinal() {

    const slots =
      $("#fragmentSlots");

    slots.innerHTML = "";


    [
      "F1",
      "F2",
      "F3",
      "F4"
    ].forEach(key => {

      const slot =
        document.createElement("div");

      slot.className =
        "fragment-slot";

      slot.textContent =
        state.fragments[key] || "?";

      slots.appendChild(slot);
    });


    showScreen(
      "finalScreen"
    );
  }


  $("#submitFinal")
    .addEventListener(
      "click",
      () => {

        const value =
          $("#finalCode")
            .value
            .trim()
            .toUpperCase()
            .replace(
              /[^A-Z]/g,
              ""
            );


        if (value === "KEMBALI") {

          if (state.gameTicker) {
            clearInterval(
              state.gameTicker
            );
          }

          showScreen(
            "winScreen"
          );

        } else {

          const feedback =
            $("#finalFeedback");

          feedback.textContent =
            "Password salah. Ingat A=1, B=2, C=3 ...";

          feedback.style.color =
            "#ff6f86";
        }
      }
    );



  /* =========================================================
     FULL-SCREEN SWIPE UNLOCK
  ========================================================= */

  const lockScreen =
    $("#lockScreen");

  let swipeStartY = 0;

  let swipeDistance = 0;

  let swiping = false;


  lockScreen.style.touchAction =
    "none";


  lockScreen.addEventListener(
    "pointerdown",
    event => {

      swiping = true;

      swipeStartY =
        event.clientY;

      swipeDistance = 0;

      lockScreen.style.transition =
        "none";


      if (
        lockScreen.setPointerCapture
      ) {
        lockScreen.setPointerCapture(
          event.pointerId
        );
      }
    }
  );


  lockScreen.addEventListener(
    "pointermove",
    event => {

      if (!swiping) return;


      swipeDistance =
        Math.max(
          0,
          swipeStartY -
          event.clientY
        );


      const move =
        Math.min(
          swipeDistance,
          260
        );


      lockScreen.style.transform =
        `translateY(-${move}px)`;
    }
  );


  function endSwipe() {

    if (!swiping) return;

    swiping = false;


    if (swipeDistance >= 100) {

  /* ENTER FULLSCREEN */

  const phoneEl = $("#phone");

  if (phoneEl && !document.fullscreenElement) {

    const enterFullscreen =
      phoneEl.requestFullscreen ||
      phoneEl.webkitRequestFullscreen;

    if (enterFullscreen) {

      try {

        const result =
          enterFullscreen.call(phoneEl);

        if (
          result &&
          typeof result.catch === "function"
        ) {
          result.catch(() => {});
        }

      } catch (error) {
        // kalau browser tidak support,
        // game tetap lanjut normal
      }
    }
  }


  /* UNLOCK ANIMATION */

  lockScreen.style.transition =
    "transform .28s ease";

  lockScreen.style.transform =
    "translateY(-100%)";


  setTimeout(
    () => {

      lockScreen.style.transform =
        "";

      startGameClock();

      showScreen(
        "homeScreen"
      );

    },
    280
  );

    } else {

      lockScreen.style.transition =
        "transform .22s ease";


      lockScreen.style.transform =
        "translateY(0)";
    }
  }


  lockScreen.addEventListener(
    "pointerup",
    endSwipe
  );


  lockScreen.addEventListener(
    "pointercancel",
    endSwipe
  );



  /* =========================================================
     NAVIGATION
  ========================================================= */

  $("#backHome")
    .addEventListener(
      "click",
      () => {
        showScreen(
          "homeScreen"
        );
      }
    );


  $$("[data-app]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openApp(
            button.dataset.app
          );
        }
      );
    });



  /* =========================================================
     HINT BUTTON
     nanti kita ganti ke diamond system
  ========================================================= */

  $("#hintBtn")
    .addEventListener(
      "click",
      () => {

        toast(
          "Hint system baru akan dipasang di objective diamond."
        );
      }
    );



  /* =========================================================
     RESTART
  ========================================================= */

  $("#restartBtn")
    .addEventListener(
      "click",
      () => {

        location.reload();
      }
    );



  /* =========================================================
     INITIAL STATE
  ========================================================= */

  updateTimeUI();

})();
/* =========================================================
   HOME SCREEN V3 — less perfect, more game-like
========================================================= */

.home-screen{
  background-color:#29261f;

  /* very subtle dirty/noisy texture */
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E");

  padding-top:6px;
}


/* status bar: kecil, flat, bukan card */

.status-bar{
  padding:4px 3px 7px;

  background:transparent;

  border:0;
  box-shadow:none;

  font-size:10px;

  color:#d5d0c5;
}


/* objective lebih rapat ke kiri */

.objective-bar{
  margin-top:0;
  margin-bottom:19px;

  padding-left:1px;
  padding-right:1px;

  border-bottom-color:rgba(226,216,193,.18);
}


.objective-diamond{
  justify-self:start;

  color:#b89d62;
}


/* grid jangan terlalu "perfect app mockup" */

.app-grid{
  padding:0 3px 0 0;

  column-gap:5px;
  row-gap:23px;

  align-items:start;
}


/* bikin icon sedikit beda posisi */
.app-icon:nth-child(4n + 1){
  transform:translateY(1px);
}

.app-icon:nth-child(4n + 2){
  transform:translateY(-2px);
}

.app-icon:nth-child(4n + 3){
  transform:translateY(2px);
}

.app-icon:nth-child(4n){
  transform:translateY(-1px);
}


/* icon lebih padat, nggak bubble */

.icon-box{
  width:49px;
  height:49px;

  border-radius:5px;

  box-shadow:
    inset 0 1px rgba(255,255,255,.055),
    0 1px 1px rgba(0,0,0,.45);
}


.icon-box svg{
  width:25px;
  height:25px;

  stroke-width:1.65;
}


/* label tidak terlalu bold / polished */

.app-icon > span:last-child{
  font-size:9.5px;

  color:#ded9ce;

  letter-spacing:.01em;
}


/* dock lebih kayak launcher lawas */

.dock{
  left:0;
  right:0;
  bottom:0;

  height:67px;

  border-radius:0;

  background:rgba(24,23,20,.93);

  border-top:1px solid rgba(255,255,255,.09);
  border-bottom:0;

  padding:0 17px;
}


.dock-icon{
  opacity:.78;
}


.dock-icon svg{
  width:23px;
  height:23px;
}


/* unread badge lebih kecil / kasar */

.badge{
  top:-4px;
  right:4px;

  min-width:15px;
  height:15px;

  padding:0 3px;

  border-radius:3px;

  background:#88423c;

  font-size:8px;
}
