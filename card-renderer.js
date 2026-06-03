function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildCardHtml(formData, state) {
  const {
    name,
    ratingLive,
    ratingPho,
    experience,
    area,
    home,
    gender,
    barrel,
    flight,
    shaft,
    tip,
    myDartsPhoto,
    myDartsScale,
    myDartsPosX,
    myDartsPosY,
    favoritePro,
    goodNumber,
    favoriteGame,
    goal,
    sns,
    qrTarget,
    pr,
  } = formData;

  const EMPTY_TEXT = '---';

  function textOrPlaceholder(value) {
    const normalized = typeof value === 'string' ? value.trim() : value;
    return normalized ? escHtml(String(normalized)) : EMPTY_TEXT;
  }

  function rawOrPlaceholder(value) {
    return value ? value : EMPTY_TEXT;
  }

  const ratingBadges = (() => {
    const badges = [
      `<span class="card-rating-badge" style="border-color:rgba(61,214,200,0.4);background:rgba(61,214,200,0.1)"><span class="card-rating-label" style="color:#3dd6c8">LIVE</span><span class="card-rating-val" style="color:#3dd6c8">${textOrPlaceholder(ratingLive)}</span></span>`,
      `<span class="card-rating-badge" style="border-color:rgba(232,112,75,0.4);background:rgba(232,112,75,0.1)"><span class="card-rating-label" style="color:#e8704b">PHO</span><span class="card-rating-val" style="color:#e8704b">${textOrPlaceholder(ratingPho)}</span></span>`
    ];
    return badges.join('');
  })();

  const genderMark = gender === 'male' ? '♂' : gender === 'female' ? '♀' : '';
  const genderColor = gender === 'male' ? '#4d90fe' : gender === 'female' ? '#e8547a' : '';
  const nameHtml = `<div class="card-name-line">${genderMark ? `<span class="card-gender-mark" style="color:${genderColor}">${genderMark}</span>` : ''}<div class="card-name">${textOrPlaceholder(name)}</div></div>`;
  const experienceText = `${textOrPlaceholder(experience)}年`;
  const metaHtml = `
    <div class="card-meta-stack">
      <div class="card-meta-row">${ratingBadges}</div>
      <div class="card-experience-row">
        <span class="card-rating-badge card-rating-badge-history">
          <span class="card-rating-label">YEAR</span>
          <span class="card-rating-val">${experienceText}</span>
        </span>
      </div>
    </div>
  `;

  const styleLabel = state.style === 'solo' ? '1人で黙々' : state.style === 'group' ? '大人数でワイワイ' : EMPTY_TEXT;
  const drinkLabel = state.drink === 'yes' ? '飲む' : state.drink === 'no' ? '飲まない' : EMPTY_TEXT;
  const smokeLabel = state.smoke === 'yes' ? '吸う' : state.smoke === 'no' ? '吸わない' : EMPTY_TEXT;
  const gachiLabel = state.gachi === 'gachi' ? '🔥 ガチ' : state.gachi === 'half' ? '⚖️ 半々' : state.gachi === 'enjoy' ? '😄 エンジョイ' : EMPTY_TEXT;

  const photoHTML = state.photo
    ? `<div class="card-photo-image" style="background-image:url('${state.photo}');--img-scale:${Number.isFinite(state.photoScale) ? Math.max(1, Math.min(2.2, state.photoScale)) : 1.3};--img-pos-x:${Number.isFinite(state.photoPosX) ? Math.max(0, Math.min(100, state.photoPosX)) : 50}%;--img-pos-y:${Number.isFinite(state.photoPosY) ? Math.max(0, Math.min(100, state.photoPosY)) : 50}%;"></div>`
    : '<span style="font-size:28px">🎯</span>';
  const qrLabel = qrTarget ? `${escHtml(qrTarget.name)}: ${escHtml(qrTarget.account)}` : 'QR';
  const myDartsScaleSafe = Number.isFinite(myDartsScale) ? Math.max(1, Math.min(2.2, myDartsScale)) : 1.3;
  const myDartsPosXSafe = Number.isFinite(myDartsPosX) ? Math.max(0, Math.min(100, myDartsPosX)) : 50;
  const myDartsPosYSafe = Number.isFinite(myDartsPosY) ? Math.max(0, Math.min(100, myDartsPosY)) : 50;
  const myDartsHtml = myDartsPhoto
    ? `<div class="card-main-darts-image" style="background-image:url('${myDartsPhoto}');--img-scale:${myDartsScaleSafe};--img-pos-x:${myDartsPosXSafe}%;--img-pos-y:${myDartsPosYSafe}%;"></div>`
    : '<span class="card-image-placeholder">---</span>';

  const mainProfileSection = `
    <div class="card-main-profile">
      <div class="card-photo">${photoHTML}</div>
      <div class="card-main-profile-text">
        ${nameHtml}
        ${metaHtml}
      </div>
      <div class="card-main-darts">
        <div class="card-main-darts-box">${myDartsHtml}</div>
        <div class="card-main-darts-note">MY DARTS</div>
      </div>
      <div class="card-main-qr">
        <div class="card-main-qr-box" id="card-qr-box"></div>
        <div class="card-main-qr-note">${qrLabel}</div>
      </div>
    </div>
  `;

  const prSection = `
    <div class="card-pr">
      <div class="c-label">PR</div>
      <div class="c-val">${textOrPlaceholder(pr)}</div>
    </div>
  `;

  function choiceCell(label, sel) {
    return `<div class="card-cell">
      <div class="c-label">${label}</div>
      <div class="c-val">${rawOrPlaceholder(sel)}</div>
    </div>`;
  }

  function wideCell(label, val, cls = '', cellClass = '') {
    return `<div class="card-cell${cellClass ? ' ' + cellClass : ''}">
      <div class="c-label">${label}</div>
      <div class="c-val${cls ? ' ' + cls : ''}">${val || EMPTY_TEXT}</div>
    </div>`;
  }

  function sectionBlock(title, cells, className = '') {
    return `
      <section class="card-section${className ? ' ' + className : ''}">
        <div class="card-section-title">${title}</div>
        <div class="card-section-grid">
          ${cells.join('')}
        </div>
      </section>
    `;
  }

  const snsMap = new Map(Array.isArray(sns) ? sns.map(item => [item.id || item.name, item]) : []);
  const fixedSnsItems = [
    { id: 'sns-x', name: 'X' },
    { id: 'sns-instagram', name: 'Instagram' },
    { id: 'sns-tiktok', name: 'TikTok' },
    { id: 'sns-youtube', name: 'YouTube' },
  ];

  const basicSection = sectionBlock('エリア/ホーム', [
    wideCell('エリア', textOrPlaceholder(area), 'gold'),
    wideCell('ホーム', textOrPlaceholder(home), 'gold'),
  ], 'card-section-basic');

  const settingSection = sectionBlock('SETTING', [
    wideCell('バレル', textOrPlaceholder(barrel)),
    wideCell('フライト', textOrPlaceholder(flight)),
    wideCell('シャフト', textOrPlaceholder(shaft)),
    wideCell('チップ', textOrPlaceholder(tip)),
  ], 'card-section-setting');

  const styleSection = sectionBlock('STYLE', [
    choiceCell('普段は', styleLabel),
    choiceCell('飲酒', drinkLabel),
    choiceCell('喫煙', smokeLabel),
    choiceCell('ガチ度', gachiLabel),
  ]);

  const favoritesSection = sectionBlock('FAVORITES', [
    wideCell('好きなプロ/プレイヤー', textOrPlaceholder(favoritePro), '', 'card-cell-span-2'),
    wideCell('好きなゲーム', textOrPlaceholder(favoriteGame)),
    wideCell('得意ナンバー', textOrPlaceholder(goodNumber)),
    wideCell('目標', textOrPlaceholder(goal), '', 'card-cell-span-2'),
  ], 'card-section-favorites');

  const visibleSnsItems = fixedSnsItems.filter(item => !qrTarget || item.id !== qrTarget.id);

  const snsSection = sectionBlock('SNS', visibleSnsItems.map(item => {
    const snsItem = snsMap.get(item.id) || snsMap.get(item.name);
    return wideCell(item.name, textOrPlaceholder(snsItem ? snsItem.account : ''));
  }));

  const now = new Date();
  const displayDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  return `
    <div class="card-header">
      <div class="card-header-title">DARTS PROFILE CARD</div>
      <span class="card-header-date">${displayDate}</span>
    </div>
    <div class="card-body">
      ${mainProfileSection}
      <div class="card-columns">
        <div class="card-col">
          ${basicSection}
          ${settingSection}
        </div>
        <div class="card-col">
          ${favoritesSection}
          ${snsSection}
        </div>
        <div class="card-col">
          ${styleSection}
          ${prSection}
        </div>
      </div>
    </div>
  `;
}
