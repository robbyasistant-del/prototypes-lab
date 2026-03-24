# Investigación: Mecánicas de Juegos de Saltos

## 100jumps.org - Análisis Técnico

### Tecnología Identificada
- **Canvas API nativa** (vanilla JavaScript, sin frameworks)
- Sin librerías externas de juego (no Phaser, no Three.js)
- Google Analytics para tracking
- localStorage para persistencia de progreso
- PWA con manifest.json
- Hosting en Cloudflare Pages

### Estructura HTML
- Meta viewport optimizado para mobile: `maximum-scale=1.0, user-scalable=no`
- Safe area support: `viewport-fit=cover` + CSS env variables
- Canvas fullscreen (`width: 100%; height: 100%`)
- Modales CSS con glassmorphism (backdrop-filter)
- Paleta de colores: #EDF2F8 (bg), #6366f1 (acento), #0f172a (texto)

### Mecánica Principal
> "Hold to charge, release to jump. Land on 100 platforms to win — but one miss and it's over."

- **Input**: Hold para cargar, release para saltar
- **Precisión**: Aterrizar exactamente en la siguiente plataforma
- **Fail-state**: Un solo fallo = Game Over
- **Meta**: 100 plataformas para victoria
- **Progresión**: Contador de intentos (persistence vía localStorage)

---

## Doodle Jump (Lima Sky, 2009)

### Core Mechanics
- **Vertical endless scrolling**: Subida infinita (no hay "fin")
- **Control**: Acelerómetro (tilt) o touch para dirección
- **Wrap-around horizontal**: Salir por izquierda = entrar por derecha
- **Física simple**: Gravedad constante, saltos desde plataformas

### Elementos Clave
1. **Power-ups**:
   - Propeller hat (ascenso lento controlado)
   - Jetpack (ascenso rápido automático)
   - Rocket (super salto vertical)
   - Springs/trampolines (rebote extra)
   - Invulnerability shields

2. **Obstáculos**:
   - Monstruos (evitar o saltar encima)
   - UFOs (abducen al jugador)
   - Black holes (muerte instantánea)
   - Plataformas rotas (caen al pisar)

3. **Progresión**:
   - Score basado en altura alcanzada
   - Temas visuales desbloqueables
   - Easter eggs (códigos para skins)

### Por qué funciona:
- **Session corta**: 1-5 minutos típico
- **Skill curve**: Fácil de jugar, difícil de dominar
- **Random generation**: Cada partida es diferente
- **Power-up dopamine**: Recompensas aleatorias mantienen engagement
- **One-more-try**: Fallo rápido = reinicio inmediato

---

## Icy Tower (Free Lunch Design, 2001)

### Core Mechanics
- **Torre infinita**: Pisos infinitos, imposible llegar al final
- **Física de momentum**: Correr acumula velocidad para saltar más alto
- **Combos**: Secuencias de saltos multi-piso = más puntos
- **Presión temporal**: Pisos bajan cada 30 segundos ("Hurry up!")

### Elementos Clave
1. **Sistema de combo**:
   - Saltar varios pisos seguidos = combo
   - Romper combo = reset de multiplicador
   - Rewards: Puntuación exponencial por combos largos

2. **Progresión visual**:
   - Pisos cambian de apariencia cada 100 niveles:
     * 0-99: Piedra
     * 100-199: Hielo
     * 200-299: Madera
     * 300-399: Metal
     * 400-499: Chicle
     * 500+: Cada vez más abstracto

3. **Wall bounce**:
   - Rebotar en paredes mantiene momentum
   - Permite cambiar dirección sin perder velocidad

### Por qué funciona:
- **Mastery depth**: Sistema de combos permite exprimir la mecánica
- **Competición**: High scores online motivan replay
- **Flow state**: Combos largos = estado de flujo intenso
- **Risk/reward**: Intentar combo más largo vs jugar seguro

---

## PapiJump (Sunflat, 2009)

### Core Mechanics
- **Jugador**: "Papi" (cara roja sonriente)
- **Control**: Tilt/accelerómetro exclusivamente
- **Plataformas**: Escalones fijos en patrón
- **Progresión**: Subir lo más alto posible

### Elementos Clave
- **Doodle Jump simplificado**: Sin power-ups, sin enemigos
- **Minimalismo extremo**: Solo saltar y subir
- **Accesibilidad**: Un control, una mecánica

### Por qué funciona:
- **Zero friction**: Entender el juego toma 5 segundos
- **Pick-up-and-play**: Ideal para momentos muertos
- **Precio/valor**: Freemium con mínima fricción

---

## Otros Juegos de Referencia

### Leap Day (Nitrome)
- **Meta diario**: Un nuevo nivel cada día
- **Repetición perfecta**: Mismo nivel, mejora de skill
- **Social**: Comparar progreso con amigos

### Crossy Road (Hipster Whale)
- **Endless Frogger**: Cruzar infinitamente
- **Voxel art**: Estética única y adorable
- **Unlocks**: Personajes coleccionables

### Hill Climb Racing (Fingersoft)
- **Física vehicle**: Control de aceleración/frenado
- **Progresión**: Mejoras de vehículo entre runs
- **Mapas**: Diferentes terrenos = diferentes desafíos

---

## Patrones Comunes de Éxito

### 1. Loop de Juego
```
Inicio rápido → Core loop simple → Fail rápido → Restart inmediato
(3-5 segundos)   (1-5 minutos)      (claro)        (sin carga)
```

### 2. Progresión de Dificultad
- **Curva suave**: Primeros 30 segundos accesibles para todos
- **Rampa gradual**: Complejidad aumenta lentamente
- **Spikes controlados**: Momentos de tensión intencionales

### 3. Feedback Inmediato
- **Visual**: Partículas, shake, flash
- **Auditivo**: SFX gratificantes en acciones clave
- **Háptico**: Vibración en mobile (cuando disponible)

### 4. Motivación de Replay
| Tipo | Ejemplo |
|------|---------|
| Score | Superar mejor marca personal |
| Meta | Llegar a X plataformas |
| Colección | Desbloquear personajes/temas |
| Skill | Dominar combos avanzados |
| Social | Comparar con amigos |

### 5. Monetización (si aplica)
- **Cosméticos**: Skins sin afectar gameplay
- **Continues**: Segunda oportunidad (opcional)
- **Remove ads**: Pago único
- **NO pay-to-win**: Preservar integridad del skill

---

## Aplicación a 100 Jumps Clones

### Mecánicas a conservar del original:
1. ✅ Hold-to-charge + release
2. ✅ Un solo fallo = game over
3. ✅ 100 plataformas como meta clara
4. ✅ Precisión sobre velocidad

### Mecánicas de variantes:

**Variante A (Power Rush)**:
- Power-ups ocasionales como "dopamine hits"
- Combo multiplier por plataformas seguidas
- Mantener tensión del "one miss" original

**Variante B (Moving Madness)**:
- Movimiento de plataformas = predicción requerida
- Viento = variabilidad en trayectoria
- Vidas múltiples = reducir frustración pero mantener tensión

---

## Referencias
- 100jumps.org/play/ - Análisis de código fuente (Marzo 2026)
- Wikipedia: Doodle Jump, Icy Tower
- TouchArcade reviews históricas
- App Store top charts 2009-2015
