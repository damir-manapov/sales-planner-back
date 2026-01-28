import { registerAs } from '@nestjs/config';

export const keycloakConfig = registerAs('keycloak', () => ({
  authServerUrl: process.env.KEYCLOAK_AUTH_SERVER_URL ?? 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM ?? 'sales-planner',
  clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'sales-planner-api',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? '',
}));
