// Minimal in-house i18n. Keeps the bundle small and avoids a runtime dep.
// Only Spanish shipped today; the shape is ready for more locales.

export type Locale = 'es'

const messages = {
  // Sidebar / nav
  'nav.overview': 'Resumen',
  'nav.spots': 'Spots',
  'nav.reviews': 'Reseñas',
  'nav.photos': 'Fotos',
  'nav.reports': 'Reportes',
  'nav.audit': 'Auditoría',
  'nav.admins': 'Administradores',
  'nav.settings': 'Ajustes',
  'nav.signOut': 'Cerrar sesión',

  // Common
  'common.loading': 'Cargando…',
  'common.empty': 'No hay datos.',
  'common.retry': 'Reintentar',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.search': 'Buscar…',
  'common.export': 'Exportar CSV',
  'common.clear': 'Limpiar',

  // Theme
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
  'theme.system': 'Sistema',
  'theme.toggle': 'Tema',

  // Errors
  'error.generic': 'Algo se rompió.',
  'error.loadFailed': 'No se pudo cargar.',

  // Pages
  'overview.title': 'Resumen',
  'overview.allClear': 'Todo al día. No hay nada por moderar.',
  'overview.pendingOne': '1 elemento espera revisión.',
  'overview.pendingMany': '{count} elementos esperan revisión.',

  'spots.title': 'Spots',
  'spots.subtitle': 'Aprueba los spots nuevos para que aparezcan en el mapa de la app.',
  'spots.empty': 'No hay spots en esta lista.',
  'spots.emptyFiltered': 'Sin resultados para los filtros aplicados.',
  'spots.approve': 'Aprobar',
  'spots.reject': 'Rechazar',
  'spots.unpublish': 'Despublicar',
  'spots.delete': 'Eliminar spot',
  'spots.deleteTitle': 'Eliminar "{name}"',
  'spots.deleteDesc': 'Se borra el spot con sus fotos, reseñas y likes. No se puede deshacer.',
  'spots.rejectTitle': 'Rechazar "{name}"',
  'spots.rejectDesc': 'El autor recibirá una notificación con este motivo y podrá corregir el spot.',
  'spots.bulkApprove': 'Aprobar {count} spots',
  'spots.bulkReject': 'Rechazar {count} spots',
  'spots.searchPlaceholder': 'Buscar por nombre o descripción…',
  'spots.filterAllTypes': 'Todos los tipos',
  'spots.filterAllDifficulties': 'Todas las dificultades',
  'spots.loadMore': 'Cargar más',
  'spots.selectAll': 'Seleccionar todo',
  'spots.selectedOf': '{selected} de {total}',

  'reviews.title': 'Reseñas',
  'reviews.subtitle': 'Solo las reseñas aprobadas cuentan para el promedio del spot.',
  'reviews.empty': 'No hay reseñas en esta lista.',
  'reviews.emptyFiltered': 'Sin resultados para la búsqueda.',
  'reviews.bulkApprove': 'Aprobar reseñas',
  'reviews.bulkReject': 'Rechazar reseñas',
  'reviews.searchPlaceholder': 'Buscar en comentarios…',

  'photos.title': 'Fotos',
  'photos.subtitle': 'Fotos subidas por autores y en reseñas. Toca una para verla completa.',
  'photos.empty': 'No hay fotos en esta lista.',

  'reports.title': 'Reportes',
  'reports.subtitle': 'Reportes de usuarios sobre spots, agrupados por spot.',
  'reports.empty': 'No hay reportes en esta lista.',
  'reports.emptyFiltered': 'Sin resultados para la búsqueda.',
  'reports.dismiss': 'Descartar',
  'reports.dismissAll': 'Descartar todos',
  'reports.unpublishSpot': 'Despublicar spot',
  'reports.deleteSpot': 'Eliminar spot',
  'reports.groupOne': 'reporte',
  'reports.groupMany': 'reportes',
  'reports.showMore': 'Mostrar {count} más',
  'reports.collapse': 'Colapsar',
  'reports.searchPlaceholder': 'Buscar en motivos…',

  'audit.title': 'Auditoría',
  'audit.subtitle': 'Registro de cada acción de moderación y cambio de rol.',
  'audit.empty': 'Aún no hay acciones registradas.',
  'audit.filterAll': 'Todas las acciones',

  'admins.title': 'Administradores',
  'admins.subtitle': 'Promueve o quita el rol de admin a cualquier cuenta.',
  'admins.searchPlaceholder': 'Buscar por email o usuario…',
  'admins.empty': 'No hay usuarios.',
  'admins.emptyFiltered': 'Sin resultados.',
  'admins.makeAdmin': 'Hacer admin',
  'admins.removeAdmin': 'Quitar admin',
  'admins.cantDemote': 'No puedes quitarte el rol a ti mismo',
  'admins.you': '(tú)',

  'settings.title': 'Ajustes',
  'settings.subtitle': 'Tu cuenta y las preferencias del panel.',
  'settings.account': 'Cuenta',
  'settings.username': 'Usuario',
  'settings.email': 'Email',
  'settings.theme': 'Tema',
  'settings.themeHint': 'Cambia la paleta del panel. "Sistema" sigue al sistema operativo.',
  'settings.password': 'Cambiar contraseña',
  'settings.passwordHint': 'Mínimo 8 caracteres.',
  'settings.passwordNew': 'Nueva contraseña',
  'settings.passwordConfirm': 'Confirma la nueva contraseña',
  'settings.passwordSave': 'Guardar contraseña',

  // Login
  'login.appName': 'Spot For Fun',
  'login.appSubtitle': 'Panel de administración',
  'login.email': 'Email',
  'login.password': 'Contraseña',
  'login.submit': 'Entrar',
  'login.invalidCreds': 'Credenciales inválidas.',
  'login.notAdmin': 'Esta cuenta no tiene permisos de administrador.',
  'login.forgot': '¿Olvidaste tu contraseña?',
  'login.back': 'Volver a iniciar sesión',
  'login.resetSubmit': 'Enviar enlace de recuperación',
  'login.resetSent': 'Te enviamos un correo para restablecer la contraseña.',
  'login.resetTitle': 'Nueva contraseña',
  'login.resetHint': 'Elige una contraseña nueva (mínimo 8 caracteres).',
  'login.resetInvalid': 'El enlace no es válido o expiró.',

  // Errors / actions
  'action.invalidPassword': 'Contraseña incorrecta.',
  'action.passwordMismatch': 'Las contraseñas no coinciden.',
  'action.passwordTooShort': 'La contraseña debe tener al menos 8 caracteres.',
  'action.noSession': 'No hay sesión activa.',

  // Toasts
  'toast.spot.approved': 'Spot aprobado. Ya aparece en el mapa.',
  'toast.spot.rejected': 'Spot rechazado.',
  'toast.spot.deleted': 'Spot eliminado.',
  'toast.spot.deletedClosed': 'Spot eliminado y reporte cerrado.',
  'toast.rating.updated': 'Reseña actualizada.',
  'toast.photo.updated': 'Foto actualizada.',
  'toast.report.updated': 'Reporte actualizado.',
  'toast.report.dismissed': 'Reporte descartado.',
  'toast.report.unpublished': 'Spot despublicado y reporte cerrado.',
  'toast.role.updated': 'Rol actualizado.',
  'toast.password.updated': 'Contraseña actualizada.',
  'toast.spots.bulkApproved': 'Spots aprobados.',
  'toast.spots.bulkRejected': 'Spots rechazados.',
  'toast.ratings.bulkApproved': 'Reseñas aprobadas.',
  'toast.ratings.bulkRejected': 'Reseñas rechazadas.',
  'toast.photos.bulkApproved': 'Fotos aprobadas.',
  'toast.photos.bulkRejected': 'Fotos rechazadas.',
  'toast.reports.bulkDismissed': 'Reportes descartados.',
  'toast.reports.dismissedMany': 'Reportes descartados.',
} as const

export type MessageKey = keyof typeof messages

export function t_(key: MessageKey, vars?: Record<string, string | number>): string {
  let msg: string = messages[key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      msg = msg.replace(`{${k}}`, String(v))
    }
  }
  return msg
}