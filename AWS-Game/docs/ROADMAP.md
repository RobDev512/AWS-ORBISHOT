# AWS ORBISHOT — Roadmap general

Este documento define el estado actual y la dirección planeada de **AWS ORBISHOT**. Las versiones publicadas permanecen congeladas mediante tags; las versiones futuras pueden ajustar su alcance o numeración si el desarrollo lo requiere.

La prioridad general es evolucionar el juego sin romper sus pilares aprobados: control simple, precisión, rendimiento razonable en móvil, hitboxes consistentes, progresión clara y compatibilidad entre escritorio y touch.

---

# Principios de evolución

- Las versiones publicadas no se reescriben.
- Los cambios posteriores a una release se documentan como parche o versión nueva.
- Los sistemas nuevos deben reutilizar economía, vidas, Power-Ups, bosses y progresión cuando tenga sentido.
- La experiencia base debe seguir siendo jugable en equipos modestos.
- Los efectos visuales nunca deben modificar de forma oculta hitboxes, física o timing.
- Cada versión importante debe cerrar con pruebas en escritorio y móvil antes de etiquetarse.

---

# Estado publicado

## v1.0.0 — Workshop Build
**Estado:** publicado.

Versión original del arcade creada durante el workshop.

## v1.1.0 — Progression Update
**Estado:** publicado.

High Score, preferencias persistentes, Perfect Shots, feedback, estadísticas y mejoras generales.

## v1.2.0 — Level Update
**Estado:** publicado.

Sistema formal de niveles, objetivos crecientes, Level Complete, bonus y progresión de dificultad.

## v1.2.1 — HUD Fix
**Estado:** publicado.

Corrección de jerarquía y espaciado del HUD superior.

## v1.3.0 — Power-Ups Update
**Estado:** publicado.

Freeze, Shield, Double Score y Cleanup.

## v1.3.1 — Interactive Power-Ups Patch
**Estado:** publicado.

Power-Up Dock interactivo, activación manual y primera versión de Power Charge.

## v1.3.2 — Power Core Update
**Estado:** publicado.

Power Charge + Power Core convierten la adquisición de Power-Ups en una recompensa basada en timing.

## v1.4.0 — Boss Update
**Estado:** publicado.

Rebranding oficial a AWS ORBISHOT, Boss Levels, Armor/Exposed/Core, Overload, rankings y nuevas familias visuales.

## v1.4.1 — Audio Update
**Estado:** publicado.

Música procedural para niveles y bosses, SFX ampliados y controles de audio independientes.

## v1.4.2 — Economy & Lives Update
**Estado:** publicado.

Monedas persistentes, vidas por run, tienda, mejoras de capacidad, arco visible y Split Shot.

## v1.4.3 — UI & Progression Polish
**Estado:** publicado.

Refinamiento responsive, jerarquía de dificultad/progreso, HUD de bosses y controles móviles.

## v1.4.3.1 — Performance & Infrastructure Patch
**Estado:** publicado.

Optimización técnica, normalización con `deltaTime`, monitor FPS/performance y Modo desarrollador.

## v1.4.3.2 — Structure & Boss HUD Hotfix
**Estado:** publicado y congelado.

- Hotfix del HUD durante `JEFE DERROTADO`.
- JavaScript organizado bajo `src/`.
- CSS separado por responsabilidad.
- Documentación consolidada en `docs/`.
- Specs históricos archivados.
- Base preparada para continuar con v1.4.4.

Tag estable: `aws-game-v1.4.3.2`.

---

# Línea v1.4.x — Pulido y expansión de la base actual

## v1.4.4 — Boss Presentation & Life Flow Polish
**Estado:** próxima versión.

**Objetivo:** hacer que los momentos de mayor tensión —entrada de boss, daño, derrota y pérdida de vidas— tengan una presentación dinámica y coherente, sin rehacer las mecánicas principales.

### Presentación de bosses
- Cinemática o animación breve de entrada antes de iniciar cada Boss Level.
- Presentación adaptable a móvil para no bloquear demasiado tiempo al jugador.
- Identidad visual distinta según la familia del boss.
- Transición clara entre gameplay normal y encuentro de boss.

### Daño progresivo
- Grietas, desgaste, pulsos o señales de daño conforme una capa pierde integridad.
- Mayor intensidad visual cuando Armor/Exposed/Core están cerca de romperse.
- Rupturas de fase más dinámicas.
- Fragmentos, anillos y debris con mejor continuidad visual.

### Derrota del boss
- Animación/cinemática de muerte o colapso del boss.
- Secuencia breve entre el impacto final y la tarjeta `JEFE DERROTADO`.
- Desintegración, ruptura, implosión, caída o comportamiento equivalente según familia.
- Mantener ranking y recompensa actual sin hacer esperar demasiado al jugador.

### Geometría fiel por familia
Las familias visuales deben respetar su silueta en todas las capas importantes.

- Firewall / círculo: núcleo y capas circulares.
- Triad / triángulo: núcleo y capas coherentes con el triángulo.
- Dynamo / cuadrado: geometría cuadrada.
- Prism / estrella: núcleo y capas basadas en estrella.
- Pentacore / pentágono: geometría pentagonal.
- Core Nexus / hexágono: geometría hexagonal.

La forma visual no debe endurecer accidentalmente la hitbox física si no se decide explícitamente cambiar balance.

### Pérdida de vida
- Reemplazar el aviso seco actual por una transición clara de daño/derrota.
- Animación del corazón perdido.
- Feedback visual y sonoro antes de reiniciar el nivel.
- Diferenciar perder una vida de un Game Over definitivo.
- Mantener un ritmo rápido para que la animación no se vuelva molesta tras varias derrotas.

### Compra de emergencia
Si el jugador pierde su última vida y tiene suficientes monedas:

- mostrar una decisión antes del Game Over definitivo;
- texto base sugerido: **“¿Deseas comprar una vida y continuar?”**;
- mostrar claramente el costo;
- opciones **Comprar vida** / **Terminar partida**;
- si compra, descontar monedas y reanudar desde el nivel actual usando la lógica de continuación existente;
- evitar duplicar recompensas o permitir farming mediante el reintento.

El costo exacto se definirá durante implementación y pruebas de balance.

---

## v1.4.5 — Power-Up Loadout Expansion
**Estado:** planeado.

**Objetivo:** ampliar la profundidad táctica de los Power-Ups sin convertir todavía el juego en un sistema de builds complejo.

- Nuevos Power-Ups o variantes de los existentes.
- Mejor selección/loadout para una run.
- Integración más profunda con tienda y economía.
- Revisión de capacidad y disponibilidad.
- Nuevas sinergias manteniendo controles simples.
- Preparación de hooks para Challenge y Mastery.

---

## v1.4.6 — PWA & Platform Experience
**Estado:** planeado.

**Objetivo:** convertir AWS ORBISHOT en una aplicación web instalable sin mantener dos bases de código distintas.

### Instalación
- `manifest.webmanifest`.
- Iconos propios para instalación.
- `display: standalone`.
- Nombre, colores y splash coherentes con AWS ORBISHOT.
- Instalación desde navegador compatible en PC y móvil.

### Experiencia de aplicación
- Apertura en ventana propia en escritorio.
- Acceso desde pantalla de inicio/app launcher en móvil.
- Detectar cuando el juego ya corre en modo standalone.
- Botón o ayuda contextual para instalar cuando el navegador lo permita.

### Offline y caché
- Service Worker controlado.
- Cachear shell y recursos esenciales.
- Permitir arranque offline después de una primera carga válida cuando sea razonable.
- Estrategia explícita para invalidar cachés entre releases.
- Evitar que un Service Worker viejo bloquee módulos nuevos.

### Actualizaciones
- Detección de nueva versión.
- Aviso no intrusivo de actualización disponible.
- Flujo claro para recargar y activar una nueva versión.
- Mantener compatibilidad con GitHub Pages.

---

# v1.5 — Challenge Update
**Estado:** planeado.

Primera expansión importante posterior a la línea 1.4.x.

- Retos con reglas especiales.
- Modificadores de partida.
- Objetivos alternativos al avance normal.
- Recompensas ligadas a dificultad y desempeño.
- Desafíos de precisión, combo, tiempo, Power-Ups y bosses.
- Reutilización de economía y vidas bajo reglas distintas.
- Base para runs con mayor rejugabilidad.

---

# v1.6 — Mastery & Weapon Progression
**Estado:** planeado.

**Objetivo:** convertir precisión y dominio mecánico en progresión de largo plazo.

### Mastery
- Experiencia/progreso por desempeño.
- Metas de Perfect Shots, combos, bosses y Challenges.
- Hitos y desbloqueos.
- Evitar que el sistema obligue a grind excesivo.

### Familias de armas
- Arco largo: precisión y recompensa por tiros limpios.
- Arco compuesto: carga estable y afinidad con Split Shot.
- Ballesta: tiro pesado/controlado con identidad propia.
- Arco pesado: especialización contra objetivos resistentes.
- Arco técnico: ventanas de precisión y Perfect Shots.
- Arco energético/experimental: contenido avanzado.

La economía de v1.4.2 puede servir como una de las bases para desbloqueos, siempre que no convierta progresión en simple compra.

---

# v1.7 — Visual FX & Shader System
**Estado:** planeado / sujeto a pruebas de rendimiento.

**Objetivo:** añadir una capa visual opcional de mayor calidad.

- Presets de calidad: Desactivado / Bajo / Alto.
- Ruta ligera para móviles/equipos modestos.
- Bloom y glow avanzado.
- Vignette y color grading sutil.
- Distorsiones/pulsos para Perfect Shots, Power Core, Overload y bosses.
- Materiales o shaders especiales para bosses.
- Postprocesado configurable.
- Fallback si una técnica gráfica no está disponible.

**Regla:** los FX nunca cambian hitboxes, física, timing ni legibilidad del gameplay.

---

# v1.8 — Cosmetics & Customization
**Estado:** planeado.

**Objetivo:** crear progresión visual sin introducir ventaja competitiva.

- Skins para arco y flecha.
- Variantes visuales del launcher.
- Trails y efectos cosméticos.
- Temas de UI.
- Recompensas cosméticas por Challenge/Mastery.
- Integración opcional con economía.
- Preservar claridad visual de proyectiles y objetivos.

---

# v1.9 — Modes & Events Foundation
**Estado:** planeado.

**Objetivo:** construir infraestructura para contenido rotativo y modos alternativos.

### Modes
- Reglas de run diferentes.
- Modos centrados en precisión, supervivencia, bosses o velocidad.
- Variantes reutilizando sistemas ya existentes.

### Events
- Retos temporales o rotativos.
- Recompensas especiales.
- Modificadores temáticos.
- Variantes de bosses o condiciones especiales.
- Evitar dependencia obligatoria de servicios online mientras el juego siga siendo principalmente cliente/local.

Esta versión debe preparar la infraestructura que v2.0 pueda reutilizar.

---

# v2.0 — Campaign Update / Major Expansion
**Estado:** visión de largo plazo.

**Objetivo:** convertir los sistemas acumulados en una experiencia estructurada de mayor escala.

### Campaña
- Mapa o capítulos.
- Progresión secuencial.
- Encuentros de boss con contexto propio.
- Desbloqueo gradual de sistemas.
- Dificultad/progresión diseñada por tramos.
- Uso más profundo de vidas, economía, Power-Ups y armas.
- Eventos o desafíos integrados al avance.
- Narrativa ligera/contextual alrededor del universo de AWS ORBISHOT.

### Integración de sistemas
La campaña podrá reutilizar:

- Boss Presentation de v1.4.4.
- Loadouts de v1.4.5.
- instalación/PWA de v1.4.6.
- Challenges de v1.5.
- Mastery y armas de v1.6.
- FX de v1.7.
- Cosmetics de v1.8.
- infraestructura de Modes/Events de v1.9.

v2.0 no debe comenzar hasta que esos sistemas tengan una base suficientemente estable.

---

# Portal y presencia web

El portal principal del repositorio no necesita incrementar `APP_VERSION` del juego para recibir mejoras.

Objetivos permanentes:

- mostrar la versión estable real;
- enlazar juego, roadmap, código y documentación;
- anunciar la siguiente versión;
- explicar las líneas futuras sin saturar la interfaz;
- incorporar acceso de instalación cuando llegue v1.4.6;
- mantener una presentación responsive coherente con AWS ORBISHOT.

---

# Backlog técnico permanente

Puede resolverse mediante parches cuando sea necesario:

- rendimiento móvil;
- stutter y estabilidad de frame pacing;
- memoria y ciclo de vida de assets;
- carga/caché de módulos;
- compatibilidad de navegadores;
- responsive, DPR y safe areas;
- accesibilidad;
- input mouse/teclado/touch;
- métricas internas para pruebas;
- pruebas de instalación/offline después de v1.4.6.

---

# Política de versiones

- **vX.Y.Z**: versión funcional o de contenido/pulido identificable.
- **vX.Y.Z.1**: parche técnico o de infraestructura posterior a una versión base.
- Un cambio exclusivamente de portal/documentación puede publicarse en `main` sin cambiar `APP_VERSION`.
- Los tags de releases publicadas son inmutables.
- Cada nueva versión del juego debe salir desde una rama propia y cerrar con pruebas antes de merge/tag.

El objetivo es que cada release importante quede reproducible, documentada y congelada antes de iniciar la siguiente.
