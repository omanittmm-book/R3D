interface QRCodeDisplayProps {
  url: string;
  size?: number;
  className?: string;
}

export default function QRCodeDisplay({ url, size = 200, className = '' }: QRCodeDisplayProps) {
  // Use high-contrast clean SVG QR generator image
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    url
  )}&bgcolor=ffffff&color=0f172a&qzone=2&format=svg`;

  return (
    <div
      className={`bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border-4 border-amber-500/30 ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <img
        src={qrUrl}
        alt="QR Code للتسجيل في السحب"
        width={size}
        height={size}
        className="rounded-lg"
        loading="lazy"
      />
    </div>
  );
}
