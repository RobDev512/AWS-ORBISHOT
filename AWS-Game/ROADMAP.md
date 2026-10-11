# AWS ORBISHOT — Roadmap general

Este documento reúne el estado actual de **AWS ORBISHOT**, los parches de mantenimiento y la dirección de las próximas versiones. La prioridad es evolucionar el juego por capas sin romper lo que ya está aprobado: gameplay base, físicas, hitboxes, balance, HUD responsive y compatibilidad entre escritorio y móvil.

---

## Principios de evolución

- Cada actualización debe conservar una ruta estable para escritorio y móvil.
- Los parches técnicos pueden mejorar rendimiento, arquitectura, carga o mantenimiento sin alterar el diseño ni el gameplay visible.
- Los cambios visuales grandes deben poder degradarse con elegancia en equipos modestos.
- Los sistemas nuevos deben reutilizar la economía, vidas, Power-Ups, bosses y progresión ya existentes siempre que tenga sentido.
- Las versiones publicadas no se reescriben: los cambios posteriores se documentan como parches o nuevas versiones.

---

# Estado publicado

## v1.4.0 — Boss Update

**Estado:** publicado.

Base del sistema moderno de bosses de AWS ORBISHOT.

- Boss Levels integrados a la progresión.
- Capas/anillos de jefe con fases diferenciadas.
- Sistema de Boss Overload.
- Power Core y ventanas especiales durante enfrentamientos.
- Base para futuras familias de bosses y presentaciones propias.

## v1.4.1 — Audio Update / Soundtrack Patch

**Estado:** publicado.

- Música procedural dinámica para niveles normales y Boss Levels.
- SFX para impactos, Perfect Shots, Power-Ups, Power Core, Overload, Level Complete, bosses y transiciones.
- Control independiente de música y efectos.
- Identidad sonora ampliada sin reescribir el gameplay.

## v1.4.2 — Economy & Lives Update

**Estado:** publicado.

### Monedas
- Saldo persistente localmente.
- Recompensas por niveles, bosses, Perfect Shots y combos.
- Base económica preparada para mejoras, cosméticos y desbloqueables futuros.

### Vidas
- Cada run comienza con 3 vidas.
- Agotar Stability o alcanzar 100 % de Boss Overload consume un corazón.
- Reintento del nivel actual mientras queden vidas.
- Protección contra farming al restaurar el score al inicio del nivel.
- Capacidad máxima persistente y ampliable 3 → 4 → 5.
- HUD preparado para representar más de cinco vidas mediante `♥ ×N` en sistemas futuros.

### Tienda inicial
- Recuperar corazones para la run actual.
- Mejorar permanentemente la capacidad de vidas.
- Comprar cargas de Freeze, Shield, Double o Cleanup.

### Arco y disparo
- Arco visible como lanzador base.
- Carga visual opcional.
- Split Shot como recompensa de precisión.
- Refinamiento de SFX de flecha/arco.

## v1.4.3 — UI & Progression Polish

**Estado:** publicado.

- Estrellas redefinidas como indicador real de dificultad:
  - Fácil = ★☆☆
  - Medio = ★★☆
  - Difícil = ★★★
- Rango separado de dificultad.
- Cambio de dificultad en vivo con menos reinicios bruscos.
- Reestructuración responsive de escritorio, pantalla completa y móvil.
- HUD de bosses refinado.
- Sobrecarga adaptada a móvil, escritorio de media pantalla y HUD ancho/fullscreen.
- Mejoras de legibilidad para economía, vidas, progreso, Tienda, Ajustes y Power-Ups.
- Controles táctiles y áreas presionables ajustados para móvil.

---

# Mantenimiento posterior a v1.4.3

## v1.4.3.1 — Performance & Infrastructure Patch

**Estado:** planeado.

Parche exclusivamente técnico. No debe cambiar diseño, balance, físicas ni gameplay visible.

### Objetivos
- Reducir tirones y micro-stutter, especialmente en celular.
- Revisar el render loop y eliminar trabajo innecesario por frame.
- Reducir asignaciones temporales y cálculos redundantes.
- Revisar escalado de resolución, DPR y costo de dibujo en móviles.
- Mejorar carga, reutilización y caché de assets.
- Revisar listeners e input para evitar trabajo duplicado.
- Revisar audio y comportamiento cuando la pestaña pierde visibilidad.
- Evaluar cache de capas/elementos estáticos y calidad adaptativa cuando ayude.
- Añadir medición básica de rendimiento si resulta útil para validar mejoras.

### Restricciones
- Mantener intacto el aspecto aprobado de v1.4.3.
- Mantener hitboxes, físicas, puntuación y dificultad.
- Mantener la colisión base actual.
- No introducir diferencias perceptibles en timing o respuesta del juego.

---

# Próximas versiones 1.4.x

## v1.4.4 — Boss Presentation & FX Polish

**Estado:** próxima versión de contenido/pulido.

Objetivo: hacer que los bosses comuniquen mejor el daño recibido y tengan presentaciones más memorables sin rehacer sus mecánicas base.

- Grietas progresivas según el daño de cada capa.
- Cambios visuales conforme una capa se acerca a romperse.
- Caída física del anillo y/o fragmentos al destruirlo.
- Más impacto visual en transiciones de fase.
- Pulido de efectos de ruptura y derrota.
- Explorar entradas cinemáticas o mini-presentaciones propias para cada familia de boss.
- Mantener legibilidad y rendimiento razonable en móvil.

## v1.4.5 — Power-Up Loadout Expansion

**Estado:** planeado.

Objetivo: ampliar el sistema de Power-Ups sin convertirlo todavía en un árbol completo de progresión.

- Más variedad de Power-Ups o variantes de los existentes.
- Mayor profundidad en el loadout previo/durante la run.
- Mejor integración con Tienda y economía.
- Reglas claras de capacidad, disponibilidad y activación.
- Mantener el control principal simple y legible en móvil.
- Preparar el sistema para Challenge y Mastery.

---

# v1.5 — Challenge Update

**Estado:** planeado.

Primera expansión grande posterior a la línea 1.4.x.

Dirección prevista:

- Retos con reglas especiales.
- Modificadores de partida.
- Objetivos alternativos al simple avance de nivel.
- Recompensas ligadas a desempeño y dificultad.
- Reutilización de bosses, Power-Ups, economía y vidas bajo condiciones distintas.
- Base para modos con mayor rejugabilidad.

El alcance exacto se definirá después de cerrar los parches 1.4.x.

---

# v1.6 — Mastery & Weapon Progression

**Estado:** planeado / diseño reservado.

Objetivo: convertir la precisión y el dominio del jugador en progresión de largo plazo.

### Mastery
- Progresión vinculada al uso y desempeño.
- Metas de precisión, Perfect Shots, combos, bosses y desafíos.
- Desbloqueos que premien dominio sin volver obligatorio el grinding.

### Progresión de armas

El arco base puede evolucionar hacia variantes con identidad propia sin abandonar el control principal de una sola acción.

- **Arco largo:** precisión y recompensa por tiros limpios.
- **Arco compuesto:** carga estable y especialización en Split Shot.
- **Ballesta:** disparo pesado/controlado con identidad propia de recarga.
- **Arco pesado:** orientación a ruptura/daño contra objetivos resistentes.
- **Arco técnico:** ventanas de precisión y Perfect Shots.
- **Arco energético/experimental:** opción tardía o de contenido avanzado.

La economía creada en v1.4.2 debe servir como una de las bases para estos sistemas.

---

# v1.7 — Visual FX & Shader System (provisional)

**Estado:** idea reservada; numeración provisional.

Objetivo: añadir una capa visual opcional de mayor calidad sin obligar a todos los dispositivos a renderizarla.

### Sistema previsto
- Efectos activables/desactivables desde Configuración.
- Presets tentativos: **Desactivado / Bajo / Alto**.
- Ruta ligera para celular y equipos modestos.
- Fallback seguro si WebGL/WebGPU o ciertos efectos no están disponibles.
- Medición de rendimiento antes y después.

### Efectos candidatos
- Bloom/glow avanzado.
- Vignette y tratamiento de color sutil.
- Pulsos o distorsiones para Perfect Shots, Overload, bosses y Power Core.
- Materiales/shaders especiales para bosses o escenarios futuros.
- Postprocesado configurable.

### Regla principal
Los shaders y FX nunca deben cambiar hitboxes, física, timing ni legibilidad del gameplay. La experiencia base debe seguir funcionando completamente con todos los efectos desactivados.

---

# Roadmap mayor

Después de Challenge y Mastery, el proyecto puede seguir creciendo en varias líneas. El orden exacto puede cambiar según lo que resulte más divertido o útil durante el desarrollo.

## Modes
- Modos alternativos de juego.
- Reglas especiales y runs con identidad propia.
- Posible reutilización de Challenge como base técnica.

## Visual / Cosmetics
- Skins, estilos de arco/flecha y personalización visual.
- Recompensas que no alteren balance.
- Integración con economía cuando tenga sentido.

## Events
- Eventos temporales o rotativos.
- Retos y recompensas especiales.
- Variantes de reglas, bosses o temas visuales.

## Campaign
- Progresión estructurada por mapa o capítulos.
- Uso más profundo del sistema de vidas y capacidad máxima.
- Desbloqueos progresivos de sistemas, armas y contenido.
- Posible narrativa ligera/contextual alrededor de servicios y entornos de AWS ORBISHOT.

---

# Backlog técnico permanente

Estos puntos pueden entrar como parches cuando sean necesarios y no requieren una actualización visual grande:

- Rendimiento móvil.
- Reducción de stutter.
- Gestión de memoria y assets.
- Carga/caché de módulos y recursos.
- Compatibilidad entre navegadores.
- Escalado responsive y DPR.
- Accesibilidad y opciones de calidad cuando sean necesarias.
- Métricas internas de rendimiento para pruebas locales.

---

# Política de versiones

- **vX.Y.Z**: versión funcional o de contenido/pulido claramente identificable.
- **vX.Y.Z.1**: parche técnico o de infraestructura que conserva comportamiento y diseño de la versión base.
- Hotfixes de publicación/caché pueden aplicarse sin cambiar `APP_VERSION` cuando no representan una nueva experiencia jugable.

El objetivo es que cada versión importante quede cerrada, etiquetada y reproducible antes de comenzar la siguiente.
