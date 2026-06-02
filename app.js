// ===== STATE =====
const state = {
  photo: null,    // base64 or null
  gender: null,
  style: null,
  drink: null,
  smoke: null,
  gachi: null,
  generated: false,
};

const ratingConfigs = {
  'f-rating-live': { max: 18, label: 'ダーツライブ' },
  'f-rating-phoenix': { max: 30, label: 'フェニックス' },
};

function initializeEventListeners() {
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const photoUpload = document.getElementById('photo-upload');
  const photoInput = document.getElementById('photo-input');
  photoUpload.addEventListener('click', triggerPhoto);
  photoInput.addEventListener('change', loadPhoto);

  document.querySelectorAll('#f-rating-live, #f-rating-phoenix').forEach(input => {
    const config = ratingConfigs[input.id];

    input.addEventListener('input', () => sanitizeRatingInput(input));
    input.addEventListener('blur', () => {
      const result = validateAndFormatRatingInput(input, config.max, config.label);
      if (!result.isValid) {
        showToast(result.error);
        input.focus();
      }
    });
  });

  const experienceInput = document.getElementById('f-experience');
  experienceInput.addEventListener('input', () => {
    experienceInput.value = experienceInput.value.replace(/[^0-9]/g, '');
  });

  document.querySelectorAll('.toggle-btn[data-group]').forEach(btn => {
    btn.addEventListener('click', () => toggleSelect(btn));
  });

  document.querySelectorAll('.sns-account').forEach(bindSnsAccountInput);
  document.getElementById('f-qr-target').addEventListener('change', refreshQrTargetOptions);

  document.getElementById('generate-btn').addEventListener('click', generateCard);
  document.getElementById('save-btn').addEventListener('click', saveCard);

  refreshQrTargetOptions();
  syncCardPreviewScale();
}

function syncCardPreviewScale() {
  const stage = document.getElementById('card-preview-stage');
  if (!stage) return;

  const designWidth = 1280;
  const stageWidth = stage.clientWidth || designWidth;
  const scale = Math.min(1, stageWidth / designWidth);

  stage.style.setProperty('--preview-scale', String(scale));
}

function shouldForceAtBySnsName(snsName) {
  const name = (snsName || '').toLowerCase();
  return (
    name === 'x' ||
    name.includes('twitter') ||
    name.includes('instagram') ||
    name.includes('insta') ||
    name.includes('tiktok') ||
    name.includes('tik tok') ||
    name.includes('youtube') ||
    name === 'yt' ||
    name.includes('facebook') ||
    name === 'fb'
  );
}

function normalizeSnsAccountValue(rawValue, { forceAt = false } = {}) {
  const compact = rawValue.replace(/\s/g, '');
  if (!compact) return '';

  if (/^https?:\/\//i.test(compact)) {
    return compact;
  }

  const withoutAt = compact.replace(/^@+/, '').replace(/@/g, '');
  if (!withoutAt) return '';

  if (forceAt) {
    return `@${withoutAt}`;
  }

  return compact.startsWith('@') ? `@${withoutAt}` : withoutAt;
}

function bindSnsAccountInput(input) {
  if (!input) return;

  const forceAt = shouldForceAtBySnsName(input.dataset.snsName);

  input.addEventListener('focus', () => {
    if (forceAt && !input.value.trim()) {
      input.value = '@';
    }
  });

  input.addEventListener('input', () => {
    const normalized = normalizeSnsAccountValue(input.value, { forceAt });
    if (forceAt) {
      input.value = normalized || '@';
    } else {
      input.value = normalized;
    }
    refreshQrTargetOptions();
  });

  input.addEventListener('blur', () => {
    if (forceAt && input.value.trim() === '@') {
      input.value = '';
    }
    refreshQrTargetOptions();
  });
}

function collectSnsDataFromDom() {
  const rows = Array.from(document.querySelectorAll('#sns-list .sns-row'));
  return rows
    .map(row => {
      const accountInput = row.querySelector('.sns-account');
      const forceAt = shouldForceAtBySnsName(accountInput ? accountInput.dataset.snsName : '');
      const account = accountInput
        ? normalizeSnsAccountValue(accountInput.value.trim(), { forceAt })
        : '';
      if (!account) return null;

      const fixedName = accountInput ? accountInput.dataset.snsName : '';
      const snsName = fixedName || 'SNS';

      return { id: row.dataset.snsId || '', name: snsName, account };
    })
    .filter(Boolean);
}

function refreshQrTargetOptions() {
  const select = document.getElementById('f-qr-target');
  if (!select) return;

  const prevValue = select.value;
  const snsData = collectSnsDataFromDom();

  select.innerHTML = '<option value="">選択しない</option>';
  snsData.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.name} (${item.account})`;
    select.appendChild(option);
  });

  if (snsData.some(item => item.id === prevValue)) {
    select.value = prevValue;
  }
}

function collectSnsData() {
  return collectSnsDataFromDom().map(({ name, account, id }) => ({ name, account, id }));
}

function buildSnsProfileUrl(target) {
  const account = (target.account || '').trim();
  if (!account) return '';

  if (/^https?:\/\//i.test(account)) {
    return account;
  }

  const accountId = account.replace(/^@+/, '');
  if (!accountId) return '';

  const snsName = (target.name || '').trim().toLowerCase();

  if (snsName === 'x' || snsName.includes('twitter')) {
    return `https://x.com/${encodeURIComponent(accountId)}`;
  }

  if (snsName.includes('instagram') || snsName.includes('insta')) {
    return `https://www.instagram.com/${encodeURIComponent(accountId)}/`;
  }

  if (snsName.includes('tiktok') || snsName.includes('tik tok')) {
    return `https://www.tiktok.com/@${encodeURIComponent(accountId)}`;
  }

  if (snsName.includes('youtube') || snsName === 'yt') {
    return `https://www.youtube.com/@${encodeURIComponent(accountId)}`;
  }

  if (snsName.includes('facebook') || snsName === 'fb') {
    return `https://www.facebook.com/${encodeURIComponent(accountId)}`;
  }

  return account;
}

function getSelectedQrTarget(snsItems) {
  const selectedId = document.getElementById('f-qr-target').value;
  if (!selectedId) return null;
  const target = snsItems.find(item => item.id === selectedId);
  if (!target) return null;

  return {
    ...target,
    qrUrl: buildSnsProfileUrl(target),
  };
}

function renderQrCode(target) {
  const box = document.getElementById('card-qr-box');
  if (!box || !target) return;

  box.innerHTML = '';
  const qrText = target.qrUrl || target.account;

  new QRCode(box, {
    text: qrText,
    width: 84,
    height: 84,
    colorDark: '#111111',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
}

// ===== TAB =====
function switchTab(tab) {
  if (tab === 'preview' && !state.generated) {
    showToast('先にカードを生成してください');
    return;
  }
  document.querySelectorAll('.tab-btn').forEach((b,i) => {
    b.classList.toggle('active', (i===0 && tab==='form') || (i===1 && tab==='preview'));
  });
  document.getElementById('form-screen').classList.toggle('active', tab==='form');
  document.getElementById('preview-screen').classList.toggle('active', tab==='preview');

  if (tab === 'preview') {
    syncCardPreviewScale();
  }
}

// ===== PHOTO =====
function triggerPhoto() {
  document.getElementById('photo-input').click();
}

function loadPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;

  const maxPhotoSize = 5 * 1024 * 1024;
  const photoValidationError = getPhotoValidationError(file, maxPhotoSize);
  if (photoValidationError) {
    showToast(photoValidationError);
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    state.photo = ev.target.result;
    const el = document.getElementById('photo-upload');
    el.classList.add('has-photo');
    el.innerHTML = `<img src="${state.photo}" alt="photo">`;
    syncPhotoSize();
  };
  reader.readAsDataURL(file);
}

function syncPhotoSize() {
  const right = document.querySelector('.photo-name-row .fields-right');
  const photo = document.getElementById('photo-upload');
  if (!right || !photo) return;
  const h = right.getBoundingClientRect().height;
  if (h > 0) {
    photo.style.width  = h + 'px';
    photo.style.height = h + 'px';
  }
}

// ページ読み込み後・リサイズ時にも同期
window.addEventListener('load', syncPhotoSize);
window.addEventListener('resize', syncPhotoSize);
window.addEventListener('load', syncCardPreviewScale);
window.addEventListener('resize', syncCardPreviewScale);

function updateSaveButtonState() {
  const btn = document.getElementById('save-btn');
  btn.disabled = !state.generated;
}

// ===== TOGGLE =====
function toggleSelect(btn) {
  const group = btn.dataset.group;
  document.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state[group] = btn.dataset.val;
}

// ===== GENERATE =====
function generateCard() {
  const liveInput = document.getElementById('f-rating-live');
  const phoenixInput = document.getElementById('f-rating-phoenix');

  const liveValidation = validateAndFormatRatingInput(
    liveInput,
    ratingConfigs['f-rating-live'].max,
    ratingConfigs['f-rating-live'].label
  );
  if (!liveValidation.isValid) {
    showToast(liveValidation.error);
    liveInput.focus();
    return;
  }

  const phoenixValidation = validateAndFormatRatingInput(
    phoenixInput,
    ratingConfigs['f-rating-phoenix'].max,
    ratingConfigs['f-rating-phoenix'].label
  );
  if (!phoenixValidation.isValid) {
    showToast(phoenixValidation.error);
    phoenixInput.focus();
    return;
  }

  const formData = {
    name: document.getElementById('f-name').value.trim(),
    ratingLive: liveInput.value.trim(),
    ratingPho: phoenixInput.value.trim(),
    experience: document.getElementById('f-experience').value.trim(),
    area: document.getElementById('f-area').value.trim(),
    home: document.getElementById('f-home').value.trim(),
    gender: state.gender,
    barrel: document.getElementById('f-barrel').value.trim(),
    flight: document.getElementById('f-flight').value.trim(),
    shaft: document.getElementById('f-shaft').value.trim(),
    tip: document.getElementById('f-tip').value.trim(),
    favoritePro: document.getElementById('f-favorite-pro').value.trim(),
    goodNumber: document.getElementById('f-good-number').value.trim(),
    favoriteGame: document.getElementById('f-favorite-game').value.trim(),
    goal: document.getElementById('f-goal').value.trim(),
    sns: collectSnsData(),
    qrTarget: null,
    pr: document.getElementById('f-pr').value.trim(),
  };

  formData.qrTarget = getSelectedQrTarget(formData.sns);

  document.getElementById('card-output').innerHTML = buildCardHtml(formData, state);
  renderQrCode(formData.qrTarget);
  syncCardPreviewScale();

  state.generated = true;
  updateSaveButtonState();
  switchTab('preview');
}

// ===== SAVE =====
async function saveCard() {
  if (!state.generated || !document.getElementById('card-output').children.length) {
    showToast('先にカードを生成してください');
    return;
  }

  const btn = document.getElementById('save-btn');
  btn.classList.add('loading');
  btn.innerHTML = '<span>⏳</span> 生成中…';

  try {
    const el = document.getElementById('card-output');
    const sourceWidth = el.offsetWidth || 1;
    const sourceHeight = el.offsetHeight || 1;

    const canvas = await html2canvas(el, {
      backgroundColor: '#12141a',
      scale: 2,
      width: sourceWidth,
      height: sourceHeight,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `darts-card-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('✅ 保存しました！');
  } catch(e) {
    showToast('❌ 保存に失敗しました');
    console.error(e);
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span>💾</span> PNG で保存する';
}

initializeEventListeners();
updateSaveButtonState();

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
