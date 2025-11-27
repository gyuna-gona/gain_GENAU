export function getColorForName(name) {
  const normalized = name.toLowerCase();

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const hue = hash % 360; // 0~360도 색상 분포
  const saturation = 25 + (hash % 26); // 25%~50% 채도
  const lightness = 75 + (hash % 16); // 75%~90% 명도

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

