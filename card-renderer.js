function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildCardHtml(formData, state) {
  const {
    name,
    ratingLive,
    ratingPho,
    area,
    barrel,
    flight,
    tip,
    pr,
  } = formData;

  const ratingBadges = (() => {
    const badges = [];
    if (ratingLive) {
      badges.push(`<span class="card-rating-badge" style="border-color:rgba(61,214,200,0.4);background:rgba(61,214,200,0.1)"><span class="card-rating-label" style="color:var(--teal)">LIVE</span><span class="card-rating-val" style="color:var(--teal)">${escHtml(ratingLive)}</span></span>`);
    }
    if (ratingPho) {
      badges.push(`<span class="card-rating-badge" style="border-color:rgba(232,112,75,0.4);background:rgba(232,112,75,0.1)"><span class="card-rating-label" style="color:#e8704b">PHO</span><span class="card-rating-val" style="color:#e8704b">${escHtml(ratingPho)}</span></span>`);
    }
    return badges.join('');
  })();

  const nameHtml = name ? `<div class="card-name">${escHtml(name)}</div>` : '';
  const ratingsHtml = ratingBadges
    ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">${ratingBadges}</div>`
    : '';

  const styleLabel = state.style === 'solo' ? '1人で黙々' : state.style === 'group' ? '大人数でワイワイ' : null;
  const drinkLabel = state.drink === 'yes' ? '飲む' : state.drink === 'no' ? '飲まない' : null;
  const smokeLabel = state.smoke === 'yes' ? '吸う' : state.smoke === 'no' ? '吸わない' : null;
  const gachiLabel = state.gachi === 'gachi' ? '🔥 ガチ' : state.gachi === 'half' ? '⚖️ 半々' : state.gachi === 'enjoy' ? '😄 エンジョイ' : null;

  const photoHTML = state.photo
    ? `<img src="${state.photo}" alt="photo">`
    : '<span style="font-size:28px">🎯</span>';

  const prSection = pr ? `
    <div class="card-pr">
      <div class="c-label">PR</div>
      <div class="c-val">${escHtml(pr)}</div>
    </div>
  ` : '';

  function choiceCell(label, sel) {
    if (!sel) return null;
    return `<div class="card-cell">
      <div class="c-label">${label}</div>
      <div class="c-val">${sel}</div>
    </div>`;
  }

  function wideCell(label, val, cls = '') {
    return `<div class="card-cell">
      <div class="c-label">${label}</div>
      <div class="c-val${cls ? ' ' + cls : ''}">${val}</div>
    </div>`;
  }

  const areaRow = area ? wideCell('エリア / ホーム', escHtml(area), 'gold') : '';

  let settingRows = '';
  if (barrel) settingRows += wideCell('バレル', escHtml(barrel));
  if (flight) settingRows += wideCell('フライト / シャフト', escHtml(flight));
  if (tip) settingRows += wideCell('チップ', escHtml(tip));

  const choices = [];
  const styleCell = choiceCell('普段は', styleLabel);
  if (styleCell) choices.push(styleCell);
  const drinkCell = choiceCell('飲酒', drinkLabel);
  if (drinkCell) choices.push(drinkCell);
  const smokeCell = choiceCell('喫煙', smokeLabel);
  if (smokeCell) choices.push(smokeCell);
  const gachiCell = choiceCell('ガチ度', gachiLabel);
  if (gachiCell) choices.push(gachiCell);

  let gridRows = '';
  for (let i = 0; i < choices.length; i += 2) {
    if (i + 1 < choices.length) {
      gridRows += `<div class="card-grid-2">${choices[i]}${choices[i + 1]}</div>`;
    } else {
      gridRows += choices[i];
    }
  }

  return `
    <div class="card-header">
      <div class="card-photo">${photoHTML}</div>
      <div class="card-name-block">
        ${nameHtml}
        ${ratingsHtml}
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
}
