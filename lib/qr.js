const QRCode = require("qrcode");

/**
 * Renders a QR code as a PNG data URI, styled to match the app's ink color.
 * Used to link printed/PDF documents back to the live, tailored digital
 * application page.
 */
function qrDataUri(url, { size = 240, dark = "#14181f", light = "#ffffffff" } = {}) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 0,
    width: size,
    color: { dark, light }
  });
}

module.exports = { qrDataUri };
