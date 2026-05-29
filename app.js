// ===== STATE =====
const state = {
  photo: null,    // base64 or null
  style: null,
  drink: null,
  smoke: null,
  gachi: null,
  generated: false,
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
    input.addEventListener('input', () => sanitizeRatingInput(input));
  });

  document.querySelectorAll('.toggle-btn[data-group]').forEach(btn => {
    btn.addEventListener('click', () => toggleSelect(btn));
  });

  document.getElementById('generate-btn').addEventListener('click', generateCard);
  document.getElementById('save-btn').addEventListener('click', saveCard);
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
  const formData = {
    name: document.getElementById('f-name').value.trim() || 'NAME',
    ratingLive: document.getElementById('f-rating-live').value.trim(),
    ratingPho: document.getElementById('f-rating-phoenix').value.trim(),
    area: document.getElementById('f-area').value.trim(),
    barrel: document.getElementById('f-barrel').value.trim(),
    flight: document.getElementById('f-flight').value.trim(),
    tip: document.getElementById('f-tip').value.trim(),
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
