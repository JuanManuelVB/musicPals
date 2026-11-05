import type { ReactNode } from "react";
import { APP_NAME } from "@/config";
import { PageHeader } from "@/ui/PageHeader";
import { Card, CardTitle } from "@/ui/Card";

const CONTACT_EMAIL = "musicpals@nebrisys.com";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-fog-300">{children}</div>
    </Card>
  );
}

export function PrivacyPage() {
  return (
    <>
      <PageHeader title="Política de privacidad" description={`Qué datos usa ${APP_NAME} y qué hace con ellos.`} />
      <div className="space-y-6">
        <Section title="Resumen">
          <p>
            {APP_NAME} es una aplicación web que calcula estadísticas de escucha musical directamente en tu navegador. No tiene servidor propio
            ni base de datos: no recopilamos, almacenamos ni compartimos tus datos.
          </p>
        </Section>

        <Section title="Cuentas de Spotify y Google (YouTube Music)">
          <p>
            Si conectas una cuenta, el inicio de sesión lo gestiona Spotify o Google y la aplicación recibe un token de acceso temporal. Ese token
            se guarda solo en el almacenamiento de sesión del navegador y se elimina al desconectar o al cerrar el navegador.
          </p>
          <p>Permisos que se solicitan, todos de solo lectura:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Spotify: perfil básico, artistas y canciones más escuchados y reproducciones recientes.</li>
            <li>
              Google: <code className="text-fog-100">youtube.readonly</code>, para leer tus canciones con «Me gusta», tus listas y el nombre de tu
              canal.
            </li>
          </ul>
          <p>
            Las consultas van directamente de tu navegador a Spotify y Google. {APP_NAME} nunca modifica tus cuentas. El uso de los datos
            obtenidos de las API de Google cumple la{" "}
            <a className="text-iris-400 underline" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
              Política de datos de usuario de los servicios de API de Google
            </a>
            , incluidos los requisitos de uso limitado.
          </p>
        </Section>

        <Section title="Historiales importados">
          <p>
            Los archivos que importas (Extended Streaming History de Spotify o Google Takeout) se procesan en tu navegador y se mantienen solo en
            memoria. No se suben a ningún servidor y se pierden al recargar la página.
          </p>
        </Section>

        <Section title="Almacenamiento local y terceros">
          <p>
            La aplicación guarda en tu navegador únicamente la fuente de datos que elegiste. No usa cookies de seguimiento, publicidad ni
            analítica. El alojamiento (AWS Amplify) puede registrar datos técnicos de acceso, como la dirección IP, por motivos de seguridad.
          </p>
        </Section>

        <Section title="Contacto">
          <p>
            Para cualquier pregunta sobre privacidad escribe a{" "}
            <a className="text-iris-400 underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            . Puedes revocar el acceso en cualquier momento desde la configuración de tu cuenta de Spotify o de Google.
          </p>
        </Section>
      </div>
    </>
  );
}
