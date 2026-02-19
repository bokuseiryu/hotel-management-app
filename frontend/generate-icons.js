// ==================================================================
// PWAアイコン生成スクリプト
// PWA Icon Generation Script
// ==================================================================

const fs = require('fs');
const path = require('path');

// SVGアイコンの内容
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1890ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#096dd9;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="paperGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5f5f5;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="512" height="512" rx="115" fill="url(#bgGradient)"/>
  
  <g transform="translate(106, 80)">
    <rect x="0" y="40" width="300" height="360" rx="12" fill="url(#paperGradient)" stroke="#d9d9d9" stroke-width="3"/>
    <rect x="0" y="40" width="300" height="80" rx="12" fill="#1890ff" opacity="0.9"/>
    <rect x="0" y="108" width="300" height="12" fill="#1890ff" opacity="0.9"/>
    <text x="150" y="90" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">31</text>
    <text x="150" y="155" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#595959" text-anchor="middle">日報</text>
    <g transform="translate(40, 200)">
      <rect x="0" y="80" width="35" height="100" rx="4" fill="#52c41a" opacity="0.8"/>
      <rect x="55" y="50" width="35" height="130" rx="4" fill="#52c41a" opacity="0.8"/>
      <rect x="110" y="30" width="35" height="150" rx="4" fill="#1890ff" opacity="0.8"/>
      <rect x="165" y="60" width="35" height="120" rx="4" fill="#1890ff" opacity="0.8"/>
      <rect x="220" y="40" width="35" height="140" rx="4" fill="#faad14" opacity="0.8"/>
    </g>
    <circle cx="30" cy="60" r="8" fill="#d9d9d9"/>
    <circle cx="270" cy="60" r="8" fill="#d9d9d9"/>
  </g>
  
  <g transform="translate(380, 100)">
    <circle cx="0" cy="0" r="45" fill="#52c41a" opacity="0.95"/>
    <path d="M -15 0 L -5 15 L 20 -15" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>
`;

// SVGファイルを保存
const publicDir = path.join(__dirname, 'public');
const svgPath = path.join(publicDir, 'icon.svg');

fs.writeFileSync(svgPath, svgContent.trim());
console.log('✅ SVGアイコンを生成しました: icon.svg');

// 簡易的なPNG生成の説明を表示
console.log('\n📝 次のステップ:');
console.log('1. オンラインツールを使用してSVGをPNGに変換してください:');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - https://svgtopng.com/');
console.log('   - https://convertio.co/ja/svg-png/');
console.log('\n2. 以下のサイズでPNGを生成してください:');
console.log('   - logo192.png (192x192)');
console.log('   - logo512.png (512x512)');
console.log('\n3. 生成したPNGファイルをpublicフォルダに配置してください。');
console.log('\n✨ または、以下のコマンドでsharpパッケージを使用して自動生成できます:');
console.log('   npm install sharp');
console.log('   node generate-icons-sharp.js');
