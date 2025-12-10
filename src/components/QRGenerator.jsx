import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import './QRGenerator.css';

export default function QRGenerator({ flowerId, flowerName, onClose, onBack }) {
    const [downloaded, setDownloaded] = useState(false);

    // Create the URL that the QR code will point to
    const flowerURL = `${window.location.origin}${window.location.pathname}?flower=${flowerId}`;

    const handleDownload = () => {
        const svg = document.getElementById('qr-code-svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `${flowerName.replace(/\s+/g, '-')}-QR.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            setDownloaded(true);

            setTimeout(() => setDownloaded(false), 3000);
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(flowerURL);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="qr-container fade-in">
            <div className="qr-header">
                <button className="back-btn" onClick={onBack} title="Back to Gallery">
                    ← Back to Gallery
                </button>
            </div>

            <div className="qr-content">
                <div className="qr-title-section">
                    <h2>QR Code Generated!</h2>
                    <p className="qr-subtitle">Scan to view "{flowerName}"</p>
                </div>

                <div className="qr-code-wrapper card scale-in">
                    <div className="qr-code-display">
                        <QRCodeSVG
                            id="qr-code-svg"
                            value={flowerURL}
                            size={280}
                            level="H"
                            includeMargin={true}
                            fgColor="#1a1a35"
                            bgColor="#ffffff"
                        />
                    </div>

                    <div className="qr-info">
                        <p className="qr-hint">
                            Point your camera at the QR code to view flower details
                        </p>
                    </div>
                </div>

                <div className="qr-actions">
                    <button className="btn btn-primary" onClick={handleDownload}>
                        {downloaded ? '✓ Downloaded!' : '📥 Download QR Code'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleCopyLink}>
                        🔗 Copy Link
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        ← Back to Edit
                    </button>
                </div>

                <div className="qr-url-display">
                    <label>QR Code URL:</label>
                    <code className="url-code">{flowerURL}</code>
                </div>
            </div>
        </div>
    );
}
