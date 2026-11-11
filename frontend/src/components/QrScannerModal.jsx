import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  useEffect(() => {
    if (!isOpen) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Trích xuất mã lô từ URL hoặc nhận chuỗi thô
        let batchCode = decodedText;
        if (decodedText.includes('/trace/')) {
          batchCode = decodedText.split('/trace/')[1].replace('/', '');
        }
        scanner.clear();
        onScanSuccess(batchCode);
      },
      (error) => {
        // Bỏ qua lỗi nhận diện từng frame khi camera đang quét
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-gray-900 mb-2">Quét mã QR trên bao bì</h3>
        <p className="text-xs text-gray-500 mb-4">Hướng camera về phía tem QR để tra cứu dữ liệu vi khí hậu và nhật ký canh tác.</p>

        <div id="qr-reader" className="w-full overflow-hidden rounded-xl border border-gray-100"></div>
      </div>
    </div>
  );
}