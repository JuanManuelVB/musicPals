import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  /**
   * Perfil público. El nombre de usuario es la clave, así que DynamoDB garantiza que sea único.
   * Solo su dueño (userId = sub de Cognito) puede crearlo o editarlo; cualquier usuario con sesión puede leerlo.
   */
  UserProfile: a
    .model({
      username: a.string().required(),
      userId: a.string().required(),
      displayName: a.string(),
      bio: a.string(),
      avatarPath: a.string(),
      topArtists: a.json(),
      topTracks: a.json(),
      /** Fuente de la que salen los tops publicados (p. ej. "Historial de Spotify"). */
      topsSource: a.string(),
      topsUpdatedAt: a.datetime(),
    })
    .identifier(["username"])
    .secondaryIndexes((index) => [index("userId")])
    .authorization((allow) => [allow.ownerDefinedIn("userId").identityClaim("sub"), allow.authenticated().to(["read"])]),

  /**
   * Enlace de amistad en un solo sentido: lo crea quien lo envía.
   * Solicitud = enlace sin respuesta; amistad = enlaces en los dos sentidos.
   * El destinatario puede leerlo y borrarlo (rechazar o eliminar la amistad), pero no crearlo en nombre de otro.
   */
  FriendLink: a
    .model({
      fromUserId: a.string().required(),
      toUserId: a.string().required(),
    })
    .identifier(["fromUserId", "toUserId"])
    .secondaryIndexes((index) => [index("toUserId")])
    .authorization((allow) => [
      allow.ownerDefinedIn("fromUserId").identityClaim("sub"),
      allow.ownerDefinedIn("toUserId").identityClaim("sub").to(["read", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: "userPool" },
});
