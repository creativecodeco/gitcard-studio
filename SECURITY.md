# Security Policy / Política de Seguridad 🛡️

[🌐 English](#-english-security-policy) | [🇪🇸 Español](#-política-de-seguridad-en-español)

---

<a name="-english-security-policy"></a>
## 🌐 English Security Policy

The **GitHub Helpers** team takes the security of our application, API endpoints, and user data very seriously. We appreciate the responsible disclosure of any security vulnerabilities found in this repository or service.

---

### 📋 Supported Versions

We actively release security updates and patches for the following versions:

| Version | Supported |
| :--- | :---: |
| Latest Release (v1.x.x) | ✅ Yes |
| < 1.0.0 | ❌ No |

---

### 🚨 Reporting a Vulnerability

**Do NOT report security vulnerabilities through public GitHub issues.**

If you discover a potential security vulnerability, please report it privately:

1. **Email:** Send an email to **[security@creativecode.com.co](mailto:security@creativecode.com.co)** or contact **John Alexander Toro Cortés** directly.
2. **Details to Include:**
   - A clear description of the vulnerability and affected endpoint/component.
   - Step-by-step instructions or Proof of Concept (PoC) script to reproduce the issue.
   - Potential impact of the vulnerability.
3. **Response Time:** We will acknowledge receipt of your report within **48 hours** and provide periodic updates on patch progress.

---

### 🔒 Security Architecture & OWASP Compliance

Our codebase implements defense-in-depth security measures aligned with OWASP standards:

- **Strict Input Regex Validation:** All parameters (`username`, `repo`, etc.) are validated at controller and domain use-case layers before processing:
  - Username: `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`
  - Repo: `/^[a-z\d-_.]{1,100}$/i`
- **XSS & Injection Prevention:** All dynamic values rendered inside SVG cards or HTML previews are strictly sanitized and XML/HTML-escaped.
- **HTTP Rate Limiting:** Enforced via `express-rate-limit` (100 requests per 15 minutes per IP). Rate limit breaches return valid SVG error cards to prevent broken image tags in GitHub READMEs.
- **Metrics Key Protection:** Admin analytics endpoints under `/api/metrics` require a valid `METRICS_KEY`. Missing keys default to `403 Forbidden`.
- **Encrypted Token Management:** User OAuth/PAT tokens are encrypted at rest using AES-256-GCM authenticated encryption.
- **Non-Root Container Execution:** Docker builds run under the non-privileged `node` user.

---

<a name="-política-de-seguridad-en-español"></a>
## 🇪🇸 Política de Seguridad en Español

El equipo de **GitHub Helpers** se toma muy en serio la seguridad del microservicio, los endpoints de la API y los datos de nuestros usuarios. Agradecemos la divulgación responsable de cualquier vulnerabilidad encontrada.

---

### 📋 Versiones Soportadas

Mantenemos y aplicamos parches de seguridad activamente en las siguientes versiones:

| Versión | Estado de Soporte |
| :--- | :---: |
| Última versión liberada (v1.x.x) | ✅ Sí |
| < 1.0.0 | ❌ No |

---

### 🚨 Reporte de Vulnerabilidades

**NO reportes vulnerabilidades de seguridad a través de Issues públicas de GitHub.**

Si descubres una vulnerabilidad de seguridad, por favor infórmala de manera privada:

1. **Correo Electrónico:** Envía un mensaje a **[security@creativecode.com.co](mailto:security@creativecode.com.co)** o contacta directamente a **John Alexander Toro Cortés**.
2. **Información a Incluir:**
   - Descripción detallada de la vulnerabilidad y el endpoint o componente afectado.
   - Pasos detallados o código de prueba de concepto (PoC) para reproducir el fallo.
   - Impacto potencial estimado.
3. **Tiempo de Respuesta:** Confirmaremos la recepción del reporte en un plazo máximo de **48 horas** y proporcionaremos actualizaciones periódicas sobre la corrección.

---

### 🔒 Medidas de Seguridad del Sistema (Alineación OWASP)

- **Validación Estricta por Expresiones Regulares:** Todos los parámetros del API se validan en los controladores y casos de uso antes de su procesamiento.
- **Prevención de XSS e Inyecciones:** Los insumos de usuario incluidos en tarjetas SVG son sanitizados y escapados para XML/HTML.
- **Rate Limiting y Helmet:** Límite de 100 peticiones cada 15 minutos con respuestas de tarjeta SVG legibles y cabeceras de seguridad Helmet.
- **Protección de Métricas:** Los endpoints `/api/metrics` responden con `403 Forbidden` si no se especifica una variable `METRICS_KEY` válida.
- **Cifrado de Tokens:** Los tokens OAuth/PAT se cifran en reposo con AES-256-GCM.
