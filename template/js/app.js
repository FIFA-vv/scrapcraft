/**
 * Premium Luxury WishCraft Template - Main Logic
 * Supports: Birthday, BF/GF Love, Mom, Dad, Sibling, Anniversary, Valentine
 */

/**
 * Wish Type Configuration — defines per-type text, emoji, and behavior.
 */
const WISH_TYPES = {
  'birthday': {
    heroTitle: (name) => `Happy Birthday, ${name}! 🎂`,
    typedStrings: (nick) => [`Happy Birthday, ${nick}! 🥳`, `Make a Wish, ${nick}! 🎉`, `This day is all about you, ${nick}! 🎊`],
    loaderText: 'Preparing your Birthday Surprise...',
    galleryTitle: 'Precious Memories',
    timelineTitle: 'Our Journey Together',
    letterTitle: 'A Special Birthday Message',
    videosTitle: 'Wishes from Friends',
    guestBookTitle: 'Birthday Guest Book',
    showCake: true,
    cakeInstruction: 'Blow into the microphone to blow out the candles!',
    heartChars: ['❤️', '✨', '🎈'],
  },
  'bf-gf': {
    heroTitle: (name) => `I Love You, ${name}! 💑`,
    typedStrings: (nick) => [`I Love You, ${nick}! 💖`, `You mean the world to me, ${nick}! 🌹`, `Forever yours, ${nick}! 💕`],
    loaderText: 'Sending Love Your Way...',
    galleryTitle: 'Our Beautiful Memories',
    timelineTitle: 'Our Love Story',
    letterTitle: 'A Letter From My Heart',
    videosTitle: 'My Video Messages For You',
    guestBookTitle: 'Leave a Love Note',
    showCake: false,
    heartChars: ['❤️', '💕', '🌹', '✨'],
  },
  'mom': {
    heroTitle: (name) => `Happy Birthday, Mom! 👩`,
    typedStrings: (nick) => [`Happy Birthday, ${nick}! 🌸`, `The Best Mom in the World! 💐`, `Thank you for everything, ${nick}! 💖`],
    loaderText: 'Celebrating the World\'s Best Mom...',
    galleryTitle: 'Our Cherished Memories',
    timelineTitle: 'Moments We Treasure',
    letterTitle: 'A Letter to Mom',
    videosTitle: 'Video Wishes for Mom',
    guestBookTitle: 'Leave Mom a Wish',
    showCake: true,
    cakeInstruction: 'Help Mom blow out the candles!',
    heartChars: ['🌸', '💐', '❤️', '✨'],
  },
  'dad': {
    heroTitle: (name) => `Happy Birthday, Dad! 👨`,
    typedStrings: (nick) => [`Happy Birthday, ${nick}! 🎉`, `The World\'s Greatest Dad! 💪`, `Thank you for everything, ${nick}! ❤️`],
    loaderText: 'Celebrating the Best Dad Ever...',
    galleryTitle: 'Our Best Memories Together',
    timelineTitle: 'Moments We Treasure',
    letterTitle: 'A Letter to Dad',
    videosTitle: 'Video Wishes for Dad',
    guestBookTitle: 'Leave Dad a Wish',
    showCake: true,
    cakeInstruction: 'Help Dad blow out the candles!',
    heartChars: ['💪', '⭐', '❤️', '✨'],
  },
  'sibling': {
    heroTitle: (name) => `Hey ${name}, this is for you! 🤝`,
    typedStrings: (nick) => [`For you, ${nick}! 🎉`, `Best Sibling Ever! 🤝`, `Always got your back, ${nick}! ❤️`],
    loaderText: 'Making Something Special...',
    galleryTitle: 'Our Fun Memories',
    timelineTitle: 'Our Journey Together',
    letterTitle: 'A Note For You',
    videosTitle: 'Video Messages',
    guestBookTitle: 'Leave a Wish',
    showCake: true,
    cakeInstruction: 'Blow out the candles!',
    heartChars: ['🤝', '😄', '❤️', '✨'],
  },
  'anniversary': {
    heroTitle: (name) => `Happy Anniversary, ${name}! 💍`,
    typedStrings: (nick) => [`Happy Anniversary, ${nick}! 💍`, `Here\'s to many more years! 🥂`, `The best is yet to come, ${nick}! 💕`],
    loaderText: 'Celebrating Your Special Day...',
    galleryTitle: 'Our Journey Together',
    timelineTitle: 'Milestones of Our Love',
    letterTitle: 'An Anniversary Letter',
    videosTitle: 'Anniversary Wishes',
    guestBookTitle: 'Anniversary Guest Book',
    showCake: false,
    heartChars: ['💍', '💕', '🥂', '✨'],
  },
  'valentine': {
    heroTitle: (name) => `Be My Valentine, ${name}! 💌`,
    typedStrings: (nick) => [`Be My Valentine, ${nick}! 💌`, `You\'re My Everything, ${nick}! ❤️`, `Loving You Always, ${nick}! 💖`],
    loaderText: 'Sending You All My Love...',
    galleryTitle: 'Our Love Memories',
    timelineTitle: 'Our Love Story',
    letterTitle: 'My Valentine Letter',
    videosTitle: 'Love Video Messages',
    guestBookTitle: 'Leave a Love Message',
    showCake: false,
    heartChars: ['💌', '❤️', '💕', '✨'],
  },
};

function getWishType(config) {
  return WISH_TYPES[config.wishType] || WISH_TYPES['birthday'];
}

const THEMES = {
  'luxury-pink': {
    name: 'Luxury Pink',
    primary: '#b76e79',
    secondary: '#ffb6c1',
    background: '#2c0e18',
    glassBg: 'rgba(50, 20, 30, 0.5)'
  },
  'anime': {
    name: 'Anime',
    primary: '#ffb7c5',
    secondary: '#87ceeb',
    background: '#1e293b',
    glassBg: 'rgba(40, 50, 70, 0.6)'
  },
  'warm-sunset': {
    name: 'Warm Sunset',
    background: '#AD2831',
    secondary: '#D8973C',
    primary: '#F3E6BD',
    glassBg: 'rgba(253, 155, 183, 0.4)'
  }
};

let currentTheme = 'warm-sunset'; // Default
let globalConfig = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Fetch Configuration
    const res = await fetch('config.json');
    globalConfig = await res.json();

    // 2. Initialize AOS (Animate on Scroll)
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
      offset: 100
    });

    // 3. Initialize App Data
    setupThemeSwitcher();
    // Default to the config theme or our default
    let initialThemeKey = globalConfig.theme.preset || 'galaxy';
    if (!THEMES[initialThemeKey]) initialThemeKey = 'galaxy';
    applyTheme(initialThemeKey);

    populateData(globalConfig);
    setupInteractions(globalConfig);
    setupAudio(globalConfig.media.music);
    setupAdvancedFeatures(globalConfig);

    // 5. Handle Loader and GSAP Luxury Intro Transitions
    setTimeout(() => {
      const loader = document.getElementById('loader');
      const mainContent = document.getElementById('main-content');

      // Fade out loader using GSAP
      gsap.to(loader, {
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
          loader.style.display = 'none';
          mainContent.classList.remove('hidden');

          // GSAP Hero Reveal Animation (Staggered)
          const tl = gsap.timeline();
          tl.to(".hero-content", { opacity: 1, y: 0, duration: 0.5 })
            .fromTo(".hero-content > *",
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "back.out(1.7)" }
            );

          // Typed.js for Subtitle
          const wt = getWishType(globalConfig);
          new Typed('#hero-subtitle', {
            strings: wt.typedStrings(globalConfig.recipient.nickname || globalConfig.recipient.name),
            typeSpeed: 50,
            backSpeed: 30,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|',
            autoInsertCss: true
          });
        }
      });
    }, 2000);

  } catch (error) {
    console.error('Failed to load config.json:', error);
    document.getElementById('loader-text').textContent = 'Error loading template data.';
  }
});

/**
 * Initializes the Theme Switcher UI and attaches event listeners.
 * Allows users to dynamically change the CSS variables for different luxury presets.
 */
function setupThemeSwitcher() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const panel = document.getElementById('theme-panel');
  const closeBtn = document.getElementById('theme-close-btn');
  const grid = document.getElementById('theme-grid');

  // Generate Swatches
  Object.keys(THEMES).forEach(key => {
    const t = THEMES[key];
    const el = document.createElement('div');
    el.className = 'theme-swatch';
    el.setAttribute('data-theme', key);
    el.innerHTML = `
      <div class="theme-colors">
        <div class="theme-color-dot" style="background: ${t.primary}"></div>
        <div class="theme-color-dot" style="background: ${t.secondary}"></div>
      </div>
      <span>${t.name}</span>
    `;

    el.addEventListener('click', () => {
      document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
      applyTheme(key);
    });

    grid.appendChild(el);
  });

  toggleBtn.addEventListener('click', () => panel.classList.add('open'));
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));
}

/**
 * Applies a specific theme preset by updating root CSS variables and active UI states.
 * @param {string} preset - The key of the theme to apply (e.g., 'galaxy', 'luxury-black').
 */
function applyTheme(preset) {
  if (!THEMES[preset]) return;
  currentTheme = preset;
  const theme = THEMES[preset];

  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--background', theme.background);
  root.style.setProperty('--glass-bg', theme.glassBg);

  if (theme.textPrimary) root.style.setProperty('--text-primary', theme.textPrimary);
  else root.style.setProperty('--text-primary', '#ffffff');

  if (theme.textSecondary) root.style.setProperty('--text-secondary', theme.textSecondary);
  else root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');

  // Update particles if they are already initialized
  initParticles();
}

/**
 * Populates the DOM with customer data from the configuration file.
 * Automatically injects text, renders gallery items (with lazy loading), timeline elements, and video blocks.
 * @param {Object} config - The JSON configuration object loaded from the backend.
 */
/**
 * Plan-based section visibility.
 * Hides entire sections that are not available in the chosen plan tier.
 * Called at the very start of populateData so no titles or content ever render.
 *
 * Basic    (₹299): name, message, ≤5 photos, animation, confetti, music
 * Standard (₹499): + gallery, timeline, animated letter, cake, fireworks, theme
 * Premium  (₹999): + video, gift, scratch card, quiz, memory wall, interactive gift
 */
function applyPlanVisibility(config) {
  const plan = (config.plan || 'basic').toLowerCase();

  // Sections hidden for Basic plan (requires Standard or higher)
  const standardOnlySections = ['timeline', 'quiz-section'];

  // Sections hidden for Basic + Standard (requires Premium)
  const premiumOnlySections = ['memory-wall', 'gift', 'scratch-card-section'];

  if (plan === 'basic') {
    [...standardOnlySections, ...premiumOnlySections].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  } else if (plan === 'standard') {
    premiumOnlySections.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
  // premium: all sections visible (default HTML state)
}

function populateData(config) {
  // 1. Apply plan-based section gating FIRST — before any content renders
  applyPlanVisibility(config);

  const wt = getWishType(config);

  // Page title & hero
  document.title = wt.heroTitle(config.recipient.name);
  document.getElementById('hero-title').textContent = config.recipient.name;
  document.getElementById('hero-age').textContent = config.recipient.age
    ? `${wt.typedStrings(config.recipient.name)[0].split(',')[0]} — ${config.recipient.age} Years`
    : wt.typedStrings(config.recipient.name)[0].split(',')[0];

  // Update loader text
  const loaderText = document.getElementById('loader-text');
  if (loaderText) loaderText.textContent = wt.loaderText;

  // Update section titles dynamically
  const galleryTitle = document.querySelector('#gallery .section-title');
  if (galleryTitle) galleryTitle.textContent = wt.galleryTitle;
  const timelineTitle = document.querySelector('#timeline .section-title');
  if (timelineTitle) timelineTitle.textContent = wt.timelineTitle;
  const letterTitle = document.querySelector('#letter .section-title');
  if (letterTitle) letterTitle.textContent = wt.letterTitle;
  const videosTitle = document.querySelector('#memory-wall .section-title');
  if (videosTitle) videosTitle.textContent = wt.videosTitle;
  const guestTitle = document.querySelector('#guest-book .section-title');
  if (guestTitle) guestTitle.textContent = wt.guestBookTitle;

  // Show/hide cake section based on wish type
  const cakeSection = document.getElementById('cake');
  if (cakeSection) {
    cakeSection.style.display = wt.showCake ? '' : 'none';
  }
  if (wt.showCake && wt.cakeInstruction) {
    const cakeInstrEl = document.getElementById('cake-instruction');
    if (cakeInstrEl) cakeInstrEl.textContent = wt.cakeInstruction;
  }

  if (config.features.floatingBalloons) {
    createGSAPBalloons(config);
  }

  // Gallery (Scrapbook)
  const scrapbook = document.getElementById('scrapbook');
  if (config.media.photos && config.media.photos.length > 0) {
    // Enforce plan photo limits
    const plan = (config.plan || 'basic').toLowerCase();
    const photoLimit = plan === 'basic' ? 5 : plan === 'standard' ? 15 : Infinity;

    const photos = config.media.photos.filter(p => p.url).slice(0, photoLimit);
    const numPages = Math.ceil(photos.length / 2);

    for (let i = 0; i < numPages; i++) {
      const page = document.createElement('div');
      page.className = 'scrapbook-page';
      page.style.zIndex = numPages - i;

      const frontPhoto = photos[i * 2];
      const backPhoto = photos[i * 2 + 1];

      let html = `<div class="page-front">
        <div class="gallery-item">
          <img src="${frontPhoto.url}" alt="${frontPhoto.name}" loading="lazy">
          <div class="gallery-caption">${frontPhoto.caption || frontPhoto.name}</div>
        </div>
      </div>`;

      if (backPhoto) {
        html += `<div class="page-back">
          <div class="gallery-item">
            <img src="${backPhoto.url}" alt="${backPhoto.name}" loading="lazy">
            <div class="gallery-caption">${backPhoto.caption || backPhoto.name}</div>
          </div>
        </div>`;
      } else {
        html += `<div class="page-back"></div>`;
      }

      page.innerHTML = html;
      scrapbook.appendChild(page);
    }
  } else {
    document.getElementById('gallery').style.display = 'none';
  }

  // Letter
  if (config.letter && config.letter.message) {
    document.getElementById('letter-content').textContent = config.letter.message;
  } else {
    document.getElementById('letter').style.display = 'none';
  }

  // Timeline
  const timelineContainer = document.getElementById('timeline-container');
  if (config.timeline && config.timeline.length > 0) {
    config.timeline.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'timeline-item';

      let photoHtml = '';
      if (item.photo) {
        photoHtml = `<img src="${item.photo}" class="timeline-img" alt="${item.title}" loading="lazy">`;
      }

      const isEven = index % 2 === 1;
      const aosDirection = isEven ? 'fade-left' : 'fade-right';

      el.innerHTML = `
        <div class="timeline-dot" data-aos="zoom-in" data-aos-delay="200"></div>
        <div class="timeline-content" data-aos="${aosDirection}">
          <div class="timeline-date">${item.date}</div>
          <h3 class="timeline-title">${item.title}</h3>
          <p>${item.description}</p>
          ${photoHtml}
        </div>
      `;
      timelineContainer.appendChild(el);
    });
  } else {
    document.getElementById('timeline').style.display = 'none';
  }

  // Cake (Candles based on age)
  const candlesContainer = document.getElementById('candles-container');
  const candleCount = Math.min(config.recipient.age || 1, 15);
  for (let i = 0; i < candleCount; i++) {
    const candle = document.createElement('div');
    candle.className = 'candle';
    candle.innerHTML = `<div class="flame"></div>`;
    candlesContainer.appendChild(candle);
  }

  // Videos
  const videoGrid = document.getElementById('video-grid');
  if (config.media.videos && config.media.videos.length > 0) {
    config.media.videos.forEach((video, idx) => {
      if (video.url) {
        const item = document.createElement('div');
        item.className = 'video-item';
        item.setAttribute('data-aos', 'fade-up');
        item.setAttribute('data-aos-delay', (idx % 2) * 150);
        item.innerHTML = `
          <video controls src="${video.url}"></video>
          <div class="video-title">${video.title || video.name}</div>
        `;
        videoGrid.appendChild(item);
      }
    });
  } else {
    document.getElementById('memory-wall').style.display = 'none';
  }

  // Gift
  if (config.gift && config.gift.title) {
    document.getElementById('gift-title').textContent = config.gift.title;
    document.getElementById('gift-detail').textContent = config.gift.detail;
  } else {
    document.getElementById('gift').style.display = 'none';
  }

  // Guestbook
  if (!config.features.guestBook) {
    document.getElementById('guest-book').style.display = 'none';
  } else {
    loadGuestBookMessages();
  }
}

/**
 * Initializes all core user interactions including GSAP scroll animations, envelope opening, and letter visibility.
 * @param {Object} config - The JSON configuration object containing the theme and interactive data.
 */
function setupInteractions(config) {
  // Scrapbook Interaction
  const pages = document.querySelectorAll('.scrapbook-page');
  const scrapbook = document.getElementById('scrapbook');

  const updateScrapbookState = () => {
    const isAnyFlipped = document.querySelectorAll('.scrapbook-page.flipped').length > 0;
    if (isAnyFlipped) {
      scrapbook.classList.add('is-open');
    } else {
      scrapbook.classList.remove('is-open');
    }
  };

  pages.forEach((page, index) => {
    page.addEventListener('click', () => {
      if (!page.classList.contains('flipped')) {
        page.classList.add('flipped');
        updateScrapbookState();
        setTimeout(() => {
          page.style.zIndex = index + 1;
        }, 500); // Wait half duration to swap z-index
      } else {
        page.classList.remove('flipped');
        updateScrapbookState();
        setTimeout(() => {
          page.style.zIndex = pages.length - index;
        }, 500);
      }
    });
  });

  // Envelope Interaction (Adding Sparkles when opened)
  const envelope = document.getElementById('envelope-container');
  if (envelope) {
    envelope.addEventListener('click', function () {
      const innerEnv = this.querySelector('.envelope');
      if (!innerEnv.classList.contains('open')) {
        innerEnv.classList.add('open');
        fireConfettiSparkles(this);
      }
    });
  }

  // GSAP ScrollTrigger for Cake
  gsap.registerPlugin(ScrollTrigger);
  gsap.from(".cake", {
    scrollTrigger: {
      trigger: "#cake",
      start: "top center"
    },
    y: 100,
    opacity: 0,
    duration: 1.5,
    ease: "back.out(1.7)"
  });

  // Cake Blowout Logic
  const flames = document.querySelectorAll('.flame');
  let blownOut = false;

  const blowCandles = () => {
    if (blownOut) return;
    blownOut = true;

    gsap.to(flames, {
      scaleY: 0, opacity: 0, duration: 0.5, stagger: 0.05, onComplete: () => {
        flames.forEach(flame => flame.classList.add('extinguished'));
      }
    });

    document.getElementById('cake-instruction').textContent = "Yay! Happy Birthday!";

    // Trigger Massive Confetti
    if (window.confetti) {
      const duration = 5000;
      const end = Date.now() + duration;
      const density = config.features.confettiDensity || 150;
      const theme = THEMES[currentTheme];

      (function frame() {
        confetti({
          particleCount: Math.max(2, density / 20),
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: [theme.primary, theme.secondary, '#ffffff', '#ffd700']
        });
        confetti({
          particleCount: Math.max(2, density / 20),
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: [theme.primary, theme.secondary, '#ffffff', '#ffd700']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  };

  const manualBtn = document.getElementById('btn-manual-blow');

  if (config.features.micBlowout && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        // Resume AudioContext on user interaction
        const resumeAudio = () => {
          if (audioContext.state === 'suspended') audioContext.resume();
        };
        window.addEventListener('click', resumeAudio, { once: true });
        window.addEventListener('scroll', resumeAudio, { once: true });
        window.addEventListener('touchstart', resumeAudio, { once: true });

        scriptProcessor.onaudioprocess = function () {
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let sum = 0;
          let maxVol = 0;
          for (let i = 0; i < array.length; i++) {
            sum += array[i];
            if (array[i] > maxVol) maxVol = array[i];
          }
          const average = sum / array.length;

          if (maxVol > 200 || average > 30) {
            blowCandles();
            stream.getTracks().forEach(track => track.stop());
            scriptProcessor.disconnect();
          }
        };
      })
      .catch(err => {
        console.warn("Mic access denied or unavailable. Falling back to button.", err);
        manualBtn.style.display = 'block';
      });
  } else {
    manualBtn.style.display = 'block';
  }

  manualBtn.addEventListener('click', blowCandles);

  // Guestbook Submission
  const guestForm = document.getElementById('guest-book-form');
  if (guestForm) {
    guestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('guest-name').value;
      const message = document.getElementById('guest-message').value;

      const newMsg = { name, message, date: new Date().toLocaleDateString() };

      let messages = JSON.parse(localStorage.getItem('wishcraft_messages') || '[]');
      messages.unshift(newMsg);
      localStorage.setItem('wishcraft_messages', JSON.stringify(messages));

      guestForm.reset();
      loadGuestBookMessages();

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 }, colors: [THEMES[currentTheme].primary, THEMES[currentTheme].secondary] });
    });
  }
}

/**
 * tsParticles Initialization (Fireflies and Hearts)
 */
async function initParticles() {
  if (!window.tsParticles) return;
  const theme = THEMES[currentTheme];
  const wt = getWishType(globalConfig);
  const heartChars = wt ? wt.heartChars : ['❤️', '✨', '🎈'];

  // We need to re-load the particles instance if it exists
  const firefliesInstance = tsParticles.domItem(0);
  if (firefliesInstance) {
    firefliesInstance.destroy();
  }
  const heartsInstance = tsParticles.domItem(0);
  if (heartsInstance) {
    heartsInstance.destroy();
  }

  // Ambient Fireflies
  await tsParticles.load("tsparticles-fireflies", {
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 60, density: { enable: true, value_area: 800 } },
      color: { value: [theme.primary, theme.secondary, "#ffffff"] },
      shape: { type: "circle" },
      opacity: { value: 0.6, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
      size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.1, sync: false } },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: true,
        straight: false,
        out_mode: "out",
        bounce: false,
      }
    },
    interactivity: {
      detectsOn: "canvas",
      events: {
        onHover: { enable: true, mode: "bubble" },
        resize: true
      },
      modes: {
        bubble: { distance: 200, size: 6, duration: 2, opacity: 1, speed: 3 }
      }
    },
    retina_detect: true
  });

  // Floating Hearts
  await tsParticles.load("tsparticles-hearts", {
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 15, density: { enable: true, value_area: 800 } },
      color: { value: [theme.secondary, theme.primary] },
      shape: {
        type: "char",
        character: { value: heartChars, font: "Verdana", style: "", weight: "400" }
      },
      opacity: { value: 0.8, random: true },
      size: { value: 20, random: true, anim: { enable: true, speed: 2, size_min: 10, sync: false } },
      move: {
        enable: true,
        speed: 2,
        direction: "top",
        random: true,
        straight: false,
        out_mode: "out",
        bounce: false,
      }
    },
    retina_detect: true
  });
}

/**
 * GSAP Balloons
 */
function createGSAPBalloons(config) {
  const container = document.getElementById('balloons-container');
  container.innerHTML = ''; // clear existing
  const theme = THEMES[currentTheme];
  const colors = [theme.primary, theme.secondary, '#ffffff'];

  for (let i = 0; i < 12; i++) {
    const balloon = document.createElement('div');
    balloon.style.position = 'absolute';
    balloon.style.bottom = '-100px';
    balloon.style.width = '40px';
    balloon.style.height = '50px';
    balloon.style.background = colors[i % colors.length];
    balloon.style.borderRadius = '50% 50% 50% 50% / 40% 40% 60% 60%';
    balloon.style.opacity = '0.7';
    balloon.style.left = (Math.random() * 90 + 5) + '%';

    // Balloon string
    const string = document.createElement('div');
    string.style.position = 'absolute';
    string.style.bottom = '-30px';
    string.style.left = '50%';
    string.style.transform = 'translateX(-50%)';
    string.style.width = '2px';
    string.style.height = '30px';
    string.style.background = 'rgba(255,255,255,0.4)';
    balloon.appendChild(string);

    container.appendChild(balloon);

    // GSAP Animation
    gsap.to(balloon, {
      y: -window.innerHeight - 200,
      x: `+=${Math.random() * 100 - 50}`,
      rotation: Math.random() * 30 - 15,
      duration: 15 + Math.random() * 10,
      ease: "none",
      repeat: -1,
      delay: Math.random() * 10
    });
  }
}

/**
 * Fun little localized burst of confetti
 */
function fireConfettiSparkles(el) {
  const rect = el.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  const theme = THEMES[currentTheme];

  if (window.confetti) {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x, y },
      colors: [theme.primary, theme.secondary, '#ffffff'],
      disableForReducedMotion: true
    });
  }
}

/**
 * Guest Book Loading
 */
function loadGuestBookMessages() {
  const container = document.getElementById('guest-messages');
  if (!container) return;

  const messages = JSON.parse(localStorage.getItem('wishcraft_messages') || '[]');
  container.innerHTML = '';

  messages.forEach((msg, idx) => {
    const el = document.createElement('div');
    el.className = 'guest-message-card';
    el.setAttribute('data-aos', 'fade-left');
    el.setAttribute('data-aos-delay', (idx % 5) * 100);
    el.innerHTML = `
      <div class="guest-message-name">${msg.name}</div>
      <p>${msg.message}</p>
    `;
    container.appendChild(el);
  });
}

/**
 * Configures the HTML5 Audio API for background music, manages the mini-player UI, and handles autoplay logic.
 * @param {Object} musicConfig - The music configuration subset from the global config.
 */
function setupAudio(musicConfig) {
  if (!musicConfig) return;

  const audio = document.getElementById('bg-music');
  const playerWidget = document.getElementById('music-player-widget');
  const btnPlay = document.getElementById('btn-music-play');
  const volumeSlider = document.getElementById('music-volume');

  const presetUrls = {
    'orchestral': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'upbeat': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  };

  let src = musicConfig.customUrl || presetUrls[musicConfig.presetKey] || presetUrls['orchestral'];
  if (!src) return;

  audio.src = src;
  audio.volume = (musicConfig.volume || 80) / 100;
  volumeSlider.value = musicConfig.volume || 80;

  if (musicConfig.autoplay) {
    playerWidget.classList.remove('hidden');
    gsap.fromTo(playerWidget, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "back.out(1.7)", delay: 3 });

    let isPlaying = false;

    const playAudio = () => {
      audio.play().then(() => {
        isPlaying = true;
        btnPlay.textContent = '⏸️';
      }).catch(e => console.log("Autoplay blocked by browser. Wait for interaction."));
    };

    playAudio();

    document.body.addEventListener('click', () => {
      if (!isPlaying) playAudio();
    }, { once: true });

    btnPlay.addEventListener('click', () => {
      if (audio.paused) {
        audio.play();
        btnPlay.textContent = '⏸️';
      } else {
        audio.pause();
        btnPlay.textContent = '▶️';
      }
    });

    volumeSlider.addEventListener('input', (e) => {
      audio.volume = e.target.value / 100;
    });
  }
}

/**
 * Binds all advanced and interactive features, including QR Code modal, Web Share, Downloads, 
 * Scratch Card mechanics, and Konami Code easter eggs.
 * @param {Object} config - The global configuration object.
 */
function setupAdvancedFeatures(config) {
  // 1. QR Code
  if (config.features.qrCode && window.QRCode) {
    const btnQr = document.getElementById('btn-qr');
    const qrModal = document.getElementById('qr-modal');
    const qrClose = document.getElementById('qr-close');
    const qrContainer = document.getElementById('qr-code-container');

    btnQr.classList.remove('hidden');
    new QRCode(qrContainer, {
      text: window.location.href,
      width: 200, height: 200,
      colorDark: "#000000", colorLight: "#ffffff"
    });

    btnQr.addEventListener('click', () => qrModal.classList.remove('hidden'));
    qrClose.addEventListener('click', () => qrModal.classList.add('hidden'));
  }

  // 2. Web Share API
  if (config.features.share && navigator.share) {
    const btnShare = document.getElementById('btn-share');
    btnShare.classList.remove('hidden');
    btnShare.addEventListener('click', () => {
      navigator.share({
        title: document.title,
        text: 'Check out this birthday website!',
        url: window.location.href
      });
    });
  }

  // 3. Screenshot Download (html2canvas)
  if (config.features.download && window.html2canvas) {
    const btnDl = document.getElementById('btn-download');
    btnDl.classList.remove('hidden');
    btnDl.addEventListener('click', () => {
      btnDl.textContent = '⏳';
      html2canvas(document.body).then(canvas => {
        const link = document.createElement('a');
        link.download = 'birthday-memory.png';
        link.href = canvas.toDataURL();
        link.click();
        btnDl.textContent = '📸';
      });
    });
  }

  // 4. Fullscreen
  const btnFs = document.getElementById('btn-fullscreen');
  btnFs.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      btnFs.textContent = '✖';
    } else {
      document.exitFullscreen();
      btnFs.textContent = '⛶';
    }
  });

  // 5. Countdown Widget
  if (config.features.countdown && config.partyDate) {
    const cdWidget = document.getElementById('countdown-widget');
    cdWidget.classList.remove('hidden');
    const target = new Date(config.partyDate).getTime();

    const cdInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(cdInterval);
        document.getElementById('cd-days').textContent = '00';
        return;
      }

      document.getElementById('cd-days').textContent = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
      document.getElementById('cd-hours').textContent = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
      document.getElementById('cd-mins').textContent = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      document.getElementById('cd-secs').textContent = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
    }, 1000);
  }

  // 6. Memory Quiz
  if (config.interactive && config.interactive.quiz && config.interactive.quiz.length > 0) {
    document.getElementById('quiz-section').classList.remove('hidden');
    let currentQ = 0;
    const quiz = config.interactive.quiz;

    const qEl = document.getElementById('quiz-question');
    const optsEl = document.getElementById('quiz-options');
    const resEl = document.getElementById('quiz-result');

    const loadQuiz = () => {
      if (currentQ >= quiz.length) {
        qEl.textContent = "Quiz Completed!";
        optsEl.innerHTML = "";
        resEl.textContent = "You remembered everything perfectly! ❤️";
        resEl.classList.remove('hidden');
        fireConfettiSparkles(document.getElementById('quiz-section'));
        return;
      }
      const q = quiz[currentQ];
      qEl.textContent = q.question;
      optsEl.innerHTML = "";
      resEl.classList.add('hidden');

      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-btn';
        btn.textContent = opt;
        btn.onclick = () => {
          if (opt === q.answer) {
            btn.classList.add('correct');
            resEl.textContent = "Correct! ✨";
            resEl.classList.remove('hidden');
            setTimeout(() => { currentQ++; loadQuiz(); }, 1500);
          } else {
            btn.classList.add('wrong');
            resEl.textContent = "Oops, try again!";
            resEl.classList.remove('hidden');
            gsap.to(btn, { x: 10, yoyo: true, repeat: 3, duration: 0.1 });
          }
        };
        optsEl.appendChild(btn);
      });
    };
    loadQuiz();
  }

  // 7. Scratch Card
  if (config.interactive && config.interactive.scratchCardMessage) {
    document.getElementById('scratch-card-section').classList.remove('hidden');
    document.getElementById('scratch-secret-message').textContent = config.interactive.scratchCardMessage;

    const canvas = document.getElementById('scratch-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 300;
    canvas.height = 150;

    // Fill mask
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch Here', canvas.width / 2, canvas.height / 2);

    let isDrawing = false;

    let isRevealed = false;

    const checkScratchProgress = () => {
      if (isRevealed) return;
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clearPixels = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) clearPixels++;
      }
      if (clearPixels / (canvas.width * canvas.height) > 0.5) {
        isRevealed = true;
        gsap.to(canvas, { opacity: 0, duration: 0.5, onComplete: () => canvas.style.pointerEvents = 'none' });
      }
    };

    const scratch = (x, y) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      checkScratchProgress();
    };

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('touchstart', () => isDrawing = true);
    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('touchend', () => isDrawing = false);

    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      const { x, y } = getPos(e);
      scratch(x, y);
    });
    canvas.addEventListener('touchmove', (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      scratch(x, y);
    });
  }

  // 8. Konami Code Secret Message
  if (config.features.konamiCode && config.interactive && config.interactive.secretMessage) {
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    window.addEventListener('keydown', (e) => {
      if (e.key === konamiSequence[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiSequence.length) {
          alert('EASTER EGG UNLOCKED: ' + config.interactive.secretMessage);
          konamiIndex = 0;
          fireConfettiSparkles(document.body);
        }
      } else {
        konamiIndex = 0;
      }
    });
  }

  // 9. Watermark
  if (config.features && config.features.watermark) {
    const wm = document.createElement('div');
    wm.innerHTML = '✨ Made with WishCraft';
    Object.assign(wm.style, {
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      padding: '5px 10px',
      background: 'rgba(0,0,0,0.5)',
      color: '#fff',
      borderRadius: '20px',
      fontSize: '0.8rem',
      zIndex: '9999',
      backdropFilter: 'blur(5px)',
      fontFamily: 'sans-serif',
      pointerEvents: 'none'
    });
    document.body.appendChild(wm);
  }
}
