import { Participant, Prize } from '../types';

/**
 * Generates an ultra high-resolution VIP Winner Certificate image (PNG)
 * using HTML5 Canvas and triggers instant download.
 */
export function downloadWinnerCertificate({
  participant,
  prize,
  storeName,
}: {
  participant: Participant;
  prize?: Prize | { title: string };
  storeName: string;
}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1200 x 800 high definition certificate
  const W = 1200;
  const H = 800;
  canvas.width = W;
  canvas.height = H;

  // 1. Deep Obsidian Black Background
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.7);
  bgGrad.addColorStop(0, '#09131C');
  bgGrad.addColorStop(0.6, '#04070A');
  bgGrad.addColorStop(1, '#020406');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Cyan Ambient Glow & Grid Lines
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 40; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 40; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Dual Cyber Neon Borders
  // Outer Border
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#164E63';
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // Inner Glow Border
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#06B6D4';
  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 15;
  ctx.strokeRect(45, 45, W - 90, H - 90);
  ctx.restore();

  // Corner Accent Brackets
  const drawCorner = (x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#22D3EE';
    ctx.fillRect(0, 0, 24, 4);
    ctx.fillRect(0, 0, 4, 24);
    ctx.restore();
  };
  drawCorner(45, 45, 0);
  drawCorner(W - 45, 45, Math.PI / 2);
  drawCorner(W - 45, H - 45, Math.PI);
  drawCorner(45, H - 45, (3 * Math.PI) / 2);

  // 4. Header Badge & Store Name
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // "R3D OFFICIAL WINNER" Pill
  ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 160, 80, 320, 38, 19);
  ctx.fill();
  ctx.strokeStyle = '#06B6D4';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#22D3EE';
  ctx.fillText('👑  شهادة فوز رسمية معتمدة  👑', W / 2, 99);

  // Store Name
  ctx.font = 'bold 36px Cairo, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
  ctx.shadowBlur = 12;
  ctx.fillText(storeName || 'متجر R3D الفاخر', W / 2, 160);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.font = '18px Cairo, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('سحب وقيف اوي عجلة الحظ الكبرى', W / 2, 200);

  // 5. Winner Center Showcase Card
  const cardY = 240;
  const cardW = 900;
  const cardH = 340;
  const cardX = (W - cardW) / 2;

  ctx.fillStyle = '#081118';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.strokeStyle = '#164E63';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Winner Greeting
  ctx.font = '22px Cairo, sans-serif';
  ctx.fillStyle = '#22D3EE';
  ctx.fillText('مبـارك للفـائـز بـالسحـب', W / 2, cardY + 50);

  // Winner Full Name (Big & Bold)
  ctx.font = '900 48px Cairo, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(participant.name, W / 2, cardY + 115);

  // Ticket Number & Prize Box
  ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 350, cardY + 165, 700, 110, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ticket Number
  ctx.font = 'bold 20px Cairo, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(`تذكرة رقم: #${participant.ticketNumber}`, W / 2, cardY + 200);

  // Prize Title
  const prizeTitle = prize ? prize.title : 'الجائزة الكبرى';
  ctx.font = 'bold 28px Cairo, sans-serif';
  ctx.fillStyle = '#22D3EE';
  ctx.fillText(`🎁  ${prizeTitle}`, W / 2, cardY + 245);

  // 6. Footer Details (Date & Verification Code)
  const drawDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  ctx.font = '15px Cairo, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(`تاريخ إجراء السحب: ${drawDate}  |  كود التحقق: R3D-${participant.ticketNumber}-${Date.now().toString(36).toUpperCase()}`, W / 2, H - 110);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#06B6D4';
  ctx.fillText('R3D STORE • VERIFIED GIVEAWAY WINNER', W / 2, H - 75);

  // 7. Trigger file download
  const imageURI = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `R3D-Winner-${participant.ticketNumber}-${participant.name.replace(/\s+/g, '_')}.png`;
  link.href = imageURI;
  link.click();
}
