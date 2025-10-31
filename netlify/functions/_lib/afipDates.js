function pad(n){ return String(n).padStart(2,'0'); }

/**
 * Formats a JS Date into AFIP datetime string with timezone, e.g. 2025-09-17T11:13:15-03:00
 * tzOffsetMinutes: minutes relative to UTC (Argentina = -180)
 */
function formatAfipDate(date, tzOffsetMinutes = -180){
  const t = new Date(date.getTime() + tzOffsetMinutes * 60000);
  const yyyy = t.getUTCFullYear();
  const mm = pad(t.getUTCMonth() + 1);
  const dd = pad(t.getUTCDate());
  const hh = pad(t.getUTCHours());
  const mi = pad(t.getUTCMinutes());
  const ss = pad(t.getUTCSeconds());
  const sign = tzOffsetMinutes <= 0 ? '-' : '+';
  const abs = Math.abs(tzOffsetMinutes);
  const oh = pad(Math.floor(abs/60));
  const om = pad(abs%60);
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${sign}${oh}:${om}`;
}

/**
 * Builds an AFIP LoginTicketRequest XML
 */
function buildLoginTicketRequest({ service = 'wsfe', tzOffsetMinutes = -180 }){
  const now = new Date();
  const uniqueId = Math.floor(now.getTime() / 1000);
  // Typical WSAA window: -5m to +15m
  const generationTime = formatAfipDate(new Date(now.getTime() - 5 * 60000), tzOffsetMinutes);
  const expirationTime = formatAfipDate(new Date(now.getTime() + 15 * 60000), tzOffsetMinutes);

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<loginTicketRequest version="1.0">` +
    `<header>` +
    `<uniqueId>${uniqueId}</uniqueId>` +
    `<generationTime>${generationTime}</generationTime>` +
    `<expirationTime>${expirationTime}</expirationTime>` +
    `</header>` +
    `<service>${service}</service>` +
    `</loginTicketRequest>`;

  return { uniqueId, generationTime, expirationTime, xml };
}

module.exports = { formatAfipDate, buildLoginTicketRequest };
