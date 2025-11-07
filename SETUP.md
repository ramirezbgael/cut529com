# 🔧 Guía Rápida de Configuración - CUT529

## 📋 Lista de verificación

### ✅ Paso 1: Configurar Stripe
1. Ve a https://dashboard.stripe.com/register
2. Crea tu cuenta de Stripe
3. Ve a **Developers > API keys**
4. Copia las claves:
   - **Publishable key** (empieza con `pk_test_`)
   - **Secret key** (empieza con `sk_test_`)

### ✅ Paso 2: Actualizar .env
```bash
# Edita el archivo .env
nano .env
```

Reemplaza con tus claves reales:
```env
STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_AQUI
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
# STRIPE_WEBHOOK_SECRET=whsec_... (opcional por ahora)
```

**✅ ¡Ya tienes esto configurado!**

### ✅ Paso 3: Configurar Email (Opcional)
Si quieres enviar emails automáticos:
```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-app
```

**Para Gmail:**
1. Activa la verificación en 2 pasos
2. Genera una contraseña de aplicación
3. Usa esa contraseña en EMAIL_PASS

### ✅ Paso 4: Probar
```bash
npm start
```

Ve a: http://localhost:3000/payment

## 🧪 Tarjetas de Prueba

**⚠️ CONFIGURADO PARA PESOS MEXICANOS (MXN)**

Usa estas tarjetas mexicanas para probar:
- **Éxito**: `4242 4242 4242 4242` (Visa)
- **Falla**: `4000 0000 0000 0002` 
- **Tarjeta MX**: `4000 0048 4000 0016` (Visa México)

**Fecha**: Cualquier fecha futura  
**CVC**: Cualquier 3 dígitos

**💰 Precios actuales:**
- Trial Gratis: $0 MXN
- Plan Básico: $200 MXN
- Plan Premium: $2,000 MXN  
- Plan Completo: $20,000 MXN

## 🚀 Para Producción

**✅ Ya estás usando claves LIVE - ¡listo para producción!**

### Opcional - Configurar Webhook (recomendado):
1. Ve a: https://dashboard.stripe.com/webhooks
2. Crea endpoint: `https://tudominio.com/webhook`
3. Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copia el webhook secret al .env:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui
   ```

## ❓ Problemas Comunes

**Error: "Stripe is not defined"**
- Verifica que la clave pública esté en .env
- Revisa la consola del navegador

**Pagos no procesan:**
- Verifica la clave secreta en .env  
- Revisa los logs del servidor con `npm start`

**Emails no llegan:**
- Verifica configuración EMAIL_USER y EMAIL_PASS
- Para Gmail usa contraseña de aplicación, no tu contraseña normal
