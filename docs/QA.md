# Verificación de la escena y el personaje

## Comprobaciones automáticas

- `npm run typecheck`: correcto.
- `npm run lint`: correcto, sin advertencias.
- `npm test`: siete pruebas correctas: dependencias, integridad GLB, rig/pose real y sentido de inclinación, datos, política de materiales, límites/temporización de mirada y compatibilidad aditiva con un AnimationMixer real.
- `npm run build`: exportación estática generada correctamente en `out/`.
- `npm start`: exportación servida y respuesta HTTP 200 comprobada.

## Navegador

Revisión en navegador integrado: 1038 × 892, escritorio de 1440 × 900 y móvil de 390 × 844.

La revisión de la nueva composición y mirada agrega escritorio 1280 × 720. La iluminación se apoya en las velas con una sola sombra dinámica y el fondo es ahora un plano lejano con arquitectura 3D parcial. El torso se separó del tablero, la silla conserva su relación con el cuerpo y la cabeza permanece dentro del rango de foco. El seguimiento utiliza cabeza/cuello; no gira la malla. Se comprobó la pose cabizbaja con Atmosphere en quietud.

- Todos los modelos originales cargan; el personaje conserva texturas y skinning.
- Clic directo en el libro 3D y en su etiqueta abre Projects.
- Libro: cambio mediante botones, teclado y arrastre real de la esquina; límite del último capítulo correcto.
- Móvil: una página por vista, descripción y pie visibles, sin desbordamiento horizontal.
- Contact, About Me y Philosophy abren y cierran en la exportación de producción.
- Escape restaura cámara y navegación.
- Tab permanece dentro del diálogo; al cerrar, el foco vuelve al botón que lo abrió (comprobado con Contact).
- Modo de quietud y navegación sin animación larga comprobados.
- La consola de producción no registra errores durante las transiciones revisadas.

Los dos avisos FBX sobre `ShininessExponent` y `ReflectionFactor` corresponden a slots heredados no soportados por FBXLoader. Los mapas PBR originales se aplican explícitamente; no son dependencias fallidas.

Se corrigió el desmontaje de raíces HTML de Drei durante la navegación conservando las etiquetas montadas y alternando su visibilidad. Las etiquetas ocultas no interceptan clics: su contenedor usa `pointerEvents: none`. Se corrigió la restauración prematura del foco esperando a que React retire `inert` de la navegación.

## Límites de esta verificación

Se probaron los tamaños móviles en emulación, no en teléfonos físicos. No se midió una tasa de cuadros garantizada. Los contactos están intencionalmente pendientes y los proyectos son demostraciones identificadas. La máscara de ventana admite un loop futuro, pero no se proporcionó un video para verificarlo.

Capturas de la primera versión: `preview-desktop.jpg`, `preview-book.jpg`, `preview-mobile.jpg` y `preview-mobile-book.jpg`. Capturas actuales: `preview-character.jpg` y `preview-character-mobile.jpg`. Parámetros, huesos y criterios de posición: `CHARACTER.md`.
