# AFIP WSAA – Netlify Functions (Multi-Cliente)

Funciones serverless para firmar un LoginTicketRequest (LTR) y obtener `token`/`sign` de WSAA.
Diseñado para múltiples clientes: enviás `crt_pem` y `key_pem` del cliente y obtenés su token.

## Endpoints

- `/.netlify/functions/token` → POST `{ env, service, crt_pem, key_pem }`
- `/.netlify/functions/sign` → POST `{ ltr_xml, crt_pem, key_pem }`

### Ejemplo `token`

```http
POST /.netlify/functions/token
Content-Type: application/json

{
  "env": "homo",
  "service": "wsfe",
  "crt_pem": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n",
  "key_pem": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

Respuesta:
```json
{
  "ok": true,
  "token": "...",
  "sign": "...",
  "generationTime": "YYYY-MM-DDTHH:mm:ss-03:00",
  "expirationTime": "YYYY-MM-DDTHH:mm:ss-03:00",
  "uniqueId": ".......",
  "cms_b64": ".......",
  "ltr_xml": "<?xml ...>"
}
```

> Recomendado: cacheá `token/sign` por cliente en tu Data Store hasta `expirationTime`.
