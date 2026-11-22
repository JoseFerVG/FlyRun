import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  DownloadSimple,
  FileText,
  Heartbeat,
  LockKey,
  Scales,
  ShieldCheck,
  Trash,
  WarningCircle,
  X,
} from '@phosphor-icons/react';

export type LegalTabId =
  | 'privacy'
  | 'google_api'
  | 'terms'
  | 'medical'
  | 'cookies'
  | 'gdpr_rights';

interface LegalComplianceModalProps {
  open: boolean;
  initialTab?: LegalTabId;
  isLoggedIn?: boolean;
  userEmail?: string;
  hasGoogleFitToken?: boolean;
  onClose: () => void;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
  onRevokeGoogleFit?: () => Promise<void> | void;
  onDeleteAccount?: () => Promise<void> | void;
  onOpenCookieSettings?: () => void;
}

const TABS: Array<{ id: LegalTabId; label: string }> = [
  { id: 'privacy', label: 'Privacidad (RGPD/CCPA)' },
  { id: 'google_api', label: 'Google Fit Limited Use' },
  { id: 'terms', label: 'Términos SaaS' },
  { id: 'medical', label: 'Aviso Médico' },
  { id: 'cookies', label: 'Aviso Legal y Cookies' },
  { id: 'gdpr_rights', label: 'Mis Derechos / Borrar' },
];

export function LegalComplianceModal({
  open,
  initialTab = 'privacy',
  isLoggedIn = false,
  userEmail = '',
  hasGoogleFitToken = false,
  onClose,
  onExportJSON,
  onExportCSV,
  onRevokeGoogleFit,
  onDeleteAccount,
  onOpenCookieSettings,
}: LegalComplianceModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<LegalTabId>(initialTab);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    setConfirmDelete(false);
  }, [initialTab, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      style={{ inlineSize: 'min(95dvw, 880px)' }}
      aria-labelledby="legal-modal-title"
    >
      <div className="stack-md" style={{ padding: 'clamp(1.1rem, 2.6vw, 1.65rem)' }}>
        <div className="row-between">
          <div>
            <span className="pill pill-emerald">
              <Scales size={14} weight="duotone" aria-hidden="true" />
              Cumplimiento Global · RGPD · LOPDGDD · LSSI-CE · CCPA · Google API
            </span>
            <h2 id="legal-modal-title" style={{ margin: '0.35rem 0 0', fontSize: '1.28rem' }}>
              Centro Legal, Privacidad y Seguridad de FlyRun
            </h2>
            <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
              Última actualización: 22 de noviembre de 2026 · Documentación pública también en{' '}
              <a href="./privacidad.html" target="_blank" rel="noreferrer">privacidad.html</a> y{' '}
              <a href="./terminos.html" target="_blank" rel="noreferrer">terminos.html</a>.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar centro legal">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="segmented-group" role="tablist" aria-label="Documentos legales de FlyRun">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className="segmented-btn"
              onClick={() => {
                setActiveTab(t.id);
                setConfirmDelete(false);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'privacy' && (
          <div className="stack-md" style={{ fontSize: '0.86rem' }}>
            <div className="inset-panel stack-sm">
              <strong>1. Responsable del Tratamiento (RGPD Art. 13 & LOPDGDD 3/2018)</strong>
              <p className="secondary" style={{ margin: 0 }}>
                El servicio <strong>FlyRun</strong> (aplicación web SaaS disponible en{' '}
                <code>https://flyrun-cardio-jf26.web.app</code>) es operado con domicilio en España (UE). Contacto
                oficial de privacidad, ejercicio de derechos y Delegado de Protección de Datos / privacidad:{' '}
                <a href="mailto:josef.caniles.murcia@gmail.com">josef.caniles.murcia@gmail.com</a>.
              </p>
            </div>

            <div className="inset-panel stack-sm">
              <strong>2. Categorías Especiales de Datos de Salud (RGPD Art. 9.2.a) y Finalidad</strong>
              <p className="secondary" style={{ margin: 0 }}>
                Al ser una plataforma de entrenamiento cardiovascular, FlyRun procesa datos biométricos y de salud física
                (edad, sexo fisiológico, peso, altura, pulso en reposo/máximo, resultados de exámenes de rendimiento VDOT,
                sesiones de ejercicio, estimación nutricional y pasos diarios de Google Fit). Su tratamiento exige{' '}
                <strong>consentimiento explícito e inequívoco</strong> otorgado antes de acceder a la aplicación (Art.
                9.2.a RGPD), pudiendo revocarse o eliminarse en cualquier momento desde la pestaña{' '}
                <em>Mis Derechos / Borrar</em>.
              </p>
            </div>

            <div className="inset-panel stack-sm">
              <strong>3. Edad Mínima de Acceso (Art. 7 LOPDGDD · COPPA)</strong>
              <p className="secondary" style={{ margin: 0 }}>
                El servicio está destinado exclusivamente a personas mayores de <strong>14 años en España</strong> (y 16
                años en jurisdicciones de la UE que no reduzcan el umbral, o 13 años bajo COPPA en EE. UU. con autorización
                parental). No recopilamos intencionadamente datos de menores sin consentimiento verificable de su
                progenitor o tutor legal.
              </p>
            </div>

            <div className="inset-panel stack-sm">
              <strong>4. Subencargados, Seguridad Técnica y Transferencias Internacionales</strong>
              <p className="secondary" style={{ margin: 0 }}>
                Infraestructura alojada en <strong>Google Cloud / Firebase (Auth, Cloud Firestore, Hosting)</strong> bajo
                Cláusulas Contractuales Tipo (SCC) aprobadas por la Comisión Europea y el Marco de Privacidad de Datos
                UE-EE. UU. Todos los datos viajan cifrados en tránsito (HTTPS / TLS 1.3) y en reposo (AES-256), con
                aislamiento estricto por usuario en reglas de seguridad (<code>isOwner(request.auth.uid)</code>). Conservamos
                los datos mientras mantengas activa tu cuenta y los eliminamos inmediatamente tras tu solicitud de borrado.
              </p>
            </div>

            <div className="inset-panel stack-sm">
              <strong>5. Derechos Internacionales (CCPA / CPRA California · UK GDPR · LGPD Brasil)</strong>
              <p className="secondary" style={{ margin: 0 }}>
                <strong>Do Not Sell or Share My Personal Information:</strong> FlyRun <strong>NO vende, alquila ni comparte</strong>{' '}
                datos personales, biométricos o de Google Fit con anunciantes, brókeres de datos o plataformas publicitarias
                de terceros. Los residentes de California, Reino Unido, EEE y Brasil pueden ejercer acceso, rectificación,
                portabilidad (JSON/CSV) y supresión inmediata desde su perfil.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'google_api' && (
          <div className="stack-md" style={{ fontSize: '0.86rem' }}>
            <div className="inset-panel stack-sm" style={{ borderColor: 'var(--pine-border)', background: 'var(--pine-soft)' }}>
              <div className="row-wrap">
                <ShieldCheck size={18} weight="duotone" color="var(--pine)" aria-hidden="true" />
                <strong style={{ color: 'var(--pine)' }}>
                  Google API Services User Data Policy — Limited Use Disclosure
                </strong>
              </div>
              <p className="secondary" style={{ margin: 0 }}>
                <strong>English Notice (Required for Global Google OAuth Verification):</strong> FlyRun&apos;s use and
                transfer to any other app of information received from Google APIs will adhere strictly to the{' '}
                <strong>Google API Services User Data Policy</strong>, including the{' '}
                <strong>Limited Use requirements</strong>.
              </p>
            </div>

            <ul className="stack-sm" style={{ margin: 0, paddingInlineStart: '1.2rem' }}>
              <li>
                <strong>Principio de mínimo privilegio (Scopes):</strong> Solo solicitamos tu identidad básica de acceso
                (Google Sign-In) y lectura de actividad/pasos diarios (
                <code>https://www.googleapis.com/auth/fitness.activity.read</code>) únicamente cuando tú pulsas conectar
                Google Fit.
              </li>
              <li>
                <strong>Prohibición absoluta de entrenar IA/ML generalizada:</strong> Tus datos de Google Fit o métricas
                de salud nunca se utilizan para entrenar, ajustar ni alimentar modelos generalizados o no personalizados de
                inteligencia artificial o machine learning.
              </li>
              <li>
                <strong>Prohibición de lectura humana y publicidad:</strong> Ningún empleado o tercero lee tus datos
                privados de Google (salvo consentimiento expreso para soporte técnico, obligación legal o seguridad). No
                mostramos publicidad dirigida ni transferimos datos a redes publicitarias.
              </li>
              <li>
                <strong>Revocación en 1 clic:</strong> Puedes revocar el token de Google Fit desde la pestaña{' '}
                <em>Mis Derechos / Borrar</em> o directamente en{' '}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
                  Permisos de tu cuenta de Google
                </a>.
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="stack-md" style={{ fontSize: '0.86rem' }}>
            <div className="inset-panel stack-sm">
              <strong>1. Objeto del Servicio SaaS y Fase Acceso Anticipado</strong>
              <p className="secondary" style={{ margin: 0 }}>
                FlyRun proporciona software como servicio (SaaS) de planificación deportiva (cálculo VDOT, zonas
                Karvonen, bloques CaCo/80-20, cronómetro PWA y orientación de macronutrientes). Durante la fase actual
                de <strong>Acceso Anticipado</strong>, todas las funcionalidades descritas son <strong>gratuitas (0 €)</strong>,
                sin cargos ocultos ni renovaciones automáticas sin consentimiento previo expreso.
              </p>
            </div>

            <div className="inset-panel stack-sm">
              <strong>2. Suscripciones Futuras y Derecho de Desistimiento (Directiva UE 2011/83 y TRLGDCU)</strong>
              <p className="secondary" style={{ margin: 0 }}>
                Cuando se activen planes comerciales opcionales, cualquier suscripción mostrará precio total con impuestos
                incluidos (IVA/VAT aplicable), periodicidad y botón de cancelación directa en un clic. Los consumidores de
                la Unión Europea disponen del derecho legal de desistimiento de <strong>14 días naturales</strong> desde la
                contratación, salvo consentimiento expreso previo de ejecución digital inmediata.
              </p>
            </div>

            <div className="inset-panel stack-sm">
              <strong>3. Propiedad Intelectual, Uso Aceptable y Disponibilidad</strong>
              <p className="secondary" style={{ margin: 0 }}>
                Queda prohibido el scraping automatizado abusivo, intento de eludir reglas de aislamiento multi-tenant en
                Firebase, ingeniería inversa maliciosa o suplantación de identidad. Conservas la plena titularidad de todos
                tus registros de entrenamiento y datos personales introducidos en FlyRun.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="stack-md" style={{ fontSize: '0.86rem' }}>
            <div className="inset-panel stack-sm" style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-soft)' }}>
              <div className="row-wrap">
                <Heartbeat size={18} weight="duotone" color="var(--accent)" aria-hidden="true" />
                <strong style={{ color: 'var(--accent)' }}>Exención de Responsabilidad Médica y Deportiva</strong>
              </div>
              <p className="secondary" style={{ margin: 0 }}>
                FlyRun <strong>no es un dispositivo médico ni sustituye el consejo, diagnóstico o tratamiento médico o
                nutricional profesional</strong>. Todos los algoritmos (VDOT de Jack Daniels, frecuencia cardíaca Karvonen,
                fórmula de Tanaka y gasto calórico Mifflin-St Jeor) ofrecen estimaciones educativas basadas en literatura
                de ciencias del deporte.
              </p>
            </div>

            <ul className="stack-sm" style={{ margin: 0, paddingInlineStart: '1.2rem' }}>
              <li>
                Consulta siempre con un médico o especialista en medicina deportiva antes de iniciar un programa de
                ejercicio o pruebas máximas (Test de Cooper 12 min, 5K a tope o series VO2max), especialmente si presentas
                patología cardiovascular, respiratoria, metabólica, embarazo o lesiones previas.
              </li>
              <li>
                <strong>Detén inmediatamente el ejercicio</strong> si experimentas dolor torácico, mareo, ahogo desproporcionado,
                palpitaciones anómalas o dolor agudo articular.
              </li>
              <li>
                Los objetivos orientativos de carbohidratos, proteínas, grasas e hidratación no constituyen una dieta
                clínica terapéutica ni contemplan alergias o patologías renales/metabólicas individuales.
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="stack-md" style={{ fontSize: '0.86rem' }}>
            <div className="inset-panel stack-sm">
              <strong>Aviso Legal (LSSI-CE · Ley 34/2002 España)</strong>
              <p className="secondary" style={{ margin: 0 }}>
                En cumplimiento del art. 10 de la Ley 34/2002 (LSSI-CE), el titular del sitio web SaaS FlyRun pone a
                disposición el correo de contacto oficial{' '}
                <a href="mailto:josef.caniles.murcia@gmail.com">josef.caniles.murcia@gmail.com</a> y los enlaces legales
                permanentes desde cualquier vista de la aplicación.
              </p>
            </div>

            <div className="inset-panel stack-sm">
              <div className="row-between">
                <strong>Política de Cookies y Almacenamiento Local (Guía AEPD)</strong>
                {onOpenCookieSettings && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenCookieSettings}>
                    Configurar preferencias
                  </button>
                )}
              </div>
              <p className="secondary" style={{ margin: 0 }}>
                FlyRun utiliza exclusivamente almacenamiento técnico imprescindible para sesión, sincronización offline/cloud,
                preferencia de tema y estado de hidratación. No cargamos cookies publicitarias ni píxeles de seguimiento de
                terceros sin tu consentimiento expreso.
              </p>
            </div>

            <div className="scroll-table-wrap">
              <table className="zone-table" style={{ fontSize: '0.78rem' }}>
                <thead>
                  <tr>
                    <th>Clave / Tecnología</th>
                    <th>Tipo</th>
                    <th>Finalidad</th>
                    <th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="mono">Firebase Auth IndexedDB</td>
                    <td>Esencial</td>
                    <td>Mantener sesión segura con Google Identity</td>
                    <td>Sesión / Hasta logout</td>
                  </tr>
                  <tr>
                    <td className="mono">flyrun_state_v1_*</td>
                    <td>Esencial</td>
                    <td>Caché local offline-first antes de sincronizar Firestore</td>
                    <td>Hasta borrar cuenta</td>
                  </tr>
                  <tr>
                    <td className="mono">flyrun_gfit_token_v1</td>
                    <td>Funcional (OAuth)</td>
                    <td>Token temporal autorizado de Google Fit (revocable)</td>
                    <td>60 min / Hasta revocar</td>
                  </tr>
                  <tr>
                    <td className="mono">flyrun_cookie_consent_v1</td>
                    <td>Esencial (AEPD)</td>
                    <td>Guardar tu elección de privacidad y cookies</td>
                    <td>12 meses</td>
                  </tr>
                  <tr>
                    <td className="mono">flyrun_theme / water</td>
                    <td>Preferencia UI</td>
                    <td>Recordar tema Claro/Oscuro y vasos de agua de hoy</td>
                    <td>Persistente / Diario</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gdpr_rights' && (
          <div className="stack-md" style={{ fontSize: '0.86rem' }}>
            <div className="inset-panel stack-sm">
              <div className="row-wrap">
                <LockKey size={18} weight="duotone" color="var(--cobalt)" aria-hidden="true" />
                <strong>Autogestión de tus Derechos RGPD y CCPA</strong>
              </div>
              <p className="secondary" style={{ margin: 0 }}>
                {isLoggedIn
                  ? `Sesión activa${userEmail ? ` (${userEmail})` : ''}. Puedes exportar todos tus datos en formatos abiertos o eliminar tu cuenta por completo en cualquier instante.`
                  : 'Inicia sesión con tu cuenta de Google o demo para descargar tus datos o gestionar la eliminación de cuenta, o escríbenos a josef.caniles.murcia@gmail.com.'}
              </p>
            </div>

            {isLoggedIn && (
              <div className="stack-md">
                <div className="grid-2">
                  <div className="inset-panel stack-sm">
                    <strong>Portabilidad RGPD Art. 20 (JSON completo)</strong>
                    <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
                      Descarga un paquete JSON estructurado con tu biometría, historial de entrenamientos, exámenes VDOT y pasos de Google Fit.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onExportJSON?.()}
                    >
                      <DownloadSimple size={15} weight="duotone" aria-hidden="true" />
                      Descargar todos mis datos (.json)
                    </button>
                  </div>

                  <div className="inset-panel stack-sm">
                    <strong>Historial Entrenamientos y Google Fit (CSV)</strong>
                    <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
                      Exporta tus sesiones completadas y pasos diarios en hoja de cálculo CSV estándar compatible con Excel.
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onExportCSV?.()}
                    >
                      <FileText size={15} weight="duotone" aria-hidden="true" />
                      Exportar historial (.csv)
                    </button>
                  </div>
                </div>

                {onRevokeGoogleFit && (
                  <div className="inset-panel row-between">
                    <div>
                      <strong>Conexión OAuth con Google Fit</strong>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>
                        {hasGoogleFitToken
                          ? 'Actualmente hay un token OAuth guardado en este navegador.'
                          : 'No hay token OAuth activo guardado actualmente.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={!hasGoogleFitToken || busyAction === 'revoke'}
                      onClick={() => {
                        setBusyAction('revoke');
                        void Promise.resolve(onRevokeGoogleFit()).finally(() => setBusyAction(null));
                      }}
                    >
                      <CheckCircle size={15} weight="duotone" aria-hidden="true" />
                      {busyAction === 'revoke' ? 'Revocando…' : 'Revocar permiso Google Fit'}
                    </button>
                  </div>
                )}

                {onDeleteAccount && (
                  <div
                    className="inset-panel stack-sm"
                    style={{ borderColor: '#fecaca', background: 'color-mix(in srgb, #ef4444 6%, var(--bg-surface))' }}
                  >
                    <div className="row-wrap">
                      <WarningCircle size={18} weight="duotone" color="#dc2626" aria-hidden="true" />
                      <strong style={{ color: '#dc2626' }}>
                        Derecho de Supresión / Borrado Completo (Art. 17 RGPD · CCPA Delete)
                      </strong>
                    </div>
                    <p className="muted" style={{ margin: 0, fontSize: '0.79rem' }}>
                      Esta acción borra en cascada tu perfil, entrenamientos, exámenes físicos y pasos de Google Fit de
                      Cloud Firestore, revoca tus tokens y elimina tu cuenta del dispositivo. Esta operación es irreversible.
                    </p>
                    {!confirmDelete ? (
                      <div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: '#ef4444', color: '#dc2626' }}
                          onClick={() => setConfirmDelete(true)}
                        >
                          <Trash size={15} weight="duotone" aria-hidden="true" />
                          Eliminar mi cuenta y todos mis datos
                        </button>
                      </div>
                    ) : (
                      <div className="row-wrap">
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: '#dc2626', color: '#ffffff' }}
                          disabled={busyAction === 'delete'}
                          onClick={() => {
                            setBusyAction('delete');
                            void Promise.resolve(onDeleteAccount()).finally(() => {
                              setBusyAction(null);
                              setConfirmDelete(false);
                              onClose();
                            });
                          }}
                        >
                          <Trash size={15} weight="duotone" aria-hidden="true" />
                          {busyAction === 'delete' ? 'Borrando datos de Cloud…' : 'Confirmar borrado definitivo'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirmDelete(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
