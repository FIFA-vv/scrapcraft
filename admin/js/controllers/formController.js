/**
 * Admin Controller: FormController
 * Binds HTML input controls to BirthdayConfigModel state and manages reactive UI updates.
 */

export class FormController {
  constructor(model, storageManager) {
    this.model = model;
    this.storage = storageManager;
    this.init();
  }

  init() {
    this.bindRecipientInputs();
    this.bindWishTypeSelector();
    this.bindPhotoUploads();
    this.bindVideoUploads();
    this.bindMusicControls();
    this.bindThemeAndColors();
    this.bindTimelineEditor();
    this.bindMessageEditor();
    this.bindGiftSelector();
    this.bindEffectsAndGuestbook();
    this.bindJSONExportAndModal();

    // Subscribe model changes to sync UI & Live Device Preview Frame
    this.model.subscribe(state => {
      this.syncLivePreviewFrame(state);
    });

    // Populate initial form fields from model state
    this.populateFormFromModel();
  }

  /**
   * Helper method to handle reading a file via FileReader
   * @param {File} file - The file to read
   * @param {function(string):void} callback - Callback executed with the Data URL
   */
  handleFileUpload(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = res => callback(res.target.result);
    reader.readAsDataURL(file);
  }

  /**
   * Populates form fields from model state
   */
  populateFormFromModel() {
    const state = this.model.get();

    // Recipient
    document.getElementById('recipient-name').value = state.recipient.name || '';
    document.getElementById('recipient-nickname').value = state.recipient.nickname || '';
    document.getElementById('recipient-age').value = state.recipient.age || '';
    document.getElementById('birth-date').value = state.recipient.birthDate || '';
    document.getElementById('relationship').value = state.recipient.relationship || 'best-friend';

    // Music
    document.getElementById('music-preset').value = state.media.music.presetKey || 'orchestral';
    document.getElementById('music-volume').value = state.media.music.volume || 80;
    document.getElementById('music-volume-badge').innerText = (state.media.music.volume || 80) + '%';
    document.getElementById('music-autoplay').checked = !!state.media.music.autoplay;

    // Theme & Colors
    document.getElementById('color-primary').value = state.theme.customColors.primary || '#a855f7';
    document.getElementById('color-primary-text').value = state.theme.customColors.primary || '#a855f7';
    document.getElementById('color-secondary').value = state.theme.customColors.secondary || '#ec4899';
    document.getElementById('color-secondary-text').value = state.theme.customColors.secondary || '#ec4899';

    // Letter & Gift
    document.getElementById('letter-body').value = state.letter.message || '';
    document.getElementById('gift-title').value = state.gift.title || '';
    document.getElementById('gift-detail').value = state.gift.detail || '';

    // Features
    document.getElementById('feature-guestbook').checked = !!state.features.guestBook;
    document.getElementById('feature-mic-blowout').checked = !!state.features.micBlowout;
    document.getElementById('feature-balloons').checked = !!state.features.floatingBalloons;
    document.getElementById('confetti-density').value = state.features.confettiDensity || 120;
    document.getElementById('confetti-density-badge').innerText = (state.features.confettiDensity || 120) + ' Particles';
    const checkWatermark = document.getElementById('check-watermark');
    if (checkWatermark) checkWatermark.checked = !!state.features.watermark;

    // Render lists
    this.renderPhotoPreviews();
    this.renderVideoPreviews();
    this.renderTimelineItems();

    // Wish type
    const savedWishType = state.wishType || 'birthday';
    const wishCards = document.querySelectorAll('.wish-type-card');
    wishCards.forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-wish') === savedWishType);
    });

    this.syncLivePreviewFrame(state);
  }

  /* 0. Wish Type Selector Binding */
  bindWishTypeSelector() {
    const wishCards = document.querySelectorAll('.wish-type-card[data-wish]');
    wishCards.forEach(card => {
      card.addEventListener('click', () => {
        const wish = card.getAttribute('data-wish');
        wishCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.model.setField('wishType', wish);
      });
    });
  }

  /* 1. Recipient Details Binding */
  bindRecipientInputs() {
    const fields = [
      { id: 'recipient-name', path: 'recipient.name' },
      { id: 'recipient-nickname', path: 'recipient.nickname' },
      { id: 'recipient-age', path: 'recipient.age' },
      { id: 'birth-date', path: 'recipient.birthDate' },
      { id: 'relationship', path: 'recipient.relationship' }
    ];

    fields.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) {
        el.addEventListener('input', e => {
          let val = e.target.value;
          if (item.id === 'recipient-age') val = parseInt(val, 10) || 0;
          this.model.setField(item.path, val);
        });
      }
    });

    // Avatar Dropzone
    const avatarDrop = document.getElementById('avatar-dropzone');
    const avatarInput = document.getElementById('input-avatar-file');
    if (avatarDrop && avatarInput) {
      avatarDrop.addEventListener('click', () => avatarInput.click());
      avatarInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
          this.handleFileUpload(file, dataUrl => {
            this.model.setField('recipient.avatar', dataUrl);
            document.getElementById('avatar-filename').innerText = file.name;
          });
        }
      });
    }
  }

  /* 2. Photo Upload Binding */
  bindPhotoUploads() {
    const dropzone = document.getElementById('photos-dropzone');
    const fileInput = document.getElementById('input-photo-file');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', e => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          this.handleFileUpload(file, dataUrl => {
            this.model.addPhoto({
              name: file.name,
              url: dataUrl,
              caption: file.name
            });
            this.renderPhotoPreviews();
          });
        });
      });
    }
  }

  renderPhotoPreviews() {
    const container = document.getElementById('photo-preview-container');
    const badge = document.getElementById('badge-photo-count');
    const photos = this.model.get().media.photos;

    if (badge) badge.innerText = `${photos.length} Photos`;
    if (!container) return;

    container.innerHTML = '';
    photos.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'photo-preview-card';

      const img = document.createElement('img');
      img.src = photo.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23c084fc" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';
      img.alt = photo.name;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'photo-remove-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Remove Photo';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.model.removePhoto(photo.id);
        this.renderPhotoPreviews();
      });

      card.appendChild(img);
      card.appendChild(removeBtn);
      container.appendChild(card);
    });
  }

  /* 3. Video Upload Binding */
  bindVideoUploads() {
    const dropzone = document.getElementById('videos-dropzone');
    const fileInput = document.getElementById('input-video-file');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', e => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          this.handleFileUpload(file, dataUrl => {
            this.model.addVideo({
              name: file.name,
              url: dataUrl,
              title: file.name
            });
            this.renderVideoPreviews();
          });
        });
      });
    }
  }

  renderVideoPreviews() {
    const container = document.getElementById('video-preview-container');
    const badge = document.getElementById('badge-video-count');
    const videos = this.model.get().media.videos;

    if (badge) badge.innerText = `${videos.length} Videos`;
    if (!container) return;

    container.innerHTML = '';
    videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'photo-preview-card';

      const videoEl = document.createElement('video');
      videoEl.src = video.url;
      videoEl.muted = true;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'photo-remove-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Remove Video';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.model.removeVideo(video.id);
        this.renderVideoPreviews();
      });

      card.appendChild(videoEl);
      card.appendChild(removeBtn);
      container.appendChild(card);
    });
  }

  /* 4. Music Controls */
  bindMusicControls() {
    const presetSelect = document.getElementById('music-preset');
    const volumeSlider = document.getElementById('music-volume');
    const volumeBadge = document.getElementById('music-volume-badge');
    const autoplayToggle = document.getElementById('music-autoplay');
    const customGroup = document.getElementById('group-custom-music-file');
    const triggerUpload = document.getElementById('btn-trigger-music-upload');
    const musicInput = document.getElementById('input-music-file');

    if (presetSelect) {
      presetSelect.addEventListener('change', e => {
        const val = e.target.value;
        this.model.setField('media.music.presetKey', val);
        if (customGroup) {
          customGroup.style.display = val === 'custom' ? 'flex' : 'none';
        }
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', e => {
        const val = parseInt(e.target.value, 10);
        if (volumeBadge) volumeBadge.innerText = val + '%';
        this.model.setField('media.music.volume', val);
      });
    }

    if (autoplayToggle) {
      autoplayToggle.addEventListener('change', e => {
        this.model.setField('media.music.autoplay', e.target.checked);
      });
    }

    if (triggerUpload && musicInput) {
      triggerUpload.addEventListener('click', () => musicInput.click());
      musicInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
          this.handleFileUpload(file, dataUrl => {
            this.model.setField('media.music.customUrl', dataUrl);
            document.getElementById('music-filename').innerText = file.name;
          });
        }
      });
    }
  }

  /* 5. Theme & Color Picker Binding */
  bindThemeAndColors() {
    const themeCards = document.querySelectorAll('.theme-preset-card[data-preset]');
    themeCards.forEach(card => {
      card.addEventListener('click', () => {
        const preset = card.getAttribute('data-preset');
        themeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.model.setField('theme.preset', preset);
      });
    });

    const primaryColor = document.getElementById('color-primary');
    const primaryText = document.getElementById('color-primary-text');
    const secondaryColor = document.getElementById('color-secondary');
    const secondaryText = document.getElementById('color-secondary-text');

    if (primaryColor && primaryText) {
      primaryColor.addEventListener('input', e => {
        primaryText.value = e.target.value;
        this.model.setField('theme.customColors.primary', e.target.value);
      });
      primaryText.addEventListener('input', e => {
        primaryColor.value = e.target.value;
        this.model.setField('theme.customColors.primary', e.target.value);
      });
    }

    if (secondaryColor && secondaryText) {
      secondaryColor.addEventListener('input', e => {
        secondaryText.value = e.target.value;
        this.model.setField('theme.customColors.secondary', e.target.value);
      });
      secondaryText.addEventListener('input', e => {
        secondaryColor.value = e.target.value;
        this.model.setField('theme.customColors.secondary', e.target.value);
      });
    }
  }

  /* 6. Timeline Editor Binding */
  bindTimelineEditor() {
    const addBtn = document.getElementById('btn-add-milestone');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.model.addTimelineItem();
        this.renderTimelineItems();
      });
    }
  }

  renderTimelineItems() {
    const container = document.getElementById('timeline-container');
    const items = this.model.get().timeline;
    if (!container) return;

    container.innerHTML = '';
    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'timeline-item-card';

      card.innerHTML = `
        <div class="timeline-badge">${index + 1}</div>
        <div class="timeline-item-body">
          <input type="text" class="form-control item-title" value="${item.title}" placeholder="Milestone Title">
          <input type="text" class="form-control item-date" value="${item.date}" placeholder="Date / Period">
          <textarea class="form-textarea item-desc" style="grid-column:1/-1;min-height:70px;" placeholder="Milestone Description">${item.description}</textarea>
        </div>
        <button class="photo-remove-btn btn-remove-timeline" style="top:12px;right:12px;" title="Delete Milestone">&times;</button>
      `;

      card.querySelector('.item-title').addEventListener('input', e => {
        this.model.updateTimelineItem(item.id, 'title', e.target.value);
      });
      card.querySelector('.item-date').addEventListener('input', e => {
        this.model.updateTimelineItem(item.id, 'date', e.target.value);
      });
      card.querySelector('.item-desc').addEventListener('input', e => {
        this.model.updateTimelineItem(item.id, 'description', e.target.value);
      });
      card.querySelector('.btn-remove-timeline').addEventListener('click', () => {
        this.model.removeTimelineItem(item.id);
        this.renderTimelineItems();
      });

      container.appendChild(card);
    });
  }

  /* 7. Message Editor Binding */
  bindMessageEditor() {
    const letterBody = document.getElementById('letter-body');
    if (letterBody) {
      letterBody.addEventListener('input', e => {
        this.model.setField('letter.message', e.target.value);
      });
    }

    const envelopePills = document.querySelectorAll('.envelope-pill');
    envelopePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const color = pill.getAttribute('data-color');
        const seal = pill.getAttribute('data-seal');
        envelopePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.model.setField('letter.envelopeColor', color);
        this.model.setField('letter.sealStyle', seal);
      });
    });
  }

  /* 8. Gift Selector Binding */
  bindGiftSelector() {
    const giftCards = document.querySelectorAll('.gift-type-card');
    giftCards.forEach(card => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-gift-type');
        giftCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.model.setField('gift.type', type);
      });
    });

    const giftTitle = document.getElementById('gift-title');
    const giftDetail = document.getElementById('gift-detail');

    if (giftTitle) {
      giftTitle.addEventListener('input', e => this.model.setField('gift.title', e.target.value));
    }
    if (giftDetail) {
      giftDetail.addEventListener('input', e => this.model.setField('gift.detail', e.target.value));
    }
  }

  /* 9. Effects & Guestbook Toggle Binding */
  bindEffectsAndGuestbook() {
    const guestbookToggle = document.getElementById('feature-guestbook');
    const micToggle = document.getElementById('feature-mic-blowout');
    const balloonsToggle = document.getElementById('feature-balloons');
    const confettiSlider = document.getElementById('confetti-density');
    const confettiBadge = document.getElementById('confetti-density-badge');

    if (guestbookToggle) {
      guestbookToggle.addEventListener('change', e => {
        this.model.setField('features.guestBook', e.target.checked);
      });
    }
    if (micToggle) {
      micToggle.addEventListener('change', e => {
        this.model.setField('features.micBlowout', e.target.checked);
      });
    }
    if (balloonsToggle) {
      balloonsToggle.addEventListener('change', e => {
        this.model.setField('features.floatingBalloons', e.target.checked);
      });
    }
    if (confettiSlider) {
      confettiSlider.addEventListener('input', e => {
        const val = parseInt(e.target.value, 10);
        if (confettiBadge) confettiBadge.innerText = val + ' Particles';
        this.model.setField('features.confettiDensity', val);
      });
    }

    const watermarkToggle = document.getElementById('check-watermark');
    if (watermarkToggle) {
      watermarkToggle.addEventListener('change', e => {
        this.model.setField('features.watermark', e.target.checked);
      });
    }
  }

  /* 10. JSON Inspection & Download Modal */
  bindJSONExportAndModal() {
    const modal = document.getElementById('json-modal');
    const codeBlock = document.getElementById('json-modal-code');
    const openBtn = document.getElementById('btn-view-json');
    const inspectorBtn = document.getElementById('btn-open-json-inspector');
    const closeBtn = document.getElementById('btn-close-json-modal');
    const doneBtn = document.getElementById('btn-modal-close-done');
    const copyBtn = document.getElementById('btn-copy-json');
    const downloadBtn = document.getElementById('btn-download-json');

    const openModal = () => {
      if (codeBlock) codeBlock.innerText = this.model.toJSON();
      if (modal) modal.style.display = 'flex';
    };

    const closeModal = () => {
      if (modal) modal.style.display = 'none';
    };

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (inspectorBtn) inspectorBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (doneBtn) doneBtn.addEventListener('click', closeModal);

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(this.model.toJSON()).then(() => {
          copyBtn.innerText = 'Copied to Clipboard!';
          setTimeout(() => copyBtn.innerText = 'Copy JSON to Clipboard', 2000);
        });
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const blob = new Blob([this.model.toJSON()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `birthday-config-${this.model.get().recipient.name.toLowerCase().replace(/\s+/g, '-') || 'wish'}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  /* Wish type helpers */
  getWishMeta(wishType) {
    const map = {
      'birthday': { emoji: '🎂', verb: 'Happy Birthday', label: 'Birthday' },
      'bf-gf': { emoji: '💑', verb: 'I Love You', label: 'Love' },
      'mom': { emoji: '👩', verb: 'Happy Birthday', label: 'Mom' },
      'dad': { emoji: '👨', verb: 'Happy Birthday', label: 'Dad' },
      'sibling': { emoji: '🤝', verb: 'Hey', label: 'Sibling' },
      'anniversary': { emoji: '💍', verb: 'Happy Anniversary', label: 'Anniversary' },
      'valentine': { emoji: '💌', verb: 'Be My Valentine', label: 'Valentine' },
    };
    return map[wishType] || map['birthday'];
  }

  /* Live Preview Sticky Frame Sync */
  syncLivePreviewFrame(state) {
    const prevName = document.getElementById('prev-recipient-name');
    const prevSub = document.getElementById('prev-recipient-sub');
    const prevBadge = document.getElementById('prev-guestbook-badge');
    const prevEmoji = document.getElementById('prev-wish-emoji');

    const meta = this.getWishMeta(state.wishType);

    if (prevEmoji) prevEmoji.textContent = meta.emoji;

    if (prevName) {
      prevName.innerText = `${meta.verb}, ${state.recipient.name || 'Recipient'}!`;
    }
    if (prevSub) {
      const themeLabel = (state.theme.preset || 'preset-pastel').replace('preset-', '').replace(/-/g, ' ').toUpperCase();
      prevSub.innerText = `${meta.label} Wish • ${themeLabel}`;
    }
    if (prevBadge) {
      prevBadge.innerText = `Guest Book: ${state.features.guestBook ? 'Enabled' : 'Disabled'}`;
    }
  }
}
