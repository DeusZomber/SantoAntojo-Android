# Santo Antojo Android

Repositorio de compilación de la APK instalable de Santo Antojo.

**Importante:** todavía no contiene el código de la aplicación ni una APK compilada. La compilación requiere subir el ZIP sin secretos y configurar la firma Android de forma privada.

## Cargar el proyecto (una sola vez)

1. Descarga el archivo preparado `SantoAntojo_1.4_Actualizable_Proyecto.zip` de la conversación original de ChatGPT.
2. En este repositorio pulsa **Add file > Upload files** y súbelo **sin descomprimirlo** a la raíz. No subas los ZIP originales 1.1: contienen el archivo privado de firma y una clave de OpenAI.
3. En **Settings > Secrets and variables > Actions**, configura estos secretos:
   - `SANTO_KEYSTORE_BASE64`: contenido Base64 del certificado original `signing/santo-antojo.p12` (el archivo se obtiene del proyecto privado 1.1).
   - `SANTO_KEYSTORE_PASSWORD`: contraseña de la firma original.
   - `SANTO_KEY_ALIAS`: alias de la clave de firma original.
   - `SANTO_KEY_PASSWORD`: contraseña de la clave original.
4. En **Actions > Compilar Santo Antojo APK**, elige **Run workflow**.

La automatización publica el archivo instalable en las publicaciones (Releases) si la firma es correcta, además de `update.json` para permitir actualizaciones desde la app.

### Seguridad
- Nunca subas archivos `.p12`, `.jks`, `.keystore`, `.env` con datos reales, ni claves `sk-...` a este repositorio público.
- No desinstales la aplicación que ya utilizas: se necesita la misma firma y un versionCode mayor para actualizar conservando sus datos.
- Antes de instalar, exporta un respaldo de ventas e inventario.
- Las campañas IA requieren configurar aparte el servidor privado HTTPS y autorización de Metricool; **no** funcionan solo por compilar una APK.
