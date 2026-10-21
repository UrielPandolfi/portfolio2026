# Verificación de la primera versión

## Comprobaciones automáticas

- `npm run typecheck`: correcto.
- `npm run lint`: correcto, sin advertencias.
- `npm test`: cuatro pruebas correctas (dependencias de assets, integridad GLB, rig y pose, datos de proyectos).
- `npm run build`: exportación estática generada correctamente en `out/`.
- `npm start`: exportación servida y respuesta HTTP 200 comprobada.

## Navegador

Revisión en navegador integrado: 1038 × 892, escritorio de 1440 × 900 y móvil de 390 × 844.

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

Se corrigió el desmontaje de raíces HTML de Drei durante la navegación conservando las etiquetas montadas y alternando su visibilidad. Se corrigió la restauración prematura del foco esperando a que React retire `inert` de la navegación.

## Límites de esta verificación

Se probaron los tamaños móviles en emulación, no en teléfonos físicos. No se midió una tasa de cuadros garantizada. Los contactos están intencionalmente pendientes y los proyectos son demostraciones identificadas. La máscara de ventana admite un loop futuro, pero no se proporcionó un video para verificarlo.

Capturas: `preview-desktop.jpg`, `preview-book.jpg`, `preview-mobile.jpg` y `preview-mobile-book.jpg`.
