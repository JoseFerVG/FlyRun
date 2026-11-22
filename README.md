# FlyRun SaaS — Entrenador de Running y Cardio con Coach Lince Ibérico

FlyRun es una aplicación web SaaS (optimizada para móvil y escritorio) diseñada como entrenador personal científico de running y condición cardiovascular, protagonizada por **Coach Lince** (Lince Ibérico generado con Google Gemini).

## Características Principales

- **Autenticación con Google y Persistencia Firebase**: Inicio de sesión con Google (`Firebase Auth` + scope de actividad de Google Fit), sincronización en Cloud Firestore con reglas de seguridad estrictas (`firestore.rules`) y modo de acceso demo instantáneo.
- **Evaluación Inicial y Exámenes Físicos Periódicos**: Cuestionario biométrico inicial y **Día de Examen Físico** (Test de Cooper 12 min, Contrarreloj 5K, Test Rockport 1.6 km y Test Continuo Base) que recalculan tu **VDOT** (Jack Daniels) y tus **5 Zonas Fisiológicas** de ritmo y pulso (Karvonen + Tanaka).
- **Estrategias Científicas de Entrenamiento**:
  - **Método CaCo Progresivo** (ej. *2 min correr / 6 min andar*, *3'/5'*, *4'/4'*) para proteger tendones y construir base sin lesiones.
  - **Modelo Polarizado 80/20** (Dr. Stephen Seiler) y **Intervalos Billat 30-30** ($v\text{VO}_2\text{max}$).
- **Equivalencia Multi-Cardio (Puntos Cardio)**: Sustituye o combina running con **Ciclismo**, **Partido de Fútbol**, **Caminata Activa** o **Natación/Elíptica** igualando carga mediante **MET-minutos** y **TRIMP**.
- **Conexión con Google Fit**: Sincroniza pasos diarios, distancia andada y calorías activas para ajustar tu gasto diario y recuperación.
- **Gamificación (10 Niveles + Insignias)**: Sube desde *Nivel 1: Cachorro de Doñana* hasta *Nivel 10: Espíritu Indomable* ganando XP por constancia, progresión de VDOT y exámenes superados.
- **Recomendación Nutricional Macro**: Guía práctica diaria en gramos y `g/kg` de carbohidratos, proteínas, grasas e hidratación (Mifflin-St Jeor + carga del entrenamiento + pasos de Google Fit).
- **Pantalla de Carga Científica**: Píldoras verificadas de fisiología del running y cardio mientras calibra tu plan.

## Puesta en Marcha

```bash
npm install
npm run dev
```

Para compilar para producción:

```bash
npm run build
```

Para desplegar las reglas de Cloud Firestore:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
```
