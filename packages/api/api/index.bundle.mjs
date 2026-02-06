import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// api/index.ts
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";

// src/app.module.ts
import { Module as Module21 } from "@nestjs/common";
import { ConfigModule as ConfigModule2 } from "@nestjs/config";

// src/entities/api-keys/api-keys.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get as Get2,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards
} from "@nestjs/common";

// src/auth/auth.guard.ts
import {
  BadRequestException,
  ForbiddenException as ForbiddenException2,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";

// src/common/constants.ts
var ROLE_NAMES = {
  SYSTEM_ADMIN: "systemAdmin",
  TENANT_ADMIN: "tenantAdmin",
  TENANT_OWNER: "tenantOwner",
  // Derived role, not stored in database
  EDITOR: "editor",
  VIEWER: "viewer"
};

// src/auth/access-control.ts
import { ForbiddenException } from "@nestjs/common";
function getShopRoles(user, shopId) {
  const shopRole = user.shopRoles.find((sr) => sr.shopId === shopId);
  return shopRole?.roles || [];
}
function getTenantRoles(user, tenantId) {
  const tenantRole = user.tenantRoles.find((tr) => tr.tenantId === tenantId);
  return tenantRole?.roles || [];
}
function isTenantAdmin(user, tenantId) {
  const tenantRoles = getTenantRoles(user, tenantId);
  return tenantRoles.includes(ROLE_NAMES.TENANT_ADMIN);
}
function isTenantOwner(user, tenantId) {
  return user.ownedTenantIds.includes(tenantId);
}
function hasTenantAccess(user, tenantId) {
  return isTenantOwner(user, tenantId) || isTenantAdmin(user, tenantId);
}
function validateTenantAdminAccess(user, tenantId) {
  if (user.isSystemAdmin) return;
  if (!hasTenantAccess(user, tenantId)) {
    throw new ForbiddenException("Tenant owner or admin access required");
  }
}
function hasReadAccess(user, shopId, tenantId) {
  if (hasTenantAccess(user, tenantId)) {
    return true;
  }
  const shopRoles = getShopRoles(user, shopId);
  return shopRoles.includes(ROLE_NAMES.VIEWER) || shopRoles.includes(ROLE_NAMES.EDITOR);
}
function hasWriteAccess(user, shopId, tenantId) {
  if (hasTenantAccess(user, tenantId)) {
    return true;
  }
  const shopRoles = getShopRoles(user, shopId);
  return shopRoles.includes(ROLE_NAMES.EDITOR);
}
function validateWriteAccess(user, shopId, tenantId) {
  if (!user.tenantIds.includes(tenantId)) {
    throw new ForbiddenException("Access to this tenant is not allowed");
  }
  if (!hasWriteAccess(user, shopId, tenantId)) {
    throw new ForbiddenException("Editor role required for this shop");
  }
}

// src/auth/decorators.ts
import { createParamDecorator, SetMetadata } from "@nestjs/common";
var ACCESS_LEVEL_KEY = "accessLevel";
var RequireReadAccess = () => SetMetadata(ACCESS_LEVEL_KEY, "read" /* READ */);
var RequireWriteAccess = () => SetMetadata(ACCESS_LEVEL_KEY, "write" /* WRITE */);
var ShopContext = createParamDecorator(
  (_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;
    const shopId = Number.parseInt(query.shop_id ?? "", 10);
    const tenantId = Number.parseInt(query.tenant_id ?? "", 10);
    if (Number.isNaN(shopId) || Number.isNaN(tenantId)) {
      throw new Error("shop_id and tenant_id are required as query parameters");
    }
    return { shopId, tenantId };
  }
);

// src/auth/auth.guard.ts
var AuthGuard = class {
  constructor(apiKeysService, userRolesService, tenantsService, reflector) {
    this.apiKeysService = apiKeysService;
    this.userRolesService = userRolesService;
    this.tenantsService = tenantsService;
    this.reflector = reflector;
  }
  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);
    if (!apiKey) {
      throw new UnauthorizedException("API key is required");
    }
    const validApiKey = await this.apiKeysService.findValidByKey(apiKey);
    if (!validApiKey) {
      throw new UnauthorizedException("Invalid or expired API key");
    }
    const userRolesWithNames = await this.userRolesService.findByUserIdWithRoleNames(
      validApiKey.user_id
    );
    const isSystemAdmin = userRolesWithNames.some(
      (ur) => ur.tenant_id === null && ur.shop_id === null && ur.role_name === ROLE_NAMES.SYSTEM_ADMIN
    );
    const tenantIds = [
      ...new Set(
        userRolesWithNames.filter((ur) => ur.tenant_id !== null).map((ur) => ur.tenant_id)
      )
    ];
    const tenantRolesMap = /* @__PURE__ */ new Map();
    for (const ur of userRolesWithNames) {
      if (ur.tenant_id !== null && ur.shop_id === null) {
        const roles = tenantRolesMap.get(ur.tenant_id) || [];
        roles.push(ur.role_name);
        tenantRolesMap.set(ur.tenant_id, roles);
      }
    }
    const tenantRoles = Array.from(tenantRolesMap.entries()).map(
      ([tenantId, roles]) => ({
        tenantId,
        roles
      })
    );
    const shopRolesMap = /* @__PURE__ */ new Map();
    for (const ur of userRolesWithNames) {
      if (ur.shop_id !== null) {
        const roles = shopRolesMap.get(ur.shop_id) || [];
        roles.push(ur.role_name);
        shopRolesMap.set(ur.shop_id, roles);
      }
    }
    const shopRoles = Array.from(shopRolesMap.entries()).map(([shopId, roles]) => ({
      shopId,
      roles
    }));
    const ownedTenants = await this.tenantsService.findByOwnerId(validApiKey.user_id);
    const ownedTenantIds = ownedTenants.map((t) => t.id);
    const allTenantIds = [.../* @__PURE__ */ new Set([...tenantIds, ...ownedTenantIds])];
    request.user = {
      id: validApiKey.user_id,
      tenantIds: allTenantIds,
      ownedTenantIds,
      tenantRoles,
      shopRoles,
      isSystemAdmin
    };
    const accessLevel = this.reflector.get(ACCESS_LEVEL_KEY, context.getHandler());
    if (accessLevel && accessLevel !== "none" /* NONE */) {
      const query = request.query;
      const shopId = Number.parseInt(query.shop_id ?? "", 10);
      const tenantId = Number.parseInt(query.tenant_id ?? "", 10);
      if (Number.isNaN(shopId) || Number.isNaN(tenantId)) {
        throw new BadRequestException("shop_id and tenant_id are required");
      }
      if (!request.user.tenantIds.includes(tenantId)) {
        throw new ForbiddenException2("Access to this tenant is not allowed");
      }
      if (accessLevel === "read" /* READ */ && !hasReadAccess(request.user, shopId, tenantId)) {
        throw new ForbiddenException2("Viewer or editor role required for this shop");
      }
      if (accessLevel === "write" /* WRITE */ && !hasWriteAccess(request.user, shopId, tenantId)) {
        throw new ForbiddenException2("Editor role required for this shop");
      }
    }
    return true;
  }
  extractApiKey(request) {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.slice(7);
    }
    return request.headers["x-api-key"] ?? null;
  }
};
AuthGuard = __decorateClass([
  Injectable()
], AuthGuard);

// src/auth/system-admin.guard.ts
import { ForbiddenException as ForbiddenException3, Injectable as Injectable2 } from "@nestjs/common";
var SystemAdminGuard = class {
  canActivate(context) {
    const request = context.switchToHttp().getRequest();
    if (!request.user?.isSystemAdmin) {
      throw new ForbiddenException3("Only system administrators can perform this action");
    }
    return true;
  }
};
SystemAdminGuard = __decorateClass([
  Injectable2()
], SystemAdminGuard);

// src/common/shop-scoped/base-entity.service.ts
import { NotFoundException } from "@nestjs/common";

// src/common/exceptions.ts
import {
  BadRequestException as BadRequestException2,
  ConflictException,
  InternalServerErrorException
} from "@nestjs/common";
var InvalidTableNameException = class extends BadRequestException2 {
  constructor(tableName) {
    super(`Invalid table name: ${tableName}`);
  }
};
var DuplicateResourceException = class extends ConflictException {
  constructor(resource, identifier, scope) {
    const scopeMessage = scope ? ` in ${scope}` : "";
    super(`${resource} with identifier '${identifier}' already exists${scopeMessage}`);
  }
};
function isUniqueViolation(error) {
  return error instanceof Error && "code" in error && error.code === "23505";
}

// src/common/shop-scoped/base-entity.service.ts
var ShopScopedBaseEntityService = class {
  constructor(repository, entityName) {
    this.repository = repository;
    this.entityName = entityName;
  }
  async findAll() {
    return this.repository.findAll();
  }
  async findById(id6) {
    return this.repository.findById(id6);
  }
  async findByShopId(shopId) {
    return this.repository.findByShopId(shopId);
  }
  async findByShopIdPaginated(shopId, query) {
    return this.repository.findByShopIdPaginated(shopId, query);
  }
  async findByTenantId(tenantId) {
    return this.repository.findByTenantId(tenantId);
  }
  /**
   * Get identifier for error messages. Override in subclass for specific identifier.
   */
  getCreateIdentifier(_dto) {
    return "unknown";
  }
  async create(dto) {
    try {
      return await this.repository.create(dto);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          this.entityName,
          this.getCreateIdentifier(dto),
          "this shop"
        );
      }
      throw error;
    }
  }
  /**
   * Get identifier for update error messages. Override in subclass for specific identifier.
   */
  getUpdateIdentifier(_dto) {
    return "unknown";
  }
  async update(id6, dto) {
    try {
      const updated = await this.repository.update(id6, dto);
      if (!updated) {
        throw new NotFoundException(`${this.entityName} with id ${id6} not found`);
      }
      return updated;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          this.entityName,
          this.getUpdateIdentifier(dto),
          "this shop"
        );
      }
      throw error;
    }
  }
  async delete(id6) {
    return this.repository.delete(id6);
  }
  async deleteByShopId(shopId) {
    return this.repository.deleteByShopId(shopId);
  }
};

// src/lib/csv.ts
import { BadRequestException as BadRequestException3 } from "@nestjs/common";
import { parse } from "csv-parse/sync";
function toCsv(items, columns) {
  const header = columns.map(String).join(",");
  const rows = items.map((item) => {
    return columns.map((col) => {
      const value = item[col];
      if (value === null || value === void 0) {
        return "";
      }
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(",");
  });
  return [header, ...rows].join("\n");
}
function fromCsv(content, requiredColumns) {
  if (!content || typeof content !== "string") {
    throw new BadRequestException3("Content must be a non-empty string");
  }
  try {
    const cleanContent = content.charCodeAt(0) === 65279 ? content.slice(1) : content;
    const firstLine = cleanContent.split("\n")[0];
    const delimiter = firstLine?.includes(";") ? ";" : ",";
    const records = parse(cleanContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
      bom: true,
      // Handle BOM at parser level too
      relax_column_count: true
      // Allow rows with fewer columns than header (for optional fields)
    });
    const nonEmptyRecords = records.filter((record) => {
      return Object.values(record).some((value) => value && value.trim() !== "");
    });
    for (const record of nonEmptyRecords) {
      for (const column of requiredColumns) {
        if (!(column in record) || !record[column]) {
          throw new BadRequestException3(`CSV must have a "${column}" column with values`);
        }
      }
    }
    return nonEmptyRecords;
  } catch (error) {
    if (error instanceof BadRequestException3) {
      throw error;
    }
    throw new BadRequestException3(
      `Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// src/lib/normalize-code.ts
var cyrillicToLatinMap = {
  \u0430: "a",
  \u0410: "A",
  \u0431: "b",
  \u0411: "B",
  \u0432: "v",
  \u0412: "V",
  \u0433: "g",
  \u0413: "G",
  \u0434: "d",
  \u0414: "D",
  \u0435: "e",
  \u0415: "E",
  \u0451: "yo",
  \u0401: "Yo",
  \u0436: "zh",
  \u0416: "Zh",
  \u0437: "z",
  \u0417: "Z",
  \u0438: "i",
  \u0418: "I",
  \u0439: "y",
  \u0419: "Y",
  \u043A: "k",
  \u041A: "K",
  \u043B: "l",
  \u041B: "L",
  \u043C: "m",
  \u041C: "M",
  \u043D: "n",
  \u041D: "N",
  \u043E: "o",
  \u041E: "O",
  \u043F: "p",
  \u041F: "P",
  \u0440: "r",
  \u0420: "R",
  \u0441: "s",
  \u0421: "S",
  \u0442: "t",
  \u0422: "T",
  \u0443: "u",
  \u0423: "U",
  \u0444: "f",
  \u0424: "F",
  \u0445: "h",
  \u0425: "H",
  \u0446: "ts",
  \u0426: "Ts",
  \u0447: "ch",
  \u0427: "Ch",
  \u0448: "sh",
  \u0428: "Sh",
  \u0449: "shch",
  \u0429: "Shch",
  \u044A: "",
  \u042A: "",
  \u044B: "y",
  \u042B: "Y",
  \u044C: "",
  \u042C: "",
  \u044D: "e",
  \u042D: "E",
  \u044E: "yu",
  \u042E: "Yu",
  \u044F: "ya",
  \u042F: "Ya"
};
function transliterate(text) {
  return text.split("").map((char) => cyrillicToLatinMap[char] ?? char).join("");
}
function splitIntoWords(text) {
  if (text.length === 0) return [];
  const words = text.split(/[_-]+|(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])|(?<=[0-9])(?=[A-Z])/).filter(Boolean);
  return words;
}
function toCamelCase(text) {
  const words = splitIntoWords(text);
  if (words.length === 0) return "";
  return words.map(
    (word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join("");
}
function normalizeCode(code9) {
  if (!code9) return code9;
  const transliterated = transliterate(code9.replace(/\s+/g, "-"));
  return toCamelCase(transliterated);
}
function normalizeSkuCode(code9) {
  if (!code9) return code9;
  return transliterate(code9.replace(/\s+/g, ""));
}

// src/lib/period.ts
function periodToDate(period2) {
  const parts = period2.split("-").map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  return new Date(Date.UTC(year, month - 1, 1));
}
function dateToPeriod(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// src/common/shop-scoped/coded-entity.service.ts
var CodedShopScopedEntityService = class extends ShopScopedBaseEntityService {
  constructor(repository, entityName, importItemSchema) {
    super(repository, entityName);
    this.repository = repository;
    this.entityName = entityName;
    this.importItemSchema = importItemSchema;
  }
  /**
   * Code normalization - uses standard normalizeCode by default.
   * Override in subclass for custom normalization (e.g., SKUs).
   */
  normalizeCode(code9) {
    return normalizeCode(code9);
  }
  /**
   * Validate import item using the schema provided in constructor
   */
  validateImportItem(item) {
    return this.importItemSchema.safeParse(item);
  }
  getCreateIdentifier(dto) {
    return dto.code;
  }
  getUpdateIdentifier(dto) {
    return dto.code ?? "unknown";
  }
  async findByCodeAndShop(code9, shopId) {
    const normalizedCode = this.normalizeCode(code9);
    return this.repository.findByCodeAndShop(normalizedCode, shopId);
  }
  async create(dto) {
    const normalizedDto = {
      ...dto,
      code: this.normalizeCode(dto.code)
    };
    return super.create(normalizedDto);
  }
  async bulkUpsert(tenantId, shopId, items) {
    const validItems = [];
    const errors = [];
    items.forEach((item, index) => {
      const result = this.validateImportItem(item);
      if (!result.success || !result.data) {
        const identifier = item.code || `at index ${index}`;
        const errorMessages = result.error?.issues.map((issue) => issue.message).join(", ") || "Invalid item";
        errors.push(`Invalid item "${identifier}": ${errorMessages}`);
        return;
      }
      validItems.push(result.data);
    });
    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }
    const normalizedItems = validItems.map((item) => ({
      code: this.normalizeCode(item.code),
      title: item.title
    }));
    const { created, updated } = await this.repository.bulkUpsert(
      tenantId,
      shopId,
      normalizedItems
    );
    return { created, updated, errors };
  }
  async exportForShop(shopId) {
    return this.repository.exportForShop(shopId);
  }
  /**
   * Finds entities by code or creates missing ones.
   * Returns a map of code -> id and the count of newly created entities.
   * Useful for auto-creating referenced entities during imports.
   */
  async findOrCreateByCode(tenantId, shopId, codes) {
    if (codes.length === 0) {
      return { codeToId: /* @__PURE__ */ new Map(), created: 0 };
    }
    const normalizedCodes = codes.map((code9) => this.normalizeCode(code9));
    return this.repository.findOrCreateByCode(tenantId, shopId, normalizedCodes);
  }
};

// src/database/database.module.ts
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

// src/database/database.config.ts
import { registerAs } from "@nestjs/config";
var databaseConfig = registerAs("database", () => {
  const url = process.env.DATABASE_URL;
  if (url) {
    const parsed = new URL(url);
    return {
      url,
      host: parsed.hostname,
      port: parseInt(parsed.port || "5432", 10),
      database: parsed.pathname.slice(1),
      // Remove leading /
      user: parsed.username,
      password: parsed.password,
      ssl: parsed.searchParams.get("sslmode") === "require",
      serverless: process.env.SERVERLESS === "true"
    };
  }
  return {
    url: void 0,
    host: process.env.DATABASE_HOST ?? "localhost",
    port: parseInt(process.env.DATABASE_PORT ?? "5432", 10),
    database: process.env.DATABASE_NAME ?? "sales_planner",
    user: process.env.DATABASE_USER ?? "postgres",
    password: process.env.DATABASE_PASSWORD ?? "postgres",
    ssl: process.env.DATABASE_SSL === "true",
    serverless: process.env.SERVERLESS === "true"
  };
});

// src/database/database.service.ts
import { Injectable as Injectable3 } from "@nestjs/common";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
var DatabaseService = class extends Kysely {
  constructor(configService) {
    const url = configService.get("database.url");
    const host = configService.get("database.host");
    const port = configService.get("database.port");
    const database = configService.get("database.database");
    const user = configService.get("database.user");
    const password = configService.get("database.password");
    const ssl = configService.get("database.ssl");
    const serverless = configService.get("database.serverless");
    const poolConfig = url ? {
      connectionString: url,
      ssl: ssl ? { rejectUnauthorized: false } : void 0,
      max: serverless ? 1 : 10,
      connectionTimeoutMillis: 5e3
    } : {
      host,
      port,
      database,
      user,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : void 0,
      max: serverless ? 1 : 10,
      connectionTimeoutMillis: 5e3
    };
    super({
      dialect: new PostgresDialect({
        pool: new pg.Pool(poolConfig)
      })
    });
  }
  async onModuleDestroy() {
    await this.destroy();
  }
};
DatabaseService = __decorateClass([
  Injectable3()
], DatabaseService);

// src/database/database.module.ts
var DatabaseModule = class {
};
DatabaseModule = __decorateClass([
  Global(),
  Module({
    imports: [ConfigModule.forFeature(databaseConfig)],
    providers: [DatabaseService],
    exports: [DatabaseService]
  })
], DatabaseModule);

// src/database/table-names.ts
var VALID_TABLE_NAMES = [
  "api_keys",
  "brands",
  "categories",
  "groups",
  "marketplaces",
  "roles",
  "sales_history",
  "shops",
  "skus",
  "statuses",
  "suppliers",
  "tenants",
  "user_roles",
  "user_shops",
  "users"
];
var USER_QUERYABLE_TABLES = [
  "brands",
  "categories",
  "groups",
  "marketplaces",
  "sales_history",
  "skus",
  "statuses",
  "suppliers"
];
function assertValidTableName(name4, allowedTables = VALID_TABLE_NAMES) {
  if (!allowedTables.includes(name4)) {
    throw new InvalidTableNameException(name4);
  }
}

// src/common/shop-scoped/base-repository.ts
var ShopScopedBaseRepository = class _ShopScopedBaseRepository {
  constructor(db, tableName, allowedTables) {
    this.db = db;
    assertValidTableName(tableName, allowedTables);
    this.tableName = tableName;
  }
  tableName;
  /** Fields to include in exportForShop. Override in subclass to specify fields. */
  exportFields = [];
  /** Unique key columns for upsert conflict resolution. Override in subclass. */
  uniqueKeys = ["id"];
  /** Business primary key for counting existing records in bulkUpsert. If not set, uses first uniqueKey that isn't shop_id. */
  businessPrimaryKey;
  async countByShopId(shopId) {
    const result = await this.db.selectFrom(this.tableName).select(this.db.fn.countAll().as("count")).where("shop_id", "=", shopId).executeTakeFirstOrThrow();
    return Number(result.count);
  }
  async findAll() {
    return this.db.selectFrom(this.tableName).selectAll().orderBy("id", "asc").execute();
  }
  async findById(id6) {
    return this.db.selectFrom(this.tableName).selectAll().where("id", "=", id6).executeTakeFirst();
  }
  async findByShopId(shopId, query) {
    let q = this.db.selectFrom(this.tableName).selectAll().where("shop_id", "=", shopId).orderBy("id", "asc");
    if (query?.limit !== void 0) {
      q = q.limit(query.limit);
    }
    if (query?.offset !== void 0) {
      q = q.offset(query.offset);
    }
    return q.execute();
  }
  async findByTenantId(tenantId) {
    return this.db.selectFrom(this.tableName).selectAll().where("tenant_id", "=", tenantId).orderBy("id", "asc").execute();
  }
  async findByShopIdPaginated(shopId, query = {}) {
    const { limit, offset } = query;
    const [total, items] = await Promise.all([
      this.countByShopId(shopId),
      this.findByShopId(shopId, query)
    ]);
    return { items, total, limit: limit ?? 0, offset: offset ?? 0 };
  }
  /** Immutable fields that should never be updated */
  static IMMUTABLE_FIELDS = /* @__PURE__ */ new Set([
    "id",
    "shop_id",
    "tenant_id",
    "created_at",
    "updated_at"
  ]);
  async create(data) {
    const result = await this.db.insertInto(this.tableName).values({
      ...data,
      updated_at: /* @__PURE__ */ new Date()
    }).returningAll().executeTakeFirstOrThrow();
    return result;
  }
  async update(id6, data) {
    const updateData = { updated_at: /* @__PURE__ */ new Date() };
    for (const [key, value] of Object.entries(data)) {
      if (value !== void 0 && !_ShopScopedBaseRepository.IMMUTABLE_FIELDS.has(key)) {
        updateData[key] = value;
      }
    }
    const result = await this.db.updateTable(this.tableName).set(updateData).where("id", "=", id6).returningAll().executeTakeFirst();
    return result;
  }
  async delete(id6) {
    await this.db.deleteFrom(this.tableName).where("id", "=", id6).execute();
  }
  async deleteByShopId(shopId) {
    const result = await this.db.deleteFrom(this.tableName).where("shop_id", "=", shopId).executeTakeFirst();
    return Number(result.numDeletedRows);
  }
  async exportForShop(shopId) {
    return this.db.selectFrom(this.tableName).select(this.exportFields.slice()).where("shop_id", "=", shopId).orderBy("id", "asc").execute();
  }
  /**
   * Bulk upsert items. Returns counts of created and updated items.
   * Updates all fields from items except immutable ones.
   */
  async bulkUpsert(tenantId, shopId, items) {
    if (items.length === 0) {
      return { created: 0, updated: 0 };
    }
    const primaryKey = this.businessPrimaryKey ?? this.uniqueKeys.find((k) => k !== "shop_id") ?? "id";
    const keyValues = items.map((item) => item[primaryKey]);
    const existingResult = await this.db.selectFrom(this.tableName).select(this.db.fn.countAll().as("count")).where("shop_id", "=", shopId).where(primaryKey, "in", keyValues).executeTakeFirstOrThrow();
    const updated = Number(existingResult.count);
    const created = items.length - updated;
    const sampleItem = items[0];
    const updateSet = { updated_at: /* @__PURE__ */ new Date() };
    for (const key of Object.keys(sampleItem)) {
      if (!_ShopScopedBaseRepository.IMMUTABLE_FIELDS.has(key)) {
        updateSet[key] = (eb) => eb.ref(`excluded.${key}`);
      }
    }
    await this.db.insertInto(this.tableName).values(
      items.map((item) => ({
        ...item,
        shop_id: shopId,
        tenant_id: tenantId,
        updated_at: /* @__PURE__ */ new Date()
      }))
    ).onConflict((oc) => oc.columns(this.uniqueKeys.slice()).doUpdateSet(updateSet)).execute();
    return { created, updated };
  }
};

// src/common/shop-scoped/coded-repository.ts
var CodedShopScopedRepository = class extends ShopScopedBaseRepository {
  /** Override to include code/title in export */
  exportFields = ["code", "title"];
  /** Override unique keys for code-based conflict resolution */
  uniqueKeys = ["code", "shop_id"];
  /** Code is the business primary key */
  businessPrimaryKey = "code";
  async findByCodeAndShop(code9, shopId) {
    return this.db.selectFrom(this.tableName).selectAll().where("code", "=", code9).where("shop_id", "=", shopId).executeTakeFirst();
  }
  async findCodesByShopId(shopId, codes) {
    const rows = await this.db.selectFrom(this.tableName).select("code").where("shop_id", "=", shopId).where("code", "in", codes).execute();
    return new Set(rows.map((r) => r.code));
  }
  /**
   * Finds entities by code or creates missing ones.
   * Returns a map of code -> id and the count of newly created entities.
   * Useful for auto-creating referenced entities during imports.
   */
  async findOrCreateByCode(tenantId, shopId, codes) {
    if (codes.length === 0) {
      return { codeToId: /* @__PURE__ */ new Map(), created: 0 };
    }
    const uniqueCodes = [...new Set(codes)];
    let entities = await this.db.selectFrom(this.tableName).select(["id", "code"]).where("shop_id", "=", shopId).where("code", "in", uniqueCodes).execute();
    const existingCodes = new Set(entities.map((e) => e.code));
    const missingCodes = uniqueCodes.filter((code9) => !existingCodes.has(code9));
    if (missingCodes.length > 0) {
      const newEntities = await this.db.insertInto(this.tableName).values(
        missingCodes.map((code9) => ({
          code: code9,
          title: code9,
          shop_id: shopId,
          tenant_id: tenantId,
          updated_at: /* @__PURE__ */ new Date()
        }))
      ).returning(["id", "code"]).execute();
      entities = [...entities, ...newEntities];
    }
    return {
      codeToId: new Map(entities.map((e) => [e.code, e.id])),
      created: missingCodes.length
    };
  }
};

// src/common/pipes/query-validation.pipe.ts
import { BadRequestException as BadRequestException4, Injectable as Injectable4 } from "@nestjs/common";
import { ZodError } from "zod";
var QueryValidationPipe = class {
  constructor(schema) {
    this.schema = schema;
  }
  transform(value, metadata) {
    if (metadata.type !== "custom") {
      return value;
    }
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((err) => {
          const path = err.path.join(".");
          return path ? `${path}: ${err.message}` : err.message;
        });
        throw new BadRequestException4({
          message: "Query validation failed",
          errors: messages
        });
      }
      throw error;
    }
  }
};
QueryValidationPipe = __decorateClass([
  Injectable4()
], QueryValidationPipe);

// src/common/pipes/zod-validation.pipe.ts
import { BadRequestException as BadRequestException5 } from "@nestjs/common";
import { ZodError as ZodError2 } from "zod";
var ZodValidationPipe = class {
  constructor(schema) {
    this.schema = schema;
  }
  transform(value, _metadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError2) {
        const messages = error.issues.map((err) => {
          const path = err.path.join(".");
          return path ? `${path}: ${err.message}` : err.message;
        });
        throw new BadRequestException5({
          message: "Validation failed",
          errors: messages
        });
      }
      throw error;
    }
  }
};

// src/common/helpers/access.helpers.ts
import { NotFoundException as NotFoundException2 } from "@nestjs/common";
function assertShopAccess(entity, ctx, entityName, id6) {
  if (!entity) {
    throw new NotFoundException2(`${entityName} with id ${id6} not found`);
  }
  if (entity.shop_id !== ctx.shopId || entity.tenant_id !== ctx.tenantId) {
    throw new NotFoundException2(`${entityName} with id ${id6} not found in this shop/tenant`);
  }
}

// src/common/helpers/export-import.helpers.ts
function sendJsonExport(res, data, filename) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.json(data);
}
function sendCsvExport(res, data, filename, columns) {
  const csv = columns ? toCsv(data, columns) : toCsv(data, Object.keys(data[0] || {}));
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}
function parseCsvImport(file, body, requiredColumns) {
  let csvContent;
  if (file) {
    csvContent = file.buffer.toString("utf-8");
  } else if (body) {
    csvContent = body;
  } else {
    throw new Error("Either file or CSV body is required");
  }
  return fromCsv(csvContent, requiredColumns);
}

// src/common/helpers/import.helpers.ts
import { BadRequestException as BadRequestException6 } from "@nestjs/common";
function parseImportData(file, bodyItems) {
  let data;
  if (file) {
    const content = file.buffer.toString("utf-8");
    data = JSON.parse(content);
  } else if (bodyItems) {
    data = bodyItems;
  } else {
    throw new BadRequestException6("Either file or JSON body is required");
  }
  if (!Array.isArray(data)) {
    throw new BadRequestException6("Data must be an array");
  }
  return data;
}
function validateArray(data, schema) {
  return data.map((item, index) => {
    try {
      return schema.parse(item);
    } catch (error) {
      throw new BadRequestException6(`Invalid item at index ${index}: ${error}`);
    }
  });
}
function parseAndValidateImport(file, bodyItems, schema) {
  const data = parseImportData(file, bodyItems);
  return validateArray(data, schema);
}

// src/common/helpers/schema.utils.ts
import { z } from "zod";
var zodSchemas = {
  /** Standard title field: 1-255 chars */
  title: () => z.string().min(1).max(255),
  /** Standard name field: 1-255 chars */
  name: () => z.string().min(1).max(255),
  /** Email field with max length */
  email: () => z.string().email().max(255),
  /** Short code field: 1-100 chars */
  code: () => z.string().min(1).max(100),
  /** Short identifier: 1-50 chars */
  shortId: () => z.string().min(1).max(50),
  /** Description field: up to 500 chars */
  description: () => z.string().max(500),
  /** Positive integer ID (for foreign keys) */
  id: () => z.number().int().positive(),
  /** Non-negative integer (for quantities) */
  quantity: () => z.number().int().nonnegative(),
  /** YYYY-MM period format */
  period: () => z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be in YYYY-MM format")
};

// src/common/base-examples.controller.ts
import { Get, Header } from "@nestjs/common";
var BaseExamplesController = class {
  getJsonExample() {
    this.setJsonHeaders();
    return this.examples;
  }
  getCsvExample() {
    this.setCsvHeaders();
    return toCsv(this.examples, this.csvColumns);
  }
  setJsonHeaders() {
  }
  setCsvHeaders() {
  }
  getJsonFilename() {
    return `${this.entityName}-example.json`;
  }
  getCsvFilename() {
    return `${this.entityName}-example.csv`;
  }
};
__decorateClass([
  Get("json"),
  Header("Content-Type", "application/json")
], BaseExamplesController.prototype, "getJsonExample", 1);
__decorateClass([
  Get("csv"),
  Header("Content-Type", "text/csv")
], BaseExamplesController.prototype, "getCsvExample", 1);

// src/common/schemas.ts
import { z as z2 } from "zod";
var PaginationQuerySchema = z2.object({
  limit: z2.coerce.number().int().min(1).max(1e3).optional(),
  offset: z2.coerce.number().int().min(0).optional()
});

// src/entities/api-keys/api-keys.schema.ts
import { z as z3 } from "zod";
var { id, name } = zodSchemas;
var CreateApiKeySchema = z3.object({
  user_id: id(),
  name: name().optional(),
  expires_at: z3.string().datetime().optional()
});
var UpdateApiKeySchema = z3.object({
  name: name().nullable().optional(),
  expires_at: z3.string().datetime().nullable().optional()
});

// src/entities/api-keys/api-keys.controller.ts
var ApiKeysController = class {
  constructor(apiKeysService) {
    this.apiKeysService = apiKeysService;
  }
  async findAll(userId) {
    if (userId) {
      return this.apiKeysService.findByUserId(Number.parseInt(userId, 10));
    }
    return this.apiKeysService.findAll();
  }
  async findById(id6) {
    return this.apiKeysService.findById(id6);
  }
  async create(dto) {
    return this.apiKeysService.create(dto);
  }
  async update(id6, dto) {
    return this.apiKeysService.update(id6, dto);
  }
  async delete(id6) {
    return this.apiKeysService.delete(id6);
  }
};
__decorateClass([
  Get2(),
  __decorateParam(0, Query("user_id"))
], ApiKeysController.prototype, "findAll", 1);
__decorateClass([
  Get2(":id"),
  __decorateParam(0, Param("id", ParseIntPipe))
], ApiKeysController.prototype, "findById", 1);
__decorateClass([
  Post(),
  __decorateParam(0, Body(new ZodValidationPipe(CreateApiKeySchema)))
], ApiKeysController.prototype, "create", 1);
__decorateClass([
  Put(":id"),
  __decorateParam(0, Param("id", ParseIntPipe)),
  __decorateParam(1, Body(new ZodValidationPipe(UpdateApiKeySchema)))
], ApiKeysController.prototype, "update", 1);
__decorateClass([
  Delete(":id"),
  __decorateParam(0, Param("id", ParseIntPipe))
], ApiKeysController.prototype, "delete", 1);
ApiKeysController = __decorateClass([
  Controller("api-keys"),
  UseGuards(AuthGuard, SystemAdminGuard)
], ApiKeysController);

// src/entities/api-keys/api-keys.module.ts
import { forwardRef as forwardRef3, Module as Module4 } from "@nestjs/common";

// src/entities/tenants/tenants.module.ts
import { forwardRef as forwardRef2, Module as Module3 } from "@nestjs/common";

// src/entities/user-roles/user-roles.module.ts
import { forwardRef, Module as Module2 } from "@nestjs/common";

// src/entities/user-roles/user-roles.controller.ts
import {
  Body as Body2,
  Controller as Controller2,
  Delete as Delete2,
  ForbiddenException as ForbiddenException4,
  Get as Get3,
  NotFoundException as NotFoundException3,
  Param as Param2,
  ParseIntPipe as ParseIntPipe2,
  Post as Post2,
  Query as Query2,
  Req,
  UseGuards as UseGuards2
} from "@nestjs/common";
var UserRolesController = class {
  constructor(userRolesService) {
    this.userRolesService = userRolesService;
  }
  async findAll(req, userId, roleId, tenantId) {
    if (req.user.isSystemAdmin) {
      if (tenantId) {
        return this.userRolesService.findByTenantId(Number(tenantId));
      }
      if (userId) {
        return this.userRolesService.findByUserId(Number(userId));
      }
      if (roleId) {
        return this.userRolesService.findByRoleId(Number(roleId));
      }
      return this.userRolesService.findAll();
    }
    if (!tenantId) {
      throw new ForbiddenException4("tenantId query parameter is required");
    }
    const tid = Number(tenantId);
    if (!hasTenantAccess(req.user, tid)) {
      throw new ForbiddenException4("Access to this tenant is not allowed");
    }
    let roles = await this.userRolesService.findByTenantId(tid);
    if (userId) {
      roles = roles.filter((r) => r.user_id === Number(userId));
    }
    if (roleId) {
      roles = roles.filter((r) => r.role_id === Number(roleId));
    }
    return roles;
  }
  async findById(req, id6) {
    const userRole = await this.userRolesService.findById(id6);
    if (!userRole) {
      throw new NotFoundException3(`UserRole with id ${id6} not found`);
    }
    if (!req.user.isSystemAdmin) {
      if (!userRole.tenant_id || !hasTenantAccess(req.user, userRole.tenant_id)) {
        throw new ForbiddenException4("Access to this user role is not allowed");
      }
    }
    return userRole;
  }
  async create(req, dto) {
    if (!req.user.isSystemAdmin) {
      if (!dto.tenant_id) {
        throw new ForbiddenException4("tenant_id is required");
      }
      validateTenantAdminAccess(req.user, dto.tenant_id);
    }
    return this.userRolesService.create(dto);
  }
  async delete(req, id6) {
    const userRole = await this.userRolesService.findById(id6);
    if (!userRole) {
      throw new NotFoundException3(`UserRole with id ${id6} not found`);
    }
    if (!req.user.isSystemAdmin) {
      if (!userRole.tenant_id || !hasTenantAccess(req.user, userRole.tenant_id)) {
        throw new ForbiddenException4("Cannot delete user role from another tenant");
      }
    }
    await this.userRolesService.delete(id6);
  }
};
__decorateClass([
  Get3(),
  __decorateParam(0, Req()),
  __decorateParam(1, Query2("userId")),
  __decorateParam(2, Query2("roleId")),
  __decorateParam(3, Query2("tenantId"))
], UserRolesController.prototype, "findAll", 1);
__decorateClass([
  Get3(":id"),
  __decorateParam(0, Req()),
  __decorateParam(1, Param2("id", ParseIntPipe2))
], UserRolesController.prototype, "findById", 1);
__decorateClass([
  Post2(),
  __decorateParam(0, Req()),
  __decorateParam(1, Body2())
], UserRolesController.prototype, "create", 1);
__decorateClass([
  Delete2(":id"),
  __decorateParam(0, Req()),
  __decorateParam(1, Param2("id", ParseIntPipe2))
], UserRolesController.prototype, "delete", 1);
UserRolesController = __decorateClass([
  Controller2("user-roles"),
  UseGuards2(AuthGuard)
], UserRolesController);

// src/entities/user-roles/user-roles.service.ts
import { Injectable as Injectable5 } from "@nestjs/common";
var UserRolesService = class {
  constructor(db) {
    this.db = db;
  }
  async findAll() {
    return this.db.selectFrom("user_roles").selectAll().execute();
  }
  async findByUserId(userId) {
    return this.db.selectFrom("user_roles").selectAll().where("user_id", "=", userId).execute();
  }
  async findByRoleId(roleId) {
    return this.db.selectFrom("user_roles").selectAll().where("role_id", "=", roleId).execute();
  }
  async findByTenantId(tenantId) {
    return this.db.selectFrom("user_roles").selectAll().where("tenant_id", "=", tenantId).execute();
  }
  async findById(id6) {
    return this.db.selectFrom("user_roles").selectAll().where("id", "=", id6).executeTakeFirst();
  }
  async hasRole(userId, roleName, tenantId) {
    let query = this.db.selectFrom("user_roles").innerJoin("roles", "roles.id", "user_roles.role_id").select("user_roles.id").where("user_roles.user_id", "=", userId).where("roles.name", "=", roleName);
    if (tenantId !== void 0) {
      query = query.where("user_roles.tenant_id", "=", tenantId);
    }
    const result = await query.executeTakeFirst();
    return !!result;
  }
  async create(dto) {
    try {
      return this.db.insertInto("user_roles").values(dto).returningAll().executeTakeFirstOrThrow();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          "User Role",
          `User ${dto.user_id} - Role ${dto.role_id}`
        );
      }
      throw error;
    }
  }
  async delete(id6) {
    await this.db.deleteFrom("user_roles").where("id", "=", id6).execute();
  }
  async deleteByUserAndRole(userId, roleId) {
    await this.db.deleteFrom("user_roles").where("user_id", "=", userId).where("role_id", "=", roleId).execute();
  }
  async findByUserIdWithRoleNames(userId) {
    return this.db.selectFrom("user_roles").innerJoin("roles", "roles.id", "user_roles.role_id").select(["user_roles.tenant_id", "user_roles.shop_id", "roles.name as role_name"]).where("user_roles.user_id", "=", userId).execute();
  }
};
UserRolesService = __decorateClass([
  Injectable5()
], UserRolesService);

// src/entities/user-roles/user-roles.module.ts
var UserRolesModule = class {
};
UserRolesModule = __decorateClass([
  Module2({
    imports: [forwardRef(() => ApiKeysModule), forwardRef(() => TenantsModule)],
    controllers: [UserRolesController],
    providers: [UserRolesService, AuthGuard],
    exports: [UserRolesService]
  })
], UserRolesModule);

// src/entities/tenants/tenants.controller.ts
import {
  Body as Body3,
  Controller as Controller3,
  Delete as Delete3,
  Get as Get4,
  NotFoundException as NotFoundException4,
  Param as Param3,
  ParseIntPipe as ParseIntPipe3,
  Post as Post3,
  Put as Put2,
  Query as Query3,
  Req as Req2,
  UseGuards as UseGuards3
} from "@nestjs/common";

// src/entities/tenants/tenants.schema.ts
import { z as z4 } from "zod";
var { title, email, name: name2, id: id2 } = zodSchemas;
var CreateTenantRequestSchema = z4.object({
  title: title(),
  owner_id: id2().optional()
});
var CreateTenantSchema = z4.object({
  title: title(),
  owner_id: id2().optional(),
  created_by: id2().optional()
});
var UpdateTenantSchema = z4.object({
  title: title().optional(),
  owner_id: id2().nullable().optional()
});
var CreateTenantWithShopSchema = z4.object({
  tenantTitle: title(),
  shopTitle: title().optional(),
  userEmail: email(),
  userName: name2()
});

// src/entities/tenants/tenants.controller.ts
var TenantsController = class {
  constructor(tenantsService) {
    this.tenantsService = tenantsService;
  }
  async findAll(_req, ownerId) {
    if (ownerId) {
      return this.tenantsService.findByOwnerId(Number.parseInt(ownerId, 10));
    }
    return this.tenantsService.findAll();
  }
  async findById(_req, id6) {
    const tenant = await this.tenantsService.findById(id6);
    if (!tenant) {
      throw new NotFoundException4(`Tenant with id ${id6} not found`);
    }
    return tenant;
  }
  async create(req, dto) {
    return this.tenantsService.create({
      ...dto,
      created_by: req.user.id
    });
  }
  async update(id6, dto) {
    const tenant = await this.tenantsService.update(id6, dto);
    if (!tenant) {
      throw new NotFoundException4(`Tenant with id ${id6} not found`);
    }
    return tenant;
  }
  async delete(_req, id6) {
    await this.tenantsService.delete(id6);
  }
  async createWithShop(_req, dto) {
    return this.tenantsService.createTenantWithShopAndUser(dto);
  }
};
__decorateClass([
  Get4(),
  __decorateParam(0, Req2()),
  __decorateParam(1, Query3("owner_id"))
], TenantsController.prototype, "findAll", 1);
__decorateClass([
  Get4(":id"),
  __decorateParam(0, Req2()),
  __decorateParam(1, Param3("id", ParseIntPipe3))
], TenantsController.prototype, "findById", 1);
__decorateClass([
  Post3(),
  UseGuards3(SystemAdminGuard),
  __decorateParam(0, Req2()),
  __decorateParam(1, Body3(new ZodValidationPipe(CreateTenantRequestSchema)))
], TenantsController.prototype, "create", 1);
__decorateClass([
  Put2(":id"),
  __decorateParam(0, Param3("id", ParseIntPipe3)),
  __decorateParam(1, Body3(new ZodValidationPipe(UpdateTenantSchema)))
], TenantsController.prototype, "update", 1);
__decorateClass([
  Delete3(":id"),
  __decorateParam(0, Req2()),
  __decorateParam(1, Param3("id", ParseIntPipe3))
], TenantsController.prototype, "delete", 1);
__decorateClass([
  Post3("with-shop-and-user"),
  UseGuards3(SystemAdminGuard),
  __decorateParam(0, Req2()),
  __decorateParam(1, Body3(new ZodValidationPipe(CreateTenantWithShopSchema)))
], TenantsController.prototype, "createWithShop", 1);
TenantsController = __decorateClass([
  Controller3("tenants"),
  UseGuards3(AuthGuard)
], TenantsController);

// src/entities/tenants/tenants.service.ts
import { Injectable as Injectable6 } from "@nestjs/common";
var TenantsService = class {
  constructor(db) {
    this.db = db;
  }
  async findAll() {
    return this.db.selectFrom("tenants").selectAll().execute();
  }
  async findById(id6) {
    return this.db.selectFrom("tenants").selectAll().where("id", "=", id6).executeTakeFirst();
  }
  async findByOwnerId(ownerId) {
    return this.db.selectFrom("tenants").selectAll().where("owner_id", "=", ownerId).execute();
  }
  async create(dto) {
    return this.db.insertInto("tenants").values(dto).returningAll().executeTakeFirstOrThrow();
  }
  async update(id6, dto) {
    return this.db.updateTable("tenants").set({ ...dto, updated_at: /* @__PURE__ */ new Date() }).where("id", "=", id6).returningAll().executeTakeFirst();
  }
  async delete(id6) {
    await this.db.deleteFrom("tenants").where("id", "=", id6).execute();
  }
  async createTenantWithShopAndUser(dto) {
    return this.db.transaction().execute(async (trx) => {
      const user = await trx.insertInto("users").values({
        email: dto.userEmail,
        name: dto.userName,
        updated_at: /* @__PURE__ */ new Date()
      }).returningAll().executeTakeFirstOrThrow();
      const apiKeyValue = `sk_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      await trx.insertInto("api_keys").values({
        user_id: user.id,
        key: apiKeyValue,
        name: "Default API Key"
      }).execute();
      const tenant = await trx.insertInto("tenants").values({
        title: dto.tenantTitle,
        owner_id: user.id,
        created_by: user.id
      }).returningAll().executeTakeFirstOrThrow();
      const shop = await trx.insertInto("shops").values({
        title: dto.shopTitle || dto.tenantTitle,
        tenant_id: tenant.id
      }).returningAll().executeTakeFirstOrThrow();
      const tenantAdminRole = await trx.selectFrom("roles").select("id").where("name", "=", ROLE_NAMES.TENANT_ADMIN).executeTakeFirst();
      if (tenantAdminRole) {
        await trx.insertInto("user_roles").values({
          user_id: user.id,
          role_id: tenantAdminRole.id,
          tenant_id: tenant.id
        }).execute();
      }
      return {
        tenant,
        shop: {
          id: shop.id,
          title: shop.title,
          tenant_id: shop.tenant_id
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        apiKey: apiKeyValue
      };
    });
  }
};
TenantsService = __decorateClass([
  Injectable6()
], TenantsService);

// src/entities/tenants/tenants.module.ts
var TenantsModule = class {
};
TenantsModule = __decorateClass([
  Module3({
    imports: [DatabaseModule, forwardRef2(() => ApiKeysModule), forwardRef2(() => UserRolesModule)],
    controllers: [TenantsController],
    providers: [TenantsService],
    exports: [TenantsService]
  })
], TenantsModule);

// src/entities/api-keys/api-keys.service.ts
import { Injectable as Injectable7 } from "@nestjs/common";
var ApiKeysService = class {
  constructor(db) {
    this.db = db;
  }
  async findAll() {
    return this.db.selectFrom("api_keys").selectAll().execute();
  }
  async findById(id6) {
    return this.db.selectFrom("api_keys").selectAll().where("id", "=", id6).executeTakeFirst();
  }
  async findByKey(key) {
    return this.db.selectFrom("api_keys").selectAll().where("key", "=", key).executeTakeFirst();
  }
  async findByUserId(userId) {
    return this.db.selectFrom("api_keys").selectAll().where("user_id", "=", userId).execute();
  }
  async findValidByKey(key) {
    const apiKey = await this.findByKey(key);
    if (!apiKey) return null;
    if (apiKey.expires_at && new Date(apiKey.expires_at) < /* @__PURE__ */ new Date()) {
      return null;
    }
    await this.db.updateTable("api_keys").set({ last_used_at: /* @__PURE__ */ new Date(), updated_at: /* @__PURE__ */ new Date() }).where("id", "=", apiKey.id).execute();
    return apiKey;
  }
  async create(data) {
    const key = crypto.randomUUID();
    try {
      return this.db.insertInto("api_keys").values({
        user_id: data.user_id,
        key,
        name: data.name,
        expires_at: data.expires_at ? new Date(data.expires_at) : null
      }).returningAll().executeTakeFirstOrThrow();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException("API Key", key);
      }
      throw error;
    }
  }
  // Internal method for bootstrap - allows setting a specific key
  async createWithKey(data) {
    try {
      return this.db.insertInto("api_keys").values({
        user_id: data.user_id,
        key: data.key,
        name: data.name,
        expires_at: data.expires_at ? new Date(data.expires_at) : null
      }).returningAll().executeTakeFirstOrThrow();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException("API Key", data.key);
      }
      throw error;
    }
  }
  async update(id6, data) {
    return this.db.updateTable("api_keys").set({
      ...data,
      expires_at: data.expires_at ? new Date(data.expires_at) : null,
      updated_at: /* @__PURE__ */ new Date()
    }).where("id", "=", id6).returningAll().executeTakeFirst();
  }
  async delete(id6) {
    return this.db.deleteFrom("api_keys").where("id", "=", id6).returningAll().executeTakeFirst();
  }
  async deleteByUserId(userId) {
    return this.db.deleteFrom("api_keys").where("user_id", "=", userId).execute();
  }
};
ApiKeysService = __decorateClass([
  Injectable7()
], ApiKeysService);

// src/entities/api-keys/api-keys.module.ts
var ApiKeysModule = class {
};
ApiKeysModule = __decorateClass([
  Module4({
    imports: [forwardRef3(() => UserRolesModule), forwardRef3(() => TenantsModule)],
    controllers: [ApiKeysController],
    providers: [ApiKeysService, AuthGuard, SystemAdminGuard],
    exports: [ApiKeysService]
  })
], ApiKeysModule);

// src/app.controller.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Controller as Controller4, Get as Get5 } from "@nestjs/common";
var AppController = class {
  constructor(appService) {
    this.appService = appService;
  }
  getHello() {
    return this.appService.getHello();
  }
  getHealth() {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
    return { status: "ok", version: packageJson.version };
  }
  getVersion() {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
    return { version: packageJson.version };
  }
};
__decorateClass([
  Get5()
], AppController.prototype, "getHello", 1);
__decorateClass([
  Get5("health")
], AppController.prototype, "getHealth", 1);
__decorateClass([
  Get5("version")
], AppController.prototype, "getVersion", 1);
AppController = __decorateClass([
  Controller4()
], AppController);

// src/app.service.ts
import { Injectable as Injectable8 } from "@nestjs/common";
var AppService = class {
  getHello() {
    return "Sales Planner API";
  }
};
AppService = __decorateClass([
  Injectable8()
], AppService);

// src/auth/auth.module.ts
import { Global as Global2, Module as Module5 } from "@nestjs/common";
var AuthModule = class {
};
AuthModule = __decorateClass([
  Global2(),
  Module5({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule],
    providers: [AuthGuard],
    exports: [AuthGuard]
  })
], AuthModule);

// src/bootstrap/bootstrap.module.ts
import { Module as Module9 } from "@nestjs/common";

// src/entities/marketplaces/marketplaces.module.ts
import { Module as Module6 } from "@nestjs/common";

// src/entities/marketplaces/marketplaces.controller.ts
import {
  Body as Body4,
  Controller as Controller5,
  Delete as Delete4,
  Get as Get6,
  NotFoundException as NotFoundException5,
  Param as Param4,
  ParseIntPipe as ParseIntPipe4,
  Post as Post4,
  Put as Put3,
  Query as Query4,
  Req as Req3,
  Res,
  UploadedFile,
  UseGuards as UseGuards4,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

// src/entities/marketplaces/marketplaces.schema.ts
import { z as z5 } from "zod";
var { shortId, title: title2 } = zodSchemas;
var CreateMarketplaceSchema = z5.object({
  code: shortId(),
  title: title2()
});
var UpdateMarketplaceSchema = z5.object({
  code: shortId().optional(),
  title: title2().optional()
  // Note: shop_id and tenant_id are intentionally not updatable
});
var ImportMarketplaceItemSchema = z5.object({
  code: shortId(),
  title: title2()
});

// src/entities/marketplaces/marketplaces.controller.ts
var MarketplacesController = class {
  constructor(marketplacesService) {
    this.marketplacesService = marketplacesService;
  }
  async findAll(_req, ctx, query) {
    return this.marketplacesService.findByShopIdPaginated(ctx.shopId, query);
  }
  async findByCode(_req, ctx, code9) {
    const marketplace = await this.marketplacesService.findByCodeAndShop(code9, ctx.shopId);
    if (!marketplace || marketplace.tenant_id !== ctx.tenantId) {
      throw new NotFoundException5(`Marketplace with code ${code9} not found`);
    }
    return marketplace;
  }
  async exportJson(_req, ctx, res) {
    const items = await this.marketplacesService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, "marketplaces.json");
  }
  async exportCsv(_req, ctx, res) {
    const items = await this.marketplacesService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, "marketplaces.csv", ["code", "title"]);
  }
  async findById(_req, ctx, id6) {
    const marketplace = await this.marketplacesService.findById(id6);
    assertShopAccess(marketplace, ctx, "Marketplace", id6);
    return marketplace;
  }
  async create(_req, ctx, dto) {
    return this.marketplacesService.create({
      ...dto,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId
    });
  }
  async update(_req, ctx, id6, dto) {
    const marketplace = await this.marketplacesService.findById(id6);
    assertShopAccess(marketplace, ctx, "Marketplace", id6);
    return this.marketplacesService.update(id6, dto);
  }
  async delete(_req, ctx, id6) {
    const marketplace = await this.marketplacesService.findById(id6);
    assertShopAccess(marketplace, ctx, "Marketplace", id6);
    await this.marketplacesService.delete(id6);
    return { message: "Marketplace deleted successfully" };
  }
  async importJson(_req, ctx, items, file) {
    const validatedData = parseAndValidateImport(file, items, ImportMarketplaceItemSchema);
    return this.marketplacesService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
  async importCsv(_req, ctx, file) {
    const records = parseCsvImport(file, void 0, [
      "code",
      "title"
    ]);
    const items = records.map((record) => ({
      code: record.code,
      title: record.title
    }));
    return this.marketplacesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
};
__decorateClass([
  Get6(),
  RequireReadAccess(),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Query4(new ZodValidationPipe(PaginationQuerySchema)))
], MarketplacesController.prototype, "findAll", 1);
__decorateClass([
  Get6("code/:code"),
  RequireReadAccess(),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param4("code"))
], MarketplacesController.prototype, "findByCode", 1);
__decorateClass([
  Get6("export/json"),
  RequireReadAccess(),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res())
], MarketplacesController.prototype, "exportJson", 1);
__decorateClass([
  Get6("export/csv"),
  RequireReadAccess(),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res())
], MarketplacesController.prototype, "exportCsv", 1);
__decorateClass([
  Get6(":id"),
  RequireReadAccess(),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param4("id", ParseIntPipe4))
], MarketplacesController.prototype, "findById", 1);
__decorateClass([
  Post4(),
  RequireWriteAccess(),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body4(new ZodValidationPipe(CreateMarketplaceSchema)))
], MarketplacesController.prototype, "create", 1);
__decorateClass([
  Put3(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param4("id", ParseIntPipe4)),
  __decorateParam(3, Body4(new ZodValidationPipe(UpdateMarketplaceSchema)))
], MarketplacesController.prototype, "update", 1);
__decorateClass([
  Delete4(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param4("id", ParseIntPipe4))
], MarketplacesController.prototype, "delete", 1);
__decorateClass([
  Post4("import/json"),
  RequireWriteAccess(),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body4()),
  __decorateParam(3, UploadedFile())
], MarketplacesController.prototype, "importJson", 1);
__decorateClass([
  Post4("import/csv"),
  RequireWriteAccess(),
  UseInterceptors(FileInterceptor("file")),
  __decorateParam(0, Req3()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, UploadedFile())
], MarketplacesController.prototype, "importCsv", 1);
MarketplacesController = __decorateClass([
  Controller5("marketplaces"),
  UseGuards4(AuthGuard)
], MarketplacesController);

// src/entities/marketplaces/marketplaces-examples.controller.ts
import { Controller as Controller6 } from "@nestjs/common";
var EXAMPLE_MARKETPLACES = [
  { code: "wb", title: "Wildberries" },
  { code: "ozon", title: "Ozon" },
  { code: "ym", title: "Yandex Market" }
];
var MarketplacesExamplesController = class extends BaseExamplesController {
  examples = EXAMPLE_MARKETPLACES;
  entityName = "marketplaces";
  csvColumns = ["code", "title"];
};
MarketplacesExamplesController = __decorateClass([
  Controller6("marketplaces/examples")
], MarketplacesExamplesController);

// src/entities/marketplaces/marketplaces.repository.ts
import { Injectable as Injectable9 } from "@nestjs/common";
var MarketplacesRepository = class extends CodedShopScopedRepository {
  constructor(db) {
    super(db, "marketplaces", USER_QUERYABLE_TABLES);
  }
};
MarketplacesRepository = __decorateClass([
  Injectable9()
], MarketplacesRepository);

// src/entities/marketplaces/marketplaces.service.ts
import { Injectable as Injectable10 } from "@nestjs/common";
var MarketplacesService = class extends CodedShopScopedEntityService {
  constructor(marketplacesRepository) {
    super(marketplacesRepository, "marketplace", ImportMarketplaceItemSchema);
    this.marketplacesRepository = marketplacesRepository;
  }
};
MarketplacesService = __decorateClass([
  Injectable10()
], MarketplacesService);

// src/entities/marketplaces/marketplaces.module.ts
var MarketplacesModule = class {
};
MarketplacesModule = __decorateClass([
  Module6({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule],
    controllers: [MarketplacesController, MarketplacesExamplesController],
    providers: [MarketplacesRepository, MarketplacesService, AuthGuard, SystemAdminGuard],
    exports: [MarketplacesService]
  })
], MarketplacesModule);

// src/roles/roles.module.ts
import { Module as Module7 } from "@nestjs/common";

// src/roles/roles.controller.ts
import {
  Body as Body5,
  Controller as Controller7,
  Delete as Delete5,
  Get as Get7,
  NotFoundException as NotFoundException6,
  Param as Param5,
  ParseIntPipe as ParseIntPipe5,
  Post as Post5,
  Put as Put4,
  UseGuards as UseGuards5
} from "@nestjs/common";

// src/roles/roles.schema.ts
import { z as z6 } from "zod";
var { code, description } = zodSchemas;
var CreateRoleSchema = z6.object({
  name: code(),
  // role names are short codes (1-100 chars)
  description: description().optional()
});
var UpdateRoleSchema = z6.object({
  name: code().optional(),
  description: description().nullable().optional()
});

// src/roles/roles.controller.ts
var RolesController = class {
  constructor(rolesService) {
    this.rolesService = rolesService;
  }
  async findAll() {
    return this.rolesService.findAll();
  }
  async findById(id6) {
    const role = await this.rolesService.findById(id6);
    if (!role) {
      throw new NotFoundException6(`Role with id ${id6} not found`);
    }
    return role;
  }
  async create(dto) {
    return this.rolesService.create(dto);
  }
  async update(id6, dto) {
    const role = await this.rolesService.update(id6, dto);
    if (!role) {
      throw new NotFoundException6(`Role with id ${id6} not found`);
    }
    return role;
  }
  async delete(id6) {
    await this.rolesService.delete(id6);
  }
};
__decorateClass([
  Get7()
], RolesController.prototype, "findAll", 1);
__decorateClass([
  Get7(":id"),
  __decorateParam(0, Param5("id", ParseIntPipe5))
], RolesController.prototype, "findById", 1);
__decorateClass([
  Post5(),
  __decorateParam(0, Body5(new ZodValidationPipe(CreateRoleSchema)))
], RolesController.prototype, "create", 1);
__decorateClass([
  Put4(":id"),
  __decorateParam(0, Param5("id", ParseIntPipe5)),
  __decorateParam(1, Body5(new ZodValidationPipe(UpdateRoleSchema)))
], RolesController.prototype, "update", 1);
__decorateClass([
  Delete5(":id"),
  __decorateParam(0, Param5("id", ParseIntPipe5))
], RolesController.prototype, "delete", 1);
RolesController = __decorateClass([
  Controller7("roles"),
  UseGuards5(AuthGuard, SystemAdminGuard)
], RolesController);

// src/roles/roles.service.ts
import { Injectable as Injectable11 } from "@nestjs/common";
var RolesService = class {
  constructor(db) {
    this.db = db;
  }
  async findAll() {
    return this.db.selectFrom("roles").selectAll().execute();
  }
  async findById(id6) {
    return this.db.selectFrom("roles").selectAll().where("id", "=", id6).executeTakeFirst();
  }
  async findByName(name4) {
    return this.db.selectFrom("roles").selectAll().where("name", "=", name4).executeTakeFirst();
  }
  async create(dto) {
    try {
      return this.db.insertInto("roles").values(dto).returningAll().executeTakeFirstOrThrow();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException("Role", dto.name);
      }
      throw error;
    }
  }
  async update(id6, dto) {
    return this.db.updateTable("roles").set({ ...dto, updated_at: /* @__PURE__ */ new Date() }).where("id", "=", id6).returningAll().executeTakeFirst();
  }
  async delete(id6) {
    await this.db.deleteFrom("roles").where("id", "=", id6).execute();
  }
};
RolesService = __decorateClass([
  Injectable11()
], RolesService);

// src/roles/roles.module.ts
var RolesModule = class {
};
RolesModule = __decorateClass([
  Module7({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule],
    controllers: [RolesController],
    providers: [RolesService, AuthGuard, SystemAdminGuard],
    exports: [RolesService]
  })
], RolesModule);

// src/entities/users/users.module.ts
import { Module as Module8 } from "@nestjs/common";

// src/entities/users/users.controller.ts
import {
  Body as Body6,
  Controller as Controller8,
  Delete as Delete6,
  ForbiddenException as ForbiddenException5,
  Get as Get8,
  NotFoundException as NotFoundException7,
  Param as Param6,
  ParseIntPipe as ParseIntPipe6,
  Post as Post6,
  Query as Query5,
  Req as Req4,
  UseGuards as UseGuards6
} from "@nestjs/common";

// src/entities/users/users.schema.ts
import { z as z7 } from "zod";
var { email: email2, name: name3, id: id3 } = zodSchemas;
var CreateUserSchema = z7.object({
  email: email2(),
  name: name3(),
  default_shop_id: id3().optional()
});
var UpdateUserSchema = z7.object({
  email: email2().optional(),
  name: name3().optional(),
  default_shop_id: id3().nullable().optional()
});

// src/entities/users/users.controller.ts
var UsersController = class {
  constructor(usersService, userRolesService) {
    this.usersService = usersService;
    this.userRolesService = userRolesService;
  }
  async findAll(req, tenantId) {
    if (req.user.isSystemAdmin) {
      if (tenantId) {
        return this.usersService.findByTenantId(Number(tenantId));
      }
      return this.usersService.findAll();
    }
    if (!tenantId) {
      throw new ForbiddenException5("tenantId query parameter is required");
    }
    const tid = Number(tenantId);
    if (!hasTenantAccess(req.user, tid)) {
      throw new ForbiddenException5("Access to this tenant is not allowed");
    }
    return this.usersService.findByTenantId(tid);
  }
  async findById(req, id6) {
    const user = await this.usersService.findById(id6);
    if (!user) {
      throw new NotFoundException7(`User with id ${id6} not found`);
    }
    if (req.user.isSystemAdmin) {
      return user;
    }
    const userRoles = await this.userRolesService.findByUserId(id6);
    const hasAccessToUser = userRoles.some(
      (ur) => ur.tenant_id && hasTenantAccess(req.user, ur.tenant_id)
    );
    if (!hasAccessToUser) {
      throw new ForbiddenException5("Access to this user is not allowed");
    }
    return user;
  }
  async create(req, tenantId, dto) {
    if (!req.user.isSystemAdmin) {
      if (!tenantId) {
        throw new ForbiddenException5("tenantId query parameter is required");
      }
      validateTenantAdminAccess(req.user, Number(tenantId));
    }
    if (!dto) {
      throw new ForbiddenException5("Request body is required");
    }
    return this.usersService.create(dto);
  }
  async delete(req, id6) {
    const user = await this.usersService.findById(id6);
    if (!user) {
      throw new NotFoundException7(`User with id ${id6} not found`);
    }
    if (req.user.isSystemAdmin) {
      return this.usersService.delete(id6);
    }
    const userRoles = await this.userRolesService.findByUserId(id6);
    const allRolesInManagedTenants = userRoles.every(
      (ur) => ur.tenant_id && hasTenantAccess(req.user, ur.tenant_id)
    );
    if (!allRolesInManagedTenants) {
      throw new ForbiddenException5("Cannot delete user with roles in other tenants");
    }
    await this.usersService.delete(id6);
  }
};
__decorateClass([
  Get8(),
  __decorateParam(0, Req4()),
  __decorateParam(1, Query5("tenantId"))
], UsersController.prototype, "findAll", 1);
__decorateClass([
  Get8(":id"),
  __decorateParam(0, Req4()),
  __decorateParam(1, Param6("id", ParseIntPipe6))
], UsersController.prototype, "findById", 1);
__decorateClass([
  Post6(),
  __decorateParam(0, Req4()),
  __decorateParam(1, Query5("tenantId")),
  __decorateParam(2, Body6(new ZodValidationPipe(CreateUserSchema)))
], UsersController.prototype, "create", 1);
__decorateClass([
  Delete6(":id"),
  __decorateParam(0, Req4()),
  __decorateParam(1, Param6("id", ParseIntPipe6))
], UsersController.prototype, "delete", 1);
UsersController = __decorateClass([
  Controller8("users"),
  UseGuards6(AuthGuard)
], UsersController);

// src/entities/users/users.service.ts
import { Injectable as Injectable12 } from "@nestjs/common";
import { sql } from "kysely";
var UsersService = class {
  constructor(db) {
    this.db = db;
  }
  async findAll() {
    return this.db.selectFrom("users").selectAll().execute();
  }
  async findById(id6) {
    return this.db.selectFrom("users").selectAll().where("id", "=", id6).executeTakeFirst();
  }
  async findByEmail(email3) {
    return this.db.selectFrom("users").selectAll().where("email", "=", email3).executeTakeFirst();
  }
  async create(dto) {
    try {
      const result = await this.db.insertInto("users").values({
        email: dto.email,
        name: dto.name,
        updated_at: /* @__PURE__ */ new Date()
      }).returningAll().executeTakeFirstOrThrow();
      return result;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException("User", dto.email);
      }
      throw error;
    }
  }
  async update(id6, dto) {
    return this.db.updateTable("users").set({ ...dto, updated_at: /* @__PURE__ */ new Date() }).where("id", "=", id6).returningAll().executeTakeFirst();
  }
  async delete(id6) {
    await this.db.deleteFrom("users").where("id", "=", id6).execute();
  }
  async findByTenantId(tenantId) {
    return this.db.selectFrom("users").selectAll("users").innerJoin("user_roles", "user_roles.user_id", "users.id").where("user_roles.tenant_id", "=", tenantId).groupBy("users.id").execute();
  }
  async getUserWithRolesAndTenants(userId) {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }
    const rolesResult = await this.db.selectFrom("user_roles").innerJoin("roles", "roles.id", "user_roles.role_id").leftJoin("tenants", "tenants.id", "user_roles.tenant_id").leftJoin("shops", "shops.id", "user_roles.shop_id").select("user_roles.id").select(sql`roles.name`.as("role_name")).select("user_roles.tenant_id").select(sql`tenants.title`.as("tenant_title")).select("user_roles.shop_id").select(sql`shops.title`.as("shop_title")).where("user_roles.user_id", "=", userId).execute();
    const roles = rolesResult.map((r) => ({
      id: r.id,
      role_name: r.role_name,
      tenant_id: r.tenant_id,
      tenant_title: r.tenant_title,
      shop_id: r.shop_id,
      shop_title: r.shop_title
    }));
    const ownedTenantsResult = await this.db.selectFrom("tenants").select("id").select("title").where("owner_id", "=", userId).execute();
    for (const ownedTenant of ownedTenantsResult) {
      roles.push({
        id: 0,
        // Synthetic role, no actual user_roles record
        role_name: "tenantOwner",
        tenant_id: ownedTenant.id,
        tenant_title: ownedTenant.title,
        shop_id: null,
        shop_title: null
      });
    }
    const tenantIds = [
      .../* @__PURE__ */ new Set([
        ...roles.filter((r) => r.tenant_id !== null).map((r) => r.tenant_id),
        ...ownedTenantsResult.map((t) => t.id)
      ])
    ];
    const tenantsResult = await this.db.selectFrom("tenants").select("id").select("title").select("owner_id").where("id", "in", tenantIds.length > 0 ? tenantIds : [-1]).execute();
    const fullAccessTenantIds = /* @__PURE__ */ new Set();
    for (const tenant of tenantsResult) {
      if (tenant.owner_id === userId) {
        fullAccessTenantIds.add(tenant.id);
        continue;
      }
      const hasTenantAdmin = roles.some(
        (r) => r.tenant_id === tenant.id && r.role_name === ROLE_NAMES.TENANT_ADMIN && r.shop_id === null
      );
      if (hasTenantAdmin) {
        fullAccessTenantIds.add(tenant.id);
      }
    }
    const shopLevelRoleShopIds = new Set(
      roles.filter((r) => r.shop_id !== null).map((r) => r.shop_id)
    );
    const shopsResult = await this.db.selectFrom("shops").select("id").select("title").select("tenant_id").where("tenant_id", "in", tenantIds.length > 0 ? tenantIds : [-1]).execute();
    const shopsByTenant = shopsResult.reduce(
      (acc, shop) => {
        const hasFullTenantAccess = fullAccessTenantIds.has(shop.tenant_id);
        const hasShopLevelRole = shopLevelRoleShopIds.has(shop.id);
        if (hasFullTenantAccess || hasShopLevelRole) {
          if (!acc[shop.tenant_id]) {
            acc[shop.tenant_id] = [];
          }
          acc[shop.tenant_id]?.push({
            id: shop.id,
            title: shop.title
          });
        }
        return acc;
      },
      {}
    );
    const tenants = tenantsResult.map((t) => ({
      id: t.id,
      title: t.title,
      is_owner: t.owner_id === userId,
      shops: shopsByTenant[t.id] || []
    }));
    return {
      ...user,
      roles,
      tenants
    };
  }
};
UsersService = __decorateClass([
  Injectable12()
], UsersService);

// src/entities/users/users.module.ts
var UsersModule = class {
};
UsersModule = __decorateClass([
  Module8({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule],
    controllers: [UsersController],
    providers: [UsersService, AuthGuard],
    exports: [UsersService]
  })
], UsersModule);

// src/bootstrap/bootstrap.service.ts
import { Injectable as Injectable13, Logger } from "@nestjs/common";
var BootstrapService = class {
  constructor(configService, usersService, rolesService, userRolesService, apiKeysService) {
    this.configService = configService;
    this.usersService = usersService;
    this.rolesService = rolesService;
    this.userRolesService = userRolesService;
    this.apiKeysService = apiKeysService;
  }
  logger = new Logger(BootstrapService.name);
  async onModuleInit() {
    await this.seedRoles();
    await this.ensureSystemAdmin();
  }
  async seedRoles() {
    const roles = [
      { name: ROLE_NAMES.VIEWER, description: "Read-only access to a shop" },
      { name: ROLE_NAMES.EDITOR, description: "Can create and edit content in a shop" },
      { name: ROLE_NAMES.TENANT_ADMIN, description: "Full access to all shops in a tenant" }
    ];
    for (const role of roles) {
      const existing = await this.rolesService.findByName(role.name);
      if (!existing) {
        try {
          this.logger.log(`Creating role: ${role.name}`);
          await this.rolesService.create(role);
        } catch (error) {
          if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
            this.logger.debug(`Role ${role.name} already exists (created by another process)`);
          } else {
            throw error;
          }
        }
      }
    }
    this.logger.log("Roles seeding complete");
  }
  async ensureSystemAdmin() {
    const systemAdminKey = this.configService.get("SYSTEM_ADMIN_KEY");
    if (!systemAdminKey) {
      this.logger.warn("SYSTEM_ADMIN_KEY not set, skipping system admin initialization");
      return;
    }
    let systemAdminRole = await this.rolesService.findByName(ROLE_NAMES.SYSTEM_ADMIN);
    if (!systemAdminRole) {
      this.logger.log("Creating systemAdmin role...");
      systemAdminRole = await this.rolesService.create({
        name: ROLE_NAMES.SYSTEM_ADMIN,
        description: "System administrator with full access"
      });
    }
    const existingAdmins = await this.userRolesService.findByRoleId(systemAdminRole.id);
    if (existingAdmins.length > 0) {
      this.logger.log("System admin already exists, skipping initialization");
      return;
    }
    const existingApiKey = await this.apiKeysService.findByKey(systemAdminKey);
    let adminUser = existingApiKey ? await this.usersService.findById(existingApiKey.user_id) : void 0;
    if (!adminUser) {
      this.logger.log("Creating system admin user...");
      try {
        adminUser = await this.usersService.create({
          email: "admin@system.local",
          name: "System Admin"
        });
        await this.apiKeysService.createWithKey({
          user_id: adminUser.id,
          key: systemAdminKey,
          name: "System Admin Key"
        });
      } catch (error) {
        const users = await this.usersService.findAll();
        adminUser = users.find((u) => u.email === "admin@system.local");
        if (!adminUser) {
          throw error;
        }
        this.logger.log("System admin user already exists (created by another process)");
      }
    }
    const hasRole = await this.userRolesService.hasRole(adminUser.id, ROLE_NAMES.SYSTEM_ADMIN);
    if (!hasRole) {
      this.logger.log("Assigning systemAdmin role to user...");
      await this.userRolesService.create({
        user_id: adminUser.id,
        role_id: systemAdminRole.id
      });
    }
    this.logger.log("System admin initialization complete");
  }
};
BootstrapService = __decorateClass([
  Injectable13()
], BootstrapService);

// src/bootstrap/bootstrap.module.ts
var BootstrapModule = class {
};
BootstrapModule = __decorateClass([
  Module9({
    imports: [UsersModule, RolesModule, UserRolesModule, ApiKeysModule, MarketplacesModule],
    providers: [BootstrapService]
  })
], BootstrapModule);

// src/entities/brands/brands.controller.ts
import {
  Body as Body7,
  Controller as Controller9,
  Delete as Delete7,
  Get as Get9,
  NotFoundException as NotFoundException8,
  Param as Param7,
  ParseIntPipe as ParseIntPipe7,
  Post as Post7,
  Put as Put5,
  Query as Query6,
  Req as Req5,
  Res as Res2,
  UploadedFile as UploadedFile2,
  UseGuards as UseGuards7,
  UseInterceptors as UseInterceptors2
} from "@nestjs/common";
import { FileInterceptor as FileInterceptor2 } from "@nestjs/platform-express";

// src/entities/brands/brands.schema.ts
import { z as z8 } from "zod";
var { code: code2, title: title3 } = zodSchemas;
var CreateBrandSchema = z8.object({
  code: code2(),
  title: title3()
});
var UpdateBrandSchema = z8.object({
  code: code2().optional(),
  title: title3().optional()
  // Note: shop_id and tenant_id are intentionally not updatable
  // Once a brand is created in a shop/tenant, it stays there
});
var ImportBrandItemSchema = z8.object({
  code: code2(),
  title: title3()
});

// src/entities/brands/brands.controller.ts
var BrandsController = class {
  constructor(brandsService) {
    this.brandsService = brandsService;
  }
  async findAll(_req, ctx, query) {
    return this.brandsService.findByShopIdPaginated(ctx.shopId, query);
  }
  async findByCode(_req, ctx, code9) {
    const brand = await this.brandsService.findByCodeAndShop(code9, ctx.shopId);
    if (!brand || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException8(`Brand with code ${code9} not found`);
    }
    return brand;
  }
  async exportJson(_req, ctx, res) {
    const items = await this.brandsService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, "brands.json");
  }
  async exportCsv(_req, ctx, res) {
    const items = await this.brandsService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, "brands.csv", ["code", "title"]);
  }
  async findById(_req, ctx, id6) {
    const brand = await this.brandsService.findById(id6);
    assertShopAccess(brand, ctx, "Brand", id6);
    return brand;
  }
  async create(_req, ctx, body) {
    return this.brandsService.create({
      ...body,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId
    });
  }
  async update(_req, ctx, id6, body) {
    const brand = await this.brandsService.findById(id6);
    assertShopAccess(brand, ctx, "Brand", id6);
    const updated = await this.brandsService.update(id6, body);
    if (!updated) {
      throw new NotFoundException8(`Brand with id ${id6} not found`);
    }
    return updated;
  }
  async delete(_req, ctx, id6) {
    const brand = await this.brandsService.findById(id6);
    assertShopAccess(brand, ctx, "Brand", id6);
    await this.brandsService.delete(id6);
    return { message: "Brand deleted successfully" };
  }
  async importJson(_req, ctx, items, file) {
    const validatedData = parseAndValidateImport(file, items, ImportBrandItemSchema);
    return this.brandsService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
  async importCsv(_req, ctx, file) {
    const records = parseCsvImport(file, void 0, [
      "code",
      "title"
    ]);
    const items = records.map((record) => ({
      code: record.code,
      title: record.title
    }));
    return this.brandsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
};
__decorateClass([
  Get9(),
  RequireReadAccess(),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Query6(new ZodValidationPipe(PaginationQuerySchema)))
], BrandsController.prototype, "findAll", 1);
__decorateClass([
  Get9("code/:code"),
  RequireReadAccess(),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param7("code"))
], BrandsController.prototype, "findByCode", 1);
__decorateClass([
  Get9("export/json"),
  RequireReadAccess(),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res2())
], BrandsController.prototype, "exportJson", 1);
__decorateClass([
  Get9("export/csv"),
  RequireReadAccess(),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res2())
], BrandsController.prototype, "exportCsv", 1);
__decorateClass([
  Get9(":id"),
  RequireReadAccess(),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param7("id", ParseIntPipe7))
], BrandsController.prototype, "findById", 1);
__decorateClass([
  Post7(),
  RequireWriteAccess(),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body7(new ZodValidationPipe(CreateBrandSchema)))
], BrandsController.prototype, "create", 1);
__decorateClass([
  Put5(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param7("id", ParseIntPipe7)),
  __decorateParam(3, Body7(new ZodValidationPipe(UpdateBrandSchema)))
], BrandsController.prototype, "update", 1);
__decorateClass([
  Delete7(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param7("id", ParseIntPipe7))
], BrandsController.prototype, "delete", 1);
__decorateClass([
  Post7("import/json"),
  RequireWriteAccess(),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body7()),
  __decorateParam(3, UploadedFile2())
], BrandsController.prototype, "importJson", 1);
__decorateClass([
  Post7("import/csv"),
  RequireWriteAccess(),
  UseInterceptors2(FileInterceptor2("file")),
  __decorateParam(0, Req5()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, UploadedFile2())
], BrandsController.prototype, "importCsv", 1);
BrandsController = __decorateClass([
  Controller9("brands"),
  UseGuards7(AuthGuard)
], BrandsController);

// src/entities/brands/brands.module.ts
import { Module as Module10 } from "@nestjs/common";

// src/entities/brands/brands-examples.controller.ts
import { Controller as Controller10 } from "@nestjs/common";
var EXAMPLE_BRANDS = [
  { code: "apple", title: "Apple" },
  { code: "samsung", title: "Samsung" },
  { code: "dell", title: "Dell" }
];
var BrandsExamplesController = class extends BaseExamplesController {
  examples = EXAMPLE_BRANDS;
  entityName = "brands";
  csvColumns = ["code", "title"];
};
BrandsExamplesController = __decorateClass([
  Controller10("brands/examples")
], BrandsExamplesController);

// src/entities/brands/brands.repository.ts
import { Injectable as Injectable14 } from "@nestjs/common";
var BrandsRepository = class extends CodedShopScopedRepository {
  constructor(db) {
    super(db, "brands", USER_QUERYABLE_TABLES);
  }
};
BrandsRepository = __decorateClass([
  Injectable14()
], BrandsRepository);

// src/entities/brands/brands.service.ts
import { Injectable as Injectable15 } from "@nestjs/common";
var BrandsService = class extends CodedShopScopedEntityService {
  constructor(repository) {
    super(repository, "brand", ImportBrandItemSchema);
  }
};
BrandsService = __decorateClass([
  Injectable15()
], BrandsService);

// src/entities/brands/brands.module.ts
var BrandsModule = class {
};
BrandsModule = __decorateClass([
  Module10({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule],
    controllers: [BrandsController, BrandsExamplesController],
    providers: [BrandsRepository, BrandsService, AuthGuard],
    exports: [BrandsService]
  })
], BrandsModule);

// src/entities/categories/categories.controller.ts
import {
  Body as Body8,
  Controller as Controller11,
  Delete as Delete8,
  Get as Get10,
  NotFoundException as NotFoundException9,
  Param as Param8,
  ParseIntPipe as ParseIntPipe8,
  Post as Post8,
  Put as Put6,
  Query as Query7,
  Req as Req6,
  Res as Res3,
  UploadedFile as UploadedFile3,
  UseGuards as UseGuards8,
  UseInterceptors as UseInterceptors3
} from "@nestjs/common";
import { FileInterceptor as FileInterceptor3 } from "@nestjs/platform-express";

// src/entities/categories/categories.schema.ts
import { z as z9 } from "zod";
var { code: code3, title: title4 } = zodSchemas;
var CreateCategorySchema = z9.object({
  code: code3(),
  title: title4()
});
var UpdateCategorySchema = z9.object({
  code: code3().optional(),
  title: title4().optional()
});
var ImportCategoryItemSchema = z9.object({
  code: code3(),
  title: title4()
});

// src/entities/categories/categories.controller.ts
var CategoriesController = class {
  constructor(categoriesService) {
    this.categoriesService = categoriesService;
  }
  async findAll(_req, ctx, query) {
    return this.categoriesService.findByShopIdPaginated(ctx.shopId, query);
  }
  async findByCode(_req, ctx, code9) {
    const category = await this.categoriesService.findByCodeAndShop(code9, ctx.shopId);
    if (!category || category.tenant_id !== ctx.tenantId) {
      throw new NotFoundException9(`Category with code ${code9} not found`);
    }
    return category;
  }
  async exportJson(_req, ctx, res) {
    const items = await this.categoriesService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, "categories.json");
  }
  async exportCsv(_req, ctx, res) {
    const items = await this.categoriesService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, "categories.csv", ["code", "title"]);
  }
  async findById(_req, ctx, id6) {
    const category = await this.categoriesService.findById(id6);
    assertShopAccess(category, ctx, "Category", id6);
    return category;
  }
  async create(_req, ctx, body) {
    return this.categoriesService.create({
      ...body,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId
    });
  }
  async update(_req, ctx, id6, body) {
    const category = await this.categoriesService.findById(id6);
    assertShopAccess(category, ctx, "Category", id6);
    const updated = await this.categoriesService.update(id6, body);
    if (!updated) {
      throw new NotFoundException9(`Category with id ${id6} not found`);
    }
    return updated;
  }
  async delete(_req, ctx, id6) {
    const category = await this.categoriesService.findById(id6);
    assertShopAccess(category, ctx, "Category", id6);
    await this.categoriesService.delete(id6);
    return { message: "Category deleted successfully" };
  }
  async importJson(_req, ctx, items, file) {
    const validatedData = parseAndValidateImport(file, items, ImportCategoryItemSchema);
    return this.categoriesService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
  async importCsv(_req, ctx, file) {
    const records = parseCsvImport(file, void 0, [
      "code",
      "title"
    ]);
    const items = records.map((record) => ({
      code: record.code,
      title: record.title
    }));
    return this.categoriesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
};
__decorateClass([
  Get10(),
  RequireReadAccess(),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Query7(new ZodValidationPipe(PaginationQuerySchema)))
], CategoriesController.prototype, "findAll", 1);
__decorateClass([
  Get10("code/:code"),
  RequireReadAccess(),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param8("code"))
], CategoriesController.prototype, "findByCode", 1);
__decorateClass([
  Get10("export/json"),
  RequireReadAccess(),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res3())
], CategoriesController.prototype, "exportJson", 1);
__decorateClass([
  Get10("export/csv"),
  RequireReadAccess(),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res3())
], CategoriesController.prototype, "exportCsv", 1);
__decorateClass([
  Get10(":id"),
  RequireReadAccess(),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param8("id", ParseIntPipe8))
], CategoriesController.prototype, "findById", 1);
__decorateClass([
  Post8(),
  RequireWriteAccess(),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body8(new ZodValidationPipe(CreateCategorySchema)))
], CategoriesController.prototype, "create", 1);
__decorateClass([
  Put6(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param8("id", ParseIntPipe8)),
  __decorateParam(3, Body8(new ZodValidationPipe(UpdateCategorySchema)))
], CategoriesController.prototype, "update", 1);
__decorateClass([
  Delete8(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param8("id", ParseIntPipe8))
], CategoriesController.prototype, "delete", 1);
__decorateClass([
  Post8("import/json"),
  RequireWriteAccess(),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body8()),
  __decorateParam(3, UploadedFile3())
], CategoriesController.prototype, "importJson", 1);
__decorateClass([
  Post8("import/csv"),
  RequireWriteAccess(),
  UseInterceptors3(FileInterceptor3("file")),
  __decorateParam(0, Req6()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, UploadedFile3())
], CategoriesController.prototype, "importCsv", 1);
CategoriesController = __decorateClass([
  Controller11("categories"),
  UseGuards8(AuthGuard)
], CategoriesController);

// src/entities/categories/categories.module.ts
import { Module as Module11 } from "@nestjs/common";

// src/entities/categories/categories-examples.controller.ts
import { Controller as Controller12 } from "@nestjs/common";
var EXAMPLE_BRANDS2 = [
  { code: "apple", title: "Apple" },
  { code: "samsung", title: "Samsung" },
  { code: "dell", title: "Dell" }
];
var CategoriesExamplesController = class extends BaseExamplesController {
  examples = EXAMPLE_BRANDS2;
  entityName = "categories";
  csvColumns = ["code", "title"];
};
CategoriesExamplesController = __decorateClass([
  Controller12("categories/examples")
], CategoriesExamplesController);

// src/entities/categories/categories.repository.ts
import { Injectable as Injectable16 } from "@nestjs/common";
var CategoriesRepository = class extends CodedShopScopedRepository {
  constructor(db) {
    super(db, "categories", USER_QUERYABLE_TABLES);
  }
};
CategoriesRepository = __decorateClass([
  Injectable16()
], CategoriesRepository);

// src/entities/categories/categories.service.ts
import { Injectable as Injectable17 } from "@nestjs/common";
var CategoriesService = class extends CodedShopScopedEntityService {
  constructor(repository) {
    super(repository, "category", ImportCategoryItemSchema);
  }
};
CategoriesService = __decorateClass([
  Injectable17()
], CategoriesService);

// src/entities/categories/categories.module.ts
var CategoriesModule = class {
};
CategoriesModule = __decorateClass([
  Module11({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule],
    controllers: [CategoriesController, CategoriesExamplesController],
    providers: [CategoriesRepository, CategoriesService, AuthGuard],
    exports: [CategoriesService]
  })
], CategoriesModule);

// src/entities/groups/groups.controller.ts
import {
  Body as Body9,
  Controller as Controller13,
  Delete as Delete9,
  Get as Get11,
  NotFoundException as NotFoundException10,
  Param as Param9,
  ParseIntPipe as ParseIntPipe9,
  Post as Post9,
  Put as Put7,
  Query as Query8,
  Req as Req7,
  Res as Res4,
  UploadedFile as UploadedFile4,
  UseGuards as UseGuards9,
  UseInterceptors as UseInterceptors4
} from "@nestjs/common";
import { FileInterceptor as FileInterceptor4 } from "@nestjs/platform-express";

// src/entities/groups/groups.schema.ts
import { z as z10 } from "zod";
var { code: code4, title: title5 } = zodSchemas;
var CreateGroupSchema = z10.object({
  code: code4(),
  title: title5()
});
var UpdateGroupSchema = z10.object({
  code: code4().optional(),
  title: title5().optional()
});
var ImportGroupItemSchema = z10.object({
  code: code4(),
  title: title5()
});

// src/entities/groups/groups.controller.ts
var GroupsController = class {
  constructor(groupsService) {
    this.groupsService = groupsService;
  }
  async findAll(_req, ctx, query) {
    return this.groupsService.findByShopIdPaginated(ctx.shopId, query);
  }
  async findByCode(_req, ctx, code9) {
    const group = await this.groupsService.findByCodeAndShop(code9, ctx.shopId);
    if (!group || group.tenant_id !== ctx.tenantId) {
      throw new NotFoundException10(`Group with code ${code9} not found`);
    }
    return group;
  }
  async exportJson(_req, ctx, res) {
    const items = await this.groupsService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, "groups.json");
  }
  async exportCsv(_req, ctx, res) {
    const items = await this.groupsService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, "groups.csv", ["code", "title"]);
  }
  async findById(_req, ctx, id6) {
    const group = await this.groupsService.findById(id6);
    assertShopAccess(group, ctx, "Group", id6);
    return group;
  }
  async create(_req, ctx, body) {
    return this.groupsService.create({
      ...body,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId
    });
  }
  async update(_req, ctx, id6, body) {
    const group = await this.groupsService.findById(id6);
    assertShopAccess(group, ctx, "Group", id6);
    return this.groupsService.update(id6, body);
  }
  async delete(_req, ctx, id6) {
    const group = await this.groupsService.findById(id6);
    assertShopAccess(group, ctx, "Group", id6);
    await this.groupsService.delete(id6);
    return { message: "Group deleted successfully" };
  }
  async importJson(_req, ctx, items, file) {
    const validatedData = parseAndValidateImport(file, items, ImportGroupItemSchema);
    return this.groupsService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
  async importCsv(_req, ctx, file) {
    const records = parseCsvImport(file, void 0, [
      "code",
      "title"
    ]);
    const items = records.map((record) => ({
      code: record.code,
      title: record.title
    }));
    return this.groupsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
};
__decorateClass([
  Get11(),
  RequireReadAccess(),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Query8(new ZodValidationPipe(PaginationQuerySchema)))
], GroupsController.prototype, "findAll", 1);
__decorateClass([
  Get11("code/:code"),
  RequireReadAccess(),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param9("code"))
], GroupsController.prototype, "findByCode", 1);
__decorateClass([
  Get11("export/json"),
  RequireReadAccess(),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res4())
], GroupsController.prototype, "exportJson", 1);
__decorateClass([
  Get11("export/csv"),
  RequireReadAccess(),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res4())
], GroupsController.prototype, "exportCsv", 1);
__decorateClass([
  Get11(":id"),
  RequireReadAccess(),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param9("id", ParseIntPipe9))
], GroupsController.prototype, "findById", 1);
__decorateClass([
  Post9(),
  RequireWriteAccess(),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body9(new ZodValidationPipe(CreateGroupSchema)))
], GroupsController.prototype, "create", 1);
__decorateClass([
  Put7(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param9("id", ParseIntPipe9)),
  __decorateParam(3, Body9(new ZodValidationPipe(UpdateGroupSchema)))
], GroupsController.prototype, "update", 1);
__decorateClass([
  Delete9(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param9("id", ParseIntPipe9))
], GroupsController.prototype, "delete", 1);
__decorateClass([
  Post9("import/json"),
  RequireWriteAccess(),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body9()),
  __decorateParam(3, UploadedFile4())
], GroupsController.prototype, "importJson", 1);
__decorateClass([
  Post9("import/csv"),
  RequireWriteAccess(),
  UseInterceptors4(FileInterceptor4("file")),
  __decorateParam(0, Req7()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, UploadedFile4())
], GroupsController.prototype, "importCsv", 1);
GroupsController = __decorateClass([
  Controller13("groups"),
  UseGuards9(AuthGuard)
], GroupsController);

// src/entities/groups/groups.module.ts
import { Module as Module12 } from "@nestjs/common";

// src/entities/groups/groups-examples.controller.ts
import { Controller as Controller14 } from "@nestjs/common";
var EXAMPLE_BRANDS3 = [
  { code: "apple", title: "Apple" },
  { code: "samsung", title: "Samsung" },
  { code: "dell", title: "Dell" }
];
var GroupsExamplesController = class extends BaseExamplesController {
  examples = EXAMPLE_BRANDS3;
  entityName = "groups";
  csvColumns = ["code", "title"];
};
GroupsExamplesController = __decorateClass([
  Controller14("groups/examples")
], GroupsExamplesController);

// src/entities/groups/groups.repository.ts
import { Injectable as Injectable18 } from "@nestjs/common";
var GroupsRepository = class extends CodedShopScopedRepository {
  constructor(db) {
    super(db, "groups", USER_QUERYABLE_TABLES);
  }
};
GroupsRepository = __decorateClass([
  Injectable18()
], GroupsRepository);

// src/entities/groups/groups.service.ts
import { Injectable as Injectable19 } from "@nestjs/common";
var GroupsService = class extends CodedShopScopedEntityService {
  constructor(repository) {
    super(repository, "group", ImportGroupItemSchema);
  }
};
GroupsService = __decorateClass([
  Injectable19()
], GroupsService);

// src/entities/groups/groups.module.ts
var GroupsModule = class {
};
GroupsModule = __decorateClass([
  Module12({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule],
    controllers: [GroupsController, GroupsExamplesController],
    providers: [GroupsRepository, GroupsService, AuthGuard],
    exports: [GroupsService]
  })
], GroupsModule);

// src/me/me.controller.ts
import { Controller as Controller15, Get as Get12, Headers, NotFoundException as NotFoundException11, UnauthorizedException as UnauthorizedException2 } from "@nestjs/common";
var MeController = class {
  constructor(usersService, apiKeysService) {
    this.usersService = usersService;
    this.apiKeysService = apiKeysService;
  }
  async getCurrentUser(apiKey) {
    if (!apiKey) {
      throw new UnauthorizedException2("API key is required");
    }
    const validApiKey = await this.apiKeysService.findValidByKey(apiKey);
    if (!validApiKey) {
      throw new UnauthorizedException2("Invalid or expired API key");
    }
    const user = await this.usersService.getUserWithRolesAndTenants(validApiKey.user_id);
    if (!user) {
      throw new NotFoundException11("User not found");
    }
    return user;
  }
};
__decorateClass([
  Get12(),
  __decorateParam(0, Headers("x-api-key"))
], MeController.prototype, "getCurrentUser", 1);
MeController = __decorateClass([
  Controller15("me")
], MeController);

// src/me/me.module.ts
import { Module as Module13 } from "@nestjs/common";
var MeModule = class {
};
MeModule = __decorateClass([
  Module13({
    imports: [UsersModule, ApiKeysModule, UserRolesModule, TenantsModule],
    controllers: [MeController]
  })
], MeModule);

// src/metadata/metadata.controller.ts
import { Controller as Controller16, Get as Get13 } from "@nestjs/common";
import { ENTITIES_METADATA } from "@sales-planner/shared";
var MetadataController = class {
  getEntitiesMetadata() {
    return ENTITIES_METADATA;
  }
};
__decorateClass([
  Get13("entities")
], MetadataController.prototype, "getEntitiesMetadata", 1);
MetadataController = __decorateClass([
  Controller16("metadata")
], MetadataController);

// src/metadata/metadata.module.ts
import { Module as Module14 } from "@nestjs/common";
var MetadataModule = class {
};
MetadataModule = __decorateClass([
  Module14({
    controllers: [MetadataController]
  })
], MetadataModule);

// src/entities/statuses/statuses.controller.ts
import {
  Body as Body10,
  Controller as Controller17,
  Delete as Delete10,
  Get as Get14,
  NotFoundException as NotFoundException12,
  Param as Param10,
  ParseIntPipe as ParseIntPipe10,
  Post as Post10,
  Put as Put8,
  Query as Query9,
  Req as Req8,
  Res as Res5,
  UploadedFile as UploadedFile5,
  UseGuards as UseGuards10,
  UseInterceptors as UseInterceptors5
} from "@nestjs/common";
import { FileInterceptor as FileInterceptor5 } from "@nestjs/platform-express";

// src/entities/statuses/statuses.schema.ts
import { z as z11 } from "zod";
var { code: code5, title: title6 } = zodSchemas;
var CreateStatusSchema = z11.object({
  code: code5(),
  title: title6()
});
var UpdateStatusSchema = z11.object({
  code: code5().optional(),
  title: title6().optional()
});
var ImportStatusItemSchema = z11.object({
  code: code5(),
  title: title6()
});

// src/entities/statuses/statuses.controller.ts
var StatusesController = class {
  constructor(statusesService) {
    this.statusesService = statusesService;
  }
  async findAll(_req, ctx, query) {
    return this.statusesService.findByShopIdPaginated(ctx.shopId, query);
  }
  async findByCode(_req, ctx, code9) {
    const status = await this.statusesService.findByCodeAndShop(code9, ctx.shopId);
    if (!status || status.tenant_id !== ctx.tenantId) {
      throw new NotFoundException12(`Status with code ${code9} not found`);
    }
    return status;
  }
  async exportJson(_req, ctx, res) {
    const items = await this.statusesService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, "statuses.json");
  }
  async exportCsv(_req, ctx, res) {
    const items = await this.statusesService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, "statuses.csv", ["code", "title"]);
  }
  async findById(_req, ctx, id6) {
    const status = await this.statusesService.findById(id6);
    assertShopAccess(status, ctx, "Status", id6);
    return status;
  }
  async create(_req, ctx, body) {
    return this.statusesService.create({
      ...body,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId
    });
  }
  async update(_req, ctx, id6, body) {
    const status = await this.statusesService.findById(id6);
    assertShopAccess(status, ctx, "Status", id6);
    return this.statusesService.update(id6, body);
  }
  async delete(_req, ctx, id6) {
    const status = await this.statusesService.findById(id6);
    assertShopAccess(status, ctx, "Status", id6);
    await this.statusesService.delete(id6);
    return { message: "Status deleted successfully" };
  }
  async importJson(_req, ctx, items, file) {
    const validatedData = parseAndValidateImport(file, items, ImportStatusItemSchema);
    return this.statusesService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
  async importCsv(_req, ctx, file) {
    const records = parseCsvImport(file, void 0, [
      "code",
      "title"
    ]);
    const items = records.map((record) => ({
      code: record.code,
      title: record.title
    }));
    return this.statusesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
};
__decorateClass([
  Get14(),
  RequireReadAccess(),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Query9(new ZodValidationPipe(PaginationQuerySchema)))
], StatusesController.prototype, "findAll", 1);
__decorateClass([
  Get14("code/:code"),
  RequireReadAccess(),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param10("code"))
], StatusesController.prototype, "findByCode", 1);
__decorateClass([
  Get14("export/json"),
  RequireReadAccess(),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res5())
], StatusesController.prototype, "exportJson", 1);
__decorateClass([
  Get14("export/csv"),
  RequireReadAccess(),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res5())
], StatusesController.prototype, "exportCsv", 1);
__decorateClass([
  Get14(":id"),
  RequireReadAccess(),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param10("id", ParseIntPipe10))
], StatusesController.prototype, "findById", 1);
__decorateClass([
  Post10(),
  RequireWriteAccess(),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body10(new ZodValidationPipe(CreateStatusSchema)))
], StatusesController.prototype, "create", 1);
__decorateClass([
  Put8(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param10("id", ParseIntPipe10)),
  __decorateParam(3, Body10(new ZodValidationPipe(UpdateStatusSchema)))
], StatusesController.prototype, "update", 1);
__decorateClass([
  Delete10(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param10("id", ParseIntPipe10))
], StatusesController.prototype, "delete", 1);
__decorateClass([
  Post10("import/json"),
  RequireWriteAccess(),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body10()),
  __decorateParam(3, UploadedFile5())
], StatusesController.prototype, "importJson", 1);
__decorateClass([
  Post10("import/csv"),
  RequireWriteAccess(),
  UseInterceptors5(FileInterceptor5("file")),
  __decorateParam(0, Req8()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, UploadedFile5())
], StatusesController.prototype, "importCsv", 1);
StatusesController = __decorateClass([
  Controller17("statuses"),
  UseGuards10(AuthGuard)
], StatusesController);

// src/entities/statuses/statuses.module.ts
import { Module as Module15 } from "@nestjs/common";

// src/entities/statuses/statuses-examples.controller.ts
import { Controller as Controller18 } from "@nestjs/common";
var EXAMPLE_BRANDS4 = [
  { code: "apple", title: "Apple" },
  { code: "samsung", title: "Samsung" },
  { code: "dell", title: "Dell" }
];
var StatusesExamplesController = class extends BaseExamplesController {
  examples = EXAMPLE_BRANDS4;
  entityName = "statuses";
  csvColumns = ["code", "title"];
};
StatusesExamplesController = __decorateClass([
  Controller18("statuses/examples")
], StatusesExamplesController);

// src/entities/statuses/statuses.repository.ts
import { Injectable as Injectable20 } from "@nestjs/common";
var StatusesRepository = class extends CodedShopScopedRepository {
  constructor(db) {
    super(db, "statuses", USER_QUERYABLE_TABLES);
  }
};
StatusesRepository = __decorateClass([
  Injectable20()
], StatusesRepository);

// src/entities/statuses/statuses.service.ts
import { Injectable as Injectable21 } from "@nestjs/common";
var StatusesService = class extends CodedShopScopedEntityService {
  constructor(repository) {
    super(repository, "status", ImportStatusItemSchema);
  }
};
StatusesService = __decorateClass([
  Injectable21()
], StatusesService);

// src/entities/statuses/statuses.module.ts
var StatusesModule = class {
};
StatusesModule = __decorateClass([
  Module15({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule],
    controllers: [StatusesController, StatusesExamplesController],
    providers: [StatusesRepository, StatusesService, AuthGuard],
    exports: [StatusesService]
  })
], StatusesModule);

// src/entities/suppliers/suppliers.module.ts
import { Module as Module16 } from "@nestjs/common";

// src/entities/suppliers/suppliers.controller.ts
import {
  Body as Body11,
  Controller as Controller19,
  Delete as Delete11,
  Get as Get15,
  NotFoundException as NotFoundException13,
  Param as Param11,
  ParseIntPipe as ParseIntPipe11,
  Post as Post11,
  Put as Put9,
  Query as Query10,
  Req as Req9,
  Res as Res6,
  UploadedFile as UploadedFile6,
  UseGuards as UseGuards11,
  UseInterceptors as UseInterceptors6
} from "@nestjs/common";
import { FileInterceptor as FileInterceptor6 } from "@nestjs/platform-express";

// src/entities/suppliers/suppliers.schema.ts
import { z as z12 } from "zod";
var { code: code6, title: title7 } = zodSchemas;
var CreateSupplierSchema = z12.object({
  code: code6(),
  title: title7()
});
var UpdateSupplierSchema = z12.object({
  code: code6().optional(),
  title: title7().optional()
});
var ImportSupplierItemSchema = z12.object({
  code: code6(),
  title: title7()
});

// src/entities/suppliers/suppliers.controller.ts
var SuppliersController = class {
  constructor(suppliersService) {
    this.suppliersService = suppliersService;
  }
  async findAll(_req, ctx, query) {
    return this.suppliersService.findByShopIdPaginated(ctx.shopId, query);
  }
  async findByCode(_req, ctx, code9) {
    const supplier = await this.suppliersService.findByCodeAndShop(code9, ctx.shopId);
    if (!supplier || supplier.tenant_id !== ctx.tenantId) {
      throw new NotFoundException13(`Supplier with code ${code9} not found`);
    }
    return supplier;
  }
  async exportJson(_req, ctx, res) {
    const items = await this.suppliersService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, "suppliers.json");
  }
  async exportCsv(_req, ctx, res) {
    const items = await this.suppliersService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, "suppliers.csv", ["code", "title"]);
  }
  async findById(_req, ctx, id6) {
    const supplier = await this.suppliersService.findById(id6);
    assertShopAccess(supplier, ctx, "Supplier", id6);
    return supplier;
  }
  async create(_req, ctx, body) {
    return this.suppliersService.create({
      ...body,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId
    });
  }
  async update(_req, ctx, id6, body) {
    const supplier = await this.suppliersService.findById(id6);
    assertShopAccess(supplier, ctx, "Supplier", id6);
    return this.suppliersService.update(id6, body);
  }
  async delete(_req, ctx, id6) {
    const supplier = await this.suppliersService.findById(id6);
    assertShopAccess(supplier, ctx, "Supplier", id6);
    await this.suppliersService.delete(id6);
    return { message: "Supplier deleted successfully" };
  }
  async importJson(_req, ctx, items, file) {
    const validatedData = parseAndValidateImport(file, items, ImportSupplierItemSchema);
    return this.suppliersService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
  async importCsv(_req, ctx, file) {
    const records = parseCsvImport(file, void 0, [
      "code",
      "title"
    ]);
    const items = records.map((record) => ({
      code: record.code,
      title: record.title
    }));
    return this.suppliersService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
};
__decorateClass([
  Get15(),
  RequireReadAccess(),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Query10(new ZodValidationPipe(PaginationQuerySchema)))
], SuppliersController.prototype, "findAll", 1);
__decorateClass([
  Get15("code/:code"),
  RequireReadAccess(),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param11("code"))
], SuppliersController.prototype, "findByCode", 1);
__decorateClass([
  Get15("export/json"),
  RequireReadAccess(),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res6())
], SuppliersController.prototype, "exportJson", 1);
__decorateClass([
  Get15("export/csv"),
  RequireReadAccess(),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res6())
], SuppliersController.prototype, "exportCsv", 1);
__decorateClass([
  Get15(":id"),
  RequireReadAccess(),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param11("id", ParseIntPipe11))
], SuppliersController.prototype, "findById", 1);
__decorateClass([
  Post11(),
  RequireWriteAccess(),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body11(new ZodValidationPipe(CreateSupplierSchema)))
], SuppliersController.prototype, "create", 1);
__decorateClass([
  Put9(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param11("id", ParseIntPipe11)),
  __decorateParam(3, Body11(new ZodValidationPipe(UpdateSupplierSchema)))
], SuppliersController.prototype, "update", 1);
__decorateClass([
  Delete11(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param11("id", ParseIntPipe11))
], SuppliersController.prototype, "delete", 1);
__decorateClass([
  Post11("import/json"),
  RequireWriteAccess(),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body11()),
  __decorateParam(3, UploadedFile6())
], SuppliersController.prototype, "importJson", 1);
__decorateClass([
  Post11("import/csv"),
  RequireWriteAccess(),
  UseInterceptors6(FileInterceptor6("file")),
  __decorateParam(0, Req9()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, UploadedFile6())
], SuppliersController.prototype, "importCsv", 1);
SuppliersController = __decorateClass([
  Controller19("suppliers"),
  UseGuards11(AuthGuard)
], SuppliersController);

// src/entities/suppliers/suppliers-examples.controller.ts
import { Controller as Controller20 } from "@nestjs/common";
var EXAMPLE_SUPPLIERS = [
  { code: "supplier1", title: "Example Supplier 1" },
  { code: "supplier2", title: "Example Supplier 2" },
  { code: "supplier3", title: "Example Supplier 3" }
];
var SuppliersExamplesController = class extends BaseExamplesController {
  examples = EXAMPLE_SUPPLIERS;
  entityName = "suppliers";
  csvColumns = ["code", "title"];
};
SuppliersExamplesController = __decorateClass([
  Controller20("suppliers/examples")
], SuppliersExamplesController);

// src/entities/suppliers/suppliers.repository.ts
import { Injectable as Injectable22 } from "@nestjs/common";
var SuppliersRepository = class extends CodedShopScopedRepository {
  constructor(db) {
    super(db, "suppliers", USER_QUERYABLE_TABLES);
  }
};
SuppliersRepository = __decorateClass([
  Injectable22()
], SuppliersRepository);

// src/entities/suppliers/suppliers.service.ts
import { Injectable as Injectable23 } from "@nestjs/common";
var SuppliersService = class extends CodedShopScopedEntityService {
  constructor(repository) {
    super(repository, "supplier", ImportSupplierItemSchema);
  }
};
SuppliersService = __decorateClass([
  Injectable23()
], SuppliersService);

// src/entities/suppliers/suppliers.module.ts
var SuppliersModule = class {
};
SuppliersModule = __decorateClass([
  Module16({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule],
    controllers: [SuppliersController, SuppliersExamplesController],
    providers: [SuppliersRepository, SuppliersService, AuthGuard],
    exports: [SuppliersService]
  })
], SuppliersModule);

// src/entities/sales-history/sales-history.controller.ts
import {
  BadRequestException as BadRequestException7,
  Body as Body12,
  Controller as Controller21,
  Delete as Delete12,
  Get as Get16,
  Param as Param12,
  ParseIntPipe as ParseIntPipe12,
  Post as Post12,
  Put as Put10,
  Query as Query11,
  Req as Req10,
  Res as Res7,
  UploadedFile as UploadedFile7,
  UseGuards as UseGuards12,
  UseInterceptors as UseInterceptors7
} from "@nestjs/common";
import { FileInterceptor as FileInterceptor7 } from "@nestjs/platform-express";

// src/entities/sales-history/sales-history.schema.ts
import { z as z13 } from "zod";
var { id: id4, quantity, period, code: code7 } = zodSchemas;
var CreateSalesHistoryRequestSchema = z13.object({
  sku_id: id4(),
  period: period(),
  quantity: quantity(),
  marketplace_id: id4()
});
var PeriodQuerySchema = z13.object({
  period_from: period().optional(),
  period_to: period().optional()
});
var SalesHistoryQuerySchema = PeriodQuerySchema.merge(PaginationQuerySchema);
var CreateSalesHistorySchema = z13.object({
  shop_id: id4(),
  tenant_id: id4(),
  sku_id: id4(),
  period: period(),
  quantity: quantity(),
  marketplace_id: id4()
});
var UpdateSalesHistorySchema = z13.object({
  quantity: quantity().optional()
  // Note: shop_id, tenant_id, sku_id, period are not updatable
});
var ImportSalesHistoryItemSchema = z13.object({
  marketplace: z13.string().min(1),
  period: period(),
  sku: code7(),
  quantity: quantity()
});

// src/entities/sales-history/sales-history.controller.ts
var SalesHistoryController = class {
  constructor(salesHistoryService) {
    this.salesHistoryService = salesHistoryService;
  }
  async findAll(_req, ctx, query) {
    return this.salesHistoryService.findByShopAndPeriod(ctx.shopId, query);
  }
  async exportJson(_req, ctx, res, periodFrom, periodTo) {
    PeriodQuerySchema.parse({ period_from: periodFrom, period_to: periodTo });
    const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendJsonExport(res, items, "sales-history.json");
  }
  async exportCsv(_req, ctx, res, periodFrom, periodTo) {
    PeriodQuerySchema.parse({ period_from: periodFrom, period_to: periodTo });
    const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendCsvExport(res, items, "sales-history.csv", ["marketplace", "period", "sku", "quantity"]);
  }
  async findById(_req, ctx, id6) {
    const record = await this.salesHistoryService.findById(id6);
    assertShopAccess(record, ctx, "Sales history record", id6);
    return record;
  }
  async create(_req, ctx, dto) {
    return this.salesHistoryService.create({
      ...dto,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId
    });
  }
  async update(_req, ctx, id6, dto) {
    const record = await this.salesHistoryService.findById(id6);
    assertShopAccess(record, ctx, "Sales history record", id6);
    return this.salesHistoryService.update(id6, dto);
  }
  async delete(_req, ctx, id6) {
    const record = await this.salesHistoryService.findById(id6);
    assertShopAccess(record, ctx, "Sales history record", id6);
    await this.salesHistoryService.delete(id6);
  }
  async import(_req, ctx, items, file) {
    const validatedData = parseAndValidateImport(file, items, ImportSalesHistoryItemSchema);
    return this.salesHistoryService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
  async importCsv(_req, ctx, file) {
    if (!file) {
      throw new BadRequestException7("File is required");
    }
    const content = file.buffer.toString("utf-8");
    const records = fromCsv(content, ["marketplace", "period", "sku", "quantity"]);
    const validatedData = records.map((record, index) => {
      const quantity2 = Number.parseFloat(record.quantity);
      if (Number.isNaN(quantity2)) {
        throw new BadRequestException7(`Invalid quantity at row ${index + 1}: ${record.quantity}`);
      }
      try {
        return ImportSalesHistoryItemSchema.parse({
          marketplace: record.marketplace,
          period: record.period,
          sku: record.sku,
          quantity: quantity2
        });
      } catch (error) {
        throw new BadRequestException7(`Invalid data at row ${index + 1}: ${error}`);
      }
    });
    return this.salesHistoryService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
};
__decorateClass([
  Get16(),
  RequireReadAccess(),
  __decorateParam(0, Req10()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Query11(new ZodValidationPipe(SalesHistoryQuerySchema)))
], SalesHistoryController.prototype, "findAll", 1);
__decorateClass([
  Get16("export/json"),
  RequireReadAccess(),
  __decorateParam(0, Req10()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res7()),
  __decorateParam(3, Query11("period_from")),
  __decorateParam(4, Query11("period_to"))
], SalesHistoryController.prototype, "exportJson", 1);
__decorateClass([
  Get16("export/csv"),
  RequireReadAccess(),
  __decorateParam(0, Req10()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res7()),
  __decorateParam(3, Query11("period_from")),
  __decorateParam(4, Query11("period_to"))
], SalesHistoryController.prototype, "exportCsv", 1);
__decorateClass([
  Get16(":id"),
  RequireReadAccess(),
  __decorateParam(0, Req10()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param12("id", ParseIntPipe12))
], SalesHistoryController.prototype, "findById", 1);
__decorateClass([
  Post12(),
  RequireWriteAccess(),
  __decorateParam(0, Req10()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body12(new ZodValidationPipe(CreateSalesHistorySchema.omit({ shop_id: true, tenant_id: true }))))
], SalesHistoryController.prototype, "create", 1);
__decorateClass([
  Put10(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req10()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param12("id", ParseIntPipe12)),
  __decorateParam(3, Body12(new ZodValidationPipe(UpdateSalesHistorySchema)))
], SalesHistoryController.prototype, "update", 1);
__decorateClass([
  Delete12(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req10()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param12("id", ParseIntPipe12))
], SalesHistoryController.prototype, "delete", 1);
__decorateClass([
  Post12("import/json"),
  RequireWriteAccess(),
  UseInterceptors7(FileInterceptor7("file")),
  __decorateParam(0, Req10()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body12()),
  __decorateParam(3, UploadedFile7())
], SalesHistoryController.prototype, "import", 1);
__decorateClass([
  Post12("import/csv"),
  RequireWriteAccess(),
  UseInterceptors7(FileInterceptor7("file")),
  __decorateParam(0, Req10()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, UploadedFile7())
], SalesHistoryController.prototype, "importCsv", 1);
SalesHistoryController = __decorateClass([
  Controller21("sales-history"),
  UseGuards12(AuthGuard)
], SalesHistoryController);

// src/entities/sales-history/sales-history.module.ts
import { Module as Module18 } from "@nestjs/common";

// src/entities/skus/skus.module.ts
import { Module as Module17 } from "@nestjs/common";

// src/entities/skus/skus.controller.ts
import {
  Body as Body13,
  Controller as Controller22,
  Delete as Delete13,
  Get as Get17,
  NotFoundException as NotFoundException14,
  Param as Param13,
  ParseIntPipe as ParseIntPipe13,
  Post as Post13,
  Put as Put11,
  Query as Query12,
  Req as Req11,
  Res as Res8,
  UploadedFile as UploadedFile8,
  UseGuards as UseGuards13,
  UseInterceptors as UseInterceptors8
} from "@nestjs/common";
import { FileInterceptor as FileInterceptor8 } from "@nestjs/platform-express";

// src/entities/skus/skus.schema.ts
import { z as z14 } from "zod";
var { code: code8, title: title8 } = zodSchemas;
var CreateSkuSchema = z14.object({
  code: code8(),
  title: title8(),
  title2: z14.string().optional(),
  category_id: z14.number().optional(),
  group_id: z14.number().optional(),
  status_id: z14.number().optional(),
  supplier_id: z14.number().optional()
});
var UpdateSkuSchema = z14.object({
  code: code8().optional(),
  title: title8().optional(),
  title2: z14.string().optional(),
  category_id: z14.number().optional(),
  group_id: z14.number().optional(),
  status_id: z14.number().optional(),
  supplier_id: z14.number().optional()
  // Note: shop_id and tenant_id are intentionally not updatable
  // Once a SKU is created in a shop/tenant, it stays there
});
var ImportSkuItemSchema = z14.object({
  code: code8(),
  title: title8(),
  title2: z14.string().optional(),
  category: z14.string().optional(),
  group: z14.string().optional(),
  status: z14.string().optional(),
  supplier: z14.string().optional()
});
var PaginationQuerySchema2 = z14.object({
  limit: z14.coerce.number().int().min(1).max(1e3).optional(),
  offset: z14.coerce.number().int().min(0).optional()
});

// src/entities/skus/skus.controller.ts
var SkusController = class {
  constructor(skusService) {
    this.skusService = skusService;
  }
  async findAll(_req, ctx, query) {
    return this.skusService.findByShopIdPaginated(ctx.shopId, query);
  }
  async findByCode(_req, ctx, code9) {
    const sku = await this.skusService.findByCodeAndShop(code9, ctx.shopId);
    if (!sku || sku.tenant_id !== ctx.tenantId) {
      throw new NotFoundException14(`SKU with code ${code9} not found`);
    }
    return sku;
  }
  async exportJson(_req, ctx, res) {
    const items = await this.skusService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, "skus.json");
  }
  async exportCsv(_req, ctx, res) {
    const items = await this.skusService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, "skus.csv", [
      "code",
      "title",
      "category",
      "title2",
      "group",
      "supplier",
      "status"
    ]);
  }
  async findById(_req, ctx, id6) {
    const sku = await this.skusService.findById(id6);
    assertShopAccess(sku, ctx, "SKU", id6);
    return sku;
  }
  async create(_req, ctx, dto) {
    return this.skusService.create({
      ...dto,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId
    });
  }
  async update(_req, ctx, id6, dto) {
    const sku = await this.skusService.findById(id6);
    assertShopAccess(sku, ctx, "SKU", id6);
    return this.skusService.update(id6, dto);
  }
  async importJson(_req, ctx, items, file) {
    const validatedData = parseAndValidateImport(file, items, ImportSkuItemSchema);
    return this.skusService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
  async importCsv(_req, ctx, file) {
    const records = parseCsvImport(file, void 0, ["code", "title"]);
    const items = records.map((record) => ({
      code: record.code,
      title: record.title,
      category: record.category,
      group: record.group,
      status: record.status,
      supplier: record.supplier
    }));
    return this.skusService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
  async delete(_req, ctx, id6) {
    const sku = await this.skusService.findById(id6);
    assertShopAccess(sku, ctx, "SKU", id6);
    await this.skusService.delete(id6);
  }
};
__decorateClass([
  Get17(),
  RequireReadAccess(),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Query12(new ZodValidationPipe(PaginationQuerySchema2)))
], SkusController.prototype, "findAll", 1);
__decorateClass([
  Get17("code/:code"),
  RequireReadAccess(),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param13("code"))
], SkusController.prototype, "findByCode", 1);
__decorateClass([
  Get17("export/json"),
  RequireReadAccess(),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res8())
], SkusController.prototype, "exportJson", 1);
__decorateClass([
  Get17("export/csv"),
  RequireReadAccess(),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Res8())
], SkusController.prototype, "exportCsv", 1);
__decorateClass([
  Get17(":id"),
  RequireReadAccess(),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param13("id", ParseIntPipe13))
], SkusController.prototype, "findById", 1);
__decorateClass([
  Post13(),
  RequireWriteAccess(),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body13(new ZodValidationPipe(CreateSkuSchema)))
], SkusController.prototype, "create", 1);
__decorateClass([
  Put11(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param13("id", ParseIntPipe13)),
  __decorateParam(3, Body13(new ZodValidationPipe(UpdateSkuSchema)))
], SkusController.prototype, "update", 1);
__decorateClass([
  Post13("import/json"),
  RequireWriteAccess(),
  UseInterceptors8(FileInterceptor8("file")),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Body13()),
  __decorateParam(3, UploadedFile8())
], SkusController.prototype, "importJson", 1);
__decorateClass([
  Post13("import/csv"),
  RequireWriteAccess(),
  UseInterceptors8(FileInterceptor8("file")),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, UploadedFile8())
], SkusController.prototype, "importCsv", 1);
__decorateClass([
  Delete13(":id"),
  RequireWriteAccess(),
  __decorateParam(0, Req11()),
  __decorateParam(1, ShopContext()),
  __decorateParam(2, Param13("id", ParseIntPipe13))
], SkusController.prototype, "delete", 1);
SkusController = __decorateClass([
  Controller22("skus"),
  UseGuards13(AuthGuard)
], SkusController);

// src/entities/skus/skus.service.ts
import { Injectable as Injectable24, NotFoundException as NotFoundException15 } from "@nestjs/common";
var SkusService = class {
  constructor(repository, categoriesService, groupsService, statusesService, suppliersService) {
    this.repository = repository;
    this.categoriesService = categoriesService;
    this.groupsService = groupsService;
    this.statusesService = statusesService;
    this.suppliersService = suppliersService;
  }
  /** Normalize SKU code for consistent lookups */
  normalizeCode(code9) {
    return normalizeSkuCode(code9);
  }
  // ============ Read Operations (delegate to repository) ============
  async findById(id6) {
    return this.repository.findById(id6);
  }
  async findByShopId(shopId) {
    return this.repository.findByShopId(shopId);
  }
  async findByShopIdPaginated(shopId, query = {}) {
    const normalizedQuery = {
      limit: Math.min(query.limit ?? SkusService.DEFAULT_LIMIT, SkusService.MAX_LIMIT),
      offset: query.offset ?? 0
    };
    return this.repository.findByShopIdPaginated(shopId, normalizedQuery);
  }
  async findByCodeAndShop(code9, shopId) {
    const normalizedCode = normalizeSkuCode(code9);
    return this.repository.findByCodeAndShop(normalizedCode, shopId);
  }
  async countByShopId(shopId) {
    return this.repository.countByShopId(shopId);
  }
  // ============ Write Operations (business logic + repository) ============
  async create(dto) {
    try {
      return await this.repository.create({
        ...dto,
        code: normalizeSkuCode(dto.code)
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException("sku", dto.code, "this shop");
      }
      throw error;
    }
  }
  async update(id6, dto) {
    const updated = await this.repository.update(id6, {
      ...dto,
      ...dto.code !== void 0 && { code: normalizeSkuCode(dto.code) }
    });
    if (!updated) {
      throw new NotFoundException15(`SKU with id ${id6} not found`);
    }
    return updated;
  }
  async delete(id6) {
    return this.repository.delete(id6);
  }
  async deleteByShopId(shopId) {
    return this.repository.deleteByShopId(shopId);
  }
  // ============ Import/Export Operations ============
  async bulkUpsert(tenantId, shopId, items) {
    const validItems = [];
    const errors = [];
    items.forEach((item, index) => {
      const result = ImportSkuItemSchema.safeParse(item);
      if (!result.success || !result.data) {
        const identifier = typeof item === "object" && item && "code" in item ? item.code : `at index ${index}`;
        const errorMessages = result.error?.issues.map((issue) => issue.message).join(", ") || "Invalid item";
        errors.push(`Invalid item "${identifier}": ${errorMessages}`);
        return;
      }
      validItems.push(result.data);
    });
    if (validItems.length === 0) {
      return {
        created: 0,
        updated: 0,
        errors,
        categories_created: 0,
        groups_created: 0,
        statuses_created: 0,
        suppliers_created: 0
      };
    }
    const categoryCodes = validItems.filter((i) => i.category).map((i) => normalizeCode(i.category));
    const groupCodes = validItems.filter((i) => i.group).map((i) => normalizeCode(i.group));
    const statusCodes = validItems.filter((i) => i.status).map((i) => normalizeCode(i.status));
    const supplierCodes = validItems.filter((i) => i.supplier).map((i) => normalizeCode(i.supplier));
    const [categoryResult, groupResult, statusResult, supplierResult] = await Promise.all([
      categoryCodes.length > 0 ? this.categoriesService.findOrCreateByCode(tenantId, shopId, categoryCodes) : { codeToId: /* @__PURE__ */ new Map(), created: 0 },
      groupCodes.length > 0 ? this.groupsService.findOrCreateByCode(tenantId, shopId, groupCodes) : { codeToId: /* @__PURE__ */ new Map(), created: 0 },
      statusCodes.length > 0 ? this.statusesService.findOrCreateByCode(tenantId, shopId, statusCodes) : { codeToId: /* @__PURE__ */ new Map(), created: 0 },
      supplierCodes.length > 0 ? this.suppliersService.findOrCreateByCode(tenantId, shopId, supplierCodes) : { codeToId: /* @__PURE__ */ new Map(), created: 0 }
    ]);
    const preparedItems = validItems.map((item) => ({
      ...item,
      category_id: item.category ? categoryResult.codeToId.get(normalizeCode(item.category)) : void 0,
      group_id: item.group ? groupResult.codeToId.get(normalizeCode(item.group)) : void 0,
      status_id: item.status ? statusResult.codeToId.get(normalizeCode(item.status)) : void 0,
      supplier_id: item.supplier ? supplierResult.codeToId.get(normalizeCode(item.supplier)) : void 0
    }));
    const normalizedCodes = preparedItems.map((i) => normalizeSkuCode(i.code));
    const existingCodes = await this.repository.findCodesByShopId(shopId, normalizedCodes);
    await this.repository.bulkUpsertFull(
      tenantId,
      shopId,
      preparedItems.map((item) => ({
        code: normalizeSkuCode(item.code),
        title: item.title,
        title2: item.title2,
        category_id: item.category_id,
        group_id: item.group_id,
        status_id: item.status_id,
        supplier_id: item.supplier_id
      }))
    );
    const created = preparedItems.filter(
      (i) => !existingCodes.has(normalizeSkuCode(i.code))
    ).length;
    const updated = preparedItems.length - created;
    return {
      created,
      updated,
      errors,
      categories_created: categoryResult.created,
      groups_created: groupResult.created,
      statuses_created: statusResult.created,
      suppliers_created: supplierResult.created
    };
  }
  async exportForShop(shopId) {
    const skus = await this.repository.exportForShop(shopId);
    return skus.map((sku) => ({
      code: sku.code,
      title: sku.title,
      title2: sku.title2 ?? void 0,
      category: sku.category ?? void 0,
      group: sku.group ?? void 0,
      status: sku.status ?? void 0,
      supplier: sku.supplier ?? void 0
    }));
  }
  /**
   * Find SKUs by code or create missing ones.
   * Used by SalesHistory import to auto-create SKUs.
   */
  async findOrCreateByCode(tenantId, shopId, codes) {
    if (codes.length === 0) {
      return { codeToId: /* @__PURE__ */ new Map(), created: 0 };
    }
    const normalizedCodes = codes.map((code9) => normalizeSkuCode(code9));
    return this.repository.findOrCreateByCode(tenantId, shopId, normalizedCodes);
  }
};
__publicField(SkusService, "DEFAULT_LIMIT", 100);
__publicField(SkusService, "MAX_LIMIT", 1e3);
SkusService = __decorateClass([
  Injectable24()
], SkusService);

// src/entities/skus/skus.repository.ts
import { Injectable as Injectable25 } from "@nestjs/common";
var SkusRepository = class extends CodedShopScopedRepository {
  constructor(db) {
    super(db, "skus", USER_QUERYABLE_TABLES);
  }
  async bulkUpsert(tenantId, shopId, items) {
    if (items.length === 0) {
      return { created: 0, updated: 0 };
    }
    const existingCodes = await this.findCodesByShopId(
      shopId,
      items.map((i) => i.code)
    );
    const updated = items.filter((i) => existingCodes.has(i.code)).length;
    const created = items.length - updated;
    await this.db.insertInto("skus").values(
      items.map((item) => ({
        code: item.code,
        title: item.title,
        shop_id: shopId,
        tenant_id: tenantId,
        updated_at: /* @__PURE__ */ new Date()
      }))
    ).onConflict(
      (oc) => oc.columns(["code", "shop_id"]).doUpdateSet((eb) => ({
        title: eb.ref("excluded.title"),
        updated_at: /* @__PURE__ */ new Date()
      }))
    ).execute();
    return { created, updated };
  }
  /**
   * Bulk upsert with full SKU fields (used by import)
   */
  async bulkUpsertFull(tenantId, shopId, items) {
    if (items.length === 0) return;
    await this.db.insertInto("skus").values(
      items.map((item) => ({
        code: item.code,
        title: item.title,
        title2: item.title2,
        shop_id: shopId,
        tenant_id: tenantId,
        category_id: item.category_id,
        group_id: item.group_id,
        status_id: item.status_id,
        supplier_id: item.supplier_id,
        updated_at: /* @__PURE__ */ new Date()
      }))
    ).onConflict(
      (oc) => oc.columns(["code", "shop_id"]).doUpdateSet((eb) => ({
        title: eb.ref("excluded.title"),
        title2: eb.ref("excluded.title2"),
        category_id: eb.ref("excluded.category_id"),
        group_id: eb.ref("excluded.group_id"),
        status_id: eb.ref("excluded.status_id"),
        supplier_id: eb.ref("excluded.supplier_id"),
        updated_at: /* @__PURE__ */ new Date()
      }))
    ).execute();
  }
  async exportForShop(shopId) {
    const rows = await this.db.selectFrom("skus").leftJoin("categories", "skus.category_id", "categories.id").leftJoin("groups", "skus.group_id", "groups.id").leftJoin("statuses", "skus.status_id", "statuses.id").leftJoin("suppliers", "skus.supplier_id", "suppliers.id").select([
      "skus.code",
      "skus.title",
      "skus.title2",
      "categories.code as category",
      "groups.code as group",
      "statuses.code as status",
      "suppliers.code as supplier"
    ]).where("skus.shop_id", "=", shopId).orderBy("skus.code", "asc").execute();
    return rows.map((row) => ({
      code: row.code,
      title: row.title,
      title2: row.title2 ?? void 0,
      category: row.category ?? void 0,
      group: row.group ?? void 0,
      status: row.status ?? void 0,
      supplier: row.supplier ?? void 0
    }));
  }
};
SkusRepository = __decorateClass([
  Injectable25()
], SkusRepository);

// src/entities/skus/skus-examples.controller.ts
import { Controller as Controller23 } from "@nestjs/common";
var EXAMPLE_SKUS = [
  { code: "SKU-001", title: "Product 1" },
  { code: "SKU-002", title: "Product 2" },
  { code: "SKU-003", title: "Product 3" }
];
var SkusExamplesController = class extends BaseExamplesController {
  examples = EXAMPLE_SKUS;
  entityName = "skus";
  csvColumns = ["code", "title"];
};
SkusExamplesController = __decorateClass([
  Controller23("skus/examples")
], SkusExamplesController);

// src/entities/skus/skus.module.ts
var SkusModule = class {
};
SkusModule = __decorateClass([
  Module17({
    imports: [
      ApiKeysModule,
      UserRolesModule,
      TenantsModule,
      CategoriesModule,
      GroupsModule,
      StatusesModule,
      SuppliersModule
    ],
    controllers: [SkusController, SkusExamplesController],
    providers: [SkusService, SkusRepository, AuthGuard],
    exports: [SkusService]
  })
], SkusModule);

// src/entities/sales-history/sales-history.service.ts
import { Injectable as Injectable26, NotFoundException as NotFoundException16 } from "@nestjs/common";
import { sql as sql2 } from "kysely";
var SalesHistoryService = class {
  constructor(db, skusService, marketplacesService) {
    this.db = db;
    this.skusService = skusService;
    this.marketplacesService = marketplacesService;
  }
  mapRow(row) {
    return {
      ...row,
      period: dateToPeriod(row.period)
    };
  }
  async findAll() {
    const rows = await this.db.selectFrom("sales_history").selectAll().execute();
    return rows.map((r) => this.mapRow(r));
  }
  async findById(id6) {
    const row = await this.db.selectFrom("sales_history").selectAll().where("id", "=", id6).executeTakeFirst();
    return row ? this.mapRow(row) : void 0;
  }
  async findByShopId(shopId) {
    const rows = await this.db.selectFrom("sales_history").selectAll().where("shop_id", "=", shopId).execute();
    return rows.map((r) => this.mapRow(r));
  }
  async findByShopAndPeriod(shopId, query) {
    const { period_from: periodFrom, period_to: periodTo, limit = 100, offset = 0 } = query ?? {};
    let baseQuery = this.db.selectFrom("sales_history").where("shop_id", "=", shopId);
    if (periodFrom) {
      baseQuery = baseQuery.where("period", ">=", periodToDate(periodFrom));
    }
    if (periodTo) {
      baseQuery = baseQuery.where("period", "<=", periodToDate(periodTo));
    }
    const { count } = await baseQuery.select((eb) => eb.fn.countAll().as("count")).executeTakeFirstOrThrow();
    const rows = await baseQuery.selectAll().orderBy("period", "desc").limit(limit).offset(offset).execute();
    return {
      items: rows.map((r) => this.mapRow(r)),
      total: Number(count),
      limit,
      offset
    };
  }
  async findBySkuId(skuId) {
    const rows = await this.db.selectFrom("sales_history").selectAll().where("sku_id", "=", skuId).orderBy("period", "desc").execute();
    return rows.map((r) => this.mapRow(r));
  }
  async create(dto) {
    try {
      const result = await this.db.insertInto("sales_history").values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        sku_id: dto.sku_id,
        period: periodToDate(dto.period),
        quantity: dto.quantity,
        marketplace_id: dto.marketplace_id,
        updated_at: /* @__PURE__ */ new Date()
      }).returningAll().executeTakeFirstOrThrow();
      return this.mapRow(result);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          "Sales History",
          `SKU ${dto.sku_id} for period ${dto.period}`,
          "this shop"
        );
      }
      throw error;
    }
  }
  async update(id6, dto) {
    const result = await this.db.updateTable("sales_history").set({ ...dto, updated_at: /* @__PURE__ */ new Date() }).where("id", "=", id6).returningAll().executeTakeFirst();
    if (!result) {
      throw new NotFoundException16(`Sales history record with id ${id6} not found`);
    }
    return this.mapRow(result);
  }
  async delete(id6) {
    await this.db.deleteFrom("sales_history").where("id", "=", id6).execute();
  }
  async deleteByShopId(shopId) {
    const result = await this.db.deleteFrom("sales_history").where("shop_id", "=", shopId).executeTakeFirst();
    return Number(result.numDeletedRows);
  }
  async upsert(dto) {
    const periodDate = periodToDate(dto.period);
    const result = await this.db.insertInto("sales_history").values({
      shop_id: dto.shop_id,
      tenant_id: dto.tenant_id,
      sku_id: dto.sku_id,
      period: periodDate,
      quantity: dto.quantity,
      marketplace_id: dto.marketplace_id,
      updated_at: /* @__PURE__ */ new Date()
    }).onConflict(
      (oc) => oc.columns(["shop_id", "sku_id", "period", "marketplace_id"]).doUpdateSet({
        quantity: dto.quantity,
        updated_at: /* @__PURE__ */ new Date()
      })
    ).returningAll().executeTakeFirstOrThrow();
    return this.mapRow(result);
  }
  async bulkUpsert(tenantId, shopId, items) {
    if (items.length === 0) {
      return { created: 0, updated: 0, skus_created: 0, marketplaces_created: 0, errors: [] };
    }
    const errors = [];
    const validatedItems = [];
    items.forEach((item, i) => {
      const result = ImportSalesHistoryItemSchema.safeParse(item);
      if (!result.success) {
        const errorMessages = result.error.issues.map((issue) => issue.message).join(", ");
        errors.push(`Invalid item at index ${i}: ${errorMessages}`);
        return;
      }
      validatedItems.push(result.data);
    });
    if (validatedItems.length === 0) {
      return { created: 0, updated: 0, skus_created: 0, marketplaces_created: 0, errors };
    }
    const skuCodes = validatedItems.map((i) => this.skusService.normalizeCode(i.sku));
    const { codeToId: skuCodeToId, created: skusCreated } = await this.skusService.findOrCreateByCode(tenantId, shopId, skuCodes);
    const marketplaceCodes = validatedItems.map(
      (i) => this.marketplacesService.normalizeCode(i.marketplace)
    );
    const { codeToId: marketplaceCodeToId, created: marketplacesCreated } = await this.marketplacesService.findOrCreateByCode(tenantId, shopId, marketplaceCodes);
    const validItems = [];
    validatedItems.forEach((item) => {
      const normalizedSkuCode = this.skusService.normalizeCode(item.sku);
      const normalizedMarketplace = this.marketplacesService.normalizeCode(item.marketplace);
      const skuId = skuCodeToId.get(normalizedSkuCode);
      let marketplaceId = marketplaceCodeToId.get(normalizedMarketplace);
      if (!marketplaceId) {
        const lowercaseMarketplace = normalizedMarketplace.toLowerCase();
        marketplaceId = marketplaceCodeToId.get(lowercaseMarketplace);
      }
      if (!marketplaceId) {
        const originalLower = item.marketplace.toLowerCase();
        for (const [code9, id6] of marketplaceCodeToId.entries()) {
          if (code9.toLowerCase() === originalLower.replace(/[^a-z0-9]/g, "")) {
            marketplaceId = id6;
            break;
          }
        }
      }
      if (skuId && marketplaceId) {
        validItems.push({
          ...item,
          sku_id: skuId,
          periodDate: periodToDate(item.period),
          marketplace_id: marketplaceId
        });
      }
    });
    if (validItems.length === 0) {
      return {
        created: 0,
        updated: 0,
        skus_created: skusCreated,
        marketplaces_created: marketplacesCreated,
        errors
      };
    }
    const existingKeys = new Set(
      (await this.db.selectFrom("sales_history").select([
        "sku_id",
        sql2`to_char(period, 'YYYY-MM')`.as("period_str"),
        "marketplace_id"
      ]).where("shop_id", "=", shopId).where(
        "sku_id",
        "in",
        validItems.map((i) => i.sku_id)
      ).execute()).map((r) => `${r.sku_id}-${r.period_str}-${r.marketplace_id}`)
    );
    await this.db.insertInto("sales_history").values(
      validItems.map((item) => ({
        shop_id: shopId,
        tenant_id: tenantId,
        sku_id: item.sku_id,
        period: item.periodDate,
        quantity: item.quantity,
        marketplace_id: item.marketplace_id,
        updated_at: /* @__PURE__ */ new Date()
      }))
    ).onConflict(
      (oc) => oc.columns(["shop_id", "sku_id", "period", "marketplace_id"]).doUpdateSet({
        quantity: (eb) => eb.ref("excluded.quantity"),
        updated_at: /* @__PURE__ */ new Date()
      })
    ).execute();
    const created = validItems.filter(
      (i) => !existingKeys.has(`${i.sku_id}-${i.period}-${i.marketplace_id}`)
    ).length;
    const updated = validItems.filter(
      (i) => existingKeys.has(`${i.sku_id}-${i.period}-${i.marketplace_id}`)
    ).length;
    return {
      created,
      updated,
      skus_created: skusCreated,
      marketplaces_created: marketplacesCreated,
      errors
    };
  }
  async exportForShop(shopId, periodFrom, periodTo) {
    let query = this.db.selectFrom("sales_history").innerJoin("skus", "skus.id", "sales_history.sku_id").innerJoin("marketplaces", "marketplaces.id", "sales_history.marketplace_id").select([
      "skus.code as sku_code",
      sql2`to_char(sales_history.period, 'YYYY-MM')`.as("period"),
      "sales_history.quantity",
      "marketplaces.code as marketplace_code"
    ]).where("sales_history.shop_id", "=", shopId);
    if (periodFrom) {
      query = query.where("sales_history.period", ">=", periodToDate(periodFrom));
    }
    if (periodTo) {
      query = query.where("sales_history.period", "<=", periodToDate(periodTo));
    }
    const rows = await query.orderBy("skus.code", "asc").orderBy("sales_history.period", "asc").execute();
    return rows.map((r) => ({
      marketplace: r.marketplace_code,
      period: r.period,
      sku: r.sku_code,
      quantity: r.quantity
    }));
  }
};
SalesHistoryService = __decorateClass([
  Injectable26()
], SalesHistoryService);

// src/entities/sales-history/sales-history-examples.controller.ts
import { Controller as Controller24 } from "@nestjs/common";
var EXAMPLE_SALES_HISTORY = [
  { marketplace: "WB", period: "2026-01", sku: "SKU-001", quantity: 100 },
  { marketplace: "WB", period: "2026-02", sku: "SKU-001", quantity: 120 },
  { marketplace: "OZON", period: "2026-01", sku: "SKU-002", quantity: 50 }
];
var SalesHistoryExamplesController = class extends BaseExamplesController {
  examples = EXAMPLE_SALES_HISTORY;
  entityName = "sales-history";
  csvColumns = ["marketplace", "period", "sku", "quantity"];
};
SalesHistoryExamplesController = __decorateClass([
  Controller24("sales-history/examples")
], SalesHistoryExamplesController);

// src/entities/sales-history/sales-history.module.ts
var SalesHistoryModule = class {
};
SalesHistoryModule = __decorateClass([
  Module18({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule, SkusModule, MarketplacesModule],
    controllers: [SalesHistoryExamplesController, SalesHistoryController],
    providers: [SalesHistoryService, AuthGuard],
    exports: [SalesHistoryService]
  })
], SalesHistoryModule);

// src/entities/shops/shops.controller.ts
import {
  Body as Body14,
  Controller as Controller25,
  Delete as Delete14,
  ForbiddenException as ForbiddenException6,
  Get as Get18,
  NotFoundException as NotFoundException17,
  Param as Param14,
  ParseIntPipe as ParseIntPipe14,
  Post as Post14,
  Put as Put12,
  Query as Query13,
  Req as Req12,
  UseGuards as UseGuards14
} from "@nestjs/common";

// src/entities/shops/shops.schema.ts
import { z as z15 } from "zod";
var { title: title9, id: id5 } = zodSchemas;
var CreateShopSchema = z15.object({
  title: title9(),
  tenant_id: id5()
});
var UpdateShopSchema = z15.object({
  title: title9().optional()
});

// src/entities/shops/shops.controller.ts
var ShopsController = class {
  constructor(shopsService) {
    this.shopsService = shopsService;
  }
  async findAll(req, tenantId) {
    if (req.user.isSystemAdmin) {
      if (tenantId) {
        return this.shopsService.findByTenantId(Number(tenantId));
      }
      return this.shopsService.findAll();
    }
    if (tenantId) {
      const tid = Number(tenantId);
      if (!hasTenantAccess(req.user, tid)) {
        throw new ForbiddenException6("Access to this tenant is not allowed");
      }
      return this.shopsService.findByTenantId(tid);
    }
    const allShops = [];
    const addedShopIds = /* @__PURE__ */ new Set();
    for (const tid of req.user.ownedTenantIds) {
      const shops = await this.shopsService.findByTenantId(tid);
      for (const shop of shops) {
        if (!addedShopIds.has(shop.id)) {
          allShops.push(shop);
          addedShopIds.add(shop.id);
        }
      }
    }
    for (const tr of req.user.tenantRoles) {
      if (!req.user.ownedTenantIds.includes(tr.tenantId)) {
        const shops = await this.shopsService.findByTenantId(tr.tenantId);
        for (const shop of shops) {
          if (!addedShopIds.has(shop.id)) {
            allShops.push(shop);
            addedShopIds.add(shop.id);
          }
        }
      }
    }
    for (const sr of req.user.shopRoles) {
      if (!addedShopIds.has(sr.shopId)) {
        const shop = await this.shopsService.findById(sr.shopId);
        if (shop) {
          allShops.push(shop);
          addedShopIds.add(shop.id);
        }
      }
    }
    return allShops;
  }
  async findById(req, id6) {
    const shop = await this.shopsService.findById(id6);
    if (!shop) {
      throw new NotFoundException17(`Shop with id ${id6} not found`);
    }
    if (req.user.isSystemAdmin) {
      return shop;
    }
    if (!hasReadAccess(req.user, shop.id, shop.tenant_id)) {
      throw new ForbiddenException6("Access to this shop is not allowed");
    }
    return shop;
  }
  async create(req, dto) {
    validateTenantAdminAccess(req.user, dto.tenant_id);
    return this.shopsService.create(dto);
  }
  async update(req, id6, dto) {
    const shop = await this.shopsService.findById(id6);
    if (!shop) {
      throw new NotFoundException17(`Shop with id ${id6} not found`);
    }
    validateTenantAdminAccess(req.user, shop.tenant_id);
    const updated = await this.shopsService.update(id6, dto);
    if (!updated) {
      throw new NotFoundException17(`Shop with id ${id6} not found`);
    }
    return updated;
  }
  async delete(req, id6) {
    const shop = await this.shopsService.findById(id6);
    if (!shop) {
      throw new NotFoundException17(`Shop with id ${id6} not found`);
    }
    validateTenantAdminAccess(req.user, shop.tenant_id);
    await this.shopsService.delete(id6);
  }
  async deleteData(req, id6) {
    const shop = await this.shopsService.findById(id6);
    if (!shop) {
      throw new NotFoundException17(`Shop with id ${id6} not found`);
    }
    validateWriteAccess(req.user, id6, shop.tenant_id);
    return this.shopsService.deleteData(id6);
  }
};
__decorateClass([
  Get18(),
  __decorateParam(0, Req12()),
  __decorateParam(1, Query13("tenantId"))
], ShopsController.prototype, "findAll", 1);
__decorateClass([
  Get18(":id"),
  __decorateParam(0, Req12()),
  __decorateParam(1, Param14("id", ParseIntPipe14))
], ShopsController.prototype, "findById", 1);
__decorateClass([
  Post14(),
  __decorateParam(0, Req12()),
  __decorateParam(1, Body14(new ZodValidationPipe(CreateShopSchema)))
], ShopsController.prototype, "create", 1);
__decorateClass([
  Put12(":id"),
  __decorateParam(0, Req12()),
  __decorateParam(1, Param14("id", ParseIntPipe14)),
  __decorateParam(2, Body14(new ZodValidationPipe(UpdateShopSchema)))
], ShopsController.prototype, "update", 1);
__decorateClass([
  Delete14(":id"),
  __decorateParam(0, Req12()),
  __decorateParam(1, Param14("id", ParseIntPipe14))
], ShopsController.prototype, "delete", 1);
__decorateClass([
  Delete14(":id/data"),
  __decorateParam(0, Req12()),
  __decorateParam(1, Param14("id", ParseIntPipe14))
], ShopsController.prototype, "deleteData", 1);
ShopsController = __decorateClass([
  Controller25("shops"),
  UseGuards14(AuthGuard)
], ShopsController);

// src/entities/shops/shops.module.ts
import { Module as Module19 } from "@nestjs/common";

// src/entities/shops/shops.service.ts
import { Injectable as Injectable27 } from "@nestjs/common";
var ShopsService = class {
  constructor(db, skusService, salesHistoryService, marketplacesService) {
    this.db = db;
    this.skusService = skusService;
    this.salesHistoryService = salesHistoryService;
    this.marketplacesService = marketplacesService;
  }
  async findAll() {
    return this.db.selectFrom("shops").selectAll().execute();
  }
  async findByTenantId(tenantId) {
    return this.db.selectFrom("shops").selectAll().where("tenant_id", "=", tenantId).execute();
  }
  async findById(id6) {
    return this.db.selectFrom("shops").selectAll().where("id", "=", id6).executeTakeFirst();
  }
  async create(dto) {
    return this.db.insertInto("shops").values(dto).returningAll().executeTakeFirstOrThrow();
  }
  async update(id6, dto) {
    return this.db.updateTable("shops").set({ ...dto, updated_at: /* @__PURE__ */ new Date() }).where("id", "=", id6).returningAll().executeTakeFirst();
  }
  async delete(id6) {
    await this.db.deleteFrom("shops").where("id", "=", id6).execute();
  }
  async deleteData(id6) {
    const salesHistoryDeleted = await this.salesHistoryService.deleteByShopId(id6);
    const skusDeleted = await this.skusService.deleteByShopId(id6);
    const marketplacesDeleted = await this.marketplacesService.deleteByShopId(id6) ?? 0;
    return { skusDeleted, salesHistoryDeleted, marketplacesDeleted };
  }
};
ShopsService = __decorateClass([
  Injectable27()
], ShopsService);

// src/entities/shops/shops.module.ts
var ShopsModule = class {
};
ShopsModule = __decorateClass([
  Module19({
    imports: [
      ApiKeysModule,
      UserRolesModule,
      TenantsModule,
      SkusModule,
      SalesHistoryModule,
      MarketplacesModule
    ],
    controllers: [ShopsController],
    providers: [ShopsService, AuthGuard],
    exports: [ShopsService]
  })
], ShopsModule);

// src/entities/user-shops/user-shops.controller.ts
import {
  Body as Body15,
  Controller as Controller26,
  Delete as Delete15,
  ForbiddenException as ForbiddenException7,
  Get as Get19,
  NotFoundException as NotFoundException18,
  Param as Param15,
  ParseIntPipe as ParseIntPipe15,
  Post as Post15,
  Query as Query14,
  Req as Req13,
  UseGuards as UseGuards15
} from "@nestjs/common";
var UserShopsController = class {
  constructor(userShopsService, shopsService) {
    this.userShopsService = userShopsService;
    this.shopsService = shopsService;
  }
  async findAll(req, userId, shopId, tenantId) {
    if (req.user.isSystemAdmin) {
      if (userId) {
        return this.userShopsService.findByUserId(Number(userId));
      }
      if (shopId) {
        return this.userShopsService.findByShopId(Number(shopId));
      }
      return this.userShopsService.findAll();
    }
    if (shopId) {
      const shop = await this.shopsService.findById(Number(shopId));
      if (!shop || !hasTenantAccess(req.user, shop.tenant_id)) {
        throw new ForbiddenException7("Access to this shop is not allowed");
      }
      return this.userShopsService.findByShopId(Number(shopId));
    }
    if (tenantId) {
      const tid = Number(tenantId);
      if (!hasTenantAccess(req.user, tid)) {
        throw new ForbiddenException7("Access to this tenant is not allowed");
      }
      return this.userShopsService.findByTenantId(tid);
    }
    throw new ForbiddenException7("shopId or tenantId query parameter is required");
  }
  async findById(req, id6) {
    const userShop = await this.userShopsService.findById(id6);
    if (!userShop) {
      throw new NotFoundException18(`UserShop with id ${id6} not found`);
    }
    if (!req.user.isSystemAdmin) {
      const shop = await this.shopsService.findById(userShop.shop_id);
      if (!shop || !hasTenantAccess(req.user, shop.tenant_id)) {
        throw new ForbiddenException7("Access to this user-shop is not allowed");
      }
    }
    return userShop;
  }
  async create(req, dto) {
    if (!req.user.isSystemAdmin) {
      const shop = await this.shopsService.findById(dto.shop_id);
      if (!shop) {
        throw new NotFoundException18(`Shop with id ${dto.shop_id} not found`);
      }
      validateTenantAdminAccess(req.user, shop.tenant_id);
    }
    return this.userShopsService.create(dto);
  }
  async delete(req, id6) {
    const userShop = await this.userShopsService.findById(id6);
    if (!userShop) {
      throw new NotFoundException18(`UserShop with id ${id6} not found`);
    }
    if (!req.user.isSystemAdmin) {
      const shop = await this.shopsService.findById(userShop.shop_id);
      if (!shop || !hasTenantAccess(req.user, shop.tenant_id)) {
        throw new ForbiddenException7("Cannot delete user-shop from another tenant");
      }
    }
    await this.userShopsService.delete(id6);
  }
};
__decorateClass([
  Get19(),
  __decorateParam(0, Req13()),
  __decorateParam(1, Query14("userId")),
  __decorateParam(2, Query14("shopId")),
  __decorateParam(3, Query14("tenantId"))
], UserShopsController.prototype, "findAll", 1);
__decorateClass([
  Get19(":id"),
  __decorateParam(0, Req13()),
  __decorateParam(1, Param15("id", ParseIntPipe15))
], UserShopsController.prototype, "findById", 1);
__decorateClass([
  Post15(),
  __decorateParam(0, Req13()),
  __decorateParam(1, Body15())
], UserShopsController.prototype, "create", 1);
__decorateClass([
  Delete15(":id"),
  __decorateParam(0, Req13()),
  __decorateParam(1, Param15("id", ParseIntPipe15))
], UserShopsController.prototype, "delete", 1);
UserShopsController = __decorateClass([
  Controller26("user-shops"),
  UseGuards15(AuthGuard)
], UserShopsController);

// src/entities/user-shops/user-shops.module.ts
import { Module as Module20 } from "@nestjs/common";

// src/entities/user-shops/user-shops.service.ts
import { Injectable as Injectable28 } from "@nestjs/common";
var UserShopsService = class {
  constructor(db) {
    this.db = db;
  }
  async findAll() {
    return this.db.selectFrom("user_shops").selectAll().execute();
  }
  async findByUserId(userId) {
    return this.db.selectFrom("user_shops").selectAll().where("user_id", "=", userId).execute();
  }
  async findByShopId(shopId) {
    return this.db.selectFrom("user_shops").selectAll().where("shop_id", "=", shopId).execute();
  }
  async findByTenantId(tenantId) {
    return this.db.selectFrom("user_shops").selectAll("user_shops").innerJoin("shops", "shops.id", "user_shops.shop_id").where("shops.tenant_id", "=", tenantId).execute();
  }
  async findById(id6) {
    return this.db.selectFrom("user_shops").selectAll().where("id", "=", id6).executeTakeFirst();
  }
  async create(dto) {
    try {
      return this.db.insertInto("user_shops").values(dto).returningAll().executeTakeFirstOrThrow();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          "User Shop",
          `User ${dto.user_id} - Shop ${dto.shop_id}`
        );
      }
      throw error;
    }
  }
  async delete(id6) {
    await this.db.deleteFrom("user_shops").where("id", "=", id6).execute();
  }
  async deleteByUserAndShop(userId, shopId) {
    await this.db.deleteFrom("user_shops").where("user_id", "=", userId).where("shop_id", "=", shopId).execute();
  }
};
UserShopsService = __decorateClass([
  Injectable28()
], UserShopsService);

// src/entities/user-shops/user-shops.module.ts
var UserShopsModule = class {
};
UserShopsModule = __decorateClass([
  Module20({
    imports: [ApiKeysModule, UserRolesModule, TenantsModule, ShopsModule],
    controllers: [UserShopsController],
    providers: [UserShopsService, AuthGuard],
    exports: [UserShopsService]
  })
], UserShopsModule);

// src/app.module.ts
var AppModule = class {
};
AppModule = __decorateClass([
  Module21({
    imports: [
      ConfigModule2.forRoot({
        isGlobal: true,
        envFilePath: [".env.local", ".env"],
        load: [databaseConfig]
      }),
      DatabaseModule,
      AuthModule,
      UsersModule,
      MeModule,
      RolesModule,
      UserRolesModule,
      TenantsModule,
      ShopsModule,
      UserShopsModule,
      ApiKeysModule,
      BootstrapModule,
      MarketplacesModule,
      MetadataModule,
      SkusModule,
      BrandsModule,
      CategoriesModule,
      GroupsModule,
      StatusesModule,
      SuppliersModule,
      SalesHistoryModule
    ],
    controllers: [AppController],
    providers: [AppService]
  })
], AppModule);

// api/index.ts
var server = express();
var isAppInitialized = false;
async function handler(req, res) {
  try {
    if (!isAppInitialized) {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
      app.enableCors();
      await app.init();
      isAppInitialized = true;
    }
    server(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
export {
  handler as default
};
