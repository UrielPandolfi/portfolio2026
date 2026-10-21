# Auditoría de recursos

Fuentes: `Assets/`. Manifiesto: `src/data/assets.json`. Copias de ejecución: `public/assets/`.

| Recurso original                    | Formato                   | Hallazgos                                                                                                                      |
| ----------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ancient-man                         | FBX + carpeta de texturas | Armature Mixamo, 65 huesos, skin weights, 10.032 vértices, cero clips. Basecolor 2048²; mapas normal/roughness/metallic 1024². |
| antique+wooden+desk+3d+model        | GLB                       | Lado largo en Z; se gira Y=π/2. Dimensiones originales 0,693 × 0,663 × 1.                                                      |
| antique+wooden+chair+3d+model       | GLB                       | Frente +Z, asiento aproximadamente en Y=0,55, respaldo hacia Z negativo.                                                       |
| antique+leather+book+3d+model       | GLB                       | Exportado vertical; se gira X=−π/2. Libro de lomo grueso según geometría original.                                             |
| antique+parchment+envelope+3d+model | GLB                       | Exportado vertical; se gira X=−π/2.                                                                                            |
| classical+bust+3d+model             | GLB                       | Y arriba, frente +Z, apoyado en Y=0.                                                                                           |
| antique+candle+3d+model             | GLB                       | Una malla, mapa basecolor. Se reutiliza dos veces y se agrega la llama por separado.                                           |
| antique+hourglass+3d+model          | GLB                       | Una malla y mapa basecolor. Arena y vidrio forman parte del asset; no se simula arena física.                                  |
| antique+ink+bottle+3d+model         | GLB                       | Incluye tintero y pluma en una malla.                                                                                          |
| Stormlit Scholar’s Observatory      | PNG 1672 × 941            | Habitación sin persona ni escritorio; se convierte a WebP y se usa como plano lejano detrás de arquitectura 3D parcial.           |

Los GLB no contienen esqueletos, animaciones, luces `KHR_lights_punctual` ni materiales emisivos. Todos contienen texturas embebidas. La mayoría usa normal, basecolor y metallic/roughness combinados; vela y reloj contienen basecolor solamente. Cada malla tiene entre aproximadamente 280 mil y 303 mil triángulos. Meshopt reduce la transferencia, no el número de triángulos.

`sceneMaterials.ts` aplica la misma política a los GLB, al FBX y a un futuro personaje de reemplazo: quitar cualquier luz importada, convertir materiales unlit a PBR, anular emisión/entorno/light maps y reducir reflectividad. Se clonan los materiales y se comparten geometrías y texturas originales. El mapa de rugosidad conserva variaciones por encima de un mínimo por recurso. Los highlights pintados en basecolor siguen siendo parte de la textura; la corrección de color reduce su brillo, pero no los elimina selectivamente.

## Personaje

La pose inicial es casi T. Altura normalizada aproximadamente 1 unidad. El FBX incluye transformaciones de −90° alrededor de X en la raíz: no aplicar una segunda corrección global. El resultado importado tiene Y arriba y frente +Z.

Jerarquía: `Hips → Spine → Spine1 → Spine2 → Neck → Head`; hombros y brazos parten de `Spine2`; piernas de `Hips`. Three elimina caracteres como `:` en nombres Mixamo, por lo que se buscan sufijos normalizados.

Los ejes locales de ambos brazos no son simétricos. `src/lib/pose.ts` orienta cada segmento mediante quaternions en mundo, convierte al espacio del padre y conserva el twist. No alarga huesos, no reescribe skin weights y no simula clips inexistentes. La pose se aplica antes de posicionar y escalar el personaje dentro de la escena.

El exportador dejó rutas `/mnt/pfs/…fbm` que no existen en el proyecto. Un cargador de texturas diferido evita peticiones inválidas. Después se aplican los cuatro mapas reales provistos a `MeshStandardMaterial`: basecolor sRGB, mapas técnicos sin conversión. Los materiales de ejecución reciben el ajuste mate y de exposición descrito arriba.

## Ajuste recomendado en Blender

1. Importar `ancient-man.fbx` con su armature. Comprobar frente +Z y escala sin duplicar la corrección de ejes.
2. Restaurar los cuatro mapas desde `Assets/ancient-man/`.
3. Ajustar pelvis al asiento, rodillas flexionadas y pies apoyados. Posar hombros/codos/muñecas manteniendo los largos originales.
4. Afinar dedos, muñecas y paños; la primera versión no agrega gestos de mano para evitar artefactos.
5. Exportar GLB con armature, skinning y materiales. Si se crean clips, nombrarlos explícitamente (por ejemplo `Idle`) y adaptar `Philosopher.tsx` para reproducirlos; no se asumen animaciones por nombre.
6. Guardar en `public/assets/`, configurar `sceneConfig.philosopher.replacementGlb` y ajustar posición/escala. El componente de reemplazo conserva el GLB exportado y no vuelve a aplicar la pose del FBX.

Para acercarse a la referencia conceptual, el mayor beneficio estará en la pose del torso/manos y el contacto con la mesa. Los modelos generados tienen detalle, proporciones y materiales propios que no coinciden exactamente con la imagen.

## Futuro video de ventana

El área se define ahora en coordenadas 3D en `sceneConfig.environment.window`; el plano de fondo, el marco y la lluvia comparten el mismo espacio. Actualmente la lluvia procedural usa una máscara de arco y parteluz, desactivable con Atmosphere o movimiento reducido. Para usar un video, proporcionar un loop silencioso preparado para conservar la silueta y el marco de esta ventana. El componente pausa el video en modo quietud o con la escena inactiva; no hay un clip proporcionado para comprobar la integración visual.
