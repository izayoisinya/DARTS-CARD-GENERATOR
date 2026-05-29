// ===== STATE =====
const state = {
  photo: null,    // base64 or null
  style: null,
  drink: null,
  smoke: null,
  gachi: null,
  generated: false,
};

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
  if (!file.type || !file.type.startsWith('image/')) {
    showToast('画像ファイルを選択してください');
    e.target.value = '';
    return;
  }
  if (file.size > maxPhotoSize) {
    showToast('画像サイズは5MB以下にしてください');
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

function sanitizeRatingInput(input) {
  let value = input.value.replace(/[^0-9.]/g, '');
  const firstDot = value.indexOf('.');
  if (firstDot !== -1) {
    value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, '');
  }
  if (value.startsWith('.')) value = `0${value}`;
  input.value = value.slice(0, 6);
}

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
  const name       = document.getElementById('f-name').value.trim() || 'NAME';
  const ratingLive = document.getElementById('f-rating-live').value.trim();
  const ratingPho  = document.getElementById('f-rating-phoenix').value.trim();
  const area       = document.getElementById('f-area').value.trim();
  const barrel     = document.getElementById('f-barrel').value.trim();
  const flight     = document.getElementById('f-flight').value.trim();
  const tip        = document.getElementById('f-tip').value.trim();
  const pr         = document.getElementById('f-pr').value.trim();

  const ratingBadges = (() => {
    const badges = [];
    if (ratingLive)  badges.push(`<span class="card-rating-badge" style="border-color:rgba(61,214,200,0.4);background:rgba(61,214,200,0.1)"><span class="card-rating-label" style="color:var(--teal)">LIVE</span><span class="card-rating-val" style="color:var(--teal)">${escHtml(ratingLive)}</span></span>`);
    if (ratingPho)   badges.push(`<span class="card-rating-badge" style="border-color:rgba(232,112,75,0.4);background:rgba(232,112,75,0.1)"><span class="card-rating-label" style="color:#e8704b">PHO</span><span class="card-rating-val" style="color:#e8704b">${escHtml(ratingPho)}</span></span>`);
    if (!badges.length) badges.push(`<span class="card-rating-badge"><span class="card-rating-label">RT</span><span class="card-rating-val">—</span></span>`);
    return badges.join('');
  })();

  const styleLabel = state.style === 'solo' ? ['1人で黙々','大人数でワイワイ'] : state.style === 'group' ? ['大人数でワイワイ','1人で黙々'] : [null, null];
  const drinkLabel = state.drink === 'yes' ? ['飲む','飲まない'] : state.drink === 'no' ? ['飲まない','飲む'] : [null, null];
  const smokeLabel = state.smoke === 'yes' ? ['吸う','吸わない'] : state.smoke === 'no' ? ['吸わない','吸う'] : [null, null];
  const gachiLabel = state.gachi === 'gachi' ? '🔥 ガチ' : state.gachi === 'half' ? '⚖️ 半々' : state.gachi === 'enjoy' ? '😄 エンジョイ' : null;

  const photoHTML = state.photo
    ? `<img src="${state.photo}" alt="photo">`
    : `<span style="font-size:28px">🎯</span>`;

  const prSection = pr ? `
    <div class="card-pr">
      <div class="c-label">PR</div>
      <div class="c-val">${escHtml(pr)}</div>
    </div>
  ` : '';

  // --- 入力済みセルだけ収集してグリッドに敷き詰める ---
  function cell(label, val, cls='') {
    return `<div class="card-cell">
      <div class="c-label">${label}</div>
      <div class="c-val${cls ? ' '+cls : ''}">${val}</div>
    </div>`;
  }
  function choiceCell(label, sel) {
    if (!sel) return null;
    return `<div class="card-cell">
      <div class="c-label">${label}</div>
      <div class="c-val">${sel}</div>
    </div>`;
  }

  // 全幅セル
  function wideCell(label, val, cls='') {
    return `<div class="card-cell">
      <div class="c-label">${label}</div>
      <div class="c-val${cls ? ' '+cls : ''}">${val}</div>
    </div>`;
  }

  // 1. エリア（全幅）
  const areaRow = area ? wideCell('エリア / ホーム', escHtml(area), 'gold') : '';

  // 2. セッティング（全幅）
  let settingRows = '';
  if (barrel) settingRows += wideCell('バレル', escHtml(barrel));
  if (flight) settingRows += wideCell('フライト / シャフト', escHtml(flight));
  if (tip)    settingRows += wideCell('チップ', escHtml(tip));

  // 3. 選択項目（2列グリッド）
  const choices = [];
  const styleCell = choiceCell('普段は', styleLabel[0]);
  if (styleCell) choices.push(styleCell);
  const drinkCell = choiceCell('飲酒', drinkLabel[0]);
  if (drinkCell) choices.push(drinkCell);
  const smokeCell = choiceCell('喫煙', smokeLabel[0]);
  if (smokeCell) choices.push(smokeCell);
  const gachiCell = choiceCell('ガチ度', gachiLabel);
  if (gachiCell) choices.push(gachiCell);

  let gridRows = '';
  for (let i = 0; i < choices.length; i += 2) {
    if (i + 1 < choices.length) {
      gridRows += `<div class="card-grid-2">${choices[i]}${choices[i+1]}</div>`;
    } else {
      gridRows += choices[i];
    }
  }

  document.getElementById('card-output').innerHTML = `
    <div class="card-header">
      <div class="card-photo">${photoHTML}</div>
      <div class="card-name-block">
        <div class="card-name">${escHtml(name)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
          ${ratingBadges}
        </div>
      </div>
    </div>
    <div class="card-body">
      ${areaRow}
      ${settingRows}
      ${gridRows}
      ${prSection}
    </div>
    <div class="card-footer">
      <span class="card-footer-tag">🎯 DARTS PROFILE CARD</span>
      <span class="card-footer-tag">${new Date().getFullYear()}</span>
    </div>
  `;

  state.generated = true;
  updateSaveButtonState();
  switchTab('preview');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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

updateSaveButtonState();

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
