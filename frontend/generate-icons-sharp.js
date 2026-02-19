// ==================================================================
// PWAアイコン自動生成スクリプト (Sharp使用)
// PWA Icon Auto-Generation Script (Using Sharp)
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

async function generateIcons() {
    try {
        // sharpをインポート
        const sharp = require('sharp');
        
        const publicDir = path.join(__dirname, 'public');
        const svgBuffer = Buffer.from(svgContent.trim());
        
        console.log('🎨 PWAアイコンを生成中...\n');
        
        // 192x192のPNGを生成
        await sharp(svgBuffer)
            .resize(192, 192)
            .png()
            .toFile(path.join(publicDir, 'logo192.png'));
        console.log('✅ logo192.png を生成しました (192x192)');
        
        // 512x512のPNGを生成
        await sharp(svgBuffer)
            .resize(512, 512)
            .png()
            .toFile(path.join(publicDir, 'logo512.png'));
        console.log('✅ logo512.png を生成しました (512x512)');
        
        // favicon用に32x32のPNGを生成
        await sharp(svgBuffer)
            .resize(32, 32)
            .png()
            .toFile(path.join(publicDir, 'favicon-32x32.png'));
        console.log('✅ favicon-32x32.png を生成しました (32x32)');
        
        // favicon用に16x16のPNGを生成
        await sharp(svgBuffer)
            .resize(16, 16)
            .png()
            .toFile(path.join(publicDir, 'favicon-16x16.png'));
        console.log('✅ favicon-16x16.png を生成しました (16x16)');
        
        console.log('\n🎉 すべてのアイコンが正常に生成されました！');
        console.log('\n📱 次のステップ:');
        console.log('1. npm start でアプリを起動');
        console.log('2. ブラウザでアプリを開く');
        console.log('3. モバイルデバイスで「ホーム画面に追加」を実行');
        
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error('\n❌ sharpパッケージがインストールされていません。');
            console.log('\n次のコマンドを実行してください:');
            console.log('  npm install sharp --save-dev');
            console.log('\nその後、再度このスクリプトを実行してください:');
            console.log('  node generate-icons-sharp.js');
        } else {
            console.error('❌ エラーが発生しました:', error.message);
        }
        process.exit(1);
    }
}

generateIcons();
