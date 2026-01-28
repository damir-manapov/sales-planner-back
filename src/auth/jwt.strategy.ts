import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

interface KeycloakTokenPayload {
  exp: number;
  iat: number;
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  realm_access: {
    roles: string[];
  };
  resource_access: Record<string, { roles: string[] }>;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const authServerUrl = configService.get<string>('keycloak.authServerUrl');
    const realm = configService.get<string>('keycloak.realm');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${authServerUrl}/realms/${realm}/protocol/openid-connect/certs`,
      }),
      issuer: `${authServerUrl}/realms/${realm}`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: KeycloakTokenPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      username: payload.preferred_username,
      roles: payload.realm_access?.roles ?? [],
    };
  }
}
