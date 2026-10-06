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

    timePenaltySeconds: 0,

    arcadeBest: {
      signal: null,
      memory: null,
      stop: null
    },

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

    screens.forEach(
      screenId => {

        const screen =
          $("#" + screenId);

        if (screen) {

          screen.classList.toggle(
            "active",
            screenId === id
          );
        }
      }
    );
  }


  function toast(message) {

    const toastBox =
      $("#toast");

    if (!toastBox) {
      return;
    }


    toastBox.textContent =
      message;

    toastBox.classList.add(
      "show"
    );


    setTimeout(
      () => {

        toastBox.classList.remove(
          "show"
        );

      },
      2200
    );
  }


  function showObjectivePopup(text) {

    const phone =
      $("#phone");

    if (!phone) {
      return;
    }


    let popup =
      $("#objectivePopup");


    if (!popup) {

      popup =
        document.createElement(
          "div"
        );

      popup.id =
        "objectivePopup";

      popup.className =
        "objective-popup";

      phone.appendChild(
        popup
      );
    }


    popup.innerHTML = `
      <small>
        OBJECTIVE BARU
      </small>

      <strong>
        ${text}
      </strong>
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


  function showTimePenaltyPopup(seconds) {

    const phone =
      $("#phone");

    if (!phone) {
      return;
    }


    let popup =
      $("#timePenaltyPopup");


    if (!popup) {

      popup =
        document.createElement(
          "div"
        );

      popup.id =
        "timePenaltyPopup";

      popup.className =
        "time-penalty-popup";

      phone.appendChild(
        popup
      );
    }


    popup.innerHTML = `
      <small>
        WAKTU BERLALU
      </small>

      <strong>
        +00:${String(seconds).padStart(2, "0")}
      </strong>
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
        1800
      );
  }



  /* =========================================================
     TIME SYSTEM
  ========================================================= */

  function getElapsedSeconds() {

    if (!state.unlockedAt) {
      return 0;
    }


    const realElapsed =
      Math.floor(
        (
          Date.now() -
          state.unlockedAt
        ) / 1000
      );


    return (
      realElapsed +
      state.timePenaltySeconds
    );
  }


  function formatClock(totalSeconds) {

    totalSeconds =
      (
        (
          totalSeconds %
          86400
        ) +
        86400
      ) %
      86400;


    const h =
      Math.floor(
        totalSeconds /
        3600
      );


    const m =
      Math.floor(
        (
          totalSeconds %
          3600
        ) /
        60
      );


    const s =
      totalSeconds %
      60;


    return {

      h:
        String(h)
          .padStart(
            2,
            "0"
          ),

      m:
        String(m)
          .padStart(
            2,
            "0"
          ),

      s:
        String(s)
          .padStart(
            2,
            "0"
          )
    };
  }


  function formatCountdown(
    totalSeconds
  ) {

    totalSeconds =
      Math.max(
        0,
        totalSeconds
      );


    const h =
      Math.floor(
        totalSeconds /
        3600
      );


    const m =
      Math.floor(
        (
          totalSeconds %
          3600
        ) /
        60
      );


    const s =
      totalSeconds %
      60;


    return (
      `${String(h).padStart(2, "0")}:` +
      `${String(m).padStart(2, "0")}:` +
      `${String(s).padStart(2, "0")}`
    );
  }


  function updateTimeUI() {

    const elapsed =
      getElapsedSeconds();


    const normalTime =
      GAME_START_TIME +
      elapsed;


    const normal =
      formatClock(
        normalTime
      );


    /* status bar */

    const statusClock =
      $("#clock");

    if (statusClock) {

      statusClock.textContent =
        `${normal.h}:${normal.m}`;
    }


    /* lock screen */

    const lockTime =
      $("#lockTime");

    if (
      lockTime &&
      !state.unlockedAt
    ) {

      lockTime.textContent =
        "23:55";
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
        TIMER_LENGTH -
        elapsed
      );


    const countdownClock =
      $("#countdownClock");

    if (countdownClock) {

      countdownClock.textContent =
        formatCountdown(
          remaining
        );
    }


    /* timer finished */

    if (
      state.unlockedAt &&
      remaining === 0 &&
      !state.timerExpiredNotified
    ) {

      state.timerExpiredNotified =
        true;


      if (
        state.gameTicker
      ) {

        clearInterval(
          state.gameTicker
        );
      }


      showScreen(
        "failScreen"
      );
    }
  }


  function startGameClock() {

    if (
      !state.unlockedAt
    ) {

      state.unlockedAt =
        Date.now();
    }


    updateTimeUI();


    if (
      state.gameTicker
    ) {

      clearInterval(
        state.gameTicker
      );
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
      Math.floor(
        elapsed /
        60
      );


    const seconds =
      elapsed %
      60;


    const finishTime =
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;


    if (
      state.gameTicker
    ) {

      clearInterval(
        state.gameTicker
      );
    }


    const winScreen =
      $("#winScreen");


    if (winScreen) {

      winScreen.innerHTML = `
        <div class="final-card">

          <small>
            SELESAI
          </small>

          <h2>
            ${finishTime}
          </h2>

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

    const app =
      apps[name];

    if (!app) {
      return;
    }


    $("#appTitle")
      .textContent =
      app.title;


    const root =
      $("#appContent");


    root.innerHTML =
      "";


    app.render(
      root
    );


    showScreen(
      "appScreen"
    );
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

        clockView.style.display =
          "";

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

        timerView.style.display =
          "";

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
  ========================================================= */

  function updateMessageBadge() {

    const badge =
      document.querySelector(
        '.app-icon[data-app="messages"] .badge'
      );


    if (!badge) {
      return;
    }


    const unreadCount =
      Object.values(
        state.unreadChats
      ).filter(Boolean)
        .length;


    if (
      unreadCount >
      0
    ) {

      badge.textContent =
        unreadCount;

      badge.style.display =
        "";

    } else {

      badge.style.display =
        "none";
    }
  }


  function renderMessages(root) {

    const chats = {

      ibu: {

        name:
          "Ibu",

        preview:
          "Jangan lupa tidur lebih cepat ya...",

        time:
          "23:41",

        messages: [

          [
            "them",
            "Udah makan?"
          ],

          [
            "me",
            "udah"
          ],

          [
            "them",
            "Besok Sekolah Minggu kan?"
          ],

          [
            "me",
            "iyaa"
          ],

          [
            "them",
            "Tasnya udah siap?"
          ],

          [
            "me",
            "belom"
          ],

          [
            "them",
            "Ya siapin dulu sebelum tidur"
          ],

          [
            "me",
            "iyaa nanti"
          ],

          [
            "them",
            "Jangan lupa tidur lebih cepat ya. Sebelum jam 12."
          ],

          [
            "me",
            "iyaa ma"
          ],

          [
            "me",
            "bentar lagi tidur"
          ],

          [
            "them",
            "Jangan bentar lagi terus"
          ]
        ]
      },


      felicia: {

        name:
          "Felicia",

        preview:
          "ya baca dulu sana 😭",

        time:
          "23:54",

        messages: [

          [
            "them",
            "oi"
          ],

          [
            "me",
            "apaa"
          ],

          [
            "them",
            "besok kumpul jam brp"
          ],

          [
            "me",
            "730 bukan"
          ],

          [
            "them",
            "iya"
          ],

          [
            "me",
            "gw kemungkinan telat dikit"
          ],

          [
            "them",
            "jgn."
          ],

          [
            "them",
            "AOSGALEGLSGR"
          ],

          [
            "me",
            "apaan jir"
          ],

          [
            "them",
            "kepencet 😭"
          ],

          [
            "me",
            "ppt siapa yg pegang"
          ],

          [
            "them",
            "malachi"
          ],

          [
            "me",
            "udah jadi?"
          ],

          [
            "them",
            "harusnya udh"
          ],

          [
            "them",
            "lu jangan lupa games ya"
          ],

          [
            "me",
            "iya aman"
          ],

          [
            "me",
            "fel"
          ],

          [
            "me",
            "games besok gmn sih akhirnya"
          ],

          [
            "them",
            "lah"
          ],

          [
            "them",
            "kan lu bagian games 😭"
          ],

          [
            "me",
            "iyaa"
          ],

          [
            "me",
            "maksud gw penutupnya"
          ],

          [
            "me",
            "gw masih bingung mau nyambunginnya ke apa"
          ],

          [
            "them",
            "ke firman besok lah"
          ],

          [
            "me",
            "yang mana"
          ],

          [
            "them",
            "Lukas 15"
          ],

          [
            "them",
            "yang anak hilang"
          ],

          [
            "me",
            "bagian mana tepatnya"
          ],

          [
            "them",
            "21-22 sama 24 paling kepake"
          ],

          [
            "me",
            "gw blm baca 💀"
          ],

          [
            "me",
            "sbr gw baca dulu"
          ],

          [
            "them",
            "ya baca dulu sana 😭"
          ]
        ]
      },


      malachi: {

        name:
          "Malachi",

        preview:
          "oke sip",

        time:
          "23:27",

        messages: [

          [
            "them",
            "besok lu bawa laptop ga"
          ],

          [
            "me",
            "kayaknya hp aja"
          ],

          [
            "them",
            "oh oke"
          ],

          [
            "me",
            "ppt aman kan"
          ],

          [
            "them",
            "aman"
          ],

          [
            "me",
            "ayat udh masuk?"
          ],

          [
            "them",
            "udah"
          ],

          [
            "them",
            "Lukas 15"
          ],

          [
            "me",
            "besok dateng jam brp"
          ],

          [
            "them",
            "sekitar 720 kali"
          ],

          [
            "me",
            "oke sip"
          ]
        ]
      }
    };


    function showInbox() {

      $("#appTitle")
        .textContent =
        "Messages";


      root.innerHTML = `
        <div class="messages-heading">

          <h2>
            Messages
          </h2>

          <span>
            3 conversations
          </span>

        </div>


        <div
          class="message-list"
          id="messageList"
        ></div>
      `;


      const list =
        $("#messageList", root);


      Object.entries(
        chats
      ).forEach(
        ([id, chat]) => {

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
            (
              unread
                ? " unread"
                : ""
            );


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
                ? `
                  <span
                    class="unread-dot"
                  ></span>
                `
                : ""
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


          list.appendChild(
            row
          );
        }
      );
    }


    function showConversation(id) {

      const chat =
        chats[id];


      $("#appTitle")
        .textContent =
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

            <div
              class="thread-avatar large"
            >
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
            document.createElement(
              "div"
            );


          const isVerseClue =
            id ===
              "felicia" &&
            text ===
              "21-22 sama 24 paling kepake";


          bubble.className =
            "bubble " +
            who;


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


          if (
            isVerseClue
          ) {

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


                if (
                  objective
                ) {

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
        id ===
          "felicia" &&
        state.bibleSolved
      ) {

        renderFeliciaReplies();
      }


      requestAnimationFrame(
        () => {

          const scrollArea =
            root.closest(
              ".screen"
            );


          if (
            scrollArea
          ) {

            scrollArea.scrollTop =
              scrollArea.scrollHeight;
          }
        }
      );


      $("#backInbox", root)
        .addEventListener(
          "click",
          showInbox
        );
    }


    function renderFeliciaReplies() {

      const area =
        $("#quickReplyArea", root);


      if (!area) {
        return;
      }


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


      $$(
        ".quick-reply",
        area
      ).forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              if (
                button.dataset.answer ===
                "correct"
              ) {

                area.innerHTML =
                  "";


                area.classList.add(
                  "reply-conversation"
                );


                const myReply =
                  document.createElement(
                    "div"
                  );


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
                      root.closest(
                        ".screen"
                      );


                    if (
                      scrollArea
                    ) {

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
                  $(
                    ".wrong-reply-msg",
                    area
                  );


                if (
                  oldReply
                ) {

                  oldReply.remove();
                }


                const reply =
                  document.createElement(
                    "div"
                  );


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
        }
      );
    }


    showInbox();

    updateMessageBadge();
  }



  /* =========================================================
     NOTES
  ========================================================= */
function renderNotes(root) {

  root.innerHTML = `
    <div class="notes-list">

      <article class="note-paper">

        <small>
          SENIN
        </small>

        <b>
          tugas
        </b>

        <p>
          Kimia — hal. 82–84,
          no. 13–20
        </p>

        <p>
          Ekonomi — selesain
          jurnal penyesuaian
        </p>

      </article>


      <article class="note-paper">

        <small>
          JANGAN LUPA
        </small>

        <b>
          minggu ini
        </b>

        <p>
          ringkasan sejarah
        </p>

        <p>
          tugas bindo
        </p>

        <p>
          cek ppt sekolah minggu
        </p>

      </article>


      <article class="note-paper">

        <small>
          RANDOM
        </small>

        <b>
          nanti
        </b>

        <p>
          rapihin folder download
        </p>

        <p>
          ganti wallpaper
        </p>

        <p>
          tidur lebih awal
        </p>

      </article>

    </div>
  `;
}



  /* =========================================================
     GALLERY
  ========================================================= */
function renderGallery(root) {

  const photos = [

  {
    src: "./chudGhost.jpg",
    name: "IMG_2841.jpg"
  },

  {
    src: "./hampter67.jpg",
    name: "IMG_2845.jpg"
  },

  {
    src: "./muehehheCat.jpg",
    name: "IMG_2850.jpg"
  },

  {
    src: "./ghostHousedude.jpg",
    name: "IMG_2853.jpg"
  },

  {
    src: "./hampterRage.jpg",
    name: "IMG_2857.jpg"
  },

  {
    src: "./beemoviethanos.jpg",
    name: "IMG_2862.jpg"
  }

];


  root.innerHTML = `
    <div class="gallery-head">

      <div>
        <small>
          RECENTS
        </small>

        <h2>
          Gallery
        </h2>
      </div>

      <span>
        ${photos.length} photos
      </span>

    </div>


    <div
      id="galleryGrid"
      class="gallery-real-grid"
    ></div>
  `;


  const grid =
    $("#galleryGrid", root);


  photos.forEach(
    (photo, index) => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "gallery-thumb";


      button.innerHTML = `
        <img
          src="${photo.src}"
          alt=""
          draggable="false"
        >
      `;


      button.addEventListener(
        "click",
        () => {

          openViewer(
            index
          );
        }
      );


      grid.appendChild(
        button
      );
    }
  );



  function openViewer(
    startIndex
  ) {

    const phone =
      $("#phone");


    let currentIndex =
      startIndex;


    const viewer =
      document.createElement(
        "div"
      );


    viewer.className =
      "gallery-viewer";


    viewer.innerHTML = `
      <div class="gallery-viewer-top">

        <button
          id="galleryClose"
          type="button"
        >
          ‹
        </button>


        <div>

          <strong id="galleryFileName">
          </strong>

          <small id="galleryCounter">
          </small>

        </div>

      </div>


      <div
        id="galleryImageArea"
        class="gallery-image-area"
      >

        <img
          id="galleryFullImage"
          draggable="false"
          alt=""
        >

      </div>


      <div class="gallery-viewer-bottom">

        <button
          id="galleryPrev"
          type="button"
        >
          ‹
        </button>


        <span>
          RECENTS
        </span>


        <button
          id="galleryNext"
          type="button"
        >
          ›
        </button>

      </div>
    `;


    phone.appendChild(
      viewer
    );


    const image =
      $("#galleryFullImage", viewer);


    const fileName =
      $("#galleryFileName", viewer);


    const counter =
      $("#galleryCounter", viewer);


    const prev =
      $("#galleryPrev", viewer);


    const next =
      $("#galleryNext", viewer);



    function draw() {

      const photo =
        photos[
          currentIndex
        ];


      image.src =
        photo.src;


      fileName.textContent =
        photo.name;


      counter.textContent =
        `${currentIndex + 1} of ${photos.length}`;


      prev.disabled =
        currentIndex ===
        0;


      next.disabled =
        currentIndex ===
        photos.length - 1;
    }



    function goPrevious() {

      if (
        currentIndex <=
        0
      ) {

        return;
      }


      currentIndex--;


      draw();
    }



    function goNext() {

      if (
        currentIndex >=
        photos.length - 1
      ) {

        return;
      }


      currentIndex++;


      draw();
    }



    $("#galleryClose", viewer)
      .addEventListener(
        "click",
        () => {

          viewer.remove();
        }
      );


    prev.addEventListener(
      "click",
      goPrevious
    );


    next.addEventListener(
      "click",
      goNext
    );



    /* swipe kiri / kanan */

    const imageArea =
      $("#galleryImageArea", viewer);


    let startX =
      0;


    let dragging =
      false;


    imageArea.addEventListener(
      "pointerdown",
      event => {

        dragging =
          true;


        startX =
          event.clientX;


        if (
          imageArea.setPointerCapture
        ) {

          imageArea.setPointerCapture(
            event.pointerId
          );
        }
      }
    );


    imageArea.addEventListener(
      "pointerup",
      event => {

        if (
          !dragging
        ) {

          return;
        }


        dragging =
          false;


        const distance =
          event.clientX -
          startX;


        if (
          distance >
          55
        ) {

          goPrevious();
        }


        if (
          distance <
          -55
        ) {

          goNext();
        }
      }
    );


    imageArea.addEventListener(
      "pointercancel",
      () => {

        dragging =
          false;
      }
    );


    draw();
  }
}



  /* =========================================================
     BROWSER
  ========================================================= */

  function renderBrowser(root) {

  const history = [

    [
      "23:39",
      "cara bangun pagi"
    ],

    [
      "23:17",
      "how to be cool without trying"
    ],

    [
      "22:51",
      "what is inside a woman's thoughts"
    ],

    [
      "22:08",
      "why do cats stare at nothing"
    ],

    [
      "21:34",
      "google drive"
    ],

    [
      "20:42",
      "can you survive on 4 hours of sleep"
    ],

    [
      "19:56",
      "why do i look better in mirrors"
    ],

    [
      "18:23",
      "youtube"
    ],

    [
      "17:11",
      "is cereal soup"
    ],

    [
      "16:48",
      "weather tomorrow"
    ],

    [
      "15:02",
      "why am i tired after doing nothing"
    ],

    [
      "13:27",
      "how to win an argument when you're wrong"
    ]

  ];


  root.innerHTML = `
    <div class="browser-search">

      <div class="browser-search-box">
        Search
      </div>

    </div>


    <div class="browser-history-head">

      <strong>
        Recent searches
      </strong>

      <small>
        TODAY
      </small>

    </div>


    <div
      id="browserHistory"
      class="browser-history"
    ></div>
  `;


  const list =
    $("#browserHistory", root);


  history.forEach(
    ([time, query]) => {

      const row =
        document.createElement(
          "button"
        );


      row.type =
        "button";


      row.className =
        "browser-history-row";


      row.innerHTML = `
        <span>
          ${query}
        </span>

        <small>
          ${time}
        </small>
      `;


      row.addEventListener(
        "click",
        () => {

          toast(
            "No internet connection."
          );
        }
      );


      list.appendChild(
        row
      );
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


  const references = [

    {
      id: "mazmur",
      title: "Mazmur 23",
      meta: "Mazmur · 6 ayat"
    },

    {
      id: "amsal",
      title: "Amsal 3:5–6",
      meta: "Amsal · 2 ayat"
    },

    {
      id: "lukas",
      title: "Lukas 15:21–22, 24",
      meta: "Lukas · Anak yang Hilang"
    },

    {
      id: "yohanes",
      title: "Yohanes 15:5",
      meta: "Yohanes · 1 ayat"
    }

  ];



  function shuffle(array) {

    const result =
      [...array];


    for (
      let i =
        result.length - 1;

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



  /* =========================================================
     ALREADY FINISHED
  ========================================================= */

  if (state.bibleSolved) {

    root.innerHTML = `
      <div class="bible-reader-head">

        <small>
          LUKAS 15
        </small>

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



  /* =========================================================
     SEARCH HOME
  ========================================================= */

  function showSearch() {

    root.innerHTML = `
      <div class="bible-search-head">

        <small>
          BIBLE
        </small>

        <h2>
          Cari ayat
        </h2>

      </div>


      <div class="bible-search-wrap">

        <input
          id="bibleSearch"
          class="bible-search-input"
          type="text"
          placeholder="Cari kitab atau ayat..."
          autocomplete="off"
          ${
            state.verseClueOpened
              ? ""
              : "disabled"
          }
        >

      </div>


      <div
        id="bibleReferenceList"
        class="bible-reference-list"
      ></div>


      ${
        !state.verseClueOpened

          ? `
            <div class="bible-search-empty">

              <small>
                BELUM ADA PENCARIAN
              </small>

              <p>
                Cari referensi dari pesan
                atau catatan terlebih dahulu.
              </p>

            </div>
          `

          : `
            <div class="bible-search-note">
              REFERENSI TERAKHIR
            </div>
          `
      }
    `;


    if (
      !state.verseClueOpened
    ) {

      return;
    }


    const search =
      $("#bibleSearch", root);


    const list =
      $("#bibleReferenceList", root);



    function drawReferences(
      query = ""
    ) {

      const normalized =
        query
          .trim()
          .toLowerCase();


      const filtered =
        references.filter(
          reference =>

            reference.title
              .toLowerCase()
              .includes(
                normalized
              )
        );


      list.innerHTML =
        "";


      if (
        filtered.length === 0
      ) {

        list.innerHTML = `
          <div class="bible-no-results">
            Tidak ada hasil.
          </div>
        `;

        return;
      }


      filtered.forEach(
        reference => {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";


          button.className =
            "bible-reference-row";


          button.innerHTML = `
            <div>

              <strong>
                ${reference.title}
              </strong>

              <small>
                ${reference.meta}
              </small>

            </div>

            <span>
              ›
            </span>
          `;


          button.addEventListener(
            "click",
            () => {

              if (
                reference.id ===
                "lukas"
              ) {

                showPuzzle();

                return;
              }


              showOtherReference(
                reference
              );
            }
          );


          list.appendChild(
            button
          );
        }
      );
    }


    search.addEventListener(
      "input",
      () => {

        drawReferences(
          search.value
        );
      }
    );


    drawReferences();
  }



  /* =========================================================
     OTHER REFERENCES
  ========================================================= */

  function showOtherReference(
    reference
  ) {

    root.innerHTML = `
      <button
        id="backBibleSearch"
        class="message-back"
        type="button"
      >
        ‹ Search
      </button>


      <div class="bible-reader-head">

        <small>
          BIBLE
        </small>

        <h2>
          ${reference.title}
        </h2>

        <p>
          ${reference.meta}
        </p>

      </div>


      <div class="bible-reference-page">

        <small>
          REFERENSI
        </small>

        <p>
          Bagian ini tidak termasuk
          referensi yang sedang dicari.
        </p>

      </div>
    `;


    $("#backBibleSearch", root)
      .addEventListener(
        "click",
        showSearch
      );
  }



  /* =========================================================
     LUKAS PUZZLE
  ========================================================= */

  function showPuzzle() {

    const verse =
      verses[
        state.bibleStep
      ];


    let selected =
      [];


    let remaining =
      shuffle(
        verse.pieces
      );


    root.innerHTML = `
      <button
        id="backBibleSearch"
        class="message-back"
        type="button"
      >
        ‹ Search
      </button>


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

        <span
          class="${
            state.bibleStep >= 0
              ? "done"
              : ""
          }"
        >
          21
        </span>

        <span
          class="${
            state.bibleStep >= 1
              ? "done"
              : ""
          }"
        >
          22
        </span>

        <span
          class="${
            state.bibleStep >= 2
              ? "done"
              : ""
          }"
        >
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


    $("#backBibleSearch", root)
      .addEventListener(
        "click",
        showSearch
      );


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
        (
          text,
          index
        ) => {

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
        (
          text,
          index
        ) => {

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

          selected =
            [];


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
              (
                text,
                index
              ) =>

                text ===
                verse.pieces[index]
            );


          if (
            !correct
          ) {

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


            if (
              objective
            ) {

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


          showPuzzle();
        }
      );


    draw();
  }



  showSearch();
}

  /* =========================================================
     ARCADE
  ========================================================= */

  function renderArcade(root) {

    const gameInfo = {

      signal: {

        name:
          "Signal Rush",

        desc:
          "Tap 8 sinyal secepat mungkin."
      },


      memory: {

        name:
          "Memory Flash",

        desc:
          "Ingat pola lalu ulangi urutannya."
      },


      stop: {

        name:
          "Perfect Stop",

        desc:
          "Hentikan marker tepat di zona target."
      }
    };


    function bestText(key) {

      const best =
        state.arcadeBest[key];


      if (
        best === null
      ) {

        return "BEST --";
      }


      return (
        "BEST " +
        best.toFixed(1) +
        "s"
      );
    }


    function saveBest(
      key,
      seconds
    ) {

      const current =
        state.arcadeBest[key];


      if (
        current === null ||
        seconds <
          current
      ) {

        state.arcadeBest[key] =
          seconds;
      }
    }


    function applyArcadePenalty() {

      state.timePenaltySeconds +=
        30;


      updateTimeUI();


      showTimePenaltyPopup(
        30
      );
    }



    /* ===============================
       ARCADE MENU
    =============================== */

    function showMenu() {

      root.innerHTML = `
        <div class="arcade-menu-head">

          <small>
            ARCADE // QUICK PLAY
          </small>

          <h2>
            Pick a game
          </h2>

          <p>
            Short matches. Beat your best time.
          </p>

        </div>


        <div class="arcade-game-grid">

          <button
            class="arcade-game-card"
            data-game="signal"
            type="button"
          >

            <span class="arcade-game-index">
              01
            </span>

            <strong>
              SIGNAL RUSH
            </strong>

            <small>
              Tap the lit signal
            </small>

            <em>
              ${bestText("signal")}
            </em>

          </button>


          <button
            class="arcade-game-card"
            data-game="memory"
            type="button"
          >

            <span class="arcade-game-index">
              02
            </span>

            <strong>
              MEMORY FLASH
            </strong>

            <small>
              Repeat the pattern
            </small>

            <em>
              ${bestText("memory")}
            </em>

          </button>


          <button
            class="arcade-game-card wide"
            data-game="stop"
            type="button"
          >

            <span class="arcade-game-index">
              03
            </span>

            <strong>
              PERFECT STOP
            </strong>

            <small>
              Stop inside the zone
            </small>

            <em>
              ${bestText("stop")}
            </em>

          </button>

        </div>
      `;


      $$(
        ".arcade-game-card",
        root
      ).forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const game =
                button.dataset.game;


              if (
                game ===
                "signal"
              ) {

                runSignalRush();
              }


              if (
                game ===
                "memory"
              ) {

                runMemoryFlash();
              }


              if (
                game ===
                "stop"
              ) {

                runPerfectStop();
              }
            }
          );
        }
      );
    }



    /* ===============================
       RESULT SCREEN
    =============================== */

    function showResult(
      key,
      seconds,
      detail,
      replay
    ) {

      saveBest(
        key,
        seconds
      );


      applyArcadePenalty();


      root.innerHTML = `
        <div class="arcade-result-screen">

          <small>
            MATCH COMPLETE
          </small>

          <h2>
            ${seconds.toFixed(1)}s
          </h2>

          <p class="arcade-result-game">
            ${gameInfo[key].name}
          </p>

          <div class="arcade-result-stats">
            ${detail}
          </div>

          <div class="arcade-result-best">
            ${bestText(key)}
          </div>

          <div class="arcade-result-actions">

            <button
              id="arcadeReplay"
              class="secondary-btn"
              type="button"
            >
              PLAY AGAIN
            </button>

            <button
              id="arcadeMenu"
              class="primary-btn"
              type="button"
            >
              GAME LIST
            </button>

          </div>

        </div>
      `;


      $("#arcadeReplay", root)
        .addEventListener(
          "click",
          replay
        );


      $("#arcadeMenu", root)
        .addEventListener(
          "click",
          showMenu
        );
    }



    /* ===============================
       GAME 1 — SIGNAL RUSH
    =============================== */

    function runSignalRush() {

      root.innerHTML = `
        <div class="arcade-game-head">

          <button
            id="arcadeBack"
            class="arcade-back"
            type="button"
          >
            ‹ GAME LIST
          </button>

          <small>
            SIGNAL RUSH
          </small>

          <h2>
            Tap 8 signals
          </h2>

        </div>


        <div class="arcade-score">

          <span>
            HIT
            <b id="signalHits">
              0
            </b>/8
          </span>

          <span>
            MISS
            <b id="signalMisses">
              0
            </b>
          </span>

        </div>


        <div
          id="signalBoard"
          class="signal-board"
        ></div>
      `;


      $("#arcadeBack", root)
        .addEventListener(
          "click",
          showMenu
        );


      const board =
        $("#signalBoard", root);


      const hitsText =
        $("#signalHits", root);


      const missesText =
        $("#signalMisses", root);


      let hits =
        0;


      let misses =
        0;


      let activeIndex =
        -1;


      const startedAt =
        performance.now();


      const cells =
        [];


      for (
        let i =
          0;

        i <
        9;

        i++
      ) {

        const cell =
          document.createElement(
            "button"
          );


        cell.type =
          "button";


        cell.className =
          "signal-cell";


        cell.addEventListener(
          "click",
          () => {

            if (
              i !==
              activeIndex
            ) {

              misses++;


              missesText.textContent =
                misses;


              cell.classList.add(
                "miss"
              );


              setTimeout(
                () => {

                  cell.classList.remove(
                    "miss"
                  );

                },
                140
              );


              return;
            }


            hits++;


            hitsText.textContent =
              hits;


            if (
              hits >=
              8
            ) {

              const seconds =
                (
                  performance.now() -
                  startedAt
                ) /
                1000;


              showResult(
                "signal",
                seconds,
                `
                  <span>
                    8 HIT
                  </span>

                  <span>
                    ${misses} MISS
                  </span>
                `,
                runSignalRush
              );


              return;
            }


            nextSignal();
          }
        );


        cells.push(
          cell
        );


        board.appendChild(
          cell
        );
      }


      function nextSignal() {

        cells.forEach(
          cell => {

            cell.classList.remove(
              "active"
            );
          }
        );


        let next;


        do {

          next =
            Math.floor(
              Math.random() *
              9
            );

        } while (
          next ===
          activeIndex
        );


        activeIndex =
          next;


        cells[
          activeIndex
        ].classList.add(
          "active"
        );
      }


      nextSignal();
    }



    /* ===============================
       GAME 2 — MEMORY FLASH
    =============================== */

    function runMemoryFlash() {

      root.innerHTML = `
        <div class="arcade-game-head">

          <button
            id="arcadeBack"
            class="arcade-back"
            type="button"
          >
            ‹ GAME LIST
          </button>

          <small>
            MEMORY FLASH
          </small>

          <h2 id="memoryStatus">
            Watch the pattern
          </h2>

        </div>


        <div class="arcade-score">

          <span>
            STEP
            <b id="memoryStep">
              0
            </b>/4
          </span>

          <span>
            MISS
            <b id="memoryMisses">
              0
            </b>
          </span>

        </div>


        <div
          id="memoryBoard"
          class="memory-board"
        ></div>
      `;


      let cancelled =
        false;


      $("#arcadeBack", root)
        .addEventListener(
          "click",
          () => {

            cancelled =
              true;


            showMenu();
          }
        );


      const board =
        $("#memoryBoard", root);


      const status =
        $("#memoryStatus", root);


      const stepText =
        $("#memoryStep", root);


      const missesText =
        $("#memoryMisses", root);


      const pads =
        [];


      const sequence =
        [];


      let inputIndex =
        0;


      let misses =
        0;


      let acceptingInput =
        false;


      const startedAt =
        performance.now();


      for (
        let i =
          0;

        i <
        4;

        i++
      ) {

        const pad =
          document.createElement(
            "button"
          );


        pad.type =
          "button";


        pad.className =
          "memory-pad";


        pad.addEventListener(
          "click",
          () => {

            if (
              !acceptingInput
            ) {

              return;
            }


            if (
              i !==
              sequence[
                inputIndex
              ]
            ) {

              misses++;


              missesText.textContent =
                misses;


              acceptingInput =
                false;


              inputIndex =
                0;


              stepText.textContent =
                "0";


              pad.classList.add(
                "wrong"
              );


              status.textContent =
                "Miss — watch again";


              setTimeout(
                () => {

                  pad.classList.remove(
                    "wrong"
                  );


                  if (
                    !cancelled
                  ) {

                    playSequence();
                  }

                },
                650
              );


              return;
            }


            pad.classList.add(
              "pressed"
            );


            setTimeout(
              () => {

                pad.classList.remove(
                  "pressed"
                );

              },
              130
            );


            inputIndex++;


            stepText.textContent =
              inputIndex;


            if (
              inputIndex >=
              sequence.length
            ) {

              acceptingInput =
                false;


              const seconds =
                (
                  performance.now() -
                  startedAt
                ) /
                1000;


              showResult(
                "memory",
                seconds,
                `
                  <span>
                    4 STEP
                  </span>

                  <span>
                    ${misses} MISS
                  </span>
                `,
                runMemoryFlash
              );
            }
          }
        );


        pads.push(
          pad
        );


        board.appendChild(
          pad
        );
      }


      for (
        let i =
          0;

        i <
        4;

        i++
      ) {

        let next;


        do {

          next =
            Math.floor(
              Math.random() *
              4
            );

        } while (
          i >
            0 &&
          next ===
            sequence[
              i -
              1
            ]
        );


        sequence.push(
          next
        );
      }


      function wait(ms) {

        return new Promise(
          resolve =>

            setTimeout(
              resolve,
              ms
            )
        );
      }


      async function playSequence() {

        acceptingInput =
          false;


        inputIndex =
          0;


        stepText.textContent =
          "0";


        status.textContent =
          "Watch the pattern";


        await wait(
          450
        );


        for (
          const index
          of sequence
        ) {

          if (
            cancelled ||
            !board.isConnected
          ) {

            return;
          }


          pads[
            index
          ].classList.add(
            "active"
          );


          await wait(
            360
          );


          pads[
            index
          ].classList.remove(
            "active"
          );


          await wait(
            170
          );
        }


        if (
          cancelled ||
          !board.isConnected
        ) {

          return;
        }


        status.textContent =
          "Repeat it";


        acceptingInput =
          true;
      }


      playSequence();
    }



    /* ===============================
       GAME 3 — PERFECT STOP
    =============================== */

    function runPerfectStop() {

      root.innerHTML = `
        <div class="arcade-game-head">

          <button
            id="arcadeBack"
            class="arcade-back"
            type="button"
          >
            ‹ GAME LIST
          </button>

          <small>
            PERFECT STOP
          </small>

          <h2>
            Hit the zone 3 times
          </h2>

        </div>


        <div class="arcade-score">

          <span>
            HIT
            <b id="stopHits">
              0
            </b>/3
          </span>

          <span>
            MISS
            <b id="stopMisses">
              0
            </b>
          </span>

        </div>


        <div class="perfect-stop-wrap">

          <div
            id="perfectTrack"
            class="perfect-track"
          >

            <div
              id="perfectZone"
              class="perfect-zone"
            ></div>

            <div
              id="perfectMarker"
              class="perfect-marker"
            ></div>

          </div>


          <p
            id="stopStatus"
            class="perfect-status"
          >
            Tap STOP inside the target.
          </p>


          <button
            id="stopButton"
            class="primary-btn"
            type="button"
          >
            STOP
          </button>

        </div>
      `;


      let finished =
        false;


      let frame =
        null;


      let hits =
        0;


      let misses =
        0;


      let position =
        0;


      let direction =
        1;


      let lastTime =
        performance.now();


      let targetCenter =
        0.5;


      const targetHalf =
        0.09;


      const startedAt =
        performance.now();


      const marker =
        $("#perfectMarker", root);


      const zone =
        $("#perfectZone", root);


      const hitsText =
        $("#stopHits", root);


      const missesText =
        $("#stopMisses", root);


      const status =
        $("#stopStatus", root);


      function setTarget() {

        targetCenter =
          0.18 +
          Math.random() *
          0.64;


        zone.style.left =
          (
            (
              targetCenter -
              targetHalf
            ) *
            100
          ) +
          "%";


        zone.style.width =
          (
            targetHalf *
            2 *
            100
          ) +
          "%";
      }


      function animate(now) {

        if (
          finished ||
          !marker.isConnected
        ) {

          return;
        }


        const delta =
          Math.min(
            40,
            now -
            lastTime
          );


        lastTime =
          now;


        position +=
          direction *
          delta *
          0.00082;


        if (
          position >=
          1
        ) {

          position =
            1;

          direction =
            -1;
        }


        if (
          position <=
          0
        ) {

          position =
            0;

          direction =
            1;
        }


        marker.style.left =
          (
            position *
            100
          ) +
          "%";


        frame =
          requestAnimationFrame(
            animate
          );
      }


      $("#arcadeBack", root)
        .addEventListener(
          "click",
          () => {

            finished =
              true;


            if (
              frame
            ) {

              cancelAnimationFrame(
                frame
              );
            }


            showMenu();
          }
        );


      $("#stopButton", root)
        .addEventListener(
          "click",
          () => {

            const distance =
              Math.abs(
                position -
                targetCenter
              );


            if (
              distance <=
              targetHalf
            ) {

              hits++;


              hitsText.textContent =
                hits;


              status.textContent =
                "Nice.";


              marker.classList.add(
                "hit"
              );


              setTimeout(
                () => {

                  marker.classList.remove(
                    "hit"
                  );

                },
                150
              );


              if (
                hits >=
                3
              ) {

                finished =
                  true;


                if (
                  frame
                ) {

                  cancelAnimationFrame(
                    frame
                  );
                }


                const seconds =
                  (
                    performance.now() -
                    startedAt
                  ) /
                  1000;


                showResult(
                  "stop",
                  seconds,
                  `
                    <span>
                      3 HIT
                    </span>

                    <span>
                      ${misses} MISS
                    </span>
                  `,
                  runPerfectStop
                );


                return;
              }


              setTarget();

            } else {

              misses++;


              missesText.textContent =
                misses;


              status.textContent =
                "Miss.";


              marker.classList.add(
                "miss"
              );


              setTimeout(
                () => {

                  marker.classList.remove(
                    "miss"
                  );

                },
                150
              );
            }
          }
        );


      setTarget();


      frame =
        requestAnimationFrame(
          animate
        );
    }


    showMenu();
  }



  /* =========================================================
     FILES
  ========================================================= */

 function renderFiles(root) {

  const files = [

    [
      "Kimia_latihan.pdf",
      "2.4 MB",
      "Today, 18:42"
    ],

    [
      "PPT_SekolahMinggu_v4.pptx",
      "8.1 MB",
      "Today, 17:16"
    ],

    [
      "Ekonomi_final_FINAL.xlsx",
      "184 KB",
      "Yesterday"
    ],

    [
      "IMG_20261002_193411.jpg",
      "3.7 MB",
      "Oct 2"
    ],

    [
      "untitled (3).pdf",
      "1.1 MB",
      "Sep 29"
    ],

    [
      "audio_17.m4a",
      "742 KB",
      "Sep 27"
    ]
  ];


  files.forEach(
    ([name, size, date]) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "file-item";


      row.innerHTML = `
        <span>
          ${name}
        </span>

        <small>
          ${size}<br>
          ${date}
        </small>
      `;


      root.appendChild(
        row
      );
    }
  );
}



  /* =========================================================
     SETTINGS
  ========================================================= */
function renderSettings(root) {

  const settings = [

    [
      "Wi-Fi",
      "Connected"
    ],

    [
      "Battery",
      "83%"
    ],

    [
      "Battery Saver",
      "Off"
    ],

    [
      "Focus Mode",
      "Off"
    ],

    [
      "Dark Mode",
      "On"
    ],

    [
      "Storage",
      "91.4 / 128 GB"
    ],

    [
      "Screen time today",
      "6h 38m"
    ]

  ];


  settings.forEach(
    ([name, value]) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "setting";


      row.innerHTML = `
        <b>
          ${name}
        </b>

        <span>
          ${value}
        </span>
      `;


      root.appendChild(
        row
      );
    }
  );
}



  /* =========================================================
     OLD FRAGMENTS SYSTEM
  ========================================================= */

  function addFragment(
    key,
    value
  ) {

    if (
      state.fragments[
        key
      ]
    ) {

      return;
    }


    state.fragments[key] =
      value;


    toast(
      `Informasi ditemukan: ${value}`
    );


    if (
      Object.keys(
        state.fragments
      ).length ===
      4
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


    if (!slots) {
      return;
    }


    slots.innerHTML =
      "";


    [
      "F1",
      "F2",
      "F3",
      "F4"
    ].forEach(
      key => {

        const slot =
          document.createElement(
            "div"
          );


        slot.className =
          "fragment-slot";


        slot.textContent =
          state.fragments[key] ||
          "?";


        slots.appendChild(
          slot
        );
      }
    );


    showScreen(
      "finalScreen"
    );
  }


  const submitFinal =
    $("#submitFinal");


  if (
    submitFinal
  ) {

    submitFinal.addEventListener(
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


        if (
          value ===
          "KEMBALI"
        ) {

          if (
            state.gameTicker
          ) {

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
  }



  /* =========================================================
     FULL-SCREEN SWIPE UNLOCK
  ========================================================= */

  const lockScreen =
    $("#lockScreen");


  let swipeStartY =
    0;


  let swipeDistance =
    0;


  let swiping =
    false;


  lockScreen.style.touchAction =
    "none";


  lockScreen.addEventListener(
    "pointerdown",
    event => {

      swiping =
        true;


      swipeStartY =
        event.clientY;


      swipeDistance =
        0;


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

      if (
        !swiping
      ) {

        return;
      }


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

    if (
      !swiping
    ) {

      return;
    }


    swiping =
      false;


    if (
      swipeDistance >=
      100
    ) {

      /* ENTER FULLSCREEN */

      const fullscreenTarget =
        document.documentElement;


      if (
        !document.fullscreenElement
      ) {

        const enterFullscreen =
          fullscreenTarget.requestFullscreen ||
          fullscreenTarget.webkitRequestFullscreen;


        if (
          enterFullscreen
        ) {

          try {

            const result =
              enterFullscreen.call(
                fullscreenTarget
              );


            if (
              result &&
              typeof result.catch ===
                "function"
            ) {

              result.catch(
                () => {}
              );
            }

          } catch (
            error
          ) {

            /* game works without fullscreen */
          }
        }
      }


      /* unlock animation */

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


  $$(
    "[data-app]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          openApp(
            button.dataset.app
          );
        }
      );
    }
  );



  /* =========================================================
     HINT BUTTON
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
