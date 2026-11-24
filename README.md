# Mi Pokédex – PWA

## Descripción
Aplicación web progresiva para descubrir y registrar Pokémon de la primera generación (ID 1 al 151) mediante códigos QR.

## Tecnologías
- HTML5, JavaScript y Tailwind CSS (CDN), con CSS local de respaldo.
- PokéAPI: https://pokeapi.co/api/v2/pokemon/{id}
- localStorage para guardar capturas.
- html5-qrcode para leer códigos QR.
- Web App Manifest y Service Worker.

## Cómo ejecutar
1. Descomprime la carpeta del proyecto y ábrela en Visual Studio Code.
2. Ejecuta `index.html` con Live Server.
3. Para utilizar la cámara, abre la aplicación desde localhost o HTTPS y acepta el permiso de cámara.
4. No abras el archivo con doble clic: la cámara y el Service Worker necesitan un contexto seguro.

## Cómo probar sin cámara
En la vista Escáner QR escribe, por ejemplo, `pokemon:25`. También puedes usar:
`pokemon:1`, `pokemon:4`, `pokemon:7`, `pokemon:25`, `pokemon:39`,
`pokemon:52`, `pokemon:94`, `pokemon:133`, `pokemon:150`, `pokemon:151`.

## Persistencia
Las capturas se guardan en localStorage con la clave `pokemonCapturados`. No utiliza backend ni base de datos.

## Instalar como PWA
Ejecuta desde localhost o HTTPS y utiliza la opción “Instalar aplicación” del navegador o “Agregar a pantalla de inicio”.

## Modo offline
El Service Worker almacena HTML, CSS, JavaScript, manifest e iconos. La interfaz y las capturas guardadas permanecen disponibles sin conexión. Consultar Pokémon nuevos requiere Internet porque usa PokéAPI. La librería del escáner QR se carga desde CDN, por lo que necesita haberse descargado previamente.
