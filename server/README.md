# Santo Antojo — servidor de prueba de campañas (solo borradores)

Backend Node.js sin librerías externas, preparado para Render. Es **un prototipo de pruebas**, no una integración operativa con la APK 1.6. No contiene clave OpenAI, tokens Metricool ni credenciales de redes sociales. No llama a ninguna API externa y **no puede publicar, aprobar ni programar**.

## Probar localmente

```bash
cd server
npm test
SANTO_CAMPAIGN_API_TOKEN='usa-una-clave-privada-de-24-caracteres-o-mas' npm start
```

- `GET /health`: estado público, siempre `publishingEnabled: false`.
- `GET /api/v1/campaigns/capabilities`: con `Authorization: Bearer <SANTO_CAMPAIGN_API_TOKEN>`.
- `POST /api/v1/campaigns/preview`: crea copys de prueba para Instagram y Facebook. JSON: `{"product":"fresas con crema y Raffaello","priceMx":80,"platforms":["instagram","facebook"]}`.
- `POST /api/v1/campaigns/publish|schedule|approve`: devuelve siempre `403`; no realiza ninguna publicación.

### Preparar Render (pendiente de confirmar workspace)

Crear servicio Node con rama de pruebas autorizada, `buildCommand: cd server && npm install --omit=dev`, `startCommand: cd server && npm start`, secreto `SANTO_CAMPAIGN_API_TOKEN` (solo en Render) y `PORT` gestionado por Render. Verificar `/health` y probar `preview` con datos de muestra. No configurar auto-publicación.

**Limitaciones:** no usa IA ni imágenes reales, no guarda campañas persistentemente, no se conecta a Metricool. La integración con la APK 1.6 y el sistema de aprobación de campañas requiere revisar su código e implementar autenticación y almacenamiento antes de producción. No incrustar `SANTO_CAMPAIGN_API_TOKEN` dentro de una APK distribuida.
