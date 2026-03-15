# HEARTBEAT.md

## Epic autonomous execution watchdog (HIGH PRIORITY)

Objetivo permanente en cada heartbeat:

0) Detectar tareas `in_progress` en PostgreSQL (`public.todos`) y aplicar watchdog de actividad real:
   - Si la tarea tiene evidencia de actividad del agente en los últimos 120s (Gateway API, session logs, tool activity), mantener `in_progress`.
   - Si no hay evidencia de actividad real en esa ventana, pasar la tarea a `todo` inmediatamente.
1) Detectar tareas `todo` en PostgreSQL (`public.todos`).
2) Si la tarea tiene `epic_id`, tratarla como parte del OPERATING_WORKFLOW, leer siempre detalle de la EPICA y la IDEA a la que pertenece esa EPICA
3) Ejecutar/coordinar con el agente correspondiente para completar la tarea, esto significa:
   - crear ejecución real del agente (session/subagent) con prompt detallado, incluyendo fase del `OPERATING_FRAMEWORK.md`, contexto de IDEA y EPIC.
   - guardar `session_id`/`run_id` en `framework_status` o nota de tarea para trazabilidad.
   - solo después pasar la tarea a `in progress` en PostgreSQL (`public.todos`).
   - si falla el spawn de sesión/subagente, mantener/volver la tarea en `todo` y registrar motivo en log + `framework_status`. 
5) Exigir resultado estructurado y guardarlo en:
   - `/workspace/Epic_<EPIC>/step_<Phase #>/`
   - Crear carpeta si no existe.
6) Validar calidad antes de cerrar:
   - evidencia completa,
   - entregable funcional,
   - coherencia con criterios de calidad del framework.
7) Si no cumple calidad: devolver feedback al mismo agente y repetir iteración hasta cumplir.
8) Solo marcar `done` cuando esté 100% validada.
9) Volver al estado `todo` cuando no esté 100% validada, y el agente no tenga mas instrucciones para seguir en la tarea.
10) Solo dejar en estado `in progress` cuando el agente responsable de la tarea esta trabajando en ella

## Convenciones de artefactos

- Ruta base por épica: `/workspace/Epic_<EPIC>/`
- Ruta por fase: `/workspace/Epic_<EPIC>/step_<Phase #>/`
- Incluir al menos:
  - `result.md` (resumen ejecutivo)
  - `evidence.json` (estado, checks, métricas, links)
  - archivos de salida relevantes (html/json/md/apk/etc)

## Regla de cierre

- No cerrar tarea si falta evidencia, si el output no es reproducible, o si no cumple quality bar del framework.
- No cerrar si Robby rervisa el objetivo de la tarea y considera que no esta completada con calidad, en este caso Robby manda un nuevo prompt / instruccion al agente encargado de la tarea con el feedback y las mejoras que debe hacer
- Si no se completa y el agente no va a trabajar mas en esta tarea, no tiene instrucciones pasar in_progress → todo de nuevo la tarea
- Solo pasar a in_progress → done cuando es aceptada
