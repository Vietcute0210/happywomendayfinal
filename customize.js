// Customization script with support for multiple images, multiple messages, and audio selection.
// This version does not persist uploaded images across page reloads to ensure a fresh form each time.
document.addEventListener('DOMContentLoaded', () => {
  // Grab DOM elements
  const nameInput = document.getElementById('nameInput');
  const imgInput = document.getElementById('imgInput');
  const imgPreviewContainer = document.getElementById('imgPreviewContainer');
  const addImageBtn = document.getElementById('addImageBtn');
  const clearImagesBtn = document.getElementById('clearImagesBtn');
  const messageInput = document.getElementById('messageInput');
  const themeInput = document.getElementById('themeInput');
  const flowerTypeInput = document.getElementById('flowerTypeInput');
  const audioSelect = document.getElementById('audioSelect');
  const customAudioInput = document.getElementById('customAudio');
  const audioLabel = document.getElementById('audioLabel');
  const shareButton = document.getElementById('shareButton');
  const shareStatus = document.getElementById('shareStatus');
  const startButton = document.getElementById('startButton');
  const startFromCustomize = document.getElementById('startFromCustomize');

  // Array to hold image DataURLs. Cleared whenever the user chooses new files.
  let imgDataArray = [];
  // Holder for custom audio DataURL
  let customAudioData = '';

  // Populate simple fields from URL params or localStorage.
  (function populateFromStorage() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('name')) {
      try {
        nameInput.value = decodeURIComponent(params.get('name'));
      } catch {
        nameInput.value = params.get('name');
      }
    }
    if (params.has('message')) {
      try {
        messageInput.value = decodeURIComponent(params.get('message'));
      } catch {
        messageInput.value = params.get('message');
      }
    }
    if (params.has('theme')) {
      themeInput.value = params.get('theme');
    }
    if (params.has('flowerType')) {
      flowerTypeInput.value = params.get('flowerType');
    }
    // If no query params, load from localStorage. Do not load images to keep the form blank.
    if (!window.location.search) {
      const savedRaw = localStorage.getItem('customization');
      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw);
          if (saved.name) nameInput.value = saved.name;
          if (Array.isArray(saved.messages)) {
            messageInput.value = saved.messages.join('\n');
          } else if (saved.message) {
            messageInput.value = saved.message;
          }
          if (saved.theme) themeInput.value = saved.theme;
          if (saved.flowerType) flowerTypeInput.value = saved.flowerType;
          if (saved.audio) {
            if (typeof saved.audio === 'string' && saved.audio.startsWith('data')) {
              customAudioData = saved.audio;
              audioSelect.value = 'custom';
              audioLabel.textContent = '(đã chọn nhạc)';
              audioLabel.style.display = 'inline';
            } else {
              const map = {
                'sound/original sound - spotify.sngspeed - Download Now!.mp3': 'default',
                'sound/song1.mp3': 'song1',
                'sound/song2.mp3': 'song2',
                'sound/song3.mp3': 'song3',
                'sound/song4.mp3': 'song4',
                'sound/song5.mp3': 'song5'
              };
              audioSelect.value = map[saved.audio] || 'default';
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  })();

  // Utility: refresh the preview container based on current imgDataArray
  function refreshImagePreviews() {
    imgPreviewContainer.innerHTML = '';
    imgDataArray.slice(0, 4).forEach((dataURL, index) => {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      // Image preview
      const imgEl = document.createElement('img');
      imgEl.src = dataURL;
      imgEl.style.maxWidth = '80px';
      imgEl.style.maxHeight = '80px';
      imgEl.style.borderRadius = '8px';
      imgEl.style.display = 'block';
      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.style.position = 'absolute';
      removeBtn.style.top = '-6px';
      removeBtn.style.right = '-6px';
      removeBtn.style.width = '20px';
      removeBtn.style.height = '20px';
      removeBtn.style.border = 'none';
      removeBtn.style.borderRadius = '50%';
      removeBtn.style.backgroundColor = '#ff7b7b';
      removeBtn.style.color = '#111';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.fontSize = '14px';
      removeBtn.style.lineHeight = '18px';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Remove this image from the array
        imgDataArray.splice(index, 1);
        refreshImagePreviews();
      });
      wrapper.appendChild(imgEl);
      wrapper.appendChild(removeBtn);
      imgPreviewContainer.appendChild(wrapper);
    });
  }

  // When the hidden file input changes, append new images to the array (up to 4)
  imgInput.addEventListener('change', () => {
    const files = Array.from(imgInput.files);
    // Process each selected file until we reach 4 images total
    files.forEach(file => {
      if (imgDataArray.length >= 4) return;
      const reader = new FileReader();
      reader.onload = ev => {
        imgDataArray.push(ev.target.result);
        refreshImagePreviews();
      };
      reader.readAsDataURL(file);
    });
    // Reset input so selecting the same file again will trigger the change event
    imgInput.value = '';
  });

  // Add image button opens the hidden file input
  if (addImageBtn) {
    addImageBtn.addEventListener('click', () => {
      if (imgDataArray.length >= 4) return; // do not allow more than 4
      imgInput.click();
    });
  }

  // Clear all images button
  if (clearImagesBtn) {
    clearImagesBtn.addEventListener('click', () => {
      imgDataArray = [];
      refreshImagePreviews();
    });
  }

  // Handle audio selection changes
  audioSelect.addEventListener('change', () => {
    const val = audioSelect.value;
    if (val === 'custom') {
      customAudioInput.style.display = 'inline-block';
    } else {
      customAudioInput.style.display = 'none';
      customAudioInput.value = '';
      customAudioData = '';
      audioLabel.style.display = 'none';
      audioLabel.textContent = '';
    }
  });

  // Read custom audio file
  customAudioInput.addEventListener('change', () => {
    const file = customAudioInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      customAudioData = ev.target.result;
      audioLabel.textContent = file.name;
      audioLabel.style.display = 'inline';
    };
    reader.readAsDataURL(file);
  });

  // Create customization object
  function gatherCustomization() {
    let audioValue = '';
    switch (audioSelect.value) {
      case 'default':
        audioValue = 'sound/original sound - spotify.sngspeed - Download Now!.mp3';
        break;
      case 'song1':
        audioValue = 'sound/song1.mp3';
        break;
      case 'song2':
        audioValue = 'sound/song2.mp3';
        break;
      case 'song3':
        audioValue = 'sound/song3.mp3';
        break;
      case 'song4':
        audioValue = 'sound/song4.mp3';
        break;
      case 'song5':
        audioValue = 'sound/song5.mp3';
        break;
      case 'custom':
        audioValue = customAudioData;
        break;
      default:
        audioValue = '';
    }
    const msgs = messageInput.value.split('\n').map(s => s.trim()).filter(s => s);
    return {
      name: nameInput.value.trim(),
      messages: msgs.slice(0, 5),
      theme: themeInput.value,
      flowerType: flowerTypeInput.value,
      imgs: imgDataArray.slice(0, 4),
      audio: audioValue
    };
  }

  // Build query string for small fields
  function buildQueryParams(data) {
    const params = new URLSearchParams();
    if (data.name) params.set('name', encodeURIComponent(data.name));
    if (data.messages && data.messages.length) {
      params.set('message', encodeURIComponent(data.messages[0]));
    }
    if (data.theme) params.set('theme', data.theme);
    if (data.flowerType) params.set('flowerType', data.flowerType);
    return params.toString();
  }

  // Save customization to localStorage
  function saveData(data) {
    try {
      localStorage.setItem('customization', JSON.stringify(data));
    } catch {
      // ignore errors
    }
  }

  // Click handlers for the large start button in the hero section
  if (startButton) {
    startButton.addEventListener('click', () => {
      const data = gatherCustomization();
      saveData(data);
      try {
        window.name = JSON.stringify(data);
      } catch {}
      const qs = buildQueryParams(data);
      startButton.href = 'flower.html' + (qs ? '?' + qs : '');
    });
  }

  // Click handler for the "Xem hoa" button within customization controls
  if (startFromCustomize) {
    startFromCustomize.addEventListener('click', () => {
      const data = gatherCustomization();
      saveData(data);
      try {
        window.name = JSON.stringify(data);
      } catch {}
      const qs = buildQueryParams(data);
      window.location.href = 'flower.html' + (qs ? '?' + qs : '');
    });
  }

  // Share button: copy shareable link without large data
  if (shareButton) {
    shareButton.addEventListener('click', () => {
      const data = gatherCustomization();
      const params = new URLSearchParams();
      if (data.name) params.set('name', encodeURIComponent(data.name));
      if (data.messages && data.messages.length) {
        params.set('message', encodeURIComponent(data.messages[0]));
      }
      if (data.theme) params.set('theme', data.theme);
      if (data.flowerType) params.set('flowerType', data.flowerType);
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = baseUrl + '?' + params.toString();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          if (shareStatus) {
            shareStatus.textContent = 'Đã sao chép liên kết! Bạn có thể gửi cho bạn bè 😊';
            shareStatus.style.display = 'block';
            setTimeout(() => {
              shareStatus.style.display = 'none';
            }, 4000);
          }
        }).catch(() => {
          if (shareStatus) {
            shareStatus.textContent = 'Không thể sao chép. Hãy copy thủ công: ' + shareUrl;
            shareStatus.style.display = 'block';
          }
        });
      } else {
        if (shareStatus) {
          shareStatus.textContent = 'Hãy copy thủ công liên kết: ' + shareUrl;
          shareStatus.style.display = 'block';
        }
      }
    });
  }
});