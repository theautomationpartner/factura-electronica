const { cmsSign } = require('./_lib/cmsSign');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { ltr_xml, crt_pem, key_pem } = body;

    if (!ltr_xml || !crt_pem || !key_pem) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'Faltan ltr_xml, crt_pem o key_pem' }),
      };
    }

    const cms_b64 = cmsSign(ltr_xml, crt_pem, key_pem);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, cms_b64 }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: e.message, stack: e.stack }),
    };
  }
};
