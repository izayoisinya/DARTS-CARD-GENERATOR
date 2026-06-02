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

  document.querySelectorAll('.toggle-btn[data-group]').forEach(btn => {
    btn.addEventListener('click', () => toggleSelect(btn));
  });

  document.querySelectorAll('.sns-account').forEach(bindSnsAccountInput);

  document.getElementById('add-sns-btn').addEventListener('click', addSnsInputRow);

  document.getElementById('generate-btn').addEventListener('click', generateCard);
  document.getElementById('save-btn').addEventListener('click', saveCard);
}

function addSnsInputRow() {
  const snsList = document.getElementById('sns-list');
  const row = document.createElement('div');
  row.className = 'sns-row';
  row.innerHTML = `
    <input type="text" class="sns-name-input" placeholder="SNS名" maxlength="16">
    <input type="text" class="sns-account" placeholder="@account" maxlength="30">
    <button type="button" class="sns-remove-btn" aria-label="SNS行を削除">×</button>
  `;

  bindSnsAccountInput(row.querySelector('.sns-account'));
  row.querySelector('.sns-remove-btn').addEventListener('click', () => row.remove());
  snsList.appendChild(row);
}

function normalizeSnsAccountValue(rawValue) {
  const compact = rawValue.replace(/\s/g, '');
  if (!compact) return '';

  const withoutAt = compact.replace(/^@+/, '').replace(/@/g, '');
  if (!withoutAt) return '';

  return `@${withoutAt}`;
}

function bindSnsAccountInput(input) {
  if (!input) return;

  input.addEventListener('focus', () => {
    if (!input.value.trim()) {
      input.value = '@';
    }
  });

  input.addEventListener('input', () => {
    const normalized = normalizeSnsAccountValue(input.value);
    input.value = normalized || '@';
  });

  input.addEventListener('blur', () => {
    if (input.value.trim() === '@') {
      input.value = '';
    }
  });
}

function collectSnsData() {
  const rows = Array.from(document.querySelectorAll('#sns-list .sns-row'));
  return rows
    .map(row => {
      const accountInput = row.querySelector('.sns-account');
      const account = accountInput ? normalizeSnsAccountValue(accountInput.value.trim()) : '';
      if (!account) return null;

      const fixedName = accountInput ? accountInput.dataset.snsName : '';
      const customNameInput = row.querySelector('.sns-name-input');
      const snsName = fixedName || (customNameInput ? customNameInput.value.trim() : '') || 'SNS';

      return { name: snsName, account };
    })
    .filter(Boolean);
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
    pr: document.getElementById('f-pr').value.trim(),
  };

  document.getElementById('card-output').innerHTML = buildCardHtml(formData, state);

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
    const canvas = await html2canvas(el, {
      backgroundColor: '#12141a',
      scale: 3,
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
