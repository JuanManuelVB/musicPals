import { defineAuth, secret } from "@aws-amplify/backend";

/** Orígenes desde los que se puede iniciar sesión con Google (callback y cierre de sesión). */
const appOrigins = [
  "http://localhost:5173/",
  "http://localhost:5174/",
  "https://desarrollo.d3brq93wp5vxmh.amplifyapp.com/",
  "https://main.d3brq93wp5vxmh.amplifyapp.com/",
  "https://musicpals.nebrisys.com/",
];

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret("GOOGLE_CLIENT_ID"),
        clientSecret: secret("GOOGLE_CLIENT_SECRET"),
        scopes: ["openid", "email", "profile"],
        attributeMapping: { email: "email", fullname: "name", profilePicture: "picture" },
      },
      callbackUrls: appOrigins,
      logoutUrls: appOrigins,
    },
  },
});
