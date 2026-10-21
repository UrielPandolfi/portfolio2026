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
- `src/data/sceneConfig.ts`: posiciones, escalas, rotaciones, cámara, área de ventana y GLB futuro del personaje.
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

- Fondo 2D estático con la imagen original y contraste cálido/frío.
- Velas duplicadas compartiendo geometrías y materiales, llama procedural, dos luces locales sin sombras dinámicas.
- Partículas en un solo `BufferGeometry`; 85 en escritorio y 28 en móvil.
- DPR máximo 1,35 / 1,1 y antialias desactivado para un acabado ligeramente retro.
- Grano CSS sutil y halos de vela; sin compositor de bloom/DOF de pantalla completa para contener el costo.
- Render pausado con la pestaña oculta; modo de quietud usa render bajo demanda.
- Tipografías locales. La aplicación no depende de Google Fonts ni de un CDN de modelos.
- Las mallas originales siguen siendo densas (~2,35 M de triángulos antes de duplicar la vela). Una exportación LOD desde Blender queda como siguiente optimización para dispositivos modestos; no se garantiza 60 fps en todos los móviles.

La lluvia está limitada a la zona de la ventana. `sceneConfig.window.video` acepta un futuro WebM/MP4 local; la capa ya comparte el encuadre del fondo y una máscara independiente. Se recomienda un loop sin audio con el marco y el parteluz preservados en una máscara más precisa.

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
