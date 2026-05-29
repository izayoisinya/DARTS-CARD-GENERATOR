function sanitizeRatingInput(input) {
  let value = input.value.replace(/[^0-9.]/g, '');
  const firstDot = value.indexOf('.');
  if (firstDot !== -1) {
    value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, '');
  }
  if (value.startsWith('.')) value = `0${value}`;
  input.value = value.slice(0, 6);
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
