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
    bibleSolved: false,
    bibleStep: 0,
    verseClueOpened: false,
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
function showObjectivePopup(text) {

  const phone =
    $("#phone");

  if (!phone) return;


  let popup =
    $("#objectivePopup");


  if (!popup) {

    popup =
      document.createElement("div");

    popup.id =
      "objectivePopup";

    popup.className =
      "objective-popup";

    phone.appendChild(
      popup
    );
  }


  popup.innerHTML = `
    <small>OBJECTIVE BARU</small>
    <strong>${text}</strong>
  `;


  popup.classList.remove(
    "show"
  );


  requestAnimationFrame(
    () => {
      popup.classList.add(
        "show"
      );
    }
  );


  clearTimeout(
    popup.hideTimer
  );


  popup.hideTimer =
    setTimeout(
      () => {
        popup.classList.remove(
          "show"
        );
      },
      2400
    );
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

function finishGame() {

  const elapsed =
    getElapsedSeconds();

  const minutes =
    Math.floor(elapsed / 60);

  const seconds =
    elapsed % 60;

  const finishTime =
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`;


  if (state.gameTicker) {
    clearInterval(
      state.gameTicker
    );
  }


  const winScreen =
    $("#winScreen");

  if (winScreen) {

    winScreen.innerHTML = `
      <div class="final-card">

        <small>SELESAI</small>

        <h2>${finishTime}</h2>

        <p>
          Persiapan games selesai.
        </p>

        <button
          class="primary-btn"
          type="button"
          onclick="location.reload()"
        >
          Main Lagi
        </button>

      </div>
    `;
  }


  showScreen(
    "winScreen"
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
          00:05:00
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
    badge.textContent = unreadCount;
    badge.style.display = "";
  } else {
    badge.style.display = "none";
  }
}



function renderMessages(root) {

  const chats = {

    ibu: {
  name: "Ibu",
  preview: "Jangan lupa tidur lebih cepat ya...",
  time: "23:41",

  messages: [
    ["them", "Udah makan?"],
    ["me", "udah"],
    ["them", "Besok Sekolah Minggu kan?"],
    ["me", "iyaa"],
    ["them", "Tasnya udah siap?"],
    ["me", "belom"],
    ["them", "Ya siapin dulu sebelum tidur"],
    ["me", "iyaa nanti"],
    ["them", "Jangan lupa tidur lebih cepat ya. Sebelum jam 12."],
    ["me", "iyaa ma"],
    ["me", "bentar lagi tidur"],
    ["them", "Jangan bentar lagi terus"]
  ]
},

    felicia: {
      name: "Felicia",
      preview: "ya baca dulu sana 😭",
      time: "23:54",

      messages: [

        /* chat lama / filler */

        ["them", "oi"],
        ["me", "apaa"],
        ["them", "besok kumpul jam brp"],
        ["me", "730 bukan"],
        ["them", "iya"],
        ["me", "gw kemungkinan telat dikit"],
        ["them", "jgn."],

        ["them", "AOSGALEGLSGR"],
        ["me", "apaan jir"],
        ["them", "kepencet 😭"],

        ["me", "ppt siapa yg pegang"],
        ["them", "malachi"],
        ["me", "udah jadi?"],
        ["them", "harusnya udh"],

        ["them", "lu jangan lupa games ya"],
        ["me", "iya aman"],

        /* chat terbaru */

        ["me", "fel"],
        ["me", "games besok gmn sih akhirnya"],

        ["them", "lah"],
        ["them", "kan lu bagian games 😭"],

        ["me", "iyaa"],
        ["me", "maksud gw penutupnya"],
        ["me", "gw masih bingung mau nyambunginnya ke apa"],

        ["them", "ke firman besok lah"],

        ["me", "yang mana"],

        ["them", "Lukas 15"],
        ["them", "yang anak hilang"],

        ["me", "bagian mana tepatnya"],

        ["them", "21-22 sama 24 paling kepake"],

        ["me", "gw blm baca 💀"],
        ["me", "sbr gw baca dulu"],

        ["them", "ya baca dulu sana 😭"]
      ]
    },


   malachi: {
  name: "Malachi",
  preview: "oke sip",
  time: "23:27",

  messages: [
    ["them", "besok lu bawa laptop ga"],
    ["me", "kayaknya hp aja"],
    ["them", "oh oke"],
    ["me", "ppt aman kan"],
    ["them", "aman"],
    ["me", "ayat udh masuk?"],
    ["them", "udah"],
    ["them", "Lukas 15"],
    ["me", "besok dateng jam brp"],
    ["them", "sekitar 720 kali"],
    ["me", "oke sip"]
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
          document.createElement("button");

        row.type = "button";

        row.className =
          "thread-row" +
          (unread ? " unread" : "");

        row.innerHTML = `
          <div class="thread-avatar">
            ${chat.name[0]}
          </div>

          <div class="thread-main">

            <div class="thread-top">
              <strong>${chat.name}</strong>
              <small>${chat.time}</small>
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

            showConversation(id);
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

          <strong>${chat.name}</strong>
        </div>

        <div
          class="chat"
          id="conversationChat"
        ></div>

        <div
          id="quickReplyArea"
        ></div>

      </div>
    `;


    const chatRoot =
      $("#conversationChat", root);


   chat.messages.forEach(
  ([who, text]) => {

    const bubble =
      document.createElement("div");


    const isVerseClue =
      id === "felicia" &&
      text ===
        "21-22 sama 24 paling kepake";


    bubble.className =
      "bubble " + who;


    if (
      isVerseClue &&
      !state.verseClueOpened
    ) {
      bubble.classList.add(
        "clue-pulse"
      );
    }


    if (
      isVerseClue &&
      state.verseClueOpened
    ) {
      bubble.classList.add(
        "clue-opened"
      );
    }


    bubble.textContent =
      text;


    if (isVerseClue) {

      bubble.addEventListener(
        "click",
        () => {

          if (
            state.verseClueOpened
          ) {
            return;
          }


          state.verseClueOpened =
            true;


          bubble.classList.remove(
            "clue-pulse"
          );

          bubble.classList.add(
            "clue-opened"
          );


          const objective =
            $("#objectiveText");


          if (objective) {
            objective.textContent =
              "Baca Lukas 15:21–22 dan 24.";
          }


          showObjectivePopup(
            "Baca Lukas 15:21–22 dan 24."
          );
        }
      );
    }


    chatRoot.appendChild(
      bubble
    );
  }
);


    if (
  id === "felicia" &&
  state.bibleSolved
) {
  renderFeliciaReplies();
}

    /*
      otomatis scroll ke chat terbaru
      supaya pemain nggak mulai dari chat lama
    */

    requestAnimationFrame(() => {

  const scrollArea =
    root.closest(".screen");

  if (scrollArea) {
    scrollArea.scrollTop =
      scrollArea.scrollHeight;
  }

});


    $("#backInbox", root)
      .addEventListener(
        "click",
        showInbox
      );
  }



  function renderFeliciaReplies() {

  const area =
    $("#quickReplyArea", root);

  if (!area) return;


  area.innerHTML = `
    <div class="quick-reply-label">
      Felicia: jadi penutupnya apa?
    </div>

    <button
      class="quick-reply"
      data-answer="wrong"
      type="button"
    >
      Berarti teknologi harus dijauhi.
    </button>

    <button
      class="quick-reply"
      data-answer="correct"
      type="button"
    >
      Kalau hal lain mulai membuat kita melupakan Tuhan,
      kita perlu kembali memprioritaskan Tuhan.
    </button>

    <button
      class="quick-reply"
      data-answer="wrong"
      type="button"
    >
      Intinya kita harus mengurangi screen time.
    </button>
  `;


  $$(".quick-reply", area)
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (
            button.dataset.answer ===
            "correct"
          ) {

            area.innerHTML = "";

            area.classList.add(
              "reply-conversation"
            );


            const myReply =
              document.createElement("div");

            myReply.className =
              "bubble me";

            myReply.textContent =
              "Kalau hal lain mulai membuat kita melupakan Tuhan, kita perlu kembali memprioritaskan Tuhan.";

            area.appendChild(
              myReply
            );


            const scrollToBottom =
              () => {

                const scrollArea =
                  root.closest(".screen");

                if (scrollArea) {
                  scrollArea.scrollTop =
                    scrollArea.scrollHeight;
                }
              };


            scrollToBottom();


            setTimeout(
              () => {

                const reply1 =
                  document.createElement(
                    "div"
                  );

                reply1.className =
                  "bubble them";

                reply1.textContent =
                  "nah iya";

                area.appendChild(
                  reply1
                );

                scrollToBottom();

              },
              450
            );


            setTimeout(
              () => {

                const reply2 =
                  document.createElement(
                    "div"
                  );

                reply2.className =
                  "bubble them";

                reply2.textContent =
                  "pake itu aja besok";

                area.appendChild(
                  reply2
                );

                scrollToBottom();

              },
              950
            );


            setTimeout(
              finishGame,
              1800
            );

          } else {

            const oldReply =
              $(".wrong-reply-msg", area);

            if (oldReply) {
              oldReply.remove();
            }


            const reply =
              document.createElement("div");

            reply.className =
              "bubble them wrong-reply-msg";

            reply.textContent =
              "bukan gitu, coba baca lagi inti ayatnya";

            area.prepend(
              reply
            );
          }
        }
      );
    });
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

  const verses = [

    {
      number: "21",

      pieces: [
        "Ayah, kata anak itu,",
        "aku sudah berdosa terhadap Allah",
        "dan terhadap Ayah.",
        "Tidak layak lagi",
        "aku disebut anak Ayah."
      ]
    },

    {
      number: "22",

      pieces: [
        "Tetapi ayahnya memanggil pelayan-pelayannya",
        "dan berkata, Cepat!",
        "Ambillah pakaian yang paling bagus",
        "dan pakaikanlah kepadanya.",
        "Kenakanlah cincin pada jarinya",
        "dan sepatu pada kakinya."
      ]
    },

    {
      number: "24",

      pieces: [
        "Sebab anakku ini sudah mati,",
        "sekarang hidup lagi;",
        "ia sudah hilang,",
        "sekarang ditemukan kembali.",
        "Lalu mulailah mereka berpesta."
      ]
    }

  ];


  function shuffle(array) {

    const result =
      [...array];

    for (
      let i = result.length - 1;
      i > 0;
      i--
    ) {

      const j =
        Math.floor(
          Math.random() *
          (i + 1)
        );

      [
        result[i],
        result[j]
      ] = [
        result[j],
        result[i]
      ];
    }

    return result;
  }



  /* ===============================
     ALL VERSES FINISHED
  =============================== */

  if (state.bibleSolved) {

    root.innerHTML = `
      <div class="bible-reader-head">

        <small>LUKAS 15</small>

        <h2>
          Ayat selesai diperbaiki.
        </h2>

        <p>
          Kamu sudah membaca bagian
          yang Felicia maksud.
        </p>

      </div>

      <button
        id="backToMessages"
        class="primary-btn"
        type="button"
      >
        Kembali ke Messages
      </button>
    `;


    $("#backToMessages", root)
      .addEventListener(
        "click",
        () => {

          openApp(
            "messages"
          );
        }
      );

    return;
  }



  /* ===============================
     CURRENT VERSE
  =============================== */

  const verse =
    verses[state.bibleStep];

  let selected = [];

  let remaining =
    shuffle(
      verse.pieces
    );


  root.innerHTML = `
    <div class="bible-reader-head">

      <small>
        LUKAS 15:${verse.number}
      </small>

      <h2>
        Perbaiki ayat
      </h2>

      <p>
        Buka Alkitab asli dan susun
        potongan berikut sesuai
        urutan ayatnya.
      </p>

    </div>


    <div class="verse-progress">

      <span class="${
        state.bibleStep >= 0
          ? "done"
          : ""
      }">
        21
      </span>

      <span class="${
        state.bibleStep >= 1
          ? "done"
          : ""
      }">
        22
      </span>

      <span class="${
        state.bibleStep >= 2
          ? "done"
          : ""
      }">
        24
      </span>

    </div>


    <div class="verse-answer">

      <small>
        URUTANMU
      </small>

      <div
        id="selectedPieces"
        class="selected-pieces"
      ></div>

    </div>


    <div class="verse-pool">

      <small>
        POTONGAN AYAT
      </small>

      <div
        id="availablePieces"
        class="available-pieces"
      ></div>

    </div>


    <div class="bible-actions">

      <button
        id="resetVerse"
        class="secondary-btn"
        type="button"
      >
        Ulang
      </button>

      <button
        id="checkVerse"
        class="primary-btn"
        type="button"
      >
        Cek urutan
      </button>

    </div>


    <p
      id="verseFeedback"
      class="verse-feedback"
    ></p>
  `;



  const selectedRoot =
    $("#selectedPieces", root);

  const availableRoot =
    $("#availablePieces", root);

  const feedback =
    $("#verseFeedback", root);



  function draw() {

    selectedRoot.innerHTML =
      "";

    availableRoot.innerHTML =
      "";


    selected.forEach(
      (text, index) => {

        const piece =
          document.createElement(
            "button"
          );

        piece.type =
          "button";

        piece.className =
          "verse-piece selected";

        piece.innerHTML = `
          <span>
            ${index + 1}
          </span>

          ${text}
        `;


        piece.addEventListener(
          "click",
          () => {

            selected.splice(
              index,
              1
            );

            remaining.push(
              text
            );

            feedback.textContent =
              "";

            draw();
          }
        );


        selectedRoot.appendChild(
          piece
        );
      }
    );



    remaining.forEach(
      (text, index) => {

        const piece =
          document.createElement(
            "button"
          );

        piece.type =
          "button";

        piece.className =
          "verse-piece";

        piece.textContent =
          text;


        piece.addEventListener(
          "click",
          () => {

            remaining.splice(
              index,
              1
            );

            selected.push(
              text
            );

            feedback.textContent =
              "";

            draw();
          }
        );


        availableRoot.appendChild(
          piece
        );
      }
    );
  }



  $("#resetVerse", root)
    .addEventListener(
      "click",
      () => {

        selected = [];

        remaining =
          shuffle(
            verse.pieces
          );

        feedback.textContent =
          "";

        draw();
      }
    );



  $("#checkVerse", root)
    .addEventListener(
      "click",
      () => {

        if (
          selected.length !==
          verse.pieces.length
        ) {

          feedback.textContent =
            "Masih ada potongan yang belum dipakai.";

          return;
        }


        const correct =
          selected.every(
            (text, index) =>
              text ===
              verse.pieces[index]
          );


        if (!correct) {

          feedback.textContent =
            "Urutannya belum tepat. Cocokkan lagi dengan Alkitab.";

          return;
        }


        state.bibleStep++;


        if (
          state.bibleStep >=
          verses.length
        ) {

          state.bibleSolved =
            true;

          const objective =
            $("#objectiveText");

          if (objective) {
            objective.textContent =
              "Balik ke chat Felicia.";
          }
          showObjectivePopup(
  "Balik ke chat Felicia."
);


          root.innerHTML = `
            <div class="bible-complete">

              <small>
                LUKAS 15
              </small>

              <h2>
                Selesai.
              </h2>

              <p>
                Semua bagian ayat sudah
                disusun dengan benar.
              </p>

              <button
                id="backToMessages"
                class="primary-btn"
                type="button"
              >
                Kembali ke Messages
              </button>

            </div>
          `;


          $("#backToMessages", root)
            .addEventListener(
              "click",
              () => {

                openApp(
                  "messages"
                );
              }
            );


          return;
        }


        /*
          lanjut langsung ke ayat berikutnya
        */

        renderBible(root);
      }
    );


  draw();
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

 /* ENTER FULLSCREEN
   fullscreen PAGE, not the phone itself
*/

const fullscreenTarget =
  document.documentElement;

if (!document.fullscreenElement) {

  const enterFullscreen =
    fullscreenTarget.requestFullscreen ||
    fullscreenTarget.webkitRequestFullscreen;

  if (enterFullscreen) {

    try {

      const result =
        enterFullscreen.call(
          fullscreenTarget
        );

      if (
        result &&
        typeof result.catch === "function"
      ) {
        result.catch(() => {});
      }

    } catch (error) {
      /* game still works without fullscreen */
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
