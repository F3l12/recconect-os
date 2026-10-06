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
    "winScreen",
    "failScreen"
  ];

  const GAME_START_TIME = (23 * 3600) + (55 * 60);
  const TIMER_LENGTH = 5 * 60;

  const state = {
    unlockedAt: null,
    gameTicker: null,
    timerExpiredNotified: false,
    unreadChats: {
  ibu: true,
  felicia: true,
  malachi: true
},

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
      lockTime.textContent = "23:55";
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

  if (state.gameTicker) {
    clearInterval(state.gameTicker);
  }

  showScreen("failScreen");
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
          23:55:00
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

  function updateMessageBadge() {

  const badge =
    document.querySelector(
      '.app-icon[data-app="messages"] .badge'
    );

  if (!badge) return;


  const unreadCount =
    Object.values(
      state.unreadChats
    ).filter(Boolean).length;


  if (unreadCount > 0) {

    badge.textContent =
      unreadCount;

    badge.style.display = "";

  } else {

    badge.style.display =
      "none";
  }
}



function renderMessages(root) {

  const chats = {

    ibu: {
      name: "Ibu",
      preview: "Jangan lupa tidur lebih cepat ya...",
      time: "23:41",

      messages: [
        [
          "them",
          "Besok Sekolah Minggu kan?"
        ],

        [
          "them",
          "Jangan lupa tidur lebih cepat ya. Sebelum jam 12."
        ],

        [
          "me",
          "Iya ma, bentar lagi."
        ],

        [
          "them",
          "Jangan 'bentar lagi' terus 😭"
        ]
      ]
    },


    felicia: {
      name: "Felicia",
      preview: "Games besok udah aman?",
      time: "23:35",

      messages: [
        [
          "them",
          "Games besok udah aman?"
        ],

        [
          "me",
          "Masih gue beresin."
        ],

        [
          "them",
          "Yang penting jangan cuma quiz biasa wkwk"
        ],

        [
          "them",
          "Kan temanya soal kita gampang ke-distract teknologi."
        ],

        [
          "me",
          "Iya, pengennya mereka ngerasain sendiri."
        ],

        [
          "them",
          "Sip. Besok tinggal nyambung ke Lukas 15."
        ]
      ]
    },


    malachi: {
      name: "Malachi",
      preview: "Ayat Lukas 15 udah gue masukin...",
      time: "23:28",

      messages: [
        [
          "them",
          "PPT hampir selesai."
        ],

        [
          "them",
          "Ayat Lukas 15 udah gue masukin juga."
        ],

        [
          "me",
          "Bagian yang anak bungsunya sadar terus balik kan?"
        ],

        [
          "them",
          "Yep."
        ],

        [
          "them",
          "Lu cek lagi aja nanti sebelum tidur."
        ]
      ]
    }
  };


  function showInbox() {

    $("#appTitle").textContent =
      "Messages";

    root.innerHTML = `
      <div class="messages-heading">
        <h2>Messages</h2>
        <span>3 conversations</span>
      </div>

      <div
        class="message-list"
        id="messageList"
      ></div>
    `;


    const list =
      $("#messageList", root);


    Object.entries(chats)
      .forEach(([id, chat]) => {

        const unread =
          state.unreadChats[id];


        const row =
          document.createElement(
            "button"
          );

        row.type =
          "button";

        row.className =
          "thread-row" +
          (unread ? " unread" : "");


        row.innerHTML = `
          <div class="thread-avatar">
            ${chat.name[0]}
          </div>

          <div class="thread-main">

            <div class="thread-top">

              <strong>
                ${chat.name}
              </strong>

              <small>
                ${chat.time}
              </small>

            </div>

            <div class="thread-preview">
              ${chat.preview}
            </div>

          </div>

          ${
            unread
              ? `<span class="unread-dot"></span>`
              : ``
          }
        `;


        row.addEventListener(
          "click",
          () => {

            state.unreadChats[id] =
              false;

            updateMessageBadge();

            showConversation(
              id
            );
          }
        );


        list.appendChild(row);
      });
  }



  function showConversation(id) {

    const chat =
      chats[id];

    $("#appTitle").textContent =
      chat.name;


    root.innerHTML = `
      <button
        id="backInbox"
        class="message-back"
        type="button"
      >
        ‹ Messages
      </button>

      <div class="conversation">

        <div class="conversation-name">
          <div class="thread-avatar large">
            ${chat.name[0]}
          </div>

          <strong>
            ${chat.name}
          </strong>
        </div>

        <div
          class="chat"
          id="conversationChat"
        ></div>

      </div>
    `;


    const chatRoot =
      $("#conversationChat", root);


    chat.messages.forEach(
      ([who, text]) => {

        const bubble =
          document.createElement(
            "div"
          );

        bubble.className =
          "bubble " + who;

        bubble.textContent =
          text;

        chatRoot.appendChild(
          bubble
        );
      }
    );


    $("#backInbox", root)
      .addEventListener(
        "click",
        showInbox
      );
  }


  showInbox();
  updateMessageBadge();
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
