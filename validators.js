function sanitizeRatingInput(input) {
  let value = input.value.replace(/[^0-9.]/g, '');
  const firstDot = value.indexOf('.');
  if (firstDot !== -1) {
    value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, '');
  }
  if (value.startsWith('.')) value = `0${value}`;

  const [integerPartRaw = '', decimalPartRaw = ''] = value.split('.');
  const integerPart = integerPartRaw.slice(0, 2);
  const decimalPart = decimalPartRaw.slice(0, 2);

  if (value.includes('.')) {
    input.value = `${integerPart}.${decimalPart}`;
    return;
  }

  input.value = integerPart;
}

function formatRatingValue(rawValue) {
  const numericValue = Number(rawValue);
  if (Number.isNaN(numericValue)) return null;

  const fixed = numericValue.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');
  return `${integerPart.padStart(2, '0')}.${decimalPart}`;
}

function validateAndFormatRatingInput(input, maxValue, label) {
  const rawValue = input.value.trim();
  if (!rawValue) {
    return { isValid: true, formattedValue: '' };
  }

  const numericValue = Number(rawValue);
  if (Number.isNaN(numericValue)) {
    return { isValid: false, error: `${label}は数値で入力してください` };
  }

  if (numericValue < 0 || numericValue > maxValue) {
    return { isValid: false, error: `${label}は0〜${maxValue}の範囲で入力してください` };
  }

  const formattedValue = formatRatingValue(rawValue);
  if (!formattedValue) {
    return { isValid: false, error: `${label}の形式が不正です` };
  }

  input.value = formattedValue;
  return { isValid: true, formattedValue };
}

function getPhotoValidationError(file, maxPhotoSize) {
  if (!file.type || !file.type.startsWith('image/')) {
    return '画像ファイルを選択してください';
  }
  if (file.size > maxPhotoSize) {
    return '画像サイズは5MB以下にしてください';
  }
  return null;
}
