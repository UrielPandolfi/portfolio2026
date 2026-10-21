# Mirada y postura del personaje

El recurso activo es `Assets/ancient-man.fbx`, no un GLB. Tiene 65 huesos Mixamo, skinning y cero clips. `sceneConfig.philosopher.replacementGlb` permite cargar un GLB futuro. No había `AnimationMixer` en el componente existente.

## Huesos y elección

- Eje central: `mixamorigHips`, `mixamorigSpine`, `mixamorigSpine1`, `mixamorigSpine2`, `mixamorigNeck`, `mixamorigHead`, `mixamorigHeadTop_End`.
- Cada pierna (`Left` / `Right`): `UpLeg`, `Leg`, `Foot`, `ToeBase`, `Toe_End`.
- Cada brazo (`Left` / `Right`): `Shoulder`, `Arm`, `ForeArm`, `Hand`.
- Cada mano (`LeftHand` / `RightHand`): `Thumb1–4`, `Index1–4`, `Middle1–4`, `Ring1–4`, `Pinky1–4`.

Todos llevan el prefijo `mixamorig`. El inventario con nombres completos, padres, posiciones y rotaciones está en `character-rig.json`. Para regenerarlo: `node scripts/inspect-character.mjs`.

La cabeza aporta el 72% del movimiento y el cuello el 28%. `Spine2` queda como alternativa para modelos sin cabeza/cuello, con amplitud reducida al 25%. Si solo existe cuello, se usa al 65%. No se gira la malla completa ni se alteran huesos de brazos o piernas. Sin huesos compatibles, se conserva únicamente la respiración.

## Archivos

- `src/components/scene/Philosopher.tsx`: carga el FBX/GLB y conecta el comportamiento después de aplicar la pose sentada.
- `src/hooks/useCharacterGaze.ts`: cursor, salida del área, limpieza de eventos, respiración y actualización por frame.
- `src/lib/characterGaze.ts`: detección del rig, límites, damping, gesto temporal y rotaciones aditivas en espacio global convertidas al padre de cada hueso.
- `src/data/characterConfig.ts`: parámetros editables.
- `src/data/sceneConfig.ts`: aplica el retroceso al personaje y a su silla.
- `src/components/scene/CinematicEffects.tsx`: mantiene al personaje dentro del rango de foco al cambiar su posición. No modifica exposición, materiales ni luces.

## Parámetros

Ángulos en radianes, tiempos en segundos, posición en unidades de escena.

| Parámetro                      |             Valor | Efecto                                         |
| ------------------------------ | ----------------: | ---------------------------------------------- |
| `HEAD_FOLLOW_STRENGTH`         |              0.65 | Intensidad global del seguimiento              |
| `HEAD_IDLE_DOWN_ANGLE`         |              0.14 | Inclinación hacia abajo, aproximadamente 8°    |
| `HEAD_LOOKUP_AMOUNT`           |              0.12 | Cuánto levanta la mirada, aproximadamente 6.9° |
| `HEAD_LOOKUP_INTERVAL_MIN/MAX` |            9 / 17 | Pausa aleatoria entre gestos                   |
| `CHARACTER_Z_OFFSET`           |              -1.8 | Retroceso adicional al Z original de -0.82     |
| `yawLimit`                     |              0.16 | Límite horizontal antes de aplicar intensidad  |
| `pitchFollowLimit`             |             0.075 | Aporte vertical máximo del cursor              |
| `pitchMin / pitchMax`          |      -0.06 / 0.22 | Límites finales de inclinación                 |
| `damping`                      |               3.4 | Mayor valor: respuesta más rápida              |
| `neckShare`                    |              0.28 | Proporción de cuello; el resto va a la cabeza  |
| `lookupRise / Hold / Return`   | 0.85 / 0.65 / 1.3 | Subida, pausa y regreso del gesto              |

El límite horizontal efectivo es menor de 6°. `tanh` suaviza los extremos; damping exponencial mantiene un comportamiento equivalente a 30 y 60 fps. La respiración conserva amplitud 0.004 y velocidad 0.8. El reloj se detiene con la escena inactiva; no hay `setInterval` ni saltos por tiempo acumulado en otra pestaña. Atmosphere/movimiento reducido conserva la inclinación base y detiene seguimiento, gesto y respiración. Los eventos táctiles no provocan giros persistentes.

## Posición y mesa

El borde posterior del escritorio está aproximadamente en Z=-2.043. La parte frontal del torso a la altura del tablero estaba en Z=-0.278: la penetración real era mayor de lo que parecía de frente. El desplazamiento -1.8 deja ese límite aproximadamente en -2.078, con las manos alcanzando el tablero desde atrás. La silla recibe el mismo desplazamiento para mantener la relación con la pelvis. El valor no es una conversión a metros: los assets están normalizados y el personaje usa escala 5.

## Compatibilidad con clips

La capa retira su offset anterior antes de un mixer (`useFrame` con prioridad -1), y suma el nuevo después. Nunca restaura una pose fija encima de un clip. Si se incorpora `useAnimations`, registrarlo **antes** de `useCharacterGaze` en el componente. No se elige ni reproduce automáticamente un clip de un GLB futuro. Hay una prueba con `AnimationMixer` real que verifica conservación de la pose animada, además de pruebas de límites, gesto, retorno, fallback y ausencia de acumulación.
