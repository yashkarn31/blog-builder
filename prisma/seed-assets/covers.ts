// SVG artwork for the sample posts' covers. Rendered to WebP by the seed
// script so the demo works offline without stock photos.

export const analyticsCover = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800" viewBox="0 0 1600 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#071a33"/><stop offset="1" stop-color="#0b3b73"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4fd1ff"/><stop offset="1" stop-color="#1767d6"/>
    </linearGradient>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4fd1ff" stop-opacity=".45"/><stop offset="1" stop-color="#4fd1ff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="800" fill="url(#bg)"/>
  <g stroke="#ffffff" stroke-opacity=".07">
    ${Array.from({ length: 9 }, (_, i) => `<line x1="0" x2="1600" y1="${100 + i * 80}" y2="${100 + i * 80}"/>`).join("")}
    ${Array.from({ length: 17 }, (_, i) => `<line y1="0" y2="800" x1="${i * 100}" x2="${i * 100}"/>`).join("")}
  </g>
  <rect x="140" y="130" width="620" height="540" rx="28" fill="#ffffff" fill-opacity=".06" stroke="#ffffff" stroke-opacity=".12"/>
  ${[180, 260, 220, 330, 290, 400, 460].map((h, i) => `<rect x="${200 + i * 78}" y="${610 - h}" width="46" height="${h}" rx="10" fill="url(#bar)"/>`).join("")}
  <rect x="200" y="175" width="180" height="16" rx="8" fill="#fff" fill-opacity=".55"/>
  <rect x="200" y="205" width="110" height="12" rx="6" fill="#fff" fill-opacity=".25"/>
  <rect x="840" y="130" width="620" height="330" rx="28" fill="#ffffff" fill-opacity=".06" stroke="#ffffff" stroke-opacity=".12"/>
  <path d="M880 400 C960 380 1000 300 1080 320 S1200 240 1260 260 S1370 190 1420 170 L1420 430 L880 430 Z" fill="url(#area)"/>
  <path d="M880 400 C960 380 1000 300 1080 320 S1200 240 1260 260 S1370 190 1420 170" fill="none" stroke="#4fd1ff" stroke-width="6" stroke-linecap="round"/>
  <circle cx="1420" cy="170" r="12" fill="#fff"/><circle cx="1420" cy="170" r="24" fill="#4fd1ff" fill-opacity=".3"/>
  <rect x="840" y="500" width="295" height="170" rx="28" fill="#ffffff" fill-opacity=".06" stroke="#ffffff" stroke-opacity=".12"/>
  <rect x="1165" y="500" width="295" height="170" rx="28" fill="#ffffff" fill-opacity=".06" stroke="#ffffff" stroke-opacity=".12"/>
  <circle cx="930" cy="585" r="46" fill="none" stroke="#ffffff" stroke-opacity=".15" stroke-width="14"/>
  <circle cx="930" cy="585" r="46" fill="none" stroke="#4fd1ff" stroke-width="14" stroke-dasharray="210 400" stroke-linecap="round" transform="rotate(-90 930 585)"/>
  <rect x="1005" y="560" width="100" height="18" rx="9" fill="#fff" fill-opacity=".55"/>
  <rect x="1005" y="592" width="70" height="12" rx="6" fill="#fff" fill-opacity=".25"/>
  <path d="M1205 630 l40 -40 l35 25 l60 -70 l50 30" fill="none" stroke="#7cf0b5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const developerCover = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800" viewBox="0 0 1600 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b1033"/><stop offset=".55" stop-color="#3b1d6e"/><stop offset="1" stop-color="#0f5f8c"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="800" fill="url(#bg)"/>
  <circle cx="1350" cy="120" r="260" fill="#ff7ac6" fill-opacity=".12"/>
  <circle cx="220" cy="720" r="300" fill="#52d6ff" fill-opacity=".1"/>
  <g transform="translate(250 120)">
    <rect width="1100" height="560" rx="26" fill="#12131a" stroke="#ffffff" stroke-opacity=".12"/>
    <rect width="1100" height="58" rx="26" fill="#1c1e28"/><rect y="32" width="1100" height="26" fill="#1c1e28"/>
    <circle cx="36" cy="29" r="9" fill="#ff5f57"/><circle cx="64" cy="29" r="9" fill="#febc2e"/><circle cx="92" cy="29" r="9" fill="#28c840"/>
    <rect x="150" y="18" width="170" height="22" rx="8" fill="#2a2d3a"/>
    <rect x="0" y="58" width="220" height="502" fill="#161822"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="28" y="${92 + i * 38}" width="${[120, 150, 90, 140, 110, 160, 100][i]}" height="12" rx="6" fill="#ffffff" fill-opacity="${i === 2 ? 0.55 : 0.18}"/>`).join("")}
    ${[
      [["#c792ea", 70], ["#82aaff", 160], ["#89ddff", 30]],
      [["#c792ea", 50], ["#ffcb6b", 110], ["#89ddff", 20], ["#c3e88d", 150]],
      [["#ffffff", 0]],
      [["#c792ea", 90], ["#82aaff", 130], ["#89ddff", 40]],
      [["#ffffff", 30], ["#ffcb6b", 90], ["#89ddff", 20], ["#f78c6c", 60]],
      [["#ffffff", 30], ["#82aaff", 180], ["#89ddff", 30]],
      [["#ffffff", 60], ["#c3e88d", 220]],
      [["#ffffff", 30], ["#89ddff", 20]],
      [["#ffffff", 0]],
      [["#c792ea", 80], ["#82aaff", 100], ["#89ddff", 30], ["#ffcb6b", 70]],
    ]
      .map((line, row) => {
        let x = 270 + (row % 5 === 4 || row % 5 === 0 ? 0 : 30);
        return line
          .map(([color, w]) => {
            const rect = `<rect x="${x}" y="${100 + row * 42}" width="${w}" height="14" rx="7" fill="${color}" fill-opacity=".85"/>`;
            x += (w as number) + 14;
            return w ? rect : "";
          })
          .join("");
      })
      .join("")}
    <rect x="270" y="520" width="3" height="22" fill="#fff"/>
  </g>
</svg>`;

export const habitsCover = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800" viewBox="0 0 1600 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffb35c"/><stop offset="1" stop-color="#f0587a"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="800" fill="url(#bg)"/>
  <circle cx="1300" cy="400" r="330" fill="#fff" fill-opacity=".12"/>
  <circle cx="1300" cy="400" r="220" fill="#fff" fill-opacity=".12"/>
  <g transform="translate(260 150)">
    ${[0, 1, 2, 3, 4]
      .map(
        (i) => `
      <g transform="translate(0 ${i * 100})">
        <rect width="620" height="76" rx="22" fill="#ffffff" fill-opacity="${i < 3 ? 0.92 : 0.55}"/>
        <circle cx="42" cy="38" r="18" fill="${i < 3 ? "#1d7a45" : "none"}" stroke="#1d7a45" stroke-width="4"/>
        ${i < 3 ? `<path d="M33 38 l7 7 l13 -14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
        <rect x="80" y="26" width="${[380, 300, 420, 260, 340][i]}" height="12" rx="6" fill="#2a2a2a" fill-opacity=".7"/>
        <rect x="80" y="46" width="${[200, 240, 160, 220, 180][i]}" height="9" rx="4.5" fill="#2a2a2a" fill-opacity=".3"/>
      </g>`,
      )
      .join("")}
  </g>
  <g transform="translate(1300 400)" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round">
    <circle r="120" stroke-opacity=".3"/>
    <circle r="120" stroke-dasharray="452 754" transform="rotate(-90)"/>
  </g>
  <text x="1300" y="425" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="700" fill="#fff">3/5</text>
</svg>`;
