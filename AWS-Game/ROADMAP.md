# AWS ORBISHOT — Roadmap general v1.0 → v2.0

Este documento reúne la evolución histórica, el estado actual y la dirección futura de **AWS ORBISHOT** desde la primera versión del workshop hasta la visión de una futura **v2.0**.

El objetivo del roadmap es que cada versión tenga una función clara, que las versiones ya publicadas permanezcan como referencia histórica y que las ideas futuras puedan cambiar de orden o alcance sin confundirse con contenido ya terminado.

---

# Principios del proyecto

- Conservar el gameplay base, la respuesta del disparo y la claridad visual como núcleo del juego.
- Evolucionar por capas: primero estabilidad, luego profundidad, después contenido mayor.
- Mantener compatibilidad real entre escritorio, pantalla completa y móvil.
- Evitar que nuevas funciones obliguen a rehacer sistemas ya estables si pueden reutilizarse.
- Los cambios visuales avanzados deben poder degradarse o desactivarse en equipos modestos.
- Las mejoras técnicas pueden publicarse como parches sin alterar diseño, balance o comportamiento jugable.
- Las versiones publicadas no se reescriben: cualquier corrección posterior se documenta como parche/hotfix o versión nueva.
- Mantener como referencia la colisión base actual de flechas, sin endurecerla accidentalmente durante trabajos visuales o técnicos.

---

# ERA I — Fundación del juego

## v1.0.0 — Workshop Build

**Estado:** publicada.

Primera versión funcional nacida durante el workshop.

### Base establecida
- Juego principal de disparo y anclaje de flechas.
- Disco central rotatorio.
- Puntaje.
- Récord de sesión.
- Game Over y Play Again.
- Selección de dificultad.
- Combo.
- Efectos visuales iniciales.

### Importancia histórica
Esta versión define el loop principal que sigue siendo el corazón de AWS ORBISHOT: **apuntar, disparar, anclar, evitar colisiones y sobrevivir mientras aumenta la dificultad**.

---

## v1.1.0 — Progression Update

**Estado:** publicada.

Primera expansión de progresión y persistencia.

### Sistemas añadidos
- Récord máximo persistente mediante `localStorage`.
- Preferencias persistentes de dificultad, sonido, combo y efectos visuales.
- Sistema **Perfect Shot** sin endurecer la hitbox base.
- Feedback visual de puntos, Perfect Shot, anillos de impacto y Tier.
- Estadísticas locales:
  - partidas,
  - precisión,
  - Perfect Shots,
  - mejor combo.
- SFX específicos para Perfect Shot y subida de Tier.
- Versión visible en HUD y Configuración.

### Dirección abierta
La partida deja de ser una experiencia completamente aislada y empieza a registrar progreso y desempeño entre sesiones.

---

## v1.2.0 — Level Update

**Estado:** publicada.

Introduce estructura de avance dentro de cada run.

### Sistemas añadidos
- Sistema de niveles con objetivos crecientes de flechas acertadas.
- Transición **LEVEL COMPLETE**.
- Bonus de puntuación al completar nivel.
- Confetti y feedback de cierre.
- Cada nivel comienza con el disco limpio.
- Score, récord y estadísticas se conservan durante la run.
- Progreso visible `flechas / objetivo`.
- Incremento gradual de dificultad por nivel además de la progresión por score.
- Paletas visuales rotativas por nivel.
- Alternancia del sentido inicial del disco.
- Game Over muestra el nivel alcanzado.
- Estadísticas persistentes de mejor nivel y niveles completados.
- SFX propio de Level Complete.

### Importancia histórica
Los niveles convierten el loop infinito original en una progresión estructurada y crean la base necesaria para bosses, retos y campaña futura.

---

## v1.2.1 — HUD Fix

**Estado:** publicada.

Parche de presentación y estabilidad visual.

### Correcciones
- Solapamiento entre estrellas de Tier y progreso de nivel.
- Espaciado vertical del HUD superior.
- Ajuste de la barra de progreso.
- Eliminación de referencias a fuentes inexistentes que producían errores 404.
- Eliminación de solicitudes innecesarias de favicon inexistente.

### Restricción
Sin cambios de gameplay, dificultad o hitboxes.

---

# ERA II — Power-Ups y decisiones tácticas

## v1.3.0 — Power-Ups Update

**Estado:** publicada.

Primera expansión táctica importante.

### Power-Ups iniciales
- **Freeze:** detiene temporalmente la rotación.
- **Shield:** absorbe una colisión y evita el Game Over correspondiente.
- **Double Score:** duplica la puntuación de varios aciertos posteriores.
- **Cleanup:** elimina una flecha anclada para recuperar espacio útil.

### Sistemas añadidos
- Power-Up Arrows desde Level 2.
- Reglas de aparición y utilidad para evitar recompensas inútiles.
- HUD de efectos activos.
- Feedback visual y SFX propios.
- Estadísticas persistentes de Power-Ups y Shield Saves.
- Compatibilidad con datos guardados anteriores.
- Temporizadores pausados durante transiciones de nivel.

---

## v1.3.1 — Interactive Power-Ups Patch

**Estado:** publicada.

Transforma los Power-Ups de recompensas automáticas a herramientas tácticas almacenables.

### Power-Up Dock
- Cuatro slots interactivos: Freeze, Shield, Double y Cleanup.
- Activación mediante clic/tap o teclas `1–4`.
- Inventario por tipo.
- Visualización de cantidad, disponibilidad y estado activo.

### Power Charge
- Aciertos, Perfect Shots, combos y Level Complete cargan un medidor adicional.
- Recompensas pueden convertirse parcialmente en Power Charge si el inventario está lleno.
- Inventario, carga y efectos se conservan entre niveles de una misma run.

### UX
- Mejor hover/presión.
- Nueva zona de notificaciones para evitar solapamientos.
- Combo convertido en indicador compacto independiente.

---

## v1.3.2 — Power Core Update

**Estado:** publicada.

Cambia por completo la adquisición de Power-Ups hacia una mecánica basada en habilidad.

### Power Core
- Power Charge genera un **Power Core** orbitante al alcanzar 100 %.
- El Core rota dinámicamente entre Freeze, Shield, Double y Cleanup.
- Para capturarlo, una flecha debe atravesarlo y después anclarse correctamente.
- Si la flecha atraviesa el Core y termina en colisión, no se concede la recompensa.
- Solo aparecen tipos con capacidad disponible.
- Si todo el inventario está lleno, la carga permanece lista hasta liberar espacio.
- Puede prepararse la siguiente carga mientras existe un Core activo.
- Efectos y Core se pausan durante `levelcomplete` y continúan al siguiente nivel.

### Importancia histórica
Power Core convierte las recompensas en una acción jugable y prepara la interacción especial que más adelante utilizan los Boss Levels.

---

# ERA III — Expansión del sistema central

## v1.4.0 — Boss Update

**Estado:** publicada.

Primera gran expansión de contenido y el rebranding moderno a **AWS ORBISHOT**.

### Identidad
- Rebranding oficial a AWS ORBISHOT.
- Logo integrado en HUD, favicon y landing pública.

### Boss Levels
- Cada quinto nivel se convierte en Boss Level.
- Bosses construidos mediante capas destructibles:
  - Armor,
  - Exposed,
  - Core.
- Seis familias visuales iniciales:
  - Firewall,
  - Triad,
  - Dynamo,
  - Prism,
  - Pentacore,
  - Core Nexus.
- Piezas orbitantes y rotación propia.
- Transiciones de fase con shake, flash, desprendimiento de flechas y escombros.
- Power Core funciona como pickup shot especial durante bosses.

### Boss Overload
- Condición de derrota propia de los enfrentamientos contra jefes.
- Los errores y tiros bloqueados cargan Overload.
- Los aciertos lo reducen.
- Completar una fase descarga una cantidad adicional.
- Shield puede evitar carga de Overload en determinadas colisiones.

### Ranking
- Rango `S/A/B/C/D` según precisión, tiempo y Perfect Shots.
- Bonus de score ligado al boss y al ranking.
- Estadísticas persistentes de bosses derrotados y mejor ranking.

### Responsive y base técnica
- Canvas HiDPI manteniendo coordenadas lógicas 600×700.
- Input adaptado al backing store de alta resolución.
- Mejor soporte móvil mediante VisualViewport.
- Power-Up Dock circular táctil y panel Power/Core compacto.
- Introducción de Stability en niveles normales como sistema de tolerancia a errores.

---

## v1.4.1 — Audio Update / Soundtrack Patch

**Estado:** publicada.

Expande la identidad sonora sin modificar el gameplay central.

### Música
- Música procedural dinámica para niveles normales.
- Música propia para Boss Levels.
- Transición automática de música al entrar/salir del combate.
- Opción persistente de música independiente de SFX.

### SFX
- Disparos.
- Impactos.
- Perfect Shots.
- Power-Ups.
- Power Core.
- Overload.
- Level Complete.
- Ruptura de capas y fases de bosses.
- Refinamiento de flecha, impacto y tensión del arco.

### Mezcla
- Controles separados para música y efectos.
- Ajustes de ganancia y claridad de transitorios.

---

## v1.4.2 — Economy & Lives Update

**Estado:** publicada.

Crea la primera economía persistente reutilizable por futuras expansiones.

### Monedas
- Saldo persistente localmente.
- Recompensas por niveles normales.
- Bonus moderados por Perfect Shots y combos.
- Recompensas mayores por bosses y ranking.

### Vidas
- Cada run comienza con 3 vidas.
- Stability agotada o Boss Overload al 100 % consume un corazón.
- Si quedan vidas, el nivel actual se reinicia.
- El score vuelve al valor con el que inició ese nivel para evitar farming.
- Capacidad máxima persistente.
- Mejora inicial `3 → 4 → 5` vidas.
- HUD preparado para cantidades mayores mediante `♥ ×N`.

### Tienda
- Recuperar corazones durante la run.
- Mejorar capacidad de vidas.
- Comprar Freeze, Shield, Double y Cleanup.
- Mejorar capacidad de almacenamiento de Power-Ups.

### Arco y disparo
- Arco visible como lanzador base.
- Animación de tensión.
- **Split Shot** mediante disparo cargado y preciso.
- Split Shot no sustituye Double Score ni se usa contra bosses.

### Base futura
Economía, vidas y tienda quedan diseñadas como sistemas reutilizables para Mastery, armas, cosméticos y campaña.

---

## v1.4.3 — UI & Progression Polish

**Estado:** publicada.

Versión centrada en presentación, responsive y legibilidad sin alterar el corazón del gameplay.

### Dificultad y progresión
- Estrellas redefinidas para representar dificultad real:
  - Fácil = `★☆☆`,
  - Medio = `★★☆`,
  - Difícil = `★★★`.
- Rango separado de dificultad.
- Cambiar dificultad desde Configuración puede aplicarse sin reiniciar abruptamente toda la run.

### Responsive
- Reestructuración para escritorio angosto.
- Mejor aprovechamiento de pantalla completa.
- Pase completo de legibilidad móvil.

### HUD móvil
- Barra superior más compacta.
- Monedas y vidas ampliadas.
- Progreso y estrellas reposicionados.
- Tienda/Ajustes más grandes y con áreas táctiles alineadas.
- Power-Up Dock táctil ampliado.
- Contadores con fondo sólido.
- Instrucciones del panel inferior más legibles.
- Limpieza del HUD de bosses.
- Sobrecarga adaptada verticalmente en layouts compactos.

### Restricciones
- Sin cambios de física, economía o balance principal.
- La colisión base permanece intacta.

---

# MANTENIMIENTO POSTERIOR A v1.4.3

## v1.4.3.1 — Performance & Infrastructure Patch

**Estado:** planeado.

Parche técnico orientado principalmente a rendimiento móvil y limpieza interna.

### Objetivos
- Reducir tirones y micro-stutter.
- Revisar el render loop.
- Evitar cálculos y asignaciones innecesarias por frame.
- Optimizar resolución/DPR en móviles.
- Mejorar carga y reutilización de assets.
- Revisar listeners e input redundante.
- Revisar audio y comportamiento al perder visibilidad la pestaña.
- Explorar cache de elementos estáticos.
- Añadir medición básica de rendimiento cuando ayude a validar mejoras.
- Preparar una base más limpia para futuras capas visuales avanzadas.

### Restricciones
- No cambiar diseño aprobado.
- No cambiar balance.
- No cambiar físicas ni hitboxes.
- No alterar timing perceptible del gameplay.

---

# ERA IV — Cierre de la línea 1.4.x

## v1.4.4 — Boss Presentation & FX Polish

**Estado:** próxima versión de contenido/pulido.

Objetivo: hacer que el daño de los bosses sea más visible y que las transiciones de fase tengan mayor impacto.

### Dirección
- Grietas progresivas según daño por capa.
- Cambios visuales conforme una capa se aproxima a romperse.
- Fragmentación más clara al destruir Armor/Exposed/Core.
- Caída física de anillos y fragmentos.
- Mejor feedback de ruptura y derrota.
- Transiciones de fase más teatrales.
- Explorar mini-presentaciones/entradas propias por familia de boss.
- Mantener una versión eficiente para móvil.

---

## v1.4.5 — Power-Up Loadout Expansion

**Estado:** planeado.

Objetivo: aumentar variedad táctica sin convertir todavía Power-Ups en un árbol completo de progresión.

### Dirección
- Nuevos Power-Ups o variantes.
- Mayor profundidad en selección/loadout.
- Mejor integración con tienda y economía.
- Reglas de capacidad y activación más ricas.
- Sin perder simplicidad en móvil.
- Preparación para Challenge y Mastery.

---

# ERA V — Rejugabilidad y dominio

## v1.5 — Challenge Update

**Estado:** planeado.

Primera expansión grande posterior a 1.4.x.

### Objetivos
- Retos con reglas especiales.
- Modificadores de run.
- Objetivos distintos al avance tradicional por nivel.
- Condiciones especiales de puntuación.
- Recompensas ligadas a desempeño y dificultad.
- Reutilización de bosses, vidas, Power-Ups y economía bajo reglas distintas.
- Base para modos de juego posteriores.

### Ejemplos de dirección
- Runs con Stability reducida.
- Boss rush parcial.
- Restricciones de Power-Ups.
- Objetivos de precisión/perfect shots.
- Modificadores rotativos.

El contenido exacto debe diseñarse después de cerrar 1.4.x.

---

## v1.6 — Mastery & Weapon Progression

**Estado:** planeado / diseño reservado.

Objetivo: convertir habilidad, precisión y tiempo de juego en progresión de largo plazo.

### Mastery
- Progresión por desempeño.
- Metas de precisión.
- Perfect Shots.
- Combos.
- Bosses.
- Challenges.
- Desbloqueos por dominio en lugar de puro grinding.

### Armas/variantes
El arco base puede evolucionar hacia estilos con identidad propia sin abandonar el control principal de una sola acción.

- **Arco largo:** precisión y recompensa por tiros limpios.
- **Arco compuesto:** carga estable y mejor especialización en Split Shot.
- **Ballesta:** sensación pesada, disparo controlado y recarga propia.
- **Arco pesado:** enfoque en ruptura/objetivos resistentes.
- **Arco técnico:** especialización en ventanas de precisión y Perfect Shots.
- **Arco energético/experimental:** opción tardía o de contenido avanzado.

### Integración
- Economía como base de desbloqueos/mejoras.
- Challenges como fuente de objetivos de Mastery.
- Campaña futura capaz de desbloquear armas de forma progresiva.

---

# ERA VI — Presentación avanzada y variedad

## v1.7 — Visual FX & Shader System

**Estado:** idea reservada / numeración provisional.

Objetivo: permitir una presentación visual más avanzada sin sacrificar rendimiento ni compatibilidad.

### Sistema de calidad
- Efectos activables/desactivables desde Configuración.
- Presets tentativos:
  - **Desactivado**,
  - **Bajo**,
  - **Alto**.
- Ruta ligera para móvil y equipos modestos.
- Fallback seguro cuando WebGL/WebGPU o determinados efectos no estén disponibles.

### Efectos candidatos
- Bloom/glow avanzado.
- Vignette.
- Tratamiento de color.
- Distorsiones en Perfect Shots.
- Pulsos de Overload.
- Efectos especiales de Power Core.
- Materiales/shaders propios para bosses.
- Postprocesado de escenarios futuros.

### Regla principal
Los FX avanzados nunca deben cambiar hitboxes, física, timing o legibilidad del gameplay. El juego debe seguir funcionando completamente con todos los efectos desactivados.

---

## v1.8 — Modes & Cosmetics Update

**Estado:** visión futura / alcance abierto.

Objetivo: ampliar rejugabilidad y personalización sobre sistemas ya maduros.

### Modes
- Modos alternativos.
- Reglas propias por run.
- Variaciones derivadas de Challenge.
- Posible Boss Rush completo.
- Endless/Survival avanzado.
- Modos con restricciones o mutadores propios.

### Cosmetics
- Skins de arco.
- Estilos de flecha.
- Trails.
- Efectos cosméticos de impacto.
- Temas/HUD cosmético cuando no reduzca legibilidad.
- Recompensas no competitivas ligadas a economía, Challenge o Mastery.

### Regla
Los cosméticos no deben convertirse en mejoras de poder ocultas.

---

## v1.9 — Events & Campaign Foundation

**Estado:** visión futura / numeración provisional.

Objetivo: preparar la transición del juego por runs hacia una experiencia más estructurada antes de v2.0.

### Events
- Eventos temporales o rotativos.
- Challenges especiales.
- Recompensas limitadas/cosméticas.
- Variantes visuales de bosses o escenarios.
- Reglas temáticas.

### Campaign Foundation
- Sistema de mapa o capítulos base.
- Nodos/etapas desbloqueables.
- Integración más profunda de vidas.
- Recompensas persistentes.
- Progresión de Mastery/armas integrada al avance.
- Preparación de guardado para progreso de campaña.
- Herramientas internas para añadir contenido sin duplicar lógica.

### Propósito
v1.9 actuaría como puente técnico y de diseño hacia la versión 2.0, reduciendo el riesgo de intentar introducir toda la campaña de golpe.

---

# ERA VII — Gran expansión

## v2.0 — Campaign & Long-Term Progression

**Estado:** visión mayor futura; alcance sujeto a evolución del proyecto.

v2.0 representa la meta de convertir AWS ORBISHOT en una experiencia más completa que una sucesión de runs, reutilizando todos los sistemas construidos desde v1.0.

### Campaña
- Mapa o estructura por capítulos.
- Progresión de etapas.
- Bosses como hitos principales.
- Variantes de niveles y objetivos.
- Curva de dificultad más controlada por región/capítulo.
- Posible narrativa ligera/contextual.

### Progresión de largo plazo
- Mastery persistente.
- Arsenal/variantes de armas.
- Loadouts.
- Economía expandida.
- Cosméticos.
- Desbloqueos por logros, challenges y campaña.

### Bosses
- Familias de boss ampliadas.
- Presentaciones propias.
- Mecánicas particulares por capítulo.
- Mejor integración de efectos visuales avanzados cuando estén habilitados.

### Calidad y rendimiento
- Presets visuales.
- FX/shaders opcionales.
- Rendimiento móvil como requisito de publicación.
- Fallback completo sin postprocesado.

### Filosofía v2.0
La campaña no debe reemplazar el juego arcade; debe **envolverlo**. El loop rápido de AWS ORBISHOT debe seguir disponible como modo directo, mientras la campaña aporta objetivos, progresión y contexto.

---

# Backlog técnico permanente

Estos trabajos pueden entrar en parches intermedios sin requerir una actualización visual grande:

- Rendimiento móvil.
- Reducción de stutter.
- Gestión de memoria.
- Cache/reutilización de assets.
- Carga de módulos.
- Compatibilidad entre navegadores.
- Escalado responsive.
- DPR y resolución adaptativa.
- Accesibilidad.
- Opciones de calidad.
- Métricas locales de rendimiento.
- Reducción de trabajo por frame.
- Refactors internos que no cambien el gameplay.

---

# Política de versiones

## Versiones de contenido
`vX.Y.Z`

Se utilizan cuando existe una actualización funcional, visual o jugable claramente identificable.

Ejemplos:
- v1.4.3 — UI & Progression Polish
- v1.4.4 — Boss Presentation & FX Polish

## Parches técnicos
`vX.Y.Z.1`

Se reservan para trabajos internos que deben conservar la experiencia visible de la versión base.

Ejemplo:
- v1.4.3.1 — Performance & Infrastructure Patch

## Hotfixes de publicación
Pueden aplicarse sin cambiar `APP_VERSION` cuando solo corrigen despliegue, caché, documentación o infraestructura de publicación y no representan una experiencia jugable nueva.

---

# Resumen de ruta

```text
v1.0.0  Workshop Build
   ↓
v1.1.0  Progression Update
   ↓
v1.2.0  Level Update
v1.2.1  HUD Fix
   ↓
v1.3.0  Power-Ups Update
v1.3.1  Interactive Power-Ups
v1.3.2  Power Core
   ↓
v1.4.0  Boss Update
v1.4.1  Audio Update
v1.4.2  Economy & Lives
v1.4.3  UI & Progression Polish
v1.4.3.1 Performance & Infrastructure
v1.4.4  Boss Presentation & FX
v1.4.5  Power-Up Loadout Expansion
   ↓
v1.5    Challenge
   ↓
v1.6    Mastery & Weapon Progression
   ↓
v1.7    Visual FX & Shaders
   ↓
v1.8    Modes & Cosmetics
   ↓
v1.9    Events & Campaign Foundation
   ↓
v2.0    Campaign & Long-Term Progression
```

---

# Nota sobre alcance futuro

Las versiones desde **v1.7 en adelante** son direcciones de producto, no contratos rígidos. Su numeración, contenido y orden pueden cambiar según rendimiento, diversión, complejidad técnica y evolución real del juego.

La prioridad permanente sigue siendo que cada expansión nueva se sienta como una evolución de AWS ORBISHOT y no como una acumulación de sistemas desconectados.
