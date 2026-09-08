# Prompt de proyecto: SFC Tracker

## Contexto y objetivo

Quiero desarrollar una **aplicación web visual** (no un bot de texto)
llamada **SFC Tracker**, un panel/dashboard centrado en el Sevilla FC que
usaré yo mismo, mi novia, y un grupo de amigos. El objetivo es doble:
1) tener una herramienta que use de verdad en mi día a día para seguir al
equipo, y 2) que sirva como proyecto destacado en mi CV, ya que vengo de un
Grado Superior en Desarrollo de Aplicaciones Web (DAW) y aspiro a entrar en
una Ingeniería (Ciencia de Datos u otra).

**Requisitos no negociables:**
- El proyecto debe poder construirse y mantenerse **100% gratis**, tanto en
  herramientas de desarrollo como en hosting y APIs, usando siempre planes
  gratuitos.
- El desarrollo se irá **subiendo y documentando en GitHub** de forma
  progresiva (commits, README, documentación técnica), tanto para llevar
  un histórico ordenado del proyecto como para que quede como evidencia de
  trabajo real de cara al CV.
- Debe ser una app pensada para **perdurar en el tiempo**: todos sus
  apartados (clasificación, plantilla, estadísticas, porra, noticias)
  deben poder **actualizarse automáticamente temporada tras temporada**,
  sin que el diseño de datos quede atado solo a la temporada actual.

## Público objetivo

- Yo mismo (uso diario/semanal).
- Mi novia y un grupo de amigos, que accederán vía enlace web / PWA
  instalada, sin fricción de registro complicado.

## Funcionalidades principales

### 1. Próximo partido y partidos en directo
- Rival, fecha, hora, competición (LaLiga, Europa League, Copa del Rey...),
  condición de local o visitante.
- Cuenta atrás visual hasta el inicio del partido.
- **Resultado en directo** durante el partido (marcador actualizado,
  eventos como goles/tarjetas si la API lo permite).
- Racha reciente: representación visual (círculos/iconos de color) de los
  últimos 5-10 resultados.

### 2. Clasificación
- Tabla completa de LaLiga con **todos los equipos**, resaltando
  visualmente al Sevilla FC.
- Código de colores para puestos de Champions/Europa League y descenso.
- Gráfica de evolución de la posición del Sevilla jornada a jornada.

### 3. Plantilla y estadísticas de jugadores
- Listado completo de la **plantilla actual** del Sevilla FC (foto,
  nombre, dorsal, posición).
- Ficha individual de cada jugador con sus **estadísticas de la temporada
  en curso**: goles y asistencias, desglosados **por competición** (LaLiga,
  Europa League, Copa del Rey, etc.), no solo un total agregado.
- Esta sección debe diseñarse para poder consultar también temporadas
  pasadas conforme la app vaya acumulando historial (ver apartado de
  longevidad más abajo).

### 4. Noticias, fichajes y lesiones
- Sección de noticias generales del club (mercado de fichajes, rumores,
  comunicados oficiales), manteniendo al usuario informado de "todo lo
  último del Sevilla FC".
- Apartado específico de lesiones y sanciones: jugadores no disponibles
  para el próximo partido y motivo.

### 5. Porra / quiniela con clasificación de usuarios
- Para participar, el usuario debe **iniciar sesión** en la app (login
  ligero, ver apartado técnico).
- Antes de cada partido, cada usuario registrado hace su **porra**
  (predicción de resultado exacto).
- El sistema avisa mediante **notificaciones push** de que la porra de un
  partido está abierta / próxima a cerrar, para incentivar la
  participación antes de que empiece el encuentro.
- Tras el partido, se calculan los puntos (acierto exacto = más puntos,
  acierto de ganador = menos puntos, fallo = 0).
- **Clasificación general de la porra** entre todos los usuarios
  registrados, acumulada a lo largo de la temporada (y, con el tiempo,
  histórico por temporadas).

### 6. Notificaciones push (PWA / Web Push)
- Sistema de notificaciones push nativo del navegador, sin depender de
  servicios externos tipo Telegram, para que lleguen directamente al
  móvil (avisos de "partido en 1h", resultado final, apertura de porra,
  fichajes importantes, etc.).
- **Cobertura**:
  - **Android**: funciona con solo aceptar el permiso de notificaciones
    en el navegador (Chrome), sin necesidad estricta de instalar la PWA.
  - **iOS (iPhone, mayoría de mis amigos)**: requiere iOS 16.4+ y que el
    usuario instale la web como PWA en la pantalla de inicio (Compartir →
    Añadir a pantalla de inicio) antes de poder activar notificaciones.
    Una vez instalada y con el permiso aceptado, las notificaciones
    llegan con total normalidad, igual que una app nativa (pantalla de
    bloqueo, centro de notificaciones, con la app cerrada, etc.).
- **Implementación recomendada**: Web Push API estándar gestionada a
  través de **OneSignal** (plan gratuito hasta 10.000 suscriptores), para
  no tener que montar manualmente la infraestructura de push (VAPID
  keys, colas de envío, etc.).
- **Onboarding para minimizar fricción, especialmente en iOS**:
  - Detectar desde el frontend si el usuario está en iOS y si la web se
    está ejecutando como PWA instalada o como pestaña normal de Safari.
  - Si es iOS y no está instalada, mostrar un mini-tutorial visual con
    los pasos para instalarla.
  - Pedir el permiso de notificaciones en un momento con sentido para el
    usuario, no nada más entrar, para reducir rechazos.
- **Eventos que deberían disparar notificación**: próximo partido en 1h,
  resultado final del partido, apertura/cierre de porra, fichaje/rumor
  relevante, novedad importante de lesiones.

## Longevidad y multi-temporada

Toda la app debe diseñarse pensando en que va a seguir usándose temporada
tras temporada, no solo en la actual:

- El modelo de datos debe incluir siempre una referencia a la
  **temporada** (p. ej. "2025/2026") en partidos, clasificación,
  estadísticas de jugadores, y clasificación de la porra.
- Al cambiar de temporada (verano, con el nuevo curso liguero), la app
  debe poder "arrancar" la temporada nueva sin perder el histórico de las
  anteriores: la plantilla se actualiza con fichajes/salidas, las
  estadísticas de jugadores empiezan de cero para la temporada nueva pero
  las anteriores quedan consultables, y la clasificación de la porra
  puede reiniciarse por temporada manteniendo un histórico de "ganadores
  de la porra" por año.
- Esto se automatiza con las mismas tareas programadas que ya actualizan
  partidos/clasificación, simplemente detectando el cambio de temporada
  en la API de fútbol utilizada.

## Requisitos no funcionales

- **100% gratis**: cero coste en hosting, dominio, APIs y herramientas.
- **Visual y moderno**: nada de interfaces de solo texto o bots de
  comandos; debe sentirse como una app real, con tarjetas, gráficas y buen
  diseño.
- **Accesible fácilmente**: se comparte por enlace; instalable como PWA en
  el móvil.
- **Multiusuario con login**: necesario para la porra y su clasificación,
  con un sistema de autenticación simple y gratuito.
- **Mantenible y documentado**: repositorio en GitHub con commits
  regulares, README explicando el proyecto, y documentación técnica de la
  arquitectura, pensado también como pieza de portfolio para el CV.
- **Preparado para durar varias temporadas** sin rediseño de datos.

## Stack técnico propuesto (todo con capa gratuita)

- **Frontend**: React con Next.js, Tailwind CSS para estilos, Recharts
  para las gráficas.
- **Backend**: FastAPI (Python).
- **Base de datos**: PostgreSQL gestionado en Supabase o Neon.tech (free
  tier permanente).
- **Autenticación**: Supabase Auth (gratis), necesaria para que cada
  usuario participe en la porra con su propio historial de puntos.
- **Automatización de datos**: tareas programadas (APScheduler o GitHub
  Actions cron gratuito) que consultan periódicamente:
  - Una API de fútbol gratuita (p. ej. football-data.org o API-Football
    de RapidAPI, con límite diario en el plan free) para partidos,
    clasificación, plantilla y estadísticas de jugadores.
  - Una fuente de noticias deportivas gratuita o scraping ligero para
    fichajes, rumores y lesiones.
- **Hosting**: Vercel para el frontend (gratis), Render o Railway para el
  backend (gratis, con posible "sleep" tras inactividad, asumible para
  este uso).
- **PWA**: configuración de manifest y service worker para poder
  "instalar" la app en el móvil desde el navegador, gratis.
- **Notificaciones push**: OneSignal (free tier) integrado sobre la Web
  Push API, disparado desde el backend ante eventos relevantes.
- **Control de versiones y documentación**: repositorio en GitHub,
  actualizado de forma continua conforme avanza el desarrollo.

## Estructura de datos a nivel alto

- `temporadas`: id, nombre (p. ej. "2025/2026"), fecha_inicio, fecha_fin.
- `partidos`: id, temporada_id, rival, fecha, competición,
  local/visitante, resultado, estado (programado/en directo/finalizado).
- `clasificacion_historico`: temporada_id, equipo, jornada, posición,
  puntos, fecha_actualización.
- `jugadores`: id, nombre, dorsal, posición, foto.
- `estadisticas_jugador`: jugador_id, temporada_id, competición, goles,
  asistencias.
- `usuarios`: id, nombre, email (login), puntos_totales_temporada_actual.
- `porras`: id, usuario_id, partido_id, goles_local, goles_visitante,
  puntos_obtenidos.
- `clasificacion_porra_historico`: temporada_id, usuario_id,
  puntos_totales, posición_final.
- `noticias`: id, titulo, resumen, tipo (fichaje/rumor/lesión/general),
  fecha, fuente.
- `lesiones`: id, jugador_id, motivo, fecha_estimada_vuelta.

## Alcance de la v1 (para no sobredimensionar el proyecto)

1. Próximo partido + resultado en directo + clasificación de LaLiga con
   el Sevilla resaltado + racha reciente.
2. Sección de plantilla con estadísticas básicas (goles y asistencias)
   por competición de la temporada actual.
3. Porra con login, cálculo de puntos y clasificación general de
   usuarios.
4. Apartado de noticias/fichajes/lesiones (aunque sea con actualización
   manual o semiautomática al principio).
5. Notificaciones push básicas vía PWA/OneSignal (partido próximo,
   resultado final, apertura de porra), incluyendo el onboarding de
   instalación para usuarios de iOS.
6. Modelo de datos ya preparado desde el inicio con el campo de
   temporada, aunque el "arranque automático de temporada nueva" como
   proceso pueda perfeccionarse en v2.

La gráfica de evolución histórica más detallada, el histórico completo de
temporadas anteriores navegable en la interfaz, y las notificaciones más
avanzadas (fichajes/lesiones en tiempo real) pueden quedar como mejoras de
v2, una vez la base esté funcionando y usándose de verdad por el grupo de
amigos.
