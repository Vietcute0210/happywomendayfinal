// Script for the flower page that applies customization and opens the 3D message view.
// This version removes the letter overlay and heart spawning when clicking flowers.
document.addEventListener("DOMContentLoaded", () => {
  // Retrieve customization data. Small fields may be encoded in query parameters, while
  // larger data (images, messages, audio) are stored in localStorage or window.name.
  function getCustomization() {
    const params = new URLSearchParams(window.location.search);
    const data = {};
    if (params.has("name")) {
      try {
        data.name = decodeURIComponent(params.get("name"));
      } catch {
        data.name = params.get("name");
      }
    }
    if (params.has("message")) {
      try {
        const msg = decodeURIComponent(params.get("message"));
        data.messages = [msg];
      } catch {
        data.messages = [params.get("message")];
      }
    }
    if (params.has("theme")) {
      data.theme = params.get("theme");
    }
    if (params.has("flowerType")) {
      data.flowerType = params.get("flowerType");
    }
    // Do not parse images or audio from the URL
    if (Object.keys(data).length === 0) {
      // fallback to localStorage
      const saved = localStorage.getItem("customization");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {};
        }
      }
    }
    return data;
  }

  const custom = getCustomization() || {};

  // Merge customization from window.name if present. This allows passing large images/audio
  // between pages without using query parameters.
  try {
    if (window.name) {
      const fromName = JSON.parse(window.name);
      if (fromName && typeof fromName === "object") {
        Object.assign(custom, fromName);
      }
      // Clear window.name so that the data is not reused inadvertently
      window.name = "";
    }
  } catch {
    // ignore parse errors
  }

  // Apply theme backgrounds.  Use image backgrounds for pastel and sunny themes.
  if (custom.theme) {
    switch (custom.theme) {
      case "pastel":
        document.body.style.background = "";
        document.body.style.backgroundImage =
          "url('img/pastel_background.png')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        break;
      case "sunny":
        document.body.style.background = "";
        document.body.style.backgroundImage = "url('img/sunny_background.png')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        break;
      default:
        // For dark theme, keep existing galaxy background defined in CSS
        document.body.style.backgroundImage = "";
        document.body.style.background = "";
    }
  }

  // Hide the night overlay if present and not needed
  const nightOverlay = document.querySelector(".night");
  if (nightOverlay && custom.theme && custom.theme !== "dark") {
    nightOverlay.style.display = "none";
  }

  // Configure the audio element
  (function setupAudio() {
    const audioEl = document.getElementById("myAudio");
    if (!audioEl) return;
    const sourceEl = audioEl.querySelector("source");
    if (!sourceEl) return;
    if (
      custom.audio &&
      typeof custom.audio === "string" &&
      custom.audio.startsWith("data")
    ) {
      sourceEl.src = custom.audio;
    } else if (custom.audio) {
      sourceEl.src = custom.audio;
    }
    // Show controls and load audio
    audioEl.style.display = "block";
    audioEl.controls = true;
    // Loop the audio so it repeats automatically
    audioEl.loop = true;
    audioEl.load();
    // Autoplay if possible
    audioEl.play().catch(() => {});
  })();

  // Apply flower type: adjust colour schemes and clone flowers if necessary
  (function applyFlowerType() {
    const type = custom.flowerType;
    const container = document.querySelector(".flowers");
    if (!container || !type) return;
    let flowers = Array.from(container.children).filter((el) =>
      el.classList.contains("flower")
    );
    // Use exactly 3 flowers for consistency and centering
    const desiredCount = 3;
    // Clone the first flower to make up the desired count
    if (flowers.length < desiredCount) {
      const baseFlower = flowers[0];
      for (let i = flowers.length; i < desiredCount; i++) {
        const clone = baseFlower.cloneNode(true);
        const variant = (i % 3) + 1;
        clone.className = "flower flower--" + variant;
        container.appendChild(clone);
      }
      flowers = Array.from(container.children).filter((el) =>
        el.classList.contains("flower")
      );
    }
    // Do not override the default horizontal positions of the flowers.  The CSS defines
    // the positioning of .flower--1, .flower--2 and .flower--3 to create a cohesive
    // bouquet where the stems emanate from the same point.  Removing manual left
    // adjustments prevents flowers from being scattered across the page.
    // Colour schemes
    const schemes = {
      tulip: { base: "#ff99c8", highlight: "#ffc9de", circle: "#ffeef7" },
      rose: { base: "#e94b35", highlight: "#f27e7a", circle: "#ffd6d6" },
      lily: { base: "#e0e56b", highlight: "#faf4b7", circle: "#fff9dc" },
    };
    const scheme = schemes[type];
    if (scheme) {
      flowers.forEach((flower) => {
        const leaves = flower.querySelectorAll(".flower__leaf");
        leaves.forEach((leaf) => {
          leaf.style.backgroundImage = `linear-gradient(to top, ${scheme.base}, ${scheme.highlight})`;
        });
        const leaf4 = flower.querySelector(".flower__leaf--4");
        if (leaf4) {
          leaf4.style.backgroundImage = `linear-gradient(to top, ${scheme.base}, ${scheme.highlight})`;
        }
        const whiteCircle = flower.querySelector(".flower__white-circle");
        if (whiteCircle) {
          whiteCircle.style.backgroundColor = scheme.circle;
        }
      });
    }
  })();

  /**
   * Persist the current customization (including audio playback position) and
   * navigate to the 3D message page.  Called when the heart is clicked.
   */
  function navigateToMessage() {
    // If an audio element is present, record the current time so we can resume
    const audioEl = document.getElementById("myAudio");
    if (audioEl) {
      try {
        custom.audioTime = audioEl.currentTime;
      } catch {}
    }
    try {
      localStorage.setItem("customization", JSON.stringify(custom));
    } catch {}
    try {
      window.name = JSON.stringify(custom);
    } catch {}
    window.location.href = "message.html";
  }

  /**
   * Create a beating heart overlay that shows the recipient's name.  After the
   * flowers have bloomed, the heart appears in the center of the page.  When
   * clicked, it navigates to the final message page using navigateToMessage().
   */
  function showHeart() {
    // Avoid showing the heart multiple times
    if (document.getElementById("heartOverlay")) return;
    // Create a CSS animation for a heart image that appears, grows slightly, floats up and fades out
    const style = document.createElement("style");
    style.textContent = `
      @keyframes heartFly {
        0% { transform: translate(-50%, -50%) scale(0.5) translateY(0); opacity: 0; }
        30% { transform: translate(-50%, -50%) scale(1.2) translateY(-20px); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.2) translateY(-200px); opacity: 0; }
      }
      #heartOverlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 200;
        animation: heartFly 5s ease-out forwards;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      #heartOverlay img {
        width: 220px;
        max-width: 80vw;
        height: auto;
        display: block;
        pointer-events: none;
      }
      #heartOverlay .heart-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-size: 2rem;
        font-weight: bold;
        text-align: center;
        text-shadow: 0 0 10px rgba(255,255,255,0.9);
        white-space: nowrap;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    // Create overlay container
    const wrap = document.createElement("div");
    wrap.id = "heartOverlay";
    // Insert heart image
    const heartImg = document.createElement("img");
    heartImg.src = "img/heart_overlay.png";
    wrap.appendChild(heartImg);
    // Insert text inside the heart; limit to 4 characters so it fits nicely
    const text = document.createElement("div");
    text.className = "heart-text";
    text.textContent = (custom.name || "").trim().substring(0, 4);
    wrap.appendChild(text);
    // Align the heart horizontally with the central flower (the second flower).  By
    // computing the bounding box of the middle flower after it has bloomed, we
    // position the heart overlay so that its horizontal centre matches that of
    // the flower.  This ensures the heart rises along the same vertical line.
    try {
      // Align the heart horizontally and vertically with the centre of the
      // middle flower's stem.  The vertical alignment ensures the heart
      // appears directly above the flower and travels upward along the
      // same line.  If the element is not found, default to viewport centre.
      const stem = document.querySelector(".flower--2 .flower__line");
      if (stem) {
        const rect = stem.getBoundingClientRect();
        // Position the heart overlay so its horizontal centre matches the
        // centre of the stem.
        // Subtract a small horizontal offset (~10px) to better centre the heart over
        // the middle flower.  Without this offset the heart can appear slightly
        // to the right of the stem due to stacking context and transform origin.
        wrap.style.left = `${rect.left + rect.width / 2 - 40}px`;
        // Place the heart so that its initial vertical position aligns with
        // the top of the stem.  The translateY in the animation will then
        // move it upward.
        wrap.style.top = `${rect.top}px`;
      } else {
        // Fallback: align with the centre of the second flower if the stem is missing
        const central = document.querySelector(".flower--2");
        if (central) {
          const rect2 = central.getBoundingClientRect();
          wrap.style.left = `${rect2.left + rect2.width / 2 - 10}px`;
          wrap.style.top = `${rect2.top}px`;
        }
      }
    } catch (e) {
      // Ignore errors silently; fallback to default centering
    }
    // When clicking the heart, navigate to the message page
    wrap.addEventListener("click", navigateToMessage);
    // Append overlay to body
    document.body.appendChild(wrap);
  }

  // Show the heart after a delay to allow the flowers to bloom.  The timing
  // corresponds roughly to the end of the bloom animations.  Adjust if needed.
  setTimeout(showHeart, 7000);
});
