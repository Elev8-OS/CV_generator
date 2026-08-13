const crypto = require("crypto");

// Builds a standalone .eml file (RFC 5322 message, multipart/mixed per RFC 2046)
// with real file attachments embedded as base64 parts. Unlike a mailto: link
// (which per RFC 6068 can only carry a plain-text body — no attachments,
// ever, in any mail client), an .eml file that already contains the PDF
// bytes CAN be opened directly in a desktop mail client with the attachment
// present. The trade-off: the user has to download + open + forward/send,
// rather than one click straight into a compose window like mailto gives.

function wrapBase64(str) {
  // RFC 2045 §6.8: base64-encoded body lines should not exceed 76 characters.
  return str.replace(/(.{76})/g, "$1\r\n");
}

function toAscii(text) {
  // Best-effort transliteration so filenames stay readable without relying
  // on RFC 2231 extended-parameter encoding, which not every mail client
  // parses reliably for the filename= token.
  return String(text || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^\x20-\x7E]/g, "_");
}

function encodeHeader(text) {
  // RFC 2047 encoded-word — only needed when the header value itself has
  // non-ASCII characters (e.g. umlauts in a German subject line).
  const value = String(text || "");
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const b64 = Buffer.from(value, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

/**
 * @param {object} opts
 * @param {string} opts.to - recipient email, or "" if none was found
 * @param {string} opts.subject
 * @param {string} opts.bodyText - plain-text email body
 * @param {string} opts.fromName
 * @param {string} opts.fromEmail
 * @param {Array<{filename: string, mime: string, buffer: Buffer}>} opts.attachments
 * @returns {Buffer} the complete .eml file content
 */
function buildApplicationEml({ to, subject, bodyText, fromName, fromEmail, attachments = [] }) {
  const boundary = `----=_Part_${crypto.randomBytes(12).toString("hex")}`;

  const headers = [
    "MIME-Version: 1.0",
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@bewerbungs-generator.local>`,
    fromEmail ? `From: ${encodeHeader(fromName)} <${fromEmail}>` : null,
    to ? `To: ${to}` : null,
    `Subject: ${encodeHeader(subject)}`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`
  ].filter(Boolean);

  const parts = [
    [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      wrapBase64(Buffer.from(String(bodyText || ""), "utf8").toString("base64"))
    ].join("\r\n")
  ];

  attachments.forEach((att) => {
    const safeFilename = toAscii(att.filename).replace(/"/g, "");
    parts.push(
      [
        `--${boundary}`,
        `Content-Type: ${att.mime}; name="${safeFilename}"`,
        `Content-Disposition: attachment; filename="${safeFilename}"`,
        "Content-Transfer-Encoding: base64",
        "",
        wrapBase64(att.buffer.toString("base64"))
      ].join("\r\n")
    );
  });

  const body = headers.join("\r\n") + "\r\n\r\n" + parts.join("\r\n\r\n") + `\r\n\r\n--${boundary}--\r\n`;
  return Buffer.from(body, "utf8");
}

module.exports = { buildApplicationEml };
