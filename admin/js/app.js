/**
 * WishCraft Admin Studio — Main Entry Point Script
 * Connects BirthdayConfigModel, StorageManager, FormController, and UI state handlers.
 */

import { StorageManager } from '../../utilities/storage.js';
import { BirthdayConfigModel, PLAN_FEATURES } from './models/configModel.js';
import { FormController } from './controllers/formController.js';
import { PaymentController } from './controllers/paymentController.js';

document.addEventListener('DOMContentLoaded', () => {
  // Load existing draft from LocalStorage if available
  const savedData = StorageManager.loadConfig();
  const configModel = new BirthdayConfigModel(savedData);

  // Initialize Payment Controller
  const paymentController = new PaymentController(configModel);

  // Initialize Form Controller to bind HTML controls to Model
  const formController = new FormController(configModel, StorageManager);

  // Initialize Plan Selector (must run before other inits)
  initPlanSelector(configModel, paymentController);

  // Initialize Sidebar Navigation UI
  initSidebarNavigation();

  // Initialize Save Draft Button Persistence
  initSaveDraftAction(configModel);

  // Initialize Generate Website Action
  initGenerateWebsiteAction(configModel, paymentController);

  // Management Additions
  initLicenseScreen();
  initAutoSave(configModel);
  initBackupRestore(configModel, formController);
  initCustomerHistory();

  // When payment completes, refresh plan UI
  paymentController.onUnlock((plan) => {
    syncPayButtonStates(plan, paymentController);
    // Auto-select the paid plan in the model
    configModel.setField('plan', plan);
    _setPlanActive(plan,
      document.querySelectorAll('.plan-card[data-plan]'),
      document.getElementById('badge-plan-name'),
      document.getElementById('selected-plan-label')
    );
    applyPlanGating(plan);
  });
});

/* Sidebar Navigation Tab Switching & Scroll Sync */
function initSidebarNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-target]');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);

      if (targetEl) {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/* Save Draft Button Action */
function initSaveDraftAction(model) {
  const btnSave = document.getElementById('btn-save-draft');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const currentConfig = model.get();
      const success = StorageManager.saveConfig(currentConfig);

      const originalText = btnSave.innerHTML;
      if (success) {
        btnSave.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          JSON Draft Saved!
        `;
        btnSave.style.background = 'rgba(16, 185, 129, 0.25)';
        btnSave.style.borderColor = 'var(--accent-green)';
        btnSave.style.color = 'var(--accent-green)';
      } else {
        btnSave.innerHTML = `Error Saving`;
      }

      setTimeout(() => {
        btnSave.innerHTML = originalText;
        btnSave.style.background = '';
        btnSave.style.borderColor = '';
        btnSave.style.color = '';
      }, 2500);
    });
  }
}

/* Generate Website Action — token-gated */
function initGenerateWebsiteAction(model, paymentController) {
  const btnGenerate = document.getElementById('btn-generate-website');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', async () => {
      const currentConfig = model.get();
      const selectedPlan = currentConfig.plan || 'basic';
      const token = paymentController.getToken();
      const paidPlan = localStorage.getItem('wishcraft_payment_plan');

      // Guard: must have paid for the currently selected plan
      if (!token || paidPlan !== selectedPlan) {
        showPaymentRequiredModal(selectedPlan, paymentController);
        return;
      }

      const originalText = btnGenerate.innerHTML;
      btnGenerate.innerHTML = 'Generating... ⏳';
      btnGenerate.disabled = true;

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...currentConfig, _token: token }),
        });

        const data = await response.json();

        if (data.success) {
          // Consume the token — one-time use done
          paymentController.clearToken();
          syncPayButtonStates(selectedPlan, paymentController);

          btnGenerate.innerHTML = `Success! 🎉`;
          btnGenerate.style.background = 'rgba(16, 185, 129, 0.25)';
          btnGenerate.style.borderColor = 'var(--accent-green)';
          btnGenerate.style.color = 'var(--accent-green)';

          setTimeout(() => {
            window.open(data.url, '_blank');
            btnGenerate.innerHTML = originalText;
            btnGenerate.style.background = '';
            btnGenerate.style.borderColor = '';
            btnGenerate.style.color = '';
            btnGenerate.disabled = false;
          }, 1500);
        } else {
          throw new Error(data.error || 'Server returned failure');
        }
      } catch (err) {
        console.error('Generation Error:', err);
        const msg = err.message || 'Generation Failed ❌';
        btnGenerate.innerHTML = `❌ ${msg}`;
        btnGenerate.style.background = 'rgba(239, 68, 68, 0.25)';
        btnGenerate.style.borderColor = '#ef4444';
        btnGenerate.style.color = '#ef4444';

        setTimeout(() => {
          btnGenerate.innerHTML = originalText;
          btnGenerate.style.background = '';
          btnGenerate.style.borderColor = '';
          btnGenerate.style.color = '';
          btnGenerate.disabled = false;
        }, 3500);
      }
    });
  }
}

/** Show a modal explaining the user needs to pay before generating */
function showPaymentRequiredModal(plan, paymentController) {
  const existing = document.getElementById('pay-required-modal');
  if (existing) existing.remove();

  const PLAN_META_LOCAL = {
    basic: { label: 'Basic', price: '₹299', emoji: '🎈' },
    standard: { label: 'Standard', price: '₹499', emoji: '⭐' },
    premium: { label: 'Premium', price: '₹999', emoji: '👑' },
  };
  const meta = PLAN_META_LOCAL[plan] || PLAN_META_LOCAL.basic;

  const modal = document.createElement('div');
  modal.id = 'pay-required-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;
  `;
  modal.innerHTML = `
    <div style="
      background:linear-gradient(135deg,#1e1b2e,#13111e);
      border:1px solid rgba(168,85,247,0.3);
      border-radius:20px;padding:40px;max-width:420px;width:90%;
      text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.6);
      font-family:inherit;
    ">
      <div style="font-size:3rem;margin-bottom:12px">${meta.emoji}</div>
      <h2 style="color:#fff;margin:0 0 8px;font-size:1.4rem">Payment Required</h2>
      <p style="color:#94a3b8;font-size:0.9rem;margin:0 0 24px;line-height:1.6">
        To generate your wish website with the <strong style="color:#c084fc">${meta.label} Plan</strong>,
        a one-time payment of <strong style="color:#f59e0b">${meta.price}</strong> is required.
        <br><br>
        After payment, you can generate <strong>one website</strong> with this plan.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="prm-cancel" style="
          padding:10px 20px;border-radius:10px;
          border:1px solid rgba(255,255,255,0.15);
          background:transparent;color:#94a3b8;cursor:pointer;font-size:0.9rem;
        ">Cancel</button>
        <button id="prm-pay" style="
          padding:10px 24px;border-radius:10px;
          background:linear-gradient(135deg,#a855f7,#ec4899);
          border:none;color:#fff;cursor:pointer;
          font-size:0.95rem;font-weight:600;
        ">Pay ${meta.price} & Unlock</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#prm-cancel').addEventListener('click', () => modal.remove());
  modal.querySelector('#prm-pay').addEventListener('click', () => {
    modal.remove();
    // Scroll to plan section first, then pay
    const planSection = document.getElementById('sec-plan');
    if (planSection) planSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => paymentController.initiatePayment(plan), 500);
  });
}

/* License Screen Logic */
function initLicenseScreen() {
  const modal = document.getElementById('license-modal');
  const btnAccept = document.getElementById('btn-accept-license');

  if (localStorage.getItem('wishcraft_license_accepted')) {
    if (modal) modal.style.display = 'none';
  }

  if (btnAccept) {
    btnAccept.addEventListener('click', () => {
      localStorage.setItem('wishcraft_license_accepted', 'true');
      if (modal) modal.style.display = 'none';
    });
  }
}

/* Auto Save Logic */
function initAutoSave(model) {
  const statusEl = document.getElementById('auto-save-status');
  setInterval(() => {
    import('../../utilities/storage.js').then(module => {
      module.StorageManager.saveConfig(model.get());
    });

    // Briefly flash status
    if (statusEl) {
      statusEl.textContent = '🟢 Saved...';
      setTimeout(() => { statusEl.textContent = '🟢 Auto-Save Active'; }, 1000);
    }
  }, 5000);
}

/* Backup and Restore Settings */
function initBackupRestore(model, formController) {
  const btnBackup = document.getElementById('btn-backup-settings');
  const btnRestore = document.getElementById('btn-restore-settings');
  const fileInput = document.getElementById('input-restore-file');

  if (btnBackup) {
    btnBackup.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(model.get(), null, 2));
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", "wishcraft_settings_backup.json");
      dlAnchorElem.click();
    });
  }

  if (btnRestore && fileInput) {
    btnRestore.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          import('../../utilities/storage.js').then(module => {
            module.StorageManager.saveConfig(parsed);
            window.location.reload();
          });
        } catch (err) {
          alert('Failed to parse JSON backup file.');
        }
      };
      reader.readAsText(file);
    });
  }
}

/* Customer History Fetching */
async function initCustomerHistory() {
  const tbody = document.getElementById('history-table-body');
  const btnRefresh = document.getElementById('btn-refresh-history');

  const loadHistory = async () => {
    if (!tbody) return;
    try {
      tbody.innerHTML = '<tr><td colspan="3" style="padding:1rem; text-align:center;">Loading history...</td></tr>';
      const res = await fetch('/api/history');
      const data = await res.json();

      if (!data.history || data.history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="padding:1rem; text-align:center; color:var(--text-secondary);">No generated sites found.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      data.history.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        tr.innerHTML = `
          <td style="padding:1rem; font-weight:bold;">${item.slug}</td>
          <td style="padding:1rem; color:var(--text-secondary);">${new Date(item.createdAt).toLocaleString()}</td>
          <td style="padding:1rem;">
            <a href="${item.url}" target="_blank" class="btn-primary" style="padding:4px 10px; font-size:0.8rem; margin-right:5px; text-decoration:none;">View</a>
            <a href="/api/download/${item.slug}" class="btn-secondary" style="padding:4px 10px; font-size:0.8rem; text-decoration:none;">ZIP</a>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="3" style="padding:1rem; text-align:center; color:red;">Failed to load history. Is the server running?</td></tr>';
    }
  };

  if (btnRefresh) {
    btnRefresh.addEventListener('click', loadHistory);
  }

  // Load initially
  loadHistory();
}

/* ============================================================
   PLAN SELECTOR — Tier Selection, Gating, and Model Sync
   ============================================================ */

/**
 * Plan tier hierarchy for comparison
 */
const PLAN_RANK = { basic: 0, standard: 1, premium: 2 };

/**
 * Human-readable plan meta
 */
const PLAN_META = {
  basic: { label: 'Basic Selected', emoji: '🎈', price: '₹299' },
  standard: { label: 'Standard Selected', emoji: '⭐', price: '₹499' },
  premium: { label: 'Premium Selected', emoji: '👑', price: '₹999' },
};

/**
 * Which minimum plan is required for each gated section
 */
const GATE_REQUIRED_PLAN = {
  standard: 'standard',
  premium: 'premium',
};

/**
 * Initialise plan card click handling and apply initial gating
 */
function initPlanSelector(model, paymentController) {
  const cards = document.querySelectorAll('.plan-card[data-plan]');
  const badgeSidebar = document.getElementById('badge-plan-name');
  const badgeTop = document.getElementById('selected-plan-label');

  // Determine starting plan (from saved model or default)
  let currentPlan = model.get().plan || 'basic';

  // Apply initial visual state
  _setPlanActive(currentPlan, cards, badgeSidebar, badgeTop);
  applyPlanGating(currentPlan);

  // Replace Select buttons with Pay buttons
  injectPayButtons(paymentController);
  syncPayButtonStates(currentPlan, paymentController);

  // Card click just highlights, doesn't auto-pay
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const plan = card.getAttribute('data-plan');
      _selectPlan(plan, model, cards, badgeSidebar, badgeTop);
    });
  });
}

/**
 * Replace static .plan-select-btn elements with dynamic Pay buttons
 */
function injectPayButtons(paymentController) {
  const PLANS = ['basic', 'standard', 'premium'];
  const PRICES = { basic: '₹299', standard: '₹499', premium: '₹999' };

  PLANS.forEach(plan => {
    const oldBtn = document.querySelector(`.plan-select-btn[data-plan="${plan}"]`);
    if (!oldBtn) return;

    const payBtn = document.createElement('button');
    payBtn.id = `pay-btn-${plan}`;
    payBtn.className = 'plan-select-btn';
    payBtn.setAttribute('data-plan', plan);
    payBtn.textContent = `Pay ${PRICES[plan]}`;

    payBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      paymentController.initiatePayment(plan);
    });

    oldBtn.replaceWith(payBtn);
  });
}

/**
 * Update pay button labels/states based on token presence
 */
function syncPayButtonStates(activePlan, paymentController) {
  const PLANS = ['basic', 'standard', 'premium'];
  const PRICES = { basic: '₹299', standard: '₹499', premium: '₹999' };
  const paidPlan = localStorage.getItem('wishcraft_payment_plan');
  const hasToken = !!paymentController.getToken();

  PLANS.forEach(plan => {
    const btn = document.getElementById(`pay-btn-${plan}`);
    if (!btn) return;

    if (hasToken && paidPlan === plan) {
      // Unlocked — ready to generate
      btn.textContent = `✅ Unlocked — Generate Now`;
      btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.disabled = false;
    } else {
      btn.textContent = `Pay ${PRICES[plan]}`;
      btn.style.background = '';
      btn.style.color = '';
      btn.style.border = '';
      btn.disabled = false;
    }
  });
}

/**
 * Select a plan: update model, active states, gating
 */
function _selectPlan(plan, model, cards, badgeSidebar, badgeTop) {
  model.setField('plan', plan);
  _setPlanActive(plan, cards, badgeSidebar, badgeTop);
  applyPlanGating(plan);

  // Show a brief confirmation flash on the card
  const activeCard = document.getElementById(`plan-card-${plan}`);
  if (activeCard) {
    activeCard.style.transform = 'scale(1.02)';
    setTimeout(() => { activeCard.style.transform = ''; }, 300);
  }
}


/**
 * Toggle active CSS class on plan cards and update badges
 */
function _setPlanActive(plan, cards, badgeSidebar, badgeTop) {
  cards.forEach(c => c.classList.toggle('active', c.getAttribute('data-plan') === plan));

  const meta = PLAN_META[plan] || PLAN_META.basic;

  if (badgeSidebar) {
    badgeSidebar.textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
    // Colour the sidebar badge by plan
    badgeSidebar.style.background =
      plan === 'premium' ? 'linear-gradient(135deg,#f59e0b,#f97316)' :
        plan === 'standard' ? 'linear-gradient(135deg,#a855f7,#ec4899)' :
          'rgba(100,116,139,0.5)';
    badgeSidebar.style.color = plan === 'premium' ? '#000' : '#fff';
  }

  if (badgeTop) {
    badgeTop.textContent = `${meta.emoji} ${meta.label}`;
    badgeTop.style.background =
      plan === 'premium' ? 'rgba(245,158,11,0.15)' :
        plan === 'standard' ? 'rgba(168,85,247,0.15)' :
          'rgba(100,116,139,0.12)';
    badgeTop.style.borderColor =
      plan === 'premium' ? 'rgba(245,158,11,0.4)' :
        plan === 'standard' ? 'rgba(168,85,247,0.4)' :
          'rgba(100,116,139,0.35)';
    badgeTop.style.color =
      plan === 'premium' ? '#f59e0b' :
        plan === 'standard' ? '#c084fc' :
          '#94a3b8';
  }
}

/**
 * Lock/unlock sections based on current plan.
 * Injects a `.plan-gate-overlay` div into sections that require a higher plan.
 */
function applyPlanGating(activePlan) {
  const gatedSections = document.querySelectorAll('[data-plan-gate]');

  gatedSections.forEach(section => {
    const requiredPlan = section.getAttribute('data-plan-gate'); // 'standard' | 'premium'
    const isLocked = PLAN_RANK[activePlan] < PLAN_RANK[requiredPlan];

    // Remove any existing overlay first
    const existingOverlay = section.querySelector('.plan-gate-overlay');
    if (existingOverlay) existingOverlay.remove();
    section.classList.remove('section-locked');

    if (isLocked) {
      section.classList.add('section-locked');

      const reqLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);
      const reqPrice = requiredPlan === 'premium' ? '₹999' : '₹499';
      const btnClass = requiredPlan === 'standard' ? 'standard-gate' : '';
      const lockEmoji = requiredPlan === 'premium' ? '👑' : '⭐';

      const overlay = document.createElement('div');
      overlay.className = 'plan-gate-overlay';
      overlay.innerHTML = `
        <div class="plan-gate-lock-icon">${lockEmoji}</div>
        <div class="plan-gate-title">${reqLabel} Feature</div>
        <div class="plan-gate-desc">
          This section requires the <strong>${reqLabel} plan</strong> (${reqPrice}) or higher.
        </div>
        <button class="plan-gate-btn ${btnClass}" data-upgrade-to="${requiredPlan}">
          Upgrade to ${reqLabel} — ${reqPrice}
        </button>
      `;

      // Upgrade button scrolls to plan section and selects the required plan
      overlay.querySelector('.plan-gate-btn').addEventListener('click', () => {
        const planSection = document.getElementById('sec-plan');
        if (planSection) {
          planSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Simulate clicking the correct plan card
        const targetCard = document.getElementById(`plan-card-${requiredPlan}`);
        if (targetCard) {
          setTimeout(() => targetCard.click(), 400);
        }
      });

      section.appendChild(overlay);
    }
  });
}

