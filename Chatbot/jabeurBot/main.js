function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

document.addEventListener("DOMContentLoaded", function () {
  const loader = `<span class='loader'><span class='loader__dot'></span><span class='loader__dot'></span><span class='loader__dot'></span></span>`;
  const errorMessage = "My apologies, I'm not available at the moment. =^.^=";

  const sendSound = new Audio("send.mp3");
  const receiveSound = new Audio("receive.wav");
  let isMuted = false;
  const muteToggleBtn = document.getElementById("muteToggle");

  if (muteToggleBtn) {
    muteToggleBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevents the header click from closing chatbot
      isMuted = !isMuted;
      muteToggleBtn.textContent = isMuted ? "🔇" : "🔈";
      localStorage.setItem("chatbotMuted", isMuted ? "true" : "false");
    });

    // Load saved mute state
    const savedMute = localStorage.getItem("chatbotMuted");
    if (savedMute === "true") {
      isMuted = true;
      muteToggleBtn.textContent = "🔇";
    }
  }

  const intentEmojis = {
    greeting: "👋",
    goodbye: "👋",
    help: "🆘",
    weather: "🌦️",
    joke: "😂",
    error: "⚠️",
    default: "🤖",
  };

  // Load saved theme
  const savedTheme = localStorage.getItem("chatbotTheme");
  if (savedTheme === "dark") {
    document.querySelector(".chatbot").classList.add("chatbot--dark");
    document.getElementById("nightToggle").textContent = "☀️";
  }

  function updateClearButtonState() {
    const chatMessages = document.querySelector(".chatbot__messages");
    const clearBtn = document.getElementById("clearChat");

    if (!chatMessages || !clearBtn) return;

    const hasMessages = chatMessages.children.length > 0;
    clearBtn.disabled = !hasMessages;
  }

  const $document = document;
  const $chatbot = $document.querySelector(".chatbot");
  const $chatbotMessageWindow = $document.querySelector(
    ".chatbot__message-window"
  );
  const $chatbotHeader = $document.querySelector(".chatbot__header");
  const $chatbotMessages = $document.querySelector(".chatbot__messages");
  const $chatbotInput = $document.querySelector(".chatbot__input");
  const $chatbotSubmit = $document.querySelector(".chatbot__submit");

  const scrollDown = () => {
    setTimeout(() => {
      $chatbotMessageWindow.scrollTop = $chatbotMessageWindow.scrollHeight;
    }, 100); // slight delay ensures new message is rendered
  };

  function ajouter() {
    const $chatbotMessages = document.querySelector(".chatbot__messages");
    const input = document.getElementById("req");
    const message = input.value.trim();
    if (!message) {
      input.classList.add("input-error");
      setTimeout(() => input.classList.remove("input-error"), 1000);
      return;
    }

    input.value = "";

    // 🔊 Play send sound
    if (!isMuted) sendSound.play();

    $chatbotMessages.innerHTML += `
        <li class='is-user animation'>
            <p class='chatbot__message'>${message}<br/><small>🕒 ${getCurrentTime()}</small></p>
            <span class='chatbot__arrow chatbot__arrow--right'></span>
        </li>`;
    scrollDown();

    // Add loader
    const loaderId = "loader-" + Date.now();
    $chatbotMessages.innerHTML += `
      <li class="is-ai animation" id="${loaderId}">
        <div class="is-ai__profile-picture">
          <img src="1.png" style="display:block; margin:auto; border-radius:50%;" width="30" height="30">
        </div>
        <span class="chatbot__arrow chatbot__arrow--left"></span>
        <div class="chatbot__message">${loader}</div>
      </li>`;
    scrollDown();

    const json = JSON.stringify({ message });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:5000/", true);
    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");

    xhr.onload = function () {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.readyState === 4 && xhr.status === 200 && data.response) {
          setTimeout(() => {
            const loaderEl = document.getElementById(loaderId);
            if (loaderEl) loaderEl.remove();

            // 🎭 Get emoji or fallback
            const emoji = intentEmojis[data.intent] || intentEmojis["default"];

            $chatbotMessages.innerHTML += `
    <li class="is-ai animation">
      <div class="is-ai__profile-picture">
        <img src="1.png" style="display:block; margin:auto; border-radius:50%;" width="30" height="30">
      </div>
      <span class="chatbot__arrow chatbot__arrow--left"></span>
      <div class="chatbot__message">${emoji} ${
              data.response
            }<br/><small>🕒 ${getCurrentTime()}</small></div>

    </li>`;
            scrollDown();
            saveChatHistory(); // ✅ right after displaying the bot reply
            updateClearButtonState();

            document.getElementById("req").focus();

            // 🔊 Play receive sound
            if (!isMuted) receiveSound.play();
          }, 1000);
        } else {
          const loaderEl = document.getElementById(loaderId);
          if (loaderEl) loaderEl.remove();
          alert(data.error || "Server error.");
        }
      } catch (e) {
        const loaderEl = document.getElementById(loaderId);
        if (loaderEl) loaderEl.remove();
        alert("Invalid response from server.");
      }
    };

    xhr.send(json);
  }

  document.addEventListener("keypress", (event) => {
    if (event.which == 13) {
      ajouter();
    }
  });
  // send btn action
  document
    .querySelector(".chatbot__submit")
    .addEventListener("click", function (e) {
      e.stopPropagation(); // optional: avoid closing the chatbot
      ajouter();
    });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const chatbot = document.querySelector(".chatbot");
      if (chatbot && chatbot.style.display === "block") {
        chatbot.style.display = "none";
        document.getElementById("chat-circle").style.display = "block";
      }
    }
  });

  $chatbotHeader.addEventListener("click", () => {
    var element = document.getElementsByClassName("chatbot");
    element[0].style.display = "none";
    document.getElementById("chat-circle").style.display = "block";
  });

  document.getElementById("chat-circle").addEventListener("click", () => {
    var element = document.getElementsByClassName("chatbot");
    element[0].classList.remove("chatbot--closed");
    element[0].style.display = "block";
    $chatbotInput.focus();
    document.getElementById("chat-circle").style.display = "none";
  });

  const nightToggleBtn = document.getElementById("nightToggle");

  if (nightToggleBtn) {
    nightToggleBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // prevent toggleChatbot if wrapped in clickable area

      const chatbot = document.querySelector(".chatbot");
      chatbot.classList.toggle("chatbot--dark");

      const isDark = chatbot.classList.contains("chatbot--dark");
      nightToggleBtn.textContent = isDark ? "☀️" : "🌙";

      // Save to localStorage
      localStorage.setItem("chatbotTheme", isDark ? "dark" : "light");
    });

    // Load saved theme on startup
    const savedTheme = localStorage.getItem("chatbotTheme");
    if (savedTheme === "dark") {
      document.querySelector(".chatbot").classList.add("chatbot--dark");
      nightToggleBtn.textContent = "☀️";
    }
  }

  // save messages
  const CHAT_STORAGE_KEY = "chatbotMessages";

  // ✅ Load messages from localStorage
  function loadChatHistory() {
    const saved = localStorage.getItem("chatbotMessages");
    const messagesContainer = document.querySelector(".chatbot__messages");

    if (saved && messagesContainer) {
      messagesContainer.innerHTML = saved;

      // Scroll to bottom after short delay to allow DOM render
      setTimeout(() => {
        scrollDown();
      }, 555); // enough delay to wait for DOM to paint
    }
  }

  // ✅ Save messages to localStorage
  function saveChatHistory() {
    const cloned = document.querySelector(".chatbot__messages").cloneNode(true);

    // Remove any loader animations before saving
    const loaders = cloned.querySelectorAll(".loader, #loader");
    loaders.forEach((el) => el.parentElement?.parentElement?.remove());

    localStorage.setItem(CHAT_STORAGE_KEY, cloned.innerHTML);
  }

  // ✅ Delete messages
  function clearChatHistory() {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    document.querySelector(".chatbot__messages").innerHTML = "";
    updateClearButtonState();
  }

  const clearBtn = document.getElementById("clearChat");
  if (clearBtn) {
    clearBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // don't close chatbot
      Swal.fire({
        title: "Are you sure?",
        text: "This will permanently clear your chat history.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#49b5e7",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, clear it",
      }).then((result) => {
        if (result.isConfirmed) {
          clearChatHistory();
          Swal.fire({
            title: "Cleared!",
            text: "Chat history has been deleted.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      });
    });
  }

  loadChatHistory();
  updateClearButtonState();
});
function toggleNightMode(event) {
  event.stopPropagation(); // prevent chatbot close
  const chatbot = document.querySelector(".chatbot");
  const button = document.getElementById("nightToggle");

  chatbot.classList.toggle("chatbot--dark");
  const isDark = chatbot.classList.contains("chatbot--dark");

  // Change icon
  button.textContent = isDark ? "☀️" : "🌙";

  // Save preference
  localStorage.setItem("chatbotTheme", isDark ? "dark" : "light");
}
