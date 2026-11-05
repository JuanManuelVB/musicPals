/**
 * Conexión con el backend de Amplify (cuentas, perfiles y fotos).
 * amplify_outputs.json lo genera el despliegue del backend; si no existe, la parte social queda
 * desactivada y el resto de la app funciona igual que antes.
 */
import { Amplify } from "aws-amplify";
import "aws-amplify/auth/enable-oauth-listener";

const outputs = Object.values(import.meta.glob<{ default: Record<string, unknown> }>("/amplify_outputs.json", { eager: true }))[0]?.default;

if (outputs) Amplify.configure(outputs);

export const isBackendConfigured = Boolean(outputs);
