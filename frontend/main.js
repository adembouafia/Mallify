function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

document.addEventListener("DOMContentLoaded", function () {
  const loader = `<span class='CTG-loader'><span class='CTG-loader__dot'></span><span class='CTG-loader__dot'></span><span class='CTG-loader__dot'></span></span>`;
  const errorMessage = "My apologies, I'm not available at the moment. =^.^=";

  const sendSound = new Audio("send.mp3");
  const receiveSound = new Audio("receive.wav");
  let isMuted = false;
  const muteToggleBtn = document.getElementById("CTG-mute-toggle");

  if (muteToggleBtn) {
    muteToggleBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevents the header click from closing chatbot
      isMuted = !isMuted;
      muteToggleBtn.textContent = isMuted ? "🔇" : "🔈";
      localStorage.setItem("CTGChatMuted", isMuted ? "true" : "false");
    });

    // Load saved mute state
    const savedMute = localStorage.getItem("CTGChatMuted");
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
  const savedTheme = localStorage.getItem("CTGChatTheme");
  if (savedTheme === "dark") {
    document.querySelector(".CTG-chat").classList.add("CTG-chat--dark");
    document.getElementById("CTG-night-toggle").textContent = "☀️";
  }

  function updateClearButtonState() {
    const chatMessages = document.querySelector(".CTG-chat__messages");
    const clearBtn = document.getElementById("CTG-clear-chat");

    if (!chatMessages || !clearBtn) return;

    const hasMessages = chatMessages.children.length > 0;
    clearBtn.disabled = !hasMessages;
  }

  const $document = document;
  const $chatbot = $document.querySelector(".CTG-chat");
  const $chatbotMessageWindow = $document.querySelector(
    ".CTG-chat__message-window"
  );
  const $chatbotHeader = $document.querySelector(".CTG-chat__header");
  const $chatbotMessages = $document.querySelector(".CTG-chat__messages");
  const $chatbotInput = $document.querySelector(".CTG-chat__input");
  const $chatbotSubmit = $document.querySelector(".CTG-chat__submit");
  const scrollDown = () => {
    setTimeout(() => {
      $chatbotMessageWindow.scrollTop = $chatbotMessageWindow.scrollHeight;
    }, 100); // slight delay ensures new message is rendered
  };

  function ajouter() {
    const $chatbotMessages = document.querySelector(".CTG-chat__messages");
    const input = document.getElementById("CTG-input");
    const message = input.value.trim();
    if (!message) {
      input.classList.add("CTG-input-error");
      setTimeout(() => input.classList.remove("CTG-input-error"), 1000);
      return;
    }

    input.value = "";

    // 🔊 Play send sound
    if (!isMuted) sendSound.play();

    $chatbotMessages.innerHTML += `
        <li class='is-user CTG-animation'>
            <p class='CTG-chat__message'>${message}<br/><small>🕒 ${getCurrentTime()}</small></p>
            <span class='CTG-chat__arrow CTG-chat__arrow--right'></span>
        </li>`;
    scrollDown();

    // Add loader
    const loaderId = "CTG-loader-" + Date.now();
    $chatbotMessages.innerHTML += `
      <li class="is-ai CTG-animation" id="${loaderId}">
        <div class="is-ai__profile-picture">
          <img src="1.png" style="display:block; margin:auto; border-radius:50%;" width="30" height="30">
        </div>
        <span class="CTG-chat__arrow CTG-chat__arrow--left"></span>
        <div class="CTG-chat__message">${loader}</div>
      </li>`;
    scrollDown();    const json = JSON.stringify({ message });
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
    <li class="is-ai CTG-animation">
      <div class="is-ai__profile-picture">
        <img src="1.png" style="display:block; margin:auto; border-radius:50%;" width="30" height="30">
      </div>
      <span class="CTG-chat__arrow CTG-chat__arrow--left"></span>
      <div class="CTG-chat__message">${emoji} ${
              data.response
            }<br/><small>🕒 ${getCurrentTime()}</small></div>

    </li>`;
            scrollDown();
            saveChatHistory(); // ✅ right after displaying the bot reply
            updateClearButtonState();

            document.getElementById("CTG-input").focus();

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
    .querySelector(".CTG-chat__submit")
    .addEventListener("click", function (e) {
      e.stopPropagation(); // optional: avoid closing the chatbot
      ajouter();
    });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const chatbot = document.querySelector(".CTG-chat");
      if (chatbot && chatbot.style.display === "block") {
        chatbot.style.display = "none";
        document.getElementById("CTG-chat-circle").style.display = "block";
      }
    }
  });

  $chatbotHeader.addEventListener("click", () => {
    var element = document.getElementsByClassName("CTG-chat");
    element[0].style.display = "none";
    document.getElementById("CTG-chat-circle").style.display = "block";
  });

  document.getElementById("CTG-chat-circle").addEventListener("click", () => {
    var element = document.getElementsByClassName("CTG-chat");
    element[0].classList.remove("CTG-chat--closed");
    element[0].style.display = "block";
    $chatbotInput.focus();
    document.getElementById("CTG-chat-circle").style.display = "none";
  });
  const nightToggleBtn = document.getElementById("CTG-night-toggle");

  if (nightToggleBtn) {
    nightToggleBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // prevent toggleChatbot if wrapped in clickable area

      const chatbot = document.querySelector(".CTG-chat");
      chatbot.classList.toggle("CTG-chat--dark");

      const isDark = chatbot.classList.contains("CTG-chat--dark");
      nightToggleBtn.textContent = isDark ? "☀️" : "🌙";

      // Save to localStorage
      localStorage.setItem("CTGChatTheme", isDark ? "dark" : "light");
    });

    // Load saved theme on startup
    const savedTheme = localStorage.getItem("CTGChatTheme");
    if (savedTheme === "dark") {
      document.querySelector(".CTG-chat").classList.add("CTG-chat--dark");
      nightToggleBtn.textContent = "☀️";
    }
  }

  // save messages
  const CHAT_STORAGE_KEY = "CTGChatMessages";

  // ✅ Load messages from localStorage
  function loadChatHistory() {
    const saved = localStorage.getItem("CTGChatMessages");
    const messagesContainer = document.querySelector(".CTG-chat__messages");

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
    const cloned = document.querySelector(".CTG-chat__messages").cloneNode(true);

    // Remove any loader animations before saving
    const loaders = cloned.querySelectorAll(".CTG-loader, #CTG-loader");
    loaders.forEach((el) => el.parentElement?.parentElement?.remove());

    localStorage.setItem(CHAT_STORAGE_KEY, cloned.innerHTML);
  }

  // ✅ Delete messages
  function clearChatHistory() {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    document.querySelector(".CTG-chat__messages").innerHTML = "";
    updateClearButtonState();
  }

  const clearBtn = document.getElementById("CTG-clear-chat");
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
function toggleChatbot() {
  const chatbot = document.querySelector(".CTG-chat");
  const chatCircle = document.getElementById("CTG-chat-circle");
  
  if (chatbot.style.display === "block") {
    chatbot.style.display = "none";
    chatCircle.style.display = "block";
  } else {
    chatbot.style.display = "block";
    chatbot.classList.remove("CTG-chat--closed");
    chatCircle.style.display = "none";
    document.querySelector(".CTG-chat__input").focus();
  }
}
function toggleNightMode(event) {
  event.stopPropagation(); // prevent chatbot close
  const chatbot = document.querySelector(".CTG-chat");
  const button = document.getElementById("CTG-night-toggle");

  chatbot.classList.toggle("CTG-chat--dark");
  const isDark = chatbot.classList.contains("CTG-chat--dark");

  // Change icon
  button.textContent = isDark ? "☀️" : "🌙";

  // Save preference
  localStorage.setItem("CTGChatTheme", isDark ? "dark" : "light");
}
