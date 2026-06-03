// ===== STATE =====
const CARD_DESIGN_WIDTH = 1280;
const CARD_DESIGN_HEIGHT = 720;
const EXPORT_WIDTH = 2560;
const EXPORT_HEIGHT = 1440;
const EXPORT_SCALE = EXPORT_WIDTH / CARD_DESIGN_WIDTH;

const state = {
  photo: null,    // base64 or null
  photoScale: 1.3,
  photoPosX: 50,
  photoPosY: 50,
  myDartsPhoto: null,
  myDartsScale: 1.3,
  myDartsPosX: 50,
  myDartsPosY: 50,
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
  const photoScale = document.getElementById('f-photo-scale');
  const photoPosX = document.getElementById('f-photo-pos-x');
  const photoPosY = document.getElementById('f-photo-pos-y');
  if (photoUpload) photoUpload.addEventListener('click', triggerPhoto);
  if (photoInput) photoInput.addEventListener('change', loadPhoto);
  if (photoScale) photoScale.addEventListener('input', updatePhotoScale);
  if (photoPosX) photoPosX.addEventListener('input', updatePhotoPosition);
  if (photoPosY) photoPosY.addEventListener('input', updatePhotoPosition);

  const myDartsUpload = document.getElementById('my-darts-upload');
  const myDartsInput = document.getElementById('my-darts-input');
  const myDartsScale = document.getElementById('f-my-darts-scale');
  const myDartsPosX = document.getElementById('f-my-darts-pos-x');
  const myDartsPosY = document.getElementById('f-my-darts-pos-y');
  if (myDartsUpload) myDartsUpload.addEventListener('click', triggerMyDartsPhoto);
  if (myDartsInput) myDartsInput.addEventListener('change', loadMyDartsPhoto);
  if (myDartsScale) myDartsScale.addEventListener('input', updateMyDartsScale);
  if (myDartsPosX) myDartsPosX.addEventListener('input', updateMyDartsPosition);
  if (myDartsPosY) myDartsPosY.addEventListener('input', updateMyDartsPosition);

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
  if (experienceInput) {
    experienceInput.addEventListener('input', () => {
      experienceInput.value = experienceInput.value.replace(/[^0-9]/g, '');
    });
  }

  document.querySelectorAll('.toggle-btn[data-group]').forEach(btn => {
    btn.addEventListener('click', () => toggleSelect(btn));
  });

  document.querySelectorAll('.sns-account').forEach(bindSnsAccountInput);
  const qrTarget = document.getElementById('f-qr-target');
  if (qrTarget) {
    qrTarget.addEventListener('change', refreshQrTargetOptions);
  }

  const generateBtn = document.getElementById('generate-btn');
  const saveBtn = document.getElementById('save-btn');
  if (generateBtn) generateBtn.addEventListener('click', generateCard);
  if (saveBtn) saveBtn.addEventListener('click', saveCard);

  refreshQrTargetOptions();
  syncCardPreviewScale();
}

function syncCardPreviewScale() {
  const stage = document.getElementById('card-preview-stage');
  if (!stage) return;

  const stageWidth = stage.clientWidth || CARD_DESIGN_WIDTH;
  const scale = Math.min(1, stageWidth / CARD_DESIGN_WIDTH);

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
    renderPhotoUploadPreview();
    syncPhotoSize();
  };
  reader.readAsDataURL(file);
}

function updatePhotoPosition() {
  const posX = Number(document.getElementById('f-photo-pos-x').value || 50);
  const posY = Number(document.getElementById('f-photo-pos-y').value || 50);
  state.photoPosX = Math.max(0, Math.min(100, posX));
  state.photoPosY = Math.max(0, Math.min(100, posY));
  renderPhotoUploadPreview();
}

function updatePhotoScale() {
  const raw = Number(document.getElementById('f-photo-scale').value || 130);
  state.photoScale = Math.max(1, Math.min(2.2, raw / 100));
  renderPhotoUploadPreview();
}

function renderPhotoUploadPreview() {
  const el = document.getElementById('photo-upload');
  if (!el || !state.photo) return;

  const posX = Number.isFinite(state.photoPosX) ? state.photoPosX : 50;
  const posY = Number.isFinite(state.photoPosY) ? state.photoPosY : 50;
  const scale = Number.isFinite(state.photoScale) ? state.photoScale : 1.3;

  el.innerHTML = `<img src="${state.photo}" alt="photo" style="--img-scale:${scale};--img-pos-x:${posX}%;--img-pos-y:${posY}%;">`;
}

function triggerMyDartsPhoto() {
  document.getElementById('my-darts-input').click();
}

function loadMyDartsPhoto(e) {
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
    state.myDartsPhoto = ev.target.result;
    const el = document.getElementById('my-darts-upload');
    el.classList.add('has-photo');
    renderMyDartsUploadPreview();
  };
  reader.readAsDataURL(file);
}

function updateMyDartsScale(e) {
  const raw = Number(e.target.value || 130);
  state.myDartsScale = raw / 100;
  renderMyDartsUploadPreview();
}

function updateMyDartsPosition() {
  const posX = Number(document.getElementById('f-my-darts-pos-x').value || 50);
  const posY = Number(document.getElementById('f-my-darts-pos-y').value || 50);
  state.myDartsPosX = Math.max(0, Math.min(100, posX));
  state.myDartsPosY = Math.max(0, Math.min(100, posY));
  renderMyDartsUploadPreview();
}

function renderMyDartsUploadPreview() {
  const el = document.getElementById('my-darts-upload');
  if (!el) return;

  if (!state.myDartsPhoto) {
    el.classList.remove('has-photo');
    return;
  }

  const scale = Number.isFinite(state.myDartsScale) ? state.myDartsScale : 1.3;
  const posX = Number.isFinite(state.myDartsPosX) ? state.myDartsPosX : 50;
  const posY = Number.isFinite(state.myDartsPosY) ? state.myDartsPosY : 50;
  el.innerHTML = `
    <img src="${state.myDartsPhoto}" alt="my darts" style="--img-scale:${scale};--img-pos-x:${posX}%;--img-pos-y:${posY}%;">
    <div class="upload-hint"><span class="upload-text">タップで画像変更</span></div>
  `;
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
  if (!btn) return;
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
    myDartsPhoto: state.myDartsPhoto,
    myDartsScale: state.myDartsScale,
    myDartsPosX: state.myDartsPosX,
    myDartsPosY: state.myDartsPosY,
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

function createExportCardNode() {
  const source = document.getElementById('card-output');
  if (!source) return null;

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-100000px';
  host.style.top = '0';
  host.style.width = `${CARD_DESIGN_WIDTH}px`;
  host.style.height = `${CARD_DESIGN_HEIGHT}px`;
  host.style.pointerEvents = 'none';
  host.style.opacity = '0';
  host.style.overflow = 'hidden';

  const clone = source.cloneNode(true);
  clone.id = 'card-output-export';
  host.appendChild(clone);
  document.body.appendChild(host);

  const sourceCanvases = source.querySelectorAll('canvas');
  const cloneCanvases = clone.querySelectorAll('canvas');

  cloneCanvases.forEach((canvas, index) => {
    const sourceCanvas = sourceCanvases[index];
    if (!sourceCanvas) return;

    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(sourceCanvas, 0, 0);
    }
  });

  return { host, clone };
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas export failed'));
      }
    }, 'image/png');
  });
}

async function shareOrDownloadPng(canvas, filename) {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'DARTS PROFILE CARD',
      text: 'ダーツプロフィールカード',
    });
    return 'shared';
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = objectUrl;
    link.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  return 'downloaded';
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

  let exportHost = null;

  try {
    const exportNode = createExportCardNode();
    if (!exportNode) {
      throw new Error('Export node initialization failed');
    }

    exportHost = exportNode.host;
    const el = exportNode.clone;
    const sourceWidth = CARD_DESIGN_WIDTH;
    const sourceHeight = CARD_DESIGN_HEIGHT;

    const canvas = await html2canvas(el, {
      backgroundColor: '#040b09',
      scale: EXPORT_SCALE,
      width: sourceWidth,
      height: sourceHeight,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const filename = `darts-card-${EXPORT_WIDTH}x${EXPORT_HEIGHT}-${Date.now()}.png`;
    const result = await shareOrDownloadPng(canvas, filename);
    showToast(result === 'shared' ? '✅ 共有シートを開きました' : '✅ 保存しました！');
  } catch(e) {
    showToast('❌ 保存に失敗しました');
    console.error(e);
  } finally {
    if (exportHost) {
      exportHost.remove();
    }
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span>💾</span> PNG で保存する';
}

function bootstrap() {
  initializeEventListeners();
  updateSaveButtonState();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
