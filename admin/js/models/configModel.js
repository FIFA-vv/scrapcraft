/**
 * Admin Model: BirthdayConfigModel
 * Manages unified reactive configuration state for the Birthday Website Generator.
 */

/**
 * Plan feature gates.
 * Keys match feature names used to show/hide admin sections.
 */
export const PLAN_FEATURES = {
  basic: [
    'name', 'personalMessage', 'photos_5', 'birthdayAnimation', 'confetti', 'music'
  ],
  standard: [
    'name', 'personalMessage', 'photos_15', 'birthdayAnimation', 'confetti', 'music',
    'photoGallery', 'timeline', 'animatedLetter', 'birthdayCake', 'fireworks', 'customTheme'
  ],
  premium: [
    'name', 'personalMessage', 'photos_unlimited', 'birthdayAnimation', 'confetti', 'music',
    'photoGallery', 'timeline', 'animatedLetter', 'birthdayCake', 'fireworks', 'customTheme',
    'video', 'voiceMessage', 'memoryWall', 'interactiveGift', 'scratchCard', 'quiz',
    'premiumAnimations', 'customDesign'
  ]
};

const DEFAULT_CONFIG = {
  plan: 'basic',
  wishType: 'birthday',
  recipient: {
    name: 'Sophia Anderson',
    nickname: 'Soph',
    age: 25,
    birthDate: '2026-08-15T18:30',
    relationship: 'best-friend',
    avatar: ''
  },
  media: {
    photos: [
      { id: 'photo-1', name: 'Memory 1', url: '', caption: 'Summer Beach Vacation' },
      { id: 'photo-2', name: 'Memory 2', url: '', caption: 'Graduation Day Celebration' }
    ],
    music: {
      type: 'preset',
      presetKey: 'orchestral',
      customUrl: '',
      volume: 80,
      autoplay: true
    },
    videos: [
      { id: 'video-1', name: 'Wish Video 1', url: '', title: 'Group Friends Birthday Wish' }
    ]
  },
  theme: {
    preset: 'preset-pastel',
    customColors: {
      primary: '#a855f7',
      secondary: '#ec4899',
      background: '#090b15'
    }
  },
  timeline: [
    {
      id: 't-1',
      title: 'First Day We Met',
      date: 'Summer 2018',
      description: 'The unforgettable summer day where it all began...',
      photo: ''
    }
  ],
  letter: {
    message: 'Dear Sophia, Happy Birthday! May your day be filled with laughter, love, and endless happiness. Here is to another amazing year of beautiful memories together!',
    envelopeColor: '#ec4899',
    sealStyle: 'rose-pink'
  },
  gift: {
    type: 'voucher',
    title: 'Custom Voucher',
    detail: 'Free Coffee Date & Movie Night'
  },
  features: {
    guestBook: true,
    confettiDensity: 120,
    micBlowout: true,
    floatingBalloons: true,
    qrCode: true,
    countdown: true,
    konamiCode: true,
    share: true,
    download: true,
    watermark: true
  },
  partyDate: '2026-08-15T20:00',
  interactive: {
    scratchCardMessage: 'Here is an Amazon Gift Card! Code: 50-OFF',
    secretMessage: 'You found the secret! I love you so much!',
    quiz: [
      {
        question: 'Where did we first meet?',
        options: ['Coffee Shop', 'Library', 'College', 'Beach'],
        answer: 'College'
      },
      {
        question: 'What is my favorite color?',
        options: ['Red', 'Blue', 'Green', 'Purple'],
        answer: 'Purple'
      }
    ]
  },
  meta: {
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  }
};

export class BirthdayConfigModel {
  constructor(initialData = null) {
    this.state = initialData ? this.deepMerge(DEFAULT_CONFIG, initialData) : JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.listeners = [];
  }

  /**
   * Helper for deep merging data
   */
  deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * Subscribe to state change events
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.state.meta.lastUpdated = new Date().toISOString();
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Get complete state object copy
   */
  get() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Set field value by dot-notation path (e.g. 'recipient.name')
   */
  setField(path, value) {
    const keys = path.split('.');
    let current = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this.notify();
  }

  /**
   * Media Photo Operations
   */
  addPhoto(photoObj) {
    const newPhoto = {
      id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: photoObj.name || 'Photo',
      url: photoObj.url || '',
      caption: photoObj.caption || ''
    };
    this.state.media.photos.push(newPhoto);
    this.notify();
    return newPhoto;
  }

  removePhoto(photoId) {
    this.state.media.photos = this.state.media.photos.filter(p => p.id !== photoId);
    this.notify();
  }

  /**
   * Media Video Operations
   */
  addVideo(videoObj) {
    const newVideo = {
      id: 'video-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: videoObj.name || 'Video',
      url: videoObj.url || '',
      title: videoObj.title || 'Birthday Wish Video'
    };
    this.state.media.videos.push(newVideo);
    this.notify();
    return newVideo;
  }

  removeVideo(videoId) {
    this.state.media.videos = this.state.media.videos.filter(v => v.id !== videoId);
    this.notify();
  }

  /**
   * Timeline Operations
   */
  addTimelineItem() {
    const newItem = {
      id: 't-' + Date.now(),
      title: 'New Memory Milestone',
      date: new Date().getFullYear().toString(),
      description: 'Add your milestone description here...',
      photo: ''
    };
    this.state.timeline.push(newItem);
    this.notify();
    return newItem;
  }

  updateTimelineItem(id, field, value) {
    const item = this.state.timeline.find(t => t.id === id);
    if (item) {
      item[field] = value;
      this.notify();
    }
  }

  removeTimelineItem(id) {
    this.state.timeline = this.state.timeline.filter(t => t.id !== id);
    this.notify();
  }

  /**
   * Serialize state into clean formatted JSON
   */
  toJSON() {
    return JSON.stringify(this.state, null, 2);
  }
}
