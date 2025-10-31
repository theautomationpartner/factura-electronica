const forge = require('node-forge');

function pemToCert(pem){ return forge.pki.certificateFromPem(pem); }
function pemToPrivateKey(pem){
  try{
    return forge.pki.privateKeyFromPem(pem);
  }catch(_){
    // In case it's an encrypted PKCS#8 without password (unlikely), try decrypt:
    return forge.pki.decryptRsaPrivateKey(pem) || null;
  }
}

/**
 * Creates a PKCS#7/CMS signed message (with embedded content) and returns Base64( DER )
 * This is what AFIP WSAA expects in loginCms.in0
 */
function cmsSign(ltrXml, crtPem, keyPem){
  const cert = pemToCert(crtPem);
  const key = pemToPrivateKey(keyPem);
  if(!key) throw new Error('No se pudo leer la clave privada (.key).');

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(ltrXml, 'utf8');
  p7.addCertificate(cert);
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType,  value: forge.pki.oids.data },
      { type: forge.pki.oids.signingTime, value: new Date() },
      { type: forge.pki.oids.messageDigest }
    ]
  });
  p7.sign({ detached: false });

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const b64 = forge.util.encode64(der);
  return b64;
}

module.exports = { cmsSign };
