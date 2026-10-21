# The Stoic Desk

Portfolio inmersivo de Uriel Pandolfi. Next.js App Router, TypeScript, React Three Fiber, Drei, Three.js, GSAP y react-pageflip. Exportación estática; no requiere backend.

## Ejecutar

Requiere Node.js 22.14 o posterior compatible y npm.

```powershell
npm install
npm run assets:prepare
npm run dev
```

Abrir `http://localhost:3000`. Las dependencias, los assets preparados y el lockfile ya están presentes en esta primera entrega.

Producción:

```powershell
npm run build
npm start
```

`npm start` sirve la exportación de `out/` en localhost:3000. Puede publicarse el contenido de `out/` en un hosting estático. No se publicó automáticamente este proyecto local. No usar `next start`: este proyecto utiliza `output: "export"`.

## Editar el contenido

- `src/data/projects.ts`: cada objeto crea dos páginas, imagen y descripción. Se incluyen tres **demostraciones**, sin atribuir trabajos reales ni inventar enlaces. Las imágenes ilustrativas son recortes del fondo proporcionado, no capturas de proyectos.
- `src/data/profile.ts`: presentación, especialidades, stack, reflexiones y contactos. Reemplazar los valores `null` de email, GitHub y LinkedIn para activar enlaces reales.
- `src/data/sceneConfig.ts`: composición completa: cámaras de escritorio/móvil, transformaciones de objetos, velas, luz de ventana, sombras, entorno y profundidad de campo.
- `src/lib/sceneMaterials.ts`: brillo, rugosidad mínima y metalicidad por recurso; elimina luces importadas, emisión y mapas de iluminación de los materiales de ejecución.
- `src/data/assets.json`: manifiesto generado con rutas verificadas, tamaños y fuentes originales.

Para un proyecto real, establecer `demo: false`, una imagen en `public/`, su año y una URL `https://…`. La cantidad de páginas y capítulos se calcula automáticamente. `year` acepta string para admitir tanto años como la marca `Demo`.

## Interacción

Los objetos y la navegación HTML abren Projects, Contact, About Me y Philosophy. La máquina de estados es `idle → focusing → sección → returning → idle`. GSAP acerca la cámara y luego la devuelve a su punto inicial. El libro y la carta se ocultan como objetos mientras se muestra su interfaz HTML.

- Libro: arrastrar una esquina, pulsar una página, utilizar flechas laterales o las teclas ← / →.
- Cierre: botón visible o Escape. El foco queda dentro del diálogo y vuelve al control que lo abrió.
- Móvil: navegación grande, encuadre adaptado y libro de una página.
- Atmosphere: alterna movimiento ambiental y quietud. Se respeta `prefers-reduced-motion`.
- No hay audio ni reproducción sonora automática.

## Recursos y personaje

La carpeta real era `Assets/`, no `public/assets/`. `assets:prepare` detecta los nombres por contenido normalizado y extensión. Conserva los originales y genera copias en `public/assets/` con geometría Meshopt y texturas WebP; los ocho GLB pasan de 79,6 MB a aproximadamente 20,8 MB. No se decimó ni sustituyó la geometría. El test comprueba que los triángulos y los materiales se conservan.

El FBX tiene 65 huesos Mixamo, skinning funcional, 10.032 vértices y **ningún AnimationClip**. Se conserva la transformación original y se posan brazos y piernas mediante quaternions en espacio global. Respiración y atención son movimientos procedurales mínimos, no animaciones importadas. Se redirige el uso de las texturas provistas mediante un material PBR equivalente porque el FBX apunta a una carpeta de exportación inexistente. Los avisos del importador sobre `ShininessExponent` y `ReflectionFactor` son conocidos; los mapas de roughness y metallic originales se aplican explícitamente.

Ver `docs/ASSETS.md` para la auditoría y el flujo de Blender. La pose es funcional; un ajuste manual de dedos, ropa y apoyo de manos en Blender puede mejorar el primer plano. No se pretende reproducir exactamente la imagen conceptual con assets cuya geometría difiere.

## Rendimiento y ambiente

- Entorno híbrido: imagen original como plano lejano, suelo, pared oscura, jambas, arco, parteluz, alféizar y bordes de estantes en 3D.
- Cámara más próxima y baja, ligeramente desplazada lateralmente. Libro y carta pequeños y diagonales; busto mayor en tres cuartos y reloj detrás del busto. Etiquetas solo al pasar el cursor; navegación HTML siempre disponible.
- Dos velas asimétricas comparten geometría y materiales. Luces locales con parpadeo mínimo y una luz principal con sombras desde la vela izquierda. Un solo mapa de sombras de 1024² se actualiza cada 180 ms. Relleno frío de ventana muy suave, sin HDRI ni luz hemisférica.
- Materiales PBR ajustados en copias de ejecución: sin emisión, light maps ni reflejos de entorno; rugosidad mínima conservando los mapas originales. Los archivos originales permanecen intactos.
- Polvo con luminosidad según proximidad a las velas, en un solo `BufferGeometry`; 85 partículas en escritorio y 28 en móvil. Niebla de profundidad sutil.
- DPR máximo 1,35 / 1,1 y antialias desactivado para un acabado ligeramente retro.
- Profundidad de campo suave en escritorio usando la textura de profundidad del render de color, sin repetir la geometría en un segundo pase. Se desactiva en móvil. Exposición ACES y grano sutil.
- Render pausado con la pestaña oculta; modo de quietud usa render bajo demanda.
- Tipografías locales. La aplicación no depende de Google Fonts ni de un CDN de modelos.
- Las mallas originales siguen siendo densas (~2,35 M de triángulos antes de duplicar la vela). Una exportación LOD desde Blender queda como siguiente optimización para dispositivos modestos; no se garantiza 60 fps en todos los móviles.

La lluvia es un shader en el plano 3D de la ventana, con máscara de arco y parteluz. `sceneConfig.window.video` acepta un futuro WebM/MP4 local alineado con ese plano; para usarlo debe prepararse un loop sin audio que preserve el marco. El modo quietud detiene lluvia, parpadeo, polvo y movimiento del personaje.

## Verificación

```powershell
npm run assets:inspect
npm run typecheck
npm run lint
npm test
npm run build
```

Se verifican integridad de assets, conservación de triángulos/materiales, rig, pose y datos de proyectos. La revisión de navegador incluye escritorio, móvil, páginas del libro, cierre con Escape y paneles. Los contactos pendientes son intencionales; falta cargar los proyectos y los perfiles reales.

Las fuentes originales no se eliminan. Las copias preparadas, `node_modules`, `.next`, `out` y `.qa` están ignoradas por Git; regenerar los assets antes del primer build en otra máquina.
