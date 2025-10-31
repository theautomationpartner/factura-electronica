const { buildLoginTicketRequest } = require('./_lib/afipDates');
const { cmsSign } = require('./_lib/cmsSign');

function buildSoapEnvelope(cms_b64){
  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">` +
    `<soapenv:Header/>` +
    `<soapenv:Body>` +
    `<loginCms xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov">` +
    `<in0>${cms_b64}</in0>` +
    `</loginCms>` +
    `</soapenv:Body>` +
    `</soapenv:Envelope>`;
}

function unescapeXmlEntities(s=''){
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseLoginCmsReturn(soapText){
  const m = soapText.match(/<loginCmsReturn>([\s\S]*?)<\/loginCmsReturn>/);
  if(!m) return null;
  const inner = unescapeXmlEntities(m[1]);
  const tok = (inner.match(/<token>([\s\S]*?)<\/token>/) || [])[1] || '';
  const sign = (inner.match(/<sign>([\s\S]*?)<\/sign>/) || [])[1] || '';
  const gen  = (inner.match(/<generationTime>([\s\S]*?)<\/generationTime>/) || [])[1] || '';
  const exp  = (inner.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/) || [])[1] || '';
  return { token: tok, sign, generationTime: gen, expirationTime: exp, rawInner: inner };
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { crt_pem, key_pem, env = 'homo', service = 'wsfe' } = body;

    if (!crt_pem || !key_pem) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'Faltan crt_pem o key_pem' }),
      };
    }

    const { xml: ltr_xml, uniqueId, generationTime, expirationTime } =
      buildLoginTicketRequest({ service });

    const cms_b64 = cmsSign(ltr_xml, crt_pem, key_pem);

    const endpoint = env === 'prod'
      ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
      : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';

    const envelope = buildSoapEnvelope(cms_b64);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      body: envelope,
    });

    const text = await res.text();
    const parsed = parseLoginCmsReturn(text);

    if (!parsed || !parsed.token || !parsed.sign) {
      // Axis Fault?
      const fault = (text.match(/<faultstring>([\s\S]*?)<\/faultstring>/) || [])[1];
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'WSAA no devolvió token/sign', fault, raw: text }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        token: parsed.token,
        sign: parsed.sign,
        generationTime: parsed.generationTime || generationTime,
        expirationTime: parsed.expirationTime || expirationTime,
        uniqueId,
        cms_b64,
        ltr_xml,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: e.message, stack: e.stack }),
    };
  }
};
