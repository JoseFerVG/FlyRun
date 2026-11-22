# FlyRun — Planificación de Running y Cardio

FlyRun es una aplicación web diseñada para planificar entrenamientos de carrera y condición cardiovascular en ordenador y móvil, basada en principios fisiológicos reales y adaptada al nivel de cada persona.

## Funcionalidades principales

- **Acceso con Google y Firebase**: Autenticación mediante Google (`Firebase Auth`), lectura opcional de pasos diarios de **Google Fit** (`fitness.activity.read`), persistencia en **Cloud Firestore** con reglas de seguridad (`firestore.rules`) y modo de prueba con perfil de ejemplo.
- **Evaluación inicial y exámenes físicos periódicos**: Cuestionario biométrico inicial y tests objetivos (**Cooper 12 min**, **5K**, **Rockport 1,6 km** o **test continuo**) que calculan tu índice **VDOT** y tus **5 zonas de ritmo y pulso** (Karvonen + Tanaka).
- **Estrategias científicas de carrera**:
  - **Método CaCo progresivo** (bloques de 2 min corriendo / 6 min caminando y progresiones semanales) para adaptar tendones sin lesiones.
  - **Distribución polarizada 80/20** (80 % aeróbico suave, 20 % umbral/series) e **intervalos 30-30**.
- **Equivalencia multi-cardio**: Conversión y sustitución entre **Running**, **Ciclismo**, **Partido de fútbol**, **Caminata rápida** y **Natación/Elíptica** mediante **MET-minutos**, **TRIMP** y **Puntos Cardio**.
- **Seguimiento diario con Google Fit y Macros**: Registro de pasos diarios y recomendación orientativa en macronutrientes (gramos y `g/kg` de carbohidratos, proteínas, grasas e hidratación) según el desgaste de cada día.

## Desarrollo y compilación

```bash
npm install
npm run dev
```

Compilación de producción:

```bash
npm run build
```

Despliegue de reglas de Firestore:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
```
