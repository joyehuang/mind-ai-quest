import type { FarmCertificateSnapshot } from "./terminology";

export const FARM_CERTIFICATE_WIDTH = 1120;
export const FARM_CERTIFICATE_HEIGHT = 780;

function escapeXml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function formatFarmCertificateDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function buildFarmCertificateSvg(snapshot: FarmCertificateSnapshot) {
  const studentName = escapeXml(snapshot.playerName.trim() || "小老师");
  const levelName = escapeXml(snapshot.levelName);
  const answerRate = `${Math.round(snapshot.answerRate * 100)}%`;
  const completedAt = escapeXml(formatFarmCertificateDate(snapshot.completedAt));

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${FARM_CERTIFICATE_WIDTH}" height="${FARM_CERTIFICATE_HEIGHT}" viewBox="0 0 ${FARM_CERTIFICATE_WIDTH} ${FARM_CERTIFICATE_HEIGHT}" role="img" aria-label="AI小当家结业证书">
      <defs>
        <linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff9ea" />
          <stop offset="55%" stop-color="#f6e6bc" />
          <stop offset="100%" stop-color="#e2c37a" />
        </linearGradient>
        <linearGradient id="ink" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#7c531f" />
          <stop offset="100%" stop-color="#b17a30" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#8c672d" flood-opacity="0.18" />
        </filter>
      </defs>

      <rect width="${FARM_CERTIFICATE_WIDTH}" height="${FARM_CERTIFICATE_HEIGHT}" rx="34" fill="url(#paper)" />
      <rect x="26" y="26" width="${FARM_CERTIFICATE_WIDTH - 52}" height="${FARM_CERTIFICATE_HEIGHT - 52}" rx="28" fill="none" stroke="#c99e4e" stroke-width="6" />
      <rect x="52" y="52" width="${FARM_CERTIFICATE_WIDTH - 104}" height="${FARM_CERTIFICATE_HEIGHT - 104}" rx="24" fill="none" stroke="#e8cc8a" stroke-width="2" stroke-dasharray="10 10" />

      <circle cx="132" cy="128" r="58" fill="#fff6dd" stroke="#dcb66b" stroke-width="4" />
      <circle cx="${FARM_CERTIFICATE_WIDTH - 132}" cy="${FARM_CERTIFICATE_HEIGHT - 128}" r="72" fill="#fff0c7" stroke="#d8af5a" stroke-width="4" />
      <path d="M110 128h44M132 106v44" stroke="#d2a34c" stroke-width="4" stroke-linecap="round" opacity="0.7" />

      <g filter="url(#shadow)">
        <rect x="150" y="96" width="${FARM_CERTIFICATE_WIDTH - 300}" height="${FARM_CERTIFICATE_HEIGHT - 192}" rx="28" fill="rgba(255,252,244,0.62)" />
      </g>

      <text x="50%" y="156" text-anchor="middle" font-size="28" font-family="'Times New Roman', 'Songti SC', serif" letter-spacing="10" fill="#956b2e">
        AI小当家
      </text>
      <text x="50%" y="236" text-anchor="middle" font-size="74" font-family="'Times New Roman', 'Songti SC', serif" font-weight="700" fill="url(#ink)">
        结业证书
      </text>
      <text x="50%" y="286" text-anchor="middle" font-size="24" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" fill="#7a5725">
        恭喜完成稻田守护训练
      </text>

      <text x="160" y="380" font-size="22" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" fill="#8a6531">颁给小老师</text>
      <text x="160" y="450" font-size="62" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" font-weight="700" fill="#5c3d1b">${studentName}</text>

      <line x1="160" y1="482" x2="${FARM_CERTIFICATE_WIDTH - 160}" y2="482" stroke="#d7b36a" stroke-width="2" />

      <text x="160" y="556" font-size="22" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" fill="#8a6531">完成关卡</text>
      <text x="160" y="596" font-size="34" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" font-weight="700" fill="#5c3d1b">${levelName}</text>

      <text x="160" y="654" font-size="22" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" fill="#8a6531">小麦的答对率</text>
      <text x="360" y="654" font-size="34" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" font-weight="700" fill="#5c3d1b">${answerRate}</text>

      <text x="${FARM_CERTIFICATE_WIDTH - 396}" y="654" font-size="22" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" fill="#8a6531">完成日期</text>
      <text x="${FARM_CERTIFICATE_WIDTH - 160}" y="654" text-anchor="end" font-size="26" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" font-weight="700" fill="#5c3d1b">${completedAt}</text>

      <g transform="translate(${FARM_CERTIFICATE_WIDTH - 206}, 548)">
        <circle cx="0" cy="0" r="72" fill="#f3d58d" stroke="#b88634" stroke-width="5" />
        <circle cx="0" cy="0" r="58" fill="#fff5d4" stroke="#d3a550" stroke-width="3" />
        <text x="0" y="-8" text-anchor="middle" font-size="24" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" font-weight="700" fill="#7b541e">优秀</text>
        <text x="0" y="28" text-anchor="middle" font-size="24" font-family="'Noto Sans SC', 'Microsoft YaHei', sans-serif" font-weight="700" fill="#7b541e">学员</text>
      </g>
    </svg>
  `.trim();
}

export function farmCertificateSvgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
