import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// dist/common/exceptions.js
var require_exceptions = __commonJS({
  "dist/common/exceptions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get DatabaseException() {
        return DatabaseException;
      },
      get DuplicateResourceException() {
        return DuplicateResourceException;
      },
      get InvalidTableNameException() {
        return InvalidTableNameException;
      },
      get isForeignKeyViolation() {
        return isForeignKeyViolation;
      },
      get isUniqueViolation() {
        return isUniqueViolation;
      }
    });
    var _common = __require("@nestjs/common");
    var InvalidTableNameException = class InvalidTableNameException extends _common.BadRequestException {
      constructor(tableName) {
        super(`Invalid table name: ${tableName}`);
      }
    };
    var DuplicateResourceException = class DuplicateResourceException extends _common.ConflictException {
      constructor(resource, identifier, scope) {
        const scopeMessage = scope ? ` in ${scope}` : "";
        super(`${resource} with identifier '${identifier}' already exists${scopeMessage}`);
      }
    };
    var DatabaseException = class DatabaseException extends _common.InternalServerErrorException {
      constructor(operation, originalError) {
        super(`Database error during ${operation}: ${originalError?.message ?? "Unknown error"}`);
      }
    };
    function isUniqueViolation(error) {
      return error instanceof Error && "code" in error && error.code === "23505";
    }
    function isForeignKeyViolation(error) {
      return error instanceof Error && "code" in error && error.code === "23503";
    }
  }
});

// dist/common/shop-scoped/base-entity.service.js
var require_base_entity_service = __commonJS({
  "dist/common/shop-scoped/base-entity.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ShopScopedBaseEntityService", {
      enumerable: true,
      get: function() {
        return ShopScopedBaseEntityService;
      }
    });
    var _common = __require("@nestjs/common");
    var _exceptions = require_exceptions();
    var ShopScopedBaseEntityService = class ShopScopedBaseEntityService {
      async findAll() {
        return this.repository.findAll();
      }
      async findById(id) {
        return this.repository.findById(id);
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
          if ((0, _exceptions.isUniqueViolation)(error)) {
            throw new _exceptions.DuplicateResourceException(this.entityName, this.getCreateIdentifier(dto), "this shop");
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
      async update(id, dto) {
        try {
          const updated = await this.repository.update(id, dto);
          if (!updated) {
            throw new _common.NotFoundException(`${this.entityName} with id ${id} not found`);
          }
          return updated;
        } catch (error) {
          if ((0, _exceptions.isUniqueViolation)(error)) {
            throw new _exceptions.DuplicateResourceException(this.entityName, this.getUpdateIdentifier(dto), "this shop");
          }
          throw error;
        }
      }
      async delete(id) {
        return this.repository.delete(id);
      }
      async deleteByShopId(shopId) {
        return this.repository.deleteByShopId(shopId);
      }
      constructor(repository, entityName) {
        this.repository = repository;
        this.entityName = entityName;
      }
    };
  }
});

// dist/lib/csv.js
var require_csv = __commonJS({
  "dist/lib/csv.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get fromCsv() {
        return fromCsv;
      },
      get toCsv() {
        return toCsv;
      }
    });
    var _common = __require("@nestjs/common");
    var _sync = __require("csv-parse/sync");
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
      return [
        header,
        ...rows
      ].join("\n");
    }
    function fromCsv(content, requiredColumns) {
      if (!content || typeof content !== "string") {
        throw new _common.BadRequestException("Content must be a non-empty string");
      }
      try {
        const cleanContent = content.charCodeAt(0) === 65279 ? content.slice(1) : content;
        const firstLine = cleanContent.split("\n")[0];
        const delimiter = firstLine?.includes(";") ? ";" : ",";
        const records = (0, _sync.parse)(cleanContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          delimiter,
          bom: true,
          relax_column_count: true
        });
        const nonEmptyRecords = records.filter((record) => {
          return Object.values(record).some((value) => value && value.trim() !== "");
        });
        for (const record of nonEmptyRecords) {
          for (const column of requiredColumns) {
            if (!(column in record) || !record[column]) {
              throw new _common.BadRequestException(`CSV must have a "${column}" column with values`);
            }
          }
        }
        return nonEmptyRecords;
      } catch (error) {
        if (error instanceof _common.BadRequestException) {
          throw error;
        }
        throw new _common.BadRequestException(`Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  }
});

// dist/lib/normalize-code.js
var require_normalize_code = __commonJS({
  "dist/lib/normalize-code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get normalizeCode() {
        return normalizeCode;
      },
      get normalizeSkuCode() {
        return normalizeSkuCode;
      },
      get splitIntoWords() {
        return splitIntoWords;
      }
    });
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
      return words.map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
    }
    function normalizeCode(code) {
      if (!code) return code;
      const transliterated = transliterate(code.replace(/\s+/g, "-"));
      return toCamelCase(transliterated);
    }
    function normalizeSkuCode(code) {
      if (!code) return code;
      return transliterate(code.replace(/\s+/g, ""));
    }
  }
});

// dist/lib/period.js
var require_period = __commonJS({
  "dist/lib/period.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get dateToPeriod() {
        return dateToPeriod;
      },
      get isValidPeriod() {
        return isValidPeriod;
      },
      get periodToDate() {
        return periodToDate;
      }
    });
    function periodToDate(period) {
      const parts = period.split("-").map(Number);
      const year = parts[0] ?? 0;
      const month = parts[1] ?? 1;
      return new Date(Date.UTC(year, month - 1, 1));
    }
    function dateToPeriod(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}`;
    }
    function isValidPeriod(period) {
      if (!/^\d{4}-\d{2}$/.test(period)) return false;
      const parts = period.split("-").map(Number);
      const year = parts[0] ?? 0;
      const month = parts[1] ?? 0;
      return month >= 1 && month <= 12 && year >= 1900 && year <= 9999;
    }
  }
});

// dist/lib/index.js
var require_lib = __commonJS({
  "dist/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get dateToPeriod() {
        return _period.dateToPeriod;
      },
      get fromCsv() {
        return _csv.fromCsv;
      },
      get isValidPeriod() {
        return _period.isValidPeriod;
      },
      get normalizeCode() {
        return _normalizecode.normalizeCode;
      },
      get normalizeSkuCode() {
        return _normalizecode.normalizeSkuCode;
      },
      get periodToDate() {
        return _period.periodToDate;
      },
      get toCsv() {
        return _csv.toCsv;
      }
    });
    var _csv = require_csv();
    var _normalizecode = require_normalize_code();
    var _period = require_period();
  }
});

// dist/common/shop-scoped/coded-entity.service.js
var require_coded_entity_service = __commonJS({
  "dist/common/shop-scoped/coded-entity.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "CodedShopScopedEntityService", {
      enumerable: true,
      get: function() {
        return CodedShopScopedEntityService;
      }
    });
    var _index = require_lib();
    var _baseentityservice = require_base_entity_service();
    var CodedShopScopedEntityService = class CodedShopScopedEntityService extends _baseentityservice.ShopScopedBaseEntityService {
      /**
      * Code normalization - uses standard normalizeCode by default.
      * Override in subclass for custom normalization (e.g., SKUs).
      */
      normalizeCode(code) {
        return (0, _index.normalizeCode)(code);
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
      async findByCodeAndShop(code, shopId) {
        const normalizedCode = this.normalizeCode(code);
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
          return {
            created: 0,
            updated: 0,
            errors
          };
        }
        const normalizedItems = validItems.map((item) => ({
          code: this.normalizeCode(item.code),
          title: item.title
        }));
        const { created, updated } = await this.repository.bulkUpsert(tenantId, shopId, normalizedItems);
        return {
          created,
          updated,
          errors
        };
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
          return {
            codeToId: /* @__PURE__ */ new Map(),
            created: 0
          };
        }
        const normalizedCodes = codes.map((code) => this.normalizeCode(code));
        return this.repository.findOrCreateByCode(tenantId, shopId, normalizedCodes);
      }
      constructor(repository, entityName, importItemSchema) {
        super(repository, entityName), this.repository = repository, this.entityName = entityName, this.importItemSchema = importItemSchema;
      }
    };
  }
});

// dist/database/database.config.js
var require_database_config = __commonJS({
  "dist/database/database.config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "databaseConfig", {
      enumerable: true,
      get: function() {
        return databaseConfig;
      }
    });
    var _config = __require("@nestjs/config");
    var databaseConfig = (0, _config.registerAs)("database", () => {
      const url = process.env.DATABASE_URL;
      if (url) {
        const parsed = new URL(url);
        return {
          url,
          host: parsed.hostname,
          port: parseInt(parsed.port || "5432", 10),
          database: parsed.pathname.slice(1),
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
  }
});

// dist/database/database.service.js
var require_database_service = __commonJS({
  "dist/database/database.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "DatabaseService", {
      enumerable: true,
      get: function() {
        return DatabaseService;
      }
    });
    var _common = __require("@nestjs/common");
    var _config = __require("@nestjs/config");
    var _kysely = __require("kysely");
    var _pg = /* @__PURE__ */ _interop_require_default(__require("pg"));
    function _interop_require_default(obj) {
      return obj && obj.__esModule ? obj : {
        default: obj
      };
    }
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var DatabaseService = class DatabaseService extends _kysely.Kysely {
      async onModuleDestroy() {
        await this.destroy();
      }
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
          ssl: ssl ? {
            rejectUnauthorized: false
          } : void 0,
          max: serverless ? 1 : 10,
          connectionTimeoutMillis: 5e3
        } : {
          host,
          port,
          database,
          user,
          password,
          ssl: ssl ? {
            rejectUnauthorized: false
          } : void 0,
          max: serverless ? 1 : 10,
          connectionTimeoutMillis: 5e3
        };
        super({
          dialect: new _kysely.PostgresDialect({
            pool: new _pg.default.Pool(poolConfig)
          })
        });
      }
    };
    DatabaseService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
      ])
    ], DatabaseService);
  }
});

// dist/database/database.module.js
var require_database_module = __commonJS({
  "dist/database/database.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "DatabaseModule", {
      enumerable: true,
      get: function() {
        return DatabaseModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _config = __require("@nestjs/config");
    var _databaseconfig = require_database_config();
    var _databaseservice = require_database_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var DatabaseModule = class DatabaseModule {
    };
    DatabaseModule = _ts_decorate([
      (0, _common.Global)(),
      (0, _common.Module)({
        imports: [
          _config.ConfigModule.forFeature(_databaseconfig.databaseConfig)
        ],
        providers: [
          _databaseservice.DatabaseService
        ],
        exports: [
          _databaseservice.DatabaseService
        ]
      })
    ], DatabaseModule);
  }
});

// dist/database/table-names.js
var require_table_names = __commonJS({
  "dist/database/table-names.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get USER_QUERYABLE_TABLES() {
        return USER_QUERYABLE_TABLES;
      },
      get VALID_TABLE_NAMES() {
        return VALID_TABLE_NAMES;
      },
      get assertValidTableName() {
        return assertValidTableName;
      }
    });
    var _exceptions = require_exceptions();
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
    function assertValidTableName(name, allowedTables = VALID_TABLE_NAMES) {
      if (!allowedTables.includes(name)) {
        throw new _exceptions.InvalidTableNameException(name);
      }
    }
  }
});

// dist/database/index.js
var require_database = __commonJS({
  "dist/database/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get DatabaseModule() {
        return _databasemodule.DatabaseModule;
      },
      get DatabaseService() {
        return _databaseservice.DatabaseService;
      },
      get USER_QUERYABLE_TABLES() {
        return _tablenames.USER_QUERYABLE_TABLES;
      },
      get VALID_TABLE_NAMES() {
        return _tablenames.VALID_TABLE_NAMES;
      },
      get assertValidTableName() {
        return _tablenames.assertValidTableName;
      }
    });
    var _databasemodule = require_database_module();
    var _databaseservice = require_database_service();
    var _tablenames = require_table_names();
  }
});

// dist/common/shop-scoped/base-repository.js
var require_base_repository = __commonJS({
  "dist/common/shop-scoped/base-repository.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ShopScopedBaseRepository", {
      enumerable: true,
      get: function() {
        return ShopScopedBaseRepository;
      }
    });
    var _index = require_database();
    var ShopScopedBaseRepository = class ShopScopedBaseRepository2 {
      async countByShopId(shopId) {
        const result = await this.db.selectFrom(this.tableName).select(this.db.fn.countAll().as("count")).where("shop_id", "=", shopId).executeTakeFirstOrThrow();
        return Number(result.count);
      }
      async findAll() {
        return this.db.selectFrom(this.tableName).selectAll().orderBy("id", "asc").execute();
      }
      async findById(id) {
        return this.db.selectFrom(this.tableName).selectAll().where("id", "=", id).executeTakeFirst();
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
        return {
          items,
          total,
          limit: limit ?? 0,
          offset: offset ?? 0
        };
      }
      async create(data) {
        const result = await this.db.insertInto(this.tableName).values({
          ...data,
          updated_at: /* @__PURE__ */ new Date()
        }).returningAll().executeTakeFirstOrThrow();
        return result;
      }
      async update(id, data) {
        const updateData = {
          updated_at: /* @__PURE__ */ new Date()
        };
        for (const [key, value] of Object.entries(data)) {
          if (value !== void 0 && !ShopScopedBaseRepository2.IMMUTABLE_FIELDS.has(key)) {
            updateData[key] = value;
          }
        }
        const result = await this.db.updateTable(this.tableName).set(updateData).where("id", "=", id).returningAll().executeTakeFirst();
        return result;
      }
      async delete(id) {
        await this.db.deleteFrom(this.tableName).where("id", "=", id).execute();
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
          return {
            created: 0,
            updated: 0
          };
        }
        const primaryKey = this.businessPrimaryKey ?? this.uniqueKeys.find((k) => k !== "shop_id") ?? "id";
        const keyValues = items.map((item) => item[primaryKey]);
        const existingResult = await this.db.selectFrom(this.tableName).select(this.db.fn.countAll().as("count")).where("shop_id", "=", shopId).where(primaryKey, "in", keyValues).executeTakeFirstOrThrow();
        const updated = Number(existingResult.count);
        const created = items.length - updated;
        const sampleItem = items[0];
        const updateSet = {
          updated_at: /* @__PURE__ */ new Date()
        };
        for (const key of Object.keys(sampleItem)) {
          if (!ShopScopedBaseRepository2.IMMUTABLE_FIELDS.has(key)) {
            updateSet[key] = (eb) => eb.ref(`excluded.${key}`);
          }
        }
        await this.db.insertInto(this.tableName).values(items.map((item) => ({
          ...item,
          shop_id: shopId,
          tenant_id: tenantId,
          updated_at: /* @__PURE__ */ new Date()
        }))).onConflict((oc) => oc.columns(this.uniqueKeys.slice()).doUpdateSet(updateSet)).execute();
        return {
          created,
          updated
        };
      }
      constructor(db, tableName, allowedTables) {
        this.db = db;
        this.exportFields = [];
        this.uniqueKeys = [
          "id"
        ];
        (0, _index.assertValidTableName)(tableName, allowedTables);
        this.tableName = tableName;
      }
    };
    ShopScopedBaseRepository.IMMUTABLE_FIELDS = /* @__PURE__ */ new Set([
      "id",
      "shop_id",
      "tenant_id",
      "created_at",
      "updated_at"
    ]);
  }
});

// dist/common/shop-scoped/coded-repository.js
var require_coded_repository = __commonJS({
  "dist/common/shop-scoped/coded-repository.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "CodedShopScopedRepository", {
      enumerable: true,
      get: function() {
        return CodedShopScopedRepository;
      }
    });
    var _baserepository = require_base_repository();
    var CodedShopScopedRepository = class CodedShopScopedRepository extends _baserepository.ShopScopedBaseRepository {
      async findByCodeAndShop(code, shopId) {
        return this.db.selectFrom(this.tableName).selectAll().where("code", "=", code).where("shop_id", "=", shopId).executeTakeFirst();
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
          return {
            codeToId: /* @__PURE__ */ new Map(),
            created: 0
          };
        }
        const uniqueCodes = [
          ...new Set(codes)
        ];
        let entities = await this.db.selectFrom(this.tableName).select([
          "id",
          "code"
        ]).where("shop_id", "=", shopId).where("code", "in", uniqueCodes).execute();
        const existingCodes = new Set(entities.map((e) => e.code));
        const missingCodes = uniqueCodes.filter((code) => !existingCodes.has(code));
        if (missingCodes.length > 0) {
          const newEntities = await this.db.insertInto(this.tableName).values(missingCodes.map((code) => ({
            code,
            title: code,
            shop_id: shopId,
            tenant_id: tenantId,
            updated_at: /* @__PURE__ */ new Date()
          }))).returning([
            "id",
            "code"
          ]).execute();
          entities = [
            ...entities,
            ...newEntities
          ];
        }
        return {
          codeToId: new Map(entities.map((e) => [
            e.code,
            e.id
          ])),
          created: missingCodes.length
        };
      }
      constructor(...args) {
        super(...args), /** Override to include code/title in export */
        this.exportFields = [
          "code",
          "title"
        ], /** Override unique keys for code-based conflict resolution */
        this.uniqueKeys = [
          "code",
          "shop_id"
        ], /** Code is the business primary key */
        this.businessPrimaryKey = "code";
      }
    };
  }
});

// dist/common/shop-scoped/index.js
var require_shop_scoped = __commonJS({
  "dist/common/shop-scoped/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CodedShopScopedEntityService() {
        return _codedentityservice.CodedShopScopedEntityService;
      },
      get CodedShopScopedRepository() {
        return _codedrepository.CodedShopScopedRepository;
      },
      get ShopScopedBaseEntityService() {
        return _baseentityservice.ShopScopedBaseEntityService;
      },
      get ShopScopedBaseRepository() {
        return _baserepository.ShopScopedBaseRepository;
      }
    });
    var _baseentityservice = require_base_entity_service();
    var _codedentityservice = require_coded_entity_service();
    var _baserepository = require_base_repository();
    var _codedrepository = require_coded_repository();
  }
});

// dist/common/pipes/query-validation.pipe.js
var require_query_validation_pipe = __commonJS({
  "dist/common/pipes/query-validation.pipe.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "QueryValidationPipe", {
      enumerable: true,
      get: function() {
        return QueryValidationPipe;
      }
    });
    var _common = __require("@nestjs/common");
    var _zod = __require("zod");
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var QueryValidationPipe = class QueryValidationPipe {
      transform(value, metadata) {
        if (metadata.type !== "custom") {
          return value;
        }
        try {
          return this.schema.parse(value);
        } catch (error) {
          if (error instanceof _zod.ZodError) {
            const messages = error.issues.map((err) => {
              const path = err.path.join(".");
              return path ? `${path}: ${err.message}` : err.message;
            });
            throw new _common.BadRequestException({
              message: "Query validation failed",
              errors: messages
            });
          }
          throw error;
        }
      }
      constructor(schema) {
        this.schema = schema;
      }
    };
    QueryValidationPipe = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof ZodType === "undefined" ? Object : ZodType
      ])
    ], QueryValidationPipe);
  }
});

// dist/common/pipes/zod-validation.pipe.js
var require_zod_validation_pipe = __commonJS({
  "dist/common/pipes/zod-validation.pipe.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ZodValidationPipe", {
      enumerable: true,
      get: function() {
        return ZodValidationPipe;
      }
    });
    var _common = __require("@nestjs/common");
    var _zod = __require("zod");
    var ZodValidationPipe = class ZodValidationPipe {
      transform(value, _metadata) {
        try {
          return this.schema.parse(value);
        } catch (error) {
          if (error instanceof _zod.ZodError) {
            const messages = error.issues.map((err) => {
              const path = err.path.join(".");
              return path ? `${path}: ${err.message}` : err.message;
            });
            throw new _common.BadRequestException({
              message: "Validation failed",
              errors: messages
            });
          }
          throw error;
        }
      }
      constructor(schema) {
        this.schema = schema;
      }
    };
  }
});

// dist/common/pipes/index.js
var require_pipes = __commonJS({
  "dist/common/pipes/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get QueryValidationPipe() {
        return _queryvalidationpipe.QueryValidationPipe;
      },
      get ZodValidationPipe() {
        return _zodvalidationpipe.ZodValidationPipe;
      }
    });
    var _queryvalidationpipe = require_query_validation_pipe();
    var _zodvalidationpipe = require_zod_validation_pipe();
  }
});

// dist/common/helpers/access.helpers.js
var require_access_helpers = __commonJS({
  "dist/common/helpers/access.helpers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "assertShopAccess", {
      enumerable: true,
      get: function() {
        return assertShopAccess;
      }
    });
    var _common = __require("@nestjs/common");
    function assertShopAccess(entity, ctx, entityName, id) {
      if (!entity) {
        throw new _common.NotFoundException(`${entityName} with id ${id} not found`);
      }
      if (entity.shop_id !== ctx.shopId || entity.tenant_id !== ctx.tenantId) {
        throw new _common.NotFoundException(`${entityName} with id ${id} not found in this shop/tenant`);
      }
    }
  }
});

// dist/common/helpers/export-import.helpers.js
var require_export_import_helpers = __commonJS({
  "dist/common/helpers/export-import.helpers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get parseCsvImport() {
        return parseCsvImport;
      },
      get sendCsvExport() {
        return sendCsvExport;
      },
      get sendJsonExport() {
        return sendJsonExport;
      }
    });
    var _index = require_lib();
    function sendJsonExport(res, data, filename) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.json(data);
    }
    function sendCsvExport(res, data, filename, columns) {
      const csv = columns ? (0, _index.toCsv)(data, columns) : (0, _index.toCsv)(data, Object.keys(data[0] || {}));
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
      return (0, _index.fromCsv)(csvContent, requiredColumns);
    }
  }
});

// dist/common/helpers/import.helpers.js
var require_import_helpers = __commonJS({
  "dist/common/helpers/import.helpers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get parseAndValidateImport() {
        return parseAndValidateImport;
      },
      get parseImportData() {
        return parseImportData;
      },
      get validateArray() {
        return validateArray;
      }
    });
    var _common = __require("@nestjs/common");
    function parseImportData(file, bodyItems) {
      let data;
      if (file) {
        const content = file.buffer.toString("utf-8");
        data = JSON.parse(content);
      } else if (bodyItems) {
        data = bodyItems;
      } else {
        throw new _common.BadRequestException("Either file or JSON body is required");
      }
      if (!Array.isArray(data)) {
        throw new _common.BadRequestException("Data must be an array");
      }
      return data;
    }
    function validateArray(data, schema) {
      return data.map((item, index) => {
        try {
          return schema.parse(item);
        } catch (error) {
          throw new _common.BadRequestException(`Invalid item at index ${index}: ${error}`);
        }
      });
    }
    function parseAndValidateImport(file, bodyItems, schema) {
      const data = parseImportData(file, bodyItems);
      return validateArray(data, schema);
    }
  }
});

// dist/common/helpers/schema.utils.js
var require_schema_utils = __commonJS({
  "dist/common/helpers/schema.utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "zodSchemas", {
      enumerable: true,
      get: function() {
        return zodSchemas;
      }
    });
    var _zod = __require("zod");
    var zodSchemas = {
      /** Standard title field: 1-255 chars */
      title: () => _zod.z.string().min(1).max(255),
      /** Standard name field: 1-255 chars */
      name: () => _zod.z.string().min(1).max(255),
      /** Email field with max length */
      email: () => _zod.z.string().email().max(255),
      /** Short code field: 1-100 chars */
      code: () => _zod.z.string().min(1).max(100),
      /** Short identifier: 1-50 chars */
      shortId: () => _zod.z.string().min(1).max(50),
      /** Description field: up to 500 chars */
      description: () => _zod.z.string().max(500),
      /** Positive integer ID (for foreign keys) */
      id: () => _zod.z.number().int().positive(),
      /** Non-negative integer (for quantities) */
      quantity: () => _zod.z.number().int().nonnegative(),
      /** YYYY-MM period format */
      period: () => _zod.z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be in YYYY-MM format")
    };
  }
});

// dist/common/helpers/index.js
var require_helpers = __commonJS({
  "dist/common/helpers/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get assertShopAccess() {
        return _accesshelpers.assertShopAccess;
      },
      get parseAndValidateImport() {
        return _importhelpers.parseAndValidateImport;
      },
      get parseCsvImport() {
        return _exportimporthelpers.parseCsvImport;
      },
      get parseImportData() {
        return _importhelpers.parseImportData;
      },
      get sendCsvExport() {
        return _exportimporthelpers.sendCsvExport;
      },
      get sendJsonExport() {
        return _exportimporthelpers.sendJsonExport;
      },
      get validateArray() {
        return _importhelpers.validateArray;
      },
      get zodSchemas() {
        return _schemautils.zodSchemas;
      }
    });
    var _accesshelpers = require_access_helpers();
    var _exportimporthelpers = require_export_import_helpers();
    var _importhelpers = require_import_helpers();
    var _schemautils = require_schema_utils();
  }
});

// dist/common/base-examples.controller.js
var require_base_examples_controller = __commonJS({
  "dist/common/base-examples.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BaseExamplesController", {
      enumerable: true,
      get: function() {
        return BaseExamplesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_lib();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var BaseExamplesController = class BaseExamplesController {
      getJsonExample() {
        this.setJsonHeaders();
        return this.examples;
      }
      getCsvExample() {
        this.setCsvHeaders();
        return (0, _index.toCsv)(this.examples, this.csvColumns);
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
    _ts_decorate([
      (0, _common.Get)("json"),
      (0, _common.Header)("Content-Type", "application/json"),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", []),
      _ts_metadata("design:returntype", Array)
    ], BaseExamplesController.prototype, "getJsonExample", null);
    _ts_decorate([
      (0, _common.Get)("csv"),
      (0, _common.Header)("Content-Type", "text/csv"),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", []),
      _ts_metadata("design:returntype", String)
    ], BaseExamplesController.prototype, "getCsvExample", null);
  }
});

// dist/common/schemas.js
var require_schemas = __commonJS({
  "dist/common/schemas.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "PaginationQuerySchema", {
      enumerable: true,
      get: function() {
        return PaginationQuerySchema;
      }
    });
    var _zod = __require("zod");
    var PaginationQuerySchema = _zod.z.object({
      limit: _zod.z.coerce.number().int().min(1).max(1e3).optional(),
      offset: _zod.z.coerce.number().int().min(0).optional()
    });
  }
});

// dist/common/index.js
var require_common = __commonJS({
  "dist/common/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_shop_scoped(), exports);
    _export_star(require_pipes(), exports);
    _export_star(require_helpers(), exports);
    _export_star(require_base_examples_controller(), exports);
    _export_star(require_exceptions(), exports);
    _export_star(require_schemas(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/api-keys/api-keys.service.js
var require_api_keys_service = __commonJS({
  "dist/entities/api-keys/api-keys.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ApiKeysService", {
      enumerable: true,
      get: function() {
        return ApiKeysService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _databaseservice = require_database_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var ApiKeysService = class ApiKeysService {
      async findAll() {
        return this.db.selectFrom("api_keys").selectAll().execute();
      }
      async findById(id) {
        return this.db.selectFrom("api_keys").selectAll().where("id", "=", id).executeTakeFirst();
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
        await this.db.updateTable("api_keys").set({
          last_used_at: /* @__PURE__ */ new Date(),
          updated_at: /* @__PURE__ */ new Date()
        }).where("id", "=", apiKey.id).execute();
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
          if ((0, _index.isUniqueViolation)(error)) {
            throw new _index.DuplicateResourceException("API Key", key);
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
          if ((0, _index.isUniqueViolation)(error)) {
            throw new _index.DuplicateResourceException("API Key", data.key);
          }
          throw error;
        }
      }
      async update(id, data) {
        return this.db.updateTable("api_keys").set({
          ...data,
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
          updated_at: /* @__PURE__ */ new Date()
        }).where("id", "=", id).returningAll().executeTakeFirst();
      }
      async delete(id) {
        return this.db.deleteFrom("api_keys").where("id", "=", id).returningAll().executeTakeFirst();
      }
      async deleteByUserId(userId) {
        return this.db.deleteFrom("api_keys").where("user_id", "=", userId).execute();
      }
      constructor(db) {
        this.db = db;
      }
    };
    ApiKeysService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _databaseservice.DatabaseService === "undefined" ? Object : _databaseservice.DatabaseService
      ])
    ], ApiKeysService);
  }
});

// dist/common/constants.js
var require_constants = __commonJS({
  "dist/common/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ROLE_NAMES", {
      enumerable: true,
      get: function() {
        return ROLE_NAMES;
      }
    });
    var ROLE_NAMES = {
      SYSTEM_ADMIN: "systemAdmin",
      TENANT_ADMIN: "tenantAdmin",
      TENANT_OWNER: "tenantOwner",
      EDITOR: "editor",
      VIEWER: "viewer"
    };
  }
});

// dist/entities/tenants/tenants.service.js
var require_tenants_service = __commonJS({
  "dist/entities/tenants/tenants.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "TenantsService", {
      enumerable: true,
      get: function() {
        return TenantsService;
      }
    });
    var _common = __require("@nestjs/common");
    var _constants = require_constants();
    var _databaseservice = require_database_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var TenantsService = class TenantsService {
      async findAll() {
        return this.db.selectFrom("tenants").selectAll().execute();
      }
      async findById(id) {
        return this.db.selectFrom("tenants").selectAll().where("id", "=", id).executeTakeFirst();
      }
      async findByOwnerId(ownerId) {
        return this.db.selectFrom("tenants").selectAll().where("owner_id", "=", ownerId).execute();
      }
      async create(dto) {
        return this.db.insertInto("tenants").values(dto).returningAll().executeTakeFirstOrThrow();
      }
      async update(id, dto) {
        return this.db.updateTable("tenants").set({
          ...dto,
          updated_at: /* @__PURE__ */ new Date()
        }).where("id", "=", id).returningAll().executeTakeFirst();
      }
      async delete(id) {
        await this.db.deleteFrom("tenants").where("id", "=", id).execute();
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
          const tenantAdminRole = await trx.selectFrom("roles").select("id").where("name", "=", _constants.ROLE_NAMES.TENANT_ADMIN).executeTakeFirst();
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
      constructor(db) {
        this.db = db;
      }
    };
    TenantsService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _databaseservice.DatabaseService === "undefined" ? Object : _databaseservice.DatabaseService
      ])
    ], TenantsService);
  }
});

// dist/entities/user-roles/user-roles.service.js
var require_user_roles_service = __commonJS({
  "dist/entities/user-roles/user-roles.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "UserRolesService", {
      enumerable: true,
      get: function() {
        return UserRolesService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _databaseservice = require_database_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var UserRolesService = class UserRolesService {
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
      async findById(id) {
        return this.db.selectFrom("user_roles").selectAll().where("id", "=", id).executeTakeFirst();
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
          if ((0, _index.isUniqueViolation)(error)) {
            throw new _index.DuplicateResourceException("User Role", `User ${dto.user_id} - Role ${dto.role_id}`);
          }
          throw error;
        }
      }
      async delete(id) {
        await this.db.deleteFrom("user_roles").where("id", "=", id).execute();
      }
      async deleteByUserAndRole(userId, roleId) {
        await this.db.deleteFrom("user_roles").where("user_id", "=", userId).where("role_id", "=", roleId).execute();
      }
      async findByUserIdWithRoleNames(userId) {
        return this.db.selectFrom("user_roles").innerJoin("roles", "roles.id", "user_roles.role_id").select([
          "user_roles.tenant_id",
          "user_roles.shop_id",
          "roles.name as role_name"
        ]).where("user_roles.user_id", "=", userId).execute();
      }
      constructor(db) {
        this.db = db;
      }
    };
    UserRolesService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _databaseservice.DatabaseService === "undefined" ? Object : _databaseservice.DatabaseService
      ])
    ], UserRolesService);
  }
});

// dist/auth/access-control.js
var require_access_control = __commonJS({
  "dist/auth/access-control.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get hasAdminAccess() {
        return hasAdminAccess;
      },
      get hasReadAccess() {
        return hasReadAccess;
      },
      get hasTenantAccess() {
        return hasTenantAccess;
      },
      get hasWriteAccess() {
        return hasWriteAccess;
      },
      get isTenantAdmin() {
        return isTenantAdmin;
      },
      get isTenantOwner() {
        return isTenantOwner;
      },
      get validateReadAccess() {
        return validateReadAccess;
      },
      get validateTenantAdminAccess() {
        return validateTenantAdminAccess;
      },
      get validateWriteAccess() {
        return validateWriteAccess;
      }
    });
    var _common = __require("@nestjs/common");
    var _constants = require_constants();
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
      return tenantRoles.includes(_constants.ROLE_NAMES.TENANT_ADMIN);
    }
    function isTenantOwner(user, tenantId) {
      return user.ownedTenantIds.includes(tenantId);
    }
    function hasTenantAccess(user, tenantId) {
      return isTenantOwner(user, tenantId) || isTenantAdmin(user, tenantId);
    }
    function hasAdminAccess(user, tenantId) {
      if (user.isSystemAdmin) return true;
      if (tenantId) return hasTenantAccess(user, tenantId);
      return false;
    }
    function validateTenantAdminAccess(user, tenantId) {
      if (user.isSystemAdmin) return;
      if (!hasTenantAccess(user, tenantId)) {
        throw new _common.ForbiddenException("Tenant owner or admin access required");
      }
    }
    function hasReadAccess(user, shopId, tenantId) {
      if (hasTenantAccess(user, tenantId)) {
        return true;
      }
      const shopRoles = getShopRoles(user, shopId);
      return shopRoles.includes(_constants.ROLE_NAMES.VIEWER) || shopRoles.includes(_constants.ROLE_NAMES.EDITOR);
    }
    function hasWriteAccess(user, shopId, tenantId) {
      if (hasTenantAccess(user, tenantId)) {
        return true;
      }
      const shopRoles = getShopRoles(user, shopId);
      return shopRoles.includes(_constants.ROLE_NAMES.EDITOR);
    }
    function validateReadAccess(user, shopId, tenantId) {
      if (!user.tenantIds.includes(tenantId)) {
        throw new _common.ForbiddenException("Access to this tenant is not allowed");
      }
      if (!hasReadAccess(user, shopId, tenantId)) {
        throw new _common.ForbiddenException("Viewer or editor role required for this shop");
      }
    }
    function validateWriteAccess(user, shopId, tenantId) {
      if (!user.tenantIds.includes(tenantId)) {
        throw new _common.ForbiddenException("Access to this tenant is not allowed");
      }
      if (!hasWriteAccess(user, shopId, tenantId)) {
        throw new _common.ForbiddenException("Editor role required for this shop");
      }
    }
  }
});

// dist/auth/decorators.js
var require_decorators = __commonJS({
  "dist/auth/decorators.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get ACCESS_LEVEL_KEY() {
        return ACCESS_LEVEL_KEY;
      },
      get AccessLevel() {
        return AccessLevel;
      },
      get RequireReadAccess() {
        return RequireReadAccess;
      },
      get RequireWriteAccess() {
        return RequireWriteAccess;
      },
      get ShopContext() {
        return ShopContext;
      }
    });
    var _common = __require("@nestjs/common");
    var ACCESS_LEVEL_KEY = "accessLevel";
    var AccessLevel = /* @__PURE__ */ (function(AccessLevel2) {
      AccessLevel2["READ"] = "read";
      AccessLevel2["WRITE"] = "write";
      AccessLevel2["NONE"] = "none";
      return AccessLevel2;
    })({});
    var RequireReadAccess = () => (0, _common.SetMetadata)(ACCESS_LEVEL_KEY, "read");
    var RequireWriteAccess = () => (0, _common.SetMetadata)(ACCESS_LEVEL_KEY, "write");
    var ShopContext = (0, _common.createParamDecorator)((_data, ctx) => {
      const request = ctx.switchToHttp().getRequest();
      const query = request.query;
      const shopId = Number.parseInt(query.shop_id ?? "", 10);
      const tenantId = Number.parseInt(query.tenant_id ?? "", 10);
      if (Number.isNaN(shopId) || Number.isNaN(tenantId)) {
        throw new Error("shop_id and tenant_id are required as query parameters");
      }
      return {
        shopId,
        tenantId
      };
    });
  }
});

// dist/auth/auth.guard.js
var require_auth_guard = __commonJS({
  "dist/auth/auth.guard.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "AuthGuard", {
      enumerable: true,
      get: function() {
        return AuthGuard;
      }
    });
    var _common = __require("@nestjs/common");
    var _core = __require("@nestjs/core");
    var _apikeysservice = require_api_keys_service();
    var _constants = require_constants();
    var _tenantsservice = require_tenants_service();
    var _userrolesservice = require_user_roles_service();
    var _accesscontrol = require_access_control();
    var _decorators = require_decorators();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var AuthGuard = class AuthGuard {
      async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const apiKey = this.extractApiKey(request);
        if (!apiKey) {
          throw new _common.UnauthorizedException("API key is required");
        }
        const validApiKey = await this.apiKeysService.findValidByKey(apiKey);
        if (!validApiKey) {
          throw new _common.UnauthorizedException("Invalid or expired API key");
        }
        const userRolesWithNames = await this.userRolesService.findByUserIdWithRoleNames(validApiKey.user_id);
        const isSystemAdmin = userRolesWithNames.some((ur) => ur.tenant_id === null && ur.shop_id === null && ur.role_name === _constants.ROLE_NAMES.SYSTEM_ADMIN);
        const tenantIds = [
          ...new Set(userRolesWithNames.filter((ur) => ur.tenant_id !== null).map((ur) => ur.tenant_id))
        ];
        const tenantRolesMap = /* @__PURE__ */ new Map();
        for (const ur of userRolesWithNames) {
          if (ur.tenant_id !== null && ur.shop_id === null) {
            const roles = tenantRolesMap.get(ur.tenant_id) || [];
            roles.push(ur.role_name);
            tenantRolesMap.set(ur.tenant_id, roles);
          }
        }
        const tenantRoles = Array.from(tenantRolesMap.entries()).map(([tenantId, roles]) => ({
          tenantId,
          roles
        }));
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
        const allTenantIds = [
          .../* @__PURE__ */ new Set([
            ...tenantIds,
            ...ownedTenantIds
          ])
        ];
        request.user = {
          id: validApiKey.user_id,
          tenantIds: allTenantIds,
          ownedTenantIds,
          tenantRoles,
          shopRoles,
          isSystemAdmin
        };
        const accessLevel = this.reflector.get(_decorators.ACCESS_LEVEL_KEY, context.getHandler());
        if (accessLevel && accessLevel !== _decorators.AccessLevel.NONE) {
          const query = request.query;
          const shopId = Number.parseInt(query.shop_id ?? "", 10);
          const tenantId = Number.parseInt(query.tenant_id ?? "", 10);
          if (Number.isNaN(shopId) || Number.isNaN(tenantId)) {
            throw new _common.BadRequestException("shop_id and tenant_id are required");
          }
          if (!request.user.tenantIds.includes(tenantId)) {
            throw new _common.ForbiddenException("Access to this tenant is not allowed");
          }
          if (accessLevel === _decorators.AccessLevel.READ && !(0, _accesscontrol.hasReadAccess)(request.user, shopId, tenantId)) {
            throw new _common.ForbiddenException("Viewer or editor role required for this shop");
          }
          if (accessLevel === _decorators.AccessLevel.WRITE && !(0, _accesscontrol.hasWriteAccess)(request.user, shopId, tenantId)) {
            throw new _common.ForbiddenException("Editor role required for this shop");
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
      constructor(apiKeysService, userRolesService, tenantsService, reflector) {
        this.apiKeysService = apiKeysService;
        this.userRolesService = userRolesService;
        this.tenantsService = tenantsService;
        this.reflector = reflector;
      }
    };
    AuthGuard = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _apikeysservice.ApiKeysService === "undefined" ? Object : _apikeysservice.ApiKeysService,
        typeof _userrolesservice.UserRolesService === "undefined" ? Object : _userrolesservice.UserRolesService,
        typeof _tenantsservice.TenantsService === "undefined" ? Object : _tenantsservice.TenantsService,
        typeof _core.Reflector === "undefined" ? Object : _core.Reflector
      ])
    ], AuthGuard);
  }
});

// dist/auth/system-admin.guard.js
var require_system_admin_guard = __commonJS({
  "dist/auth/system-admin.guard.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SystemAdminGuard", {
      enumerable: true,
      get: function() {
        return SystemAdminGuard;
      }
    });
    var _common = __require("@nestjs/common");
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var SystemAdminGuard = class SystemAdminGuard {
      canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (!request.user?.isSystemAdmin) {
          throw new _common.ForbiddenException("Only system administrators can perform this action");
        }
        return true;
      }
    };
    SystemAdminGuard = _ts_decorate([
      (0, _common.Injectable)()
    ], SystemAdminGuard);
  }
});

// dist/entities/api-keys/api-keys.schema.js
var require_api_keys_schema = __commonJS({
  "dist/entities/api-keys/api-keys.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name2 in all) Object.defineProperty(target, name2, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name2).get
      });
    }
    _export(exports, {
      get CreateApiKeySchema() {
        return CreateApiKeySchema;
      },
      get UpdateApiKeySchema() {
        return UpdateApiKeySchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { id, name } = _index.zodSchemas;
    var CreateApiKeySchema = _zod.z.object({
      user_id: id(),
      name: name().optional(),
      expires_at: _zod.z.string().datetime().optional()
    });
    var UpdateApiKeySchema = _zod.z.object({
      name: name().nullable().optional(),
      expires_at: _zod.z.string().datetime().nullable().optional()
    });
  }
});

// dist/entities/api-keys/api-keys.controller.js
var require_api_keys_controller = __commonJS({
  "dist/entities/api-keys/api-keys.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ApiKeysController", {
      enumerable: true,
      get: function() {
        return ApiKeysController;
      }
    });
    var _common = __require("@nestjs/common");
    var _authguard = require_auth_guard();
    var _systemadminguard = require_system_admin_guard();
    var _index = require_common();
    var _apikeysschema = require_api_keys_schema();
    var _apikeysservice = require_api_keys_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var ApiKeysController = class ApiKeysController {
      async findAll(userId) {
        if (userId) {
          return this.apiKeysService.findByUserId(Number.parseInt(userId, 10));
        }
        return this.apiKeysService.findAll();
      }
      async findById(id) {
        return this.apiKeysService.findById(id);
      }
      async create(dto) {
        return this.apiKeysService.create(dto);
      }
      async update(id, dto) {
        return this.apiKeysService.update(id, dto);
      }
      async delete(id) {
        return this.apiKeysService.delete(id);
      }
      constructor(apiKeysService) {
        this.apiKeysService = apiKeysService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      _ts_param(0, (0, _common.Query)("user_id")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ApiKeysController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      _ts_param(0, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ApiKeysController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      _ts_param(0, (0, _common.Body)(new _index.ZodValidationPipe(_apikeysschema.CreateApiKeySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof CreateApiKeyRequest === "undefined" ? Object : CreateApiKeyRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ApiKeysController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      _ts_param(0, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(1, (0, _common.Body)(new _index.ZodValidationPipe(_apikeysschema.UpdateApiKeySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        Number,
        typeof UpdateApiKeyRequest === "undefined" ? Object : UpdateApiKeyRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ApiKeysController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      _ts_param(0, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ApiKeysController.prototype, "delete", null);
    ApiKeysController = _ts_decorate([
      (0, _common.Controller)("api-keys"),
      (0, _common.UseGuards)(_authguard.AuthGuard, _systemadminguard.SystemAdminGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _apikeysservice.ApiKeysService === "undefined" ? Object : _apikeysservice.ApiKeysService
      ])
    ], ApiKeysController);
  }
});

// dist/entities/user-roles/user-roles.controller.js
var require_user_roles_controller = __commonJS({
  "dist/entities/user-roles/user-roles.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "UserRolesController", {
      enumerable: true,
      get: function() {
        return UserRolesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _accesscontrol = require_access_control();
    var _authguard = require_auth_guard();
    var _userrolesservice = require_user_roles_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var UserRolesController = class UserRolesController {
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
          throw new _common.ForbiddenException("tenantId query parameter is required");
        }
        const tid = Number(tenantId);
        if (!(0, _accesscontrol.hasTenantAccess)(req.user, tid)) {
          throw new _common.ForbiddenException("Access to this tenant is not allowed");
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
      async findById(req, id) {
        const userRole = await this.userRolesService.findById(id);
        if (!userRole) {
          throw new _common.NotFoundException(`UserRole with id ${id} not found`);
        }
        if (!req.user.isSystemAdmin) {
          if (!userRole.tenant_id || !(0, _accesscontrol.hasTenantAccess)(req.user, userRole.tenant_id)) {
            throw new _common.ForbiddenException("Access to this user role is not allowed");
          }
        }
        return userRole;
      }
      async create(req, dto) {
        if (!req.user.isSystemAdmin) {
          if (!dto.tenant_id) {
            throw new _common.ForbiddenException("tenant_id is required");
          }
          (0, _accesscontrol.validateTenantAdminAccess)(req.user, dto.tenant_id);
        }
        return this.userRolesService.create(dto);
      }
      async delete(req, id) {
        const userRole = await this.userRolesService.findById(id);
        if (!userRole) {
          throw new _common.NotFoundException(`UserRole with id ${id} not found`);
        }
        if (!req.user.isSystemAdmin) {
          if (!userRole.tenant_id || !(0, _accesscontrol.hasTenantAccess)(req.user, userRole.tenant_id)) {
            throw new _common.ForbiddenException("Cannot delete user role from another tenant");
          }
        }
        await this.userRolesService.delete(id);
      }
      constructor(userRolesService) {
        this.userRolesService = userRolesService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Query)("userId")),
      _ts_param(2, (0, _common.Query)("roleId")),
      _ts_param(3, (0, _common.Query)("tenantId")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        String,
        String,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UserRolesController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UserRolesController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Body)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof _userrolesservice.CreateUserRoleDto === "undefined" ? Object : _userrolesservice.CreateUserRoleDto
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UserRolesController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UserRolesController.prototype, "delete", null);
    UserRolesController = _ts_decorate([
      (0, _common.Controller)("user-roles"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _userrolesservice.UserRolesService === "undefined" ? Object : _userrolesservice.UserRolesService
      ])
    ], UserRolesController);
  }
});

// dist/entities/user-roles/user-roles.module.js
var require_user_roles_module = __commonJS({
  "dist/entities/user-roles/user-roles.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "UserRolesModule", {
      enumerable: true,
      get: function() {
        return UserRolesModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolescontroller = require_user_roles_controller();
    var _userrolesservice = require_user_roles_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var UserRolesModule = class UserRolesModule {
    };
    UserRolesModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          (0, _common.forwardRef)(() => _apikeysmodule.ApiKeysModule),
          (0, _common.forwardRef)(() => _tenantsmodule.TenantsModule)
        ],
        controllers: [
          _userrolescontroller.UserRolesController
        ],
        providers: [
          _userrolesservice.UserRolesService,
          _authguard.AuthGuard
        ],
        exports: [
          _userrolesservice.UserRolesService
        ]
      })
    ], UserRolesModule);
  }
});

// dist/entities/tenants/tenants.schema.js
var require_tenants_schema = __commonJS({
  "dist/entities/tenants/tenants.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name2 in all) Object.defineProperty(target, name2, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name2).get
      });
    }
    _export(exports, {
      get CreateTenantRequestSchema() {
        return CreateTenantRequestSchema;
      },
      get CreateTenantSchema() {
        return CreateTenantSchema;
      },
      get CreateTenantWithShopSchema() {
        return CreateTenantWithShopSchema;
      },
      get UpdateTenantSchema() {
        return UpdateTenantSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { title, email, name, id } = _index.zodSchemas;
    var CreateTenantRequestSchema = _zod.z.object({
      title: title(),
      owner_id: id().optional()
    });
    var CreateTenantSchema = _zod.z.object({
      title: title(),
      owner_id: id().optional(),
      created_by: id().optional()
    });
    var UpdateTenantSchema = _zod.z.object({
      title: title().optional(),
      owner_id: id().nullable().optional()
    });
    var CreateTenantWithShopSchema = _zod.z.object({
      tenantTitle: title(),
      shopTitle: title().optional(),
      userEmail: email(),
      userName: name()
    });
  }
});

// dist/entities/tenants/tenants.controller.js
var require_tenants_controller = __commonJS({
  "dist/entities/tenants/tenants.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "TenantsController", {
      enumerable: true,
      get: function() {
        return TenantsController;
      }
    });
    var _common = __require("@nestjs/common");
    var _authguard = require_auth_guard();
    var _systemadminguard = require_system_admin_guard();
    var _index = require_common();
    var _tenantsschema = require_tenants_schema();
    var _tenantsservice = require_tenants_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var TenantsController = class TenantsController {
      async findAll(_req, ownerId) {
        if (ownerId) {
          return this.tenantsService.findByOwnerId(Number.parseInt(ownerId, 10));
        }
        return this.tenantsService.findAll();
      }
      async findById(_req, id) {
        const tenant = await this.tenantsService.findById(id);
        if (!tenant) {
          throw new _common.NotFoundException(`Tenant with id ${id} not found`);
        }
        return tenant;
      }
      async create(req, dto) {
        return this.tenantsService.create({
          ...dto,
          created_by: req.user.id
        });
      }
      async update(id, dto) {
        const tenant = await this.tenantsService.update(id, dto);
        if (!tenant) {
          throw new _common.NotFoundException(`Tenant with id ${id} not found`);
        }
        return tenant;
      }
      async delete(_req, id) {
        await this.tenantsService.delete(id);
      }
      async createWithShop(_req, dto) {
        return this.tenantsService.createTenantWithShopAndUser(dto);
      }
      constructor(tenantsService) {
        this.tenantsService = tenantsService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Query)("owner_id")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], TenantsController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], TenantsController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      (0, _common.UseGuards)(_systemadminguard.SystemAdminGuard),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Body)(new _index.ZodValidationPipe(_tenantsschema.CreateTenantRequestSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof CreateTenantRequest === "undefined" ? Object : CreateTenantRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], TenantsController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      _ts_param(0, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(1, (0, _common.Body)(new _index.ZodValidationPipe(_tenantsschema.UpdateTenantSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        Number,
        typeof UpdateTenantRequest === "undefined" ? Object : UpdateTenantRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], TenantsController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], TenantsController.prototype, "delete", null);
    _ts_decorate([
      (0, _common.Post)("with-shop-and-user"),
      (0, _common.UseGuards)(_systemadminguard.SystemAdminGuard),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Body)(new _index.ZodValidationPipe(_tenantsschema.CreateTenantWithShopSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof CreateTenantWithShopDto === "undefined" ? Object : CreateTenantWithShopDto
      ]),
      _ts_metadata("design:returntype", Promise)
    ], TenantsController.prototype, "createWithShop", null);
    TenantsController = _ts_decorate([
      (0, _common.Controller)("tenants"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _tenantsservice.TenantsService === "undefined" ? Object : _tenantsservice.TenantsService
      ])
    ], TenantsController);
  }
});

// dist/entities/tenants/tenants.module.js
var require_tenants_module = __commonJS({
  "dist/entities/tenants/tenants.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "TenantsModule", {
      enumerable: true,
      get: function() {
        return TenantsModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _databasemodule = require_database_module();
    var _userrolesmodule = require_user_roles_module();
    var _tenantscontroller = require_tenants_controller();
    var _tenantsservice = require_tenants_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var TenantsModule = class TenantsModule {
    };
    TenantsModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _databasemodule.DatabaseModule,
          (0, _common.forwardRef)(() => _apikeysmodule.ApiKeysModule),
          (0, _common.forwardRef)(() => _userrolesmodule.UserRolesModule)
        ],
        controllers: [
          _tenantscontroller.TenantsController
        ],
        providers: [
          _tenantsservice.TenantsService
        ],
        exports: [
          _tenantsservice.TenantsService
        ]
      })
    ], TenantsModule);
  }
});

// dist/entities/api-keys/api-keys.module.js
var require_api_keys_module = __commonJS({
  "dist/entities/api-keys/api-keys.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ApiKeysModule", {
      enumerable: true,
      get: function() {
        return ApiKeysModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _authguard = require_auth_guard();
    var _systemadminguard = require_system_admin_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _apikeyscontroller = require_api_keys_controller();
    var _apikeysservice = require_api_keys_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var ApiKeysModule = class ApiKeysModule {
    };
    ApiKeysModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          (0, _common.forwardRef)(() => _userrolesmodule.UserRolesModule),
          (0, _common.forwardRef)(() => _tenantsmodule.TenantsModule)
        ],
        controllers: [
          _apikeyscontroller.ApiKeysController
        ],
        providers: [
          _apikeysservice.ApiKeysService,
          _authguard.AuthGuard,
          _systemadminguard.SystemAdminGuard
        ],
        exports: [
          _apikeysservice.ApiKeysService
        ]
      })
    ], ApiKeysModule);
  }
});

// dist/entities/api-keys/index.js
var require_api_keys = __commonJS({
  "dist/entities/api-keys/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_api_keys_controller(), exports);
    _export_star(require_api_keys_module(), exports);
    _export_star(require_api_keys_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/app.service.js
var require_app_service = __commonJS({
  "dist/app.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "AppService", {
      enumerable: true,
      get: function() {
        return AppService;
      }
    });
    var _common = __require("@nestjs/common");
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var AppService = class AppService {
      getHello() {
        return "Sales Planner API";
      }
    };
    AppService = _ts_decorate([
      (0, _common.Injectable)()
    ], AppService);
  }
});

// dist/app.controller.js
var require_app_controller = __commonJS({
  "dist/app.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "AppController", {
      enumerable: true,
      get: function() {
        return AppController;
      }
    });
    var _nodefs = __require("node:fs");
    var _nodepath = __require("node:path");
    var _common = __require("@nestjs/common");
    var _appservice = require_app_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var AppController = class AppController {
      getHello() {
        return this.appService.getHello();
      }
      getHealth() {
        const packageJson = JSON.parse((0, _nodefs.readFileSync)((0, _nodepath.join)(process.cwd(), "package.json"), "utf-8"));
        return {
          status: "ok",
          version: packageJson.version
        };
      }
      getVersion() {
        const packageJson = JSON.parse((0, _nodefs.readFileSync)((0, _nodepath.join)(process.cwd(), "package.json"), "utf-8"));
        return {
          version: packageJson.version
        };
      }
      constructor(appService) {
        this.appService = appService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", []),
      _ts_metadata("design:returntype", String)
    ], AppController.prototype, "getHello", null);
    _ts_decorate([
      (0, _common.Get)("health"),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", []),
      _ts_metadata("design:returntype", Object)
    ], AppController.prototype, "getHealth", null);
    _ts_decorate([
      (0, _common.Get)("version"),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", []),
      _ts_metadata("design:returntype", Object)
    ], AppController.prototype, "getVersion", null);
    AppController = _ts_decorate([
      (0, _common.Controller)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _appservice.AppService === "undefined" ? Object : _appservice.AppService
      ])
    ], AppController);
  }
});

// dist/auth/auth.module.js
var require_auth_module = __commonJS({
  "dist/auth/auth.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "AuthModule", {
      enumerable: true,
      get: function() {
        return AuthModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _authguard = require_auth_guard();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var AuthModule = class AuthModule {
    };
    AuthModule = _ts_decorate([
      (0, _common.Global)(),
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        providers: [
          _authguard.AuthGuard
        ],
        exports: [
          _authguard.AuthGuard
        ]
      })
    ], AuthModule);
  }
});

// dist/auth/index.js
var require_auth = __commonJS({
  "dist/auth/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get AuthGuard() {
        return _authguard.AuthGuard;
      },
      get AuthModule() {
        return _authmodule.AuthModule;
      },
      get AuthenticatedRequest() {
        return _authguard.AuthenticatedRequest;
      },
      get AuthenticatedUser() {
        return _authguard.AuthenticatedUser;
      },
      get RequireReadAccess() {
        return _decorators.RequireReadAccess;
      },
      get RequireWriteAccess() {
        return _decorators.RequireWriteAccess;
      },
      get ShopContext() {
        return _decorators.ShopContext;
      },
      get SystemAdminGuard() {
        return _systemadminguard.SystemAdminGuard;
      },
      get hasAdminAccess() {
        return _accesscontrol.hasAdminAccess;
      },
      get hasReadAccess() {
        return _accesscontrol.hasReadAccess;
      },
      get hasTenantAccess() {
        return _accesscontrol.hasTenantAccess;
      },
      get hasWriteAccess() {
        return _accesscontrol.hasWriteAccess;
      },
      get isTenantAdmin() {
        return _accesscontrol.isTenantAdmin;
      },
      get isTenantOwner() {
        return _accesscontrol.isTenantOwner;
      },
      get validateReadAccess() {
        return _accesscontrol.validateReadAccess;
      },
      get validateTenantAdminAccess() {
        return _accesscontrol.validateTenantAdminAccess;
      },
      get validateWriteAccess() {
        return _accesscontrol.validateWriteAccess;
      }
    });
    var _accesscontrol = require_access_control();
    var _authguard = require_auth_guard();
    var _authmodule = require_auth_module();
    var _decorators = require_decorators();
    var _systemadminguard = require_system_admin_guard();
  }
});

// dist/entities/marketplaces/marketplaces.schema.js
var require_marketplaces_schema = __commonJS({
  "dist/entities/marketplaces/marketplaces.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateMarketplaceSchema() {
        return CreateMarketplaceSchema;
      },
      get ImportMarketplaceItemSchema() {
        return ImportMarketplaceItemSchema;
      },
      get UpdateMarketplaceSchema() {
        return UpdateMarketplaceSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { shortId, title } = _index.zodSchemas;
    var CreateMarketplaceSchema = _zod.z.object({
      code: shortId(),
      title: title()
    });
    var UpdateMarketplaceSchema = _zod.z.object({
      code: shortId().optional(),
      title: title().optional()
    });
    var ImportMarketplaceItemSchema = _zod.z.object({
      code: shortId(),
      title: title()
    });
  }
});

// dist/entities/marketplaces/marketplaces.repository.js
var require_marketplaces_repository = __commonJS({
  "dist/entities/marketplaces/marketplaces.repository.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "MarketplacesRepository", {
      enumerable: true,
      get: function() {
        return MarketplacesRepository;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _index1 = require_database();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var MarketplacesRepository = class MarketplacesRepository extends _index.CodedShopScopedRepository {
      constructor(db) {
        super(db, "marketplaces", _index1.USER_QUERYABLE_TABLES);
      }
    };
    MarketplacesRepository = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _index1.DatabaseService === "undefined" ? Object : _index1.DatabaseService
      ])
    ], MarketplacesRepository);
  }
});

// dist/entities/marketplaces/marketplaces.service.js
var require_marketplaces_service = __commonJS({
  "dist/entities/marketplaces/marketplaces.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "MarketplacesService", {
      enumerable: true,
      get: function() {
        return MarketplacesService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _marketplacesrepository = require_marketplaces_repository();
    var _marketplacesschema = require_marketplaces_schema();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var MarketplacesService = class MarketplacesService extends _index.CodedShopScopedEntityService {
      constructor(marketplacesRepository) {
        super(marketplacesRepository, "marketplace", _marketplacesschema.ImportMarketplaceItemSchema), this.marketplacesRepository = marketplacesRepository;
      }
    };
    MarketplacesService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _marketplacesrepository.MarketplacesRepository === "undefined" ? Object : _marketplacesrepository.MarketplacesRepository
      ])
    ], MarketplacesService);
  }
});

// dist/entities/marketplaces/marketplaces.controller.js
var require_marketplaces_controller = __commonJS({
  "dist/entities/marketplaces/marketplaces.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "MarketplacesController", {
      enumerable: true,
      get: function() {
        return MarketplacesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _platformexpress = __require("@nestjs/platform-express");
    var _authguard = require_auth_guard();
    var _decorators = require_decorators();
    var _index = require_common();
    var _marketplacesschema = require_marketplaces_schema();
    var _marketplacesservice = require_marketplaces_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var MarketplacesController = class MarketplacesController {
      async findAll(_req, ctx, query) {
        return this.marketplacesService.findByShopIdPaginated(ctx.shopId, query);
      }
      async findByCode(_req, ctx, code) {
        const marketplace = await this.marketplacesService.findByCodeAndShop(code, ctx.shopId);
        if (!marketplace || marketplace.tenant_id !== ctx.tenantId) {
          throw new _common.NotFoundException(`Marketplace with code ${code} not found`);
        }
        return marketplace;
      }
      async exportJson(_req, ctx, res) {
        const items = await this.marketplacesService.exportForShop(ctx.shopId);
        (0, _index.sendJsonExport)(res, items, "marketplaces.json");
      }
      async exportCsv(_req, ctx, res) {
        const items = await this.marketplacesService.exportForShop(ctx.shopId);
        (0, _index.sendCsvExport)(res, items, "marketplaces.csv", [
          "code",
          "title"
        ]);
      }
      async findById(_req, ctx, id) {
        const marketplace = await this.marketplacesService.findById(id);
        (0, _index.assertShopAccess)(marketplace, ctx, "Marketplace", id);
        return marketplace;
      }
      async create(_req, ctx, dto) {
        return this.marketplacesService.create({
          ...dto,
          shop_id: ctx.shopId,
          tenant_id: ctx.tenantId
        });
      }
      async update(_req, ctx, id, dto) {
        const marketplace = await this.marketplacesService.findById(id);
        (0, _index.assertShopAccess)(marketplace, ctx, "Marketplace", id);
        return this.marketplacesService.update(id, dto);
      }
      async delete(_req, ctx, id) {
        const marketplace = await this.marketplacesService.findById(id);
        (0, _index.assertShopAccess)(marketplace, ctx, "Marketplace", id);
        await this.marketplacesService.delete(id);
        return {
          message: "Marketplace deleted successfully"
        };
      }
      async importJson(_req, ctx, items, file) {
        const validatedData = (0, _index.parseAndValidateImport)(file, items, _marketplacesschema.ImportMarketplaceItemSchema);
        return this.marketplacesService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
      }
      async importCsv(_req, ctx, file) {
        const records = (0, _index.parseCsvImport)(file, void 0, [
          "code",
          "title"
        ]);
        const items = records.map((record) => ({
          code: record.code,
          title: record.title
        }));
        return this.marketplacesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
      }
      constructor(marketplacesService) {
        this.marketplacesService = marketplacesService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Query)(new _index.ZodValidationPipe(_index.PaginationQuerySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof PaginationQuery === "undefined" ? Object : PaginationQuery
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)("code/:code"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("code")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "findByCode", null);
    _ts_decorate([
      (0, _common.Get)("export/json"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "exportJson", null);
    _ts_decorate([
      (0, _common.Get)("export/csv"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "exportCsv", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_marketplacesschema.CreateMarketplaceSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof CreateMarketplaceRequest === "undefined" ? Object : CreateMarketplaceRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(3, (0, _common.Body)(new _index.ZodValidationPipe(_marketplacesschema.UpdateMarketplaceSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number,
        typeof UpdateMarketplaceRequest === "undefined" ? Object : UpdateMarketplaceRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "delete", null);
    _ts_decorate([
      (0, _common.Post)("import/json"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)()),
      _ts_param(3, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Array,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "importJson", null);
    _ts_decorate([
      (0, _common.Post)("import/csv"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof AuthenticatedRequest === "undefined" ? Object : AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MarketplacesController.prototype, "importCsv", null);
    MarketplacesController = _ts_decorate([
      (0, _common.Controller)("marketplaces"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _marketplacesservice.MarketplacesService === "undefined" ? Object : _marketplacesservice.MarketplacesService
      ])
    ], MarketplacesController);
  }
});

// dist/entities/marketplaces/marketplaces-examples.controller.js
var require_marketplaces_examples_controller = __commonJS({
  "dist/entities/marketplaces/marketplaces-examples.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "MarketplacesExamplesController", {
      enumerable: true,
      get: function() {
        return MarketplacesExamplesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var EXAMPLE_MARKETPLACES = [
      {
        code: "wb",
        title: "Wildberries"
      },
      {
        code: "ozon",
        title: "Ozon"
      },
      {
        code: "ym",
        title: "Yandex Market"
      }
    ];
    var MarketplacesExamplesController = class MarketplacesExamplesController extends _index.BaseExamplesController {
      constructor(...args) {
        super(...args), this.examples = EXAMPLE_MARKETPLACES, this.entityName = "marketplaces", this.csvColumns = [
          "code",
          "title"
        ];
      }
    };
    MarketplacesExamplesController = _ts_decorate([
      (0, _common.Controller)("marketplaces/examples")
    ], MarketplacesExamplesController);
  }
});

// dist/entities/marketplaces/marketplaces.module.js
var require_marketplaces_module = __commonJS({
  "dist/entities/marketplaces/marketplaces.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "MarketplacesModule", {
      enumerable: true,
      get: function() {
        return MarketplacesModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _systemadminguard = require_system_admin_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _marketplacescontroller = require_marketplaces_controller();
    var _marketplacesexamplescontroller = require_marketplaces_examples_controller();
    var _marketplacesrepository = require_marketplaces_repository();
    var _marketplacesservice = require_marketplaces_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var MarketplacesModule = class MarketplacesModule {
    };
    MarketplacesModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        controllers: [
          _marketplacescontroller.MarketplacesController,
          _marketplacesexamplescontroller.MarketplacesExamplesController
        ],
        providers: [
          _marketplacesrepository.MarketplacesRepository,
          _marketplacesservice.MarketplacesService,
          _authguard.AuthGuard,
          _systemadminguard.SystemAdminGuard
        ],
        exports: [
          _marketplacesservice.MarketplacesService
        ]
      })
    ], MarketplacesModule);
  }
});

// dist/roles/roles.schema.js
var require_roles_schema = __commonJS({
  "dist/roles/roles.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateRoleSchema() {
        return CreateRoleSchema;
      },
      get UpdateRoleSchema() {
        return UpdateRoleSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { code, description } = _index.zodSchemas;
    var CreateRoleSchema = _zod.z.object({
      name: code(),
      description: description().optional()
    });
    var UpdateRoleSchema = _zod.z.object({
      name: code().optional(),
      description: description().nullable().optional()
    });
  }
});

// dist/roles/roles.service.js
var require_roles_service = __commonJS({
  "dist/roles/roles.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "RolesService", {
      enumerable: true,
      get: function() {
        return RolesService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _databaseservice = require_database_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var RolesService = class RolesService {
      async findAll() {
        return this.db.selectFrom("roles").selectAll().execute();
      }
      async findById(id) {
        return this.db.selectFrom("roles").selectAll().where("id", "=", id).executeTakeFirst();
      }
      async findByName(name) {
        return this.db.selectFrom("roles").selectAll().where("name", "=", name).executeTakeFirst();
      }
      async create(dto) {
        try {
          return this.db.insertInto("roles").values(dto).returningAll().executeTakeFirstOrThrow();
        } catch (error) {
          if ((0, _index.isUniqueViolation)(error)) {
            throw new _index.DuplicateResourceException("Role", dto.name);
          }
          throw error;
        }
      }
      async update(id, dto) {
        return this.db.updateTable("roles").set({
          ...dto,
          updated_at: /* @__PURE__ */ new Date()
        }).where("id", "=", id).returningAll().executeTakeFirst();
      }
      async delete(id) {
        await this.db.deleteFrom("roles").where("id", "=", id).execute();
      }
      constructor(db) {
        this.db = db;
      }
    };
    RolesService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _databaseservice.DatabaseService === "undefined" ? Object : _databaseservice.DatabaseService
      ])
    ], RolesService);
  }
});

// dist/roles/roles.controller.js
var require_roles_controller = __commonJS({
  "dist/roles/roles.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "RolesController", {
      enumerable: true,
      get: function() {
        return RolesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _authguard = require_auth_guard();
    var _systemadminguard = require_system_admin_guard();
    var _index = require_common();
    var _rolesschema = require_roles_schema();
    var _rolesservice = require_roles_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var RolesController = class RolesController {
      async findAll() {
        return this.rolesService.findAll();
      }
      async findById(id) {
        const role = await this.rolesService.findById(id);
        if (!role) {
          throw new _common.NotFoundException(`Role with id ${id} not found`);
        }
        return role;
      }
      async create(dto) {
        return this.rolesService.create(dto);
      }
      async update(id, dto) {
        const role = await this.rolesService.update(id, dto);
        if (!role) {
          throw new _common.NotFoundException(`Role with id ${id} not found`);
        }
        return role;
      }
      async delete(id) {
        await this.rolesService.delete(id);
      }
      constructor(rolesService) {
        this.rolesService = rolesService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", []),
      _ts_metadata("design:returntype", Promise)
    ], RolesController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      _ts_param(0, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], RolesController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      _ts_param(0, (0, _common.Body)(new _index.ZodValidationPipe(_rolesschema.CreateRoleSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof CreateRoleRequest === "undefined" ? Object : CreateRoleRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], RolesController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      _ts_param(0, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(1, (0, _common.Body)(new _index.ZodValidationPipe(_rolesschema.UpdateRoleSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        Number,
        typeof UpdateRoleRequest === "undefined" ? Object : UpdateRoleRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], RolesController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      _ts_param(0, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], RolesController.prototype, "delete", null);
    RolesController = _ts_decorate([
      (0, _common.Controller)("roles"),
      (0, _common.UseGuards)(_authguard.AuthGuard, _systemadminguard.SystemAdminGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _rolesservice.RolesService === "undefined" ? Object : _rolesservice.RolesService
      ])
    ], RolesController);
  }
});

// dist/roles/roles.module.js
var require_roles_module = __commonJS({
  "dist/roles/roles.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "RolesModule", {
      enumerable: true,
      get: function() {
        return RolesModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _systemadminguard = require_system_admin_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _rolescontroller = require_roles_controller();
    var _rolesservice = require_roles_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var RolesModule = class RolesModule {
    };
    RolesModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        controllers: [
          _rolescontroller.RolesController
        ],
        providers: [
          _rolesservice.RolesService,
          _authguard.AuthGuard,
          _systemadminguard.SystemAdminGuard
        ],
        exports: [
          _rolesservice.RolesService
        ]
      })
    ], RolesModule);
  }
});

// dist/entities/users/users.schema.js
var require_users_schema = __commonJS({
  "dist/entities/users/users.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name2 in all) Object.defineProperty(target, name2, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name2).get
      });
    }
    _export(exports, {
      get CreateUserSchema() {
        return CreateUserSchema;
      },
      get UpdateUserSchema() {
        return UpdateUserSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { email, name, id } = _index.zodSchemas;
    var CreateUserSchema = _zod.z.object({
      email: email(),
      name: name(),
      default_shop_id: id().optional()
    });
    var UpdateUserSchema = _zod.z.object({
      email: email().optional(),
      name: name().optional(),
      default_shop_id: id().nullable().optional()
    });
  }
});

// dist/entities/users/users.service.js
var require_users_service = __commonJS({
  "dist/entities/users/users.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "UsersService", {
      enumerable: true,
      get: function() {
        return UsersService;
      }
    });
    var _common = __require("@nestjs/common");
    var _kysely = __require("kysely");
    var _constants = require_constants();
    var _index = require_common();
    var _index1 = require_database();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var UsersService = class UsersService {
      async findAll() {
        return this.db.selectFrom("users").selectAll().execute();
      }
      async findById(id) {
        return this.db.selectFrom("users").selectAll().where("id", "=", id).executeTakeFirst();
      }
      async findByEmail(email) {
        return this.db.selectFrom("users").selectAll().where("email", "=", email).executeTakeFirst();
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
          if ((0, _index.isUniqueViolation)(error)) {
            throw new _index.DuplicateResourceException("User", dto.email);
          }
          throw error;
        }
      }
      async update(id, dto) {
        return this.db.updateTable("users").set({
          ...dto,
          updated_at: /* @__PURE__ */ new Date()
        }).where("id", "=", id).returningAll().executeTakeFirst();
      }
      async delete(id) {
        await this.db.deleteFrom("users").where("id", "=", id).execute();
      }
      async findByTenantId(tenantId) {
        return this.db.selectFrom("users").selectAll("users").innerJoin("user_roles", "user_roles.user_id", "users.id").where("user_roles.tenant_id", "=", tenantId).groupBy("users.id").execute();
      }
      async getUserWithRolesAndTenants(userId) {
        const user = await this.findById(userId);
        if (!user) {
          return null;
        }
        const rolesResult = await this.db.selectFrom("user_roles").innerJoin("roles", "roles.id", "user_roles.role_id").leftJoin("tenants", "tenants.id", "user_roles.tenant_id").leftJoin("shops", "shops.id", "user_roles.shop_id").select("user_roles.id").select((0, _kysely.sql)`roles.name`.as("role_name")).select("user_roles.tenant_id").select((0, _kysely.sql)`tenants.title`.as("tenant_title")).select("user_roles.shop_id").select((0, _kysely.sql)`shops.title`.as("shop_title")).where("user_roles.user_id", "=", userId).execute();
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
        const tenantsResult = await this.db.selectFrom("tenants").select("id").select("title").select("owner_id").where("id", "in", tenantIds.length > 0 ? tenantIds : [
          -1
        ]).execute();
        const fullAccessTenantIds = /* @__PURE__ */ new Set();
        for (const tenant of tenantsResult) {
          if (tenant.owner_id === userId) {
            fullAccessTenantIds.add(tenant.id);
            continue;
          }
          const hasTenantAdmin = roles.some((r) => r.tenant_id === tenant.id && r.role_name === _constants.ROLE_NAMES.TENANT_ADMIN && r.shop_id === null);
          if (hasTenantAdmin) {
            fullAccessTenantIds.add(tenant.id);
          }
        }
        const shopLevelRoleShopIds = new Set(roles.filter((r) => r.shop_id !== null).map((r) => r.shop_id));
        const shopsResult = await this.db.selectFrom("shops").select("id").select("title").select("tenant_id").where("tenant_id", "in", tenantIds.length > 0 ? tenantIds : [
          -1
        ]).execute();
        const shopsByTenant = shopsResult.reduce((acc, shop) => {
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
        }, {});
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
      constructor(db) {
        this.db = db;
      }
    };
    UsersService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _index1.DatabaseService === "undefined" ? Object : _index1.DatabaseService
      ])
    ], UsersService);
  }
});

// dist/entities/users/users.controller.js
var require_users_controller = __commonJS({
  "dist/entities/users/users.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "UsersController", {
      enumerable: true,
      get: function() {
        return UsersController;
      }
    });
    var _common = __require("@nestjs/common");
    var _accesscontrol = require_access_control();
    var _authguard = require_auth_guard();
    var _index = require_common();
    var _userrolesservice = require_user_roles_service();
    var _usersschema = require_users_schema();
    var _usersservice = require_users_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var UsersController = class UsersController {
      async findAll(req, tenantId) {
        if (req.user.isSystemAdmin) {
          if (tenantId) {
            return this.usersService.findByTenantId(Number(tenantId));
          }
          return this.usersService.findAll();
        }
        if (!tenantId) {
          throw new _common.ForbiddenException("tenantId query parameter is required");
        }
        const tid = Number(tenantId);
        if (!(0, _accesscontrol.hasTenantAccess)(req.user, tid)) {
          throw new _common.ForbiddenException("Access to this tenant is not allowed");
        }
        return this.usersService.findByTenantId(tid);
      }
      async findById(req, id) {
        const user = await this.usersService.findById(id);
        if (!user) {
          throw new _common.NotFoundException(`User with id ${id} not found`);
        }
        if (req.user.isSystemAdmin) {
          return user;
        }
        const userRoles = await this.userRolesService.findByUserId(id);
        const hasAccessToUser = userRoles.some((ur) => ur.tenant_id && (0, _accesscontrol.hasTenantAccess)(req.user, ur.tenant_id));
        if (!hasAccessToUser) {
          throw new _common.ForbiddenException("Access to this user is not allowed");
        }
        return user;
      }
      async create(req, tenantId, dto) {
        if (!req.user.isSystemAdmin) {
          if (!tenantId) {
            throw new _common.ForbiddenException("tenantId query parameter is required");
          }
          (0, _accesscontrol.validateTenantAdminAccess)(req.user, Number(tenantId));
        }
        if (!dto) {
          throw new _common.ForbiddenException("Request body is required");
        }
        return this.usersService.create(dto);
      }
      async delete(req, id) {
        const user = await this.usersService.findById(id);
        if (!user) {
          throw new _common.NotFoundException(`User with id ${id} not found`);
        }
        if (req.user.isSystemAdmin) {
          return this.usersService.delete(id);
        }
        const userRoles = await this.userRolesService.findByUserId(id);
        const allRolesInManagedTenants = userRoles.every((ur) => ur.tenant_id && (0, _accesscontrol.hasTenantAccess)(req.user, ur.tenant_id));
        if (!allRolesInManagedTenants) {
          throw new _common.ForbiddenException("Cannot delete user with roles in other tenants");
        }
        await this.usersService.delete(id);
      }
      constructor(usersService, userRolesService) {
        this.usersService = usersService;
        this.userRolesService = userRolesService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Query)("tenantId")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UsersController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UsersController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Query)("tenantId")),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_usersschema.CreateUserSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        String,
        typeof CreateUserRequest === "undefined" ? Object : CreateUserRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UsersController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UsersController.prototype, "delete", null);
    UsersController = _ts_decorate([
      (0, _common.Controller)("users"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _userrolesservice.UserRolesService === "undefined" ? Object : _userrolesservice.UserRolesService
      ])
    ], UsersController);
  }
});

// dist/entities/users/users.module.js
var require_users_module = __commonJS({
  "dist/entities/users/users.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "UsersModule", {
      enumerable: true,
      get: function() {
        return UsersModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _userscontroller = require_users_controller();
    var _usersservice = require_users_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var UsersModule = class UsersModule {
    };
    UsersModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        controllers: [
          _userscontroller.UsersController
        ],
        providers: [
          _usersservice.UsersService,
          _authguard.AuthGuard
        ],
        exports: [
          _usersservice.UsersService
        ]
      })
    ], UsersModule);
  }
});

// dist/bootstrap/bootstrap.service.js
var require_bootstrap_service = __commonJS({
  "dist/bootstrap/bootstrap.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BootstrapService", {
      enumerable: true,
      get: function() {
        return BootstrapService;
      }
    });
    var _common = __require("@nestjs/common");
    var _config = __require("@nestjs/config");
    var _apikeysservice = require_api_keys_service();
    var _constants = require_constants();
    var _rolesservice = require_roles_service();
    var _userrolesservice = require_user_roles_service();
    var _usersservice = require_users_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var BootstrapService = class BootstrapService2 {
      async onModuleInit() {
        await this.seedRoles();
        await this.ensureSystemAdmin();
      }
      async seedRoles() {
        const roles = [
          {
            name: _constants.ROLE_NAMES.VIEWER,
            description: "Read-only access to a shop"
          },
          {
            name: _constants.ROLE_NAMES.EDITOR,
            description: "Can create and edit content in a shop"
          },
          {
            name: _constants.ROLE_NAMES.TENANT_ADMIN,
            description: "Full access to all shops in a tenant"
          }
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
        let systemAdminRole = await this.rolesService.findByName(_constants.ROLE_NAMES.SYSTEM_ADMIN);
        if (!systemAdminRole) {
          this.logger.log("Creating systemAdmin role...");
          systemAdminRole = await this.rolesService.create({
            name: _constants.ROLE_NAMES.SYSTEM_ADMIN,
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
        const hasRole = await this.userRolesService.hasRole(adminUser.id, _constants.ROLE_NAMES.SYSTEM_ADMIN);
        if (!hasRole) {
          this.logger.log("Assigning systemAdmin role to user...");
          await this.userRolesService.create({
            user_id: adminUser.id,
            role_id: systemAdminRole.id
          });
        }
        this.logger.log("System admin initialization complete");
      }
      constructor(configService, usersService, rolesService, userRolesService, apiKeysService) {
        this.configService = configService;
        this.usersService = usersService;
        this.rolesService = rolesService;
        this.userRolesService = userRolesService;
        this.apiKeysService = apiKeysService;
        this.logger = new _common.Logger(BootstrapService2.name);
      }
    };
    BootstrapService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _rolesservice.RolesService === "undefined" ? Object : _rolesservice.RolesService,
        typeof _userrolesservice.UserRolesService === "undefined" ? Object : _userrolesservice.UserRolesService,
        typeof _apikeysservice.ApiKeysService === "undefined" ? Object : _apikeysservice.ApiKeysService
      ])
    ], BootstrapService);
  }
});

// dist/bootstrap/bootstrap.module.js
var require_bootstrap_module = __commonJS({
  "dist/bootstrap/bootstrap.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BootstrapModule", {
      enumerable: true,
      get: function() {
        return BootstrapModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _marketplacesmodule = require_marketplaces_module();
    var _rolesmodule = require_roles_module();
    var _userrolesmodule = require_user_roles_module();
    var _usersmodule = require_users_module();
    var _bootstrapservice = require_bootstrap_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var BootstrapModule = class BootstrapModule {
    };
    BootstrapModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _usersmodule.UsersModule,
          _rolesmodule.RolesModule,
          _userrolesmodule.UserRolesModule,
          _apikeysmodule.ApiKeysModule,
          _marketplacesmodule.MarketplacesModule
        ],
        providers: [
          _bootstrapservice.BootstrapService
        ]
      })
    ], BootstrapModule);
  }
});

// dist/bootstrap/index.js
var require_bootstrap = __commonJS({
  "dist/bootstrap/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_bootstrap_module(), exports);
    _export_star(require_bootstrap_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/brands/brands.schema.js
var require_brands_schema = __commonJS({
  "dist/entities/brands/brands.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateBrandSchema() {
        return CreateBrandSchema;
      },
      get ImportBrandItemSchema() {
        return ImportBrandItemSchema;
      },
      get UpdateBrandSchema() {
        return UpdateBrandSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { code, title } = _index.zodSchemas;
    var CreateBrandSchema = _zod.z.object({
      code: code(),
      title: title()
    });
    var UpdateBrandSchema = _zod.z.object({
      code: code().optional(),
      title: title().optional()
    });
    var ImportBrandItemSchema = _zod.z.object({
      code: code(),
      title: title()
    });
  }
});

// dist/entities/brands/brands.repository.js
var require_brands_repository = __commonJS({
  "dist/entities/brands/brands.repository.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BrandsRepository", {
      enumerable: true,
      get: function() {
        return BrandsRepository;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _index1 = require_database();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var BrandsRepository = class BrandsRepository extends _index.CodedShopScopedRepository {
      constructor(db) {
        super(db, "brands", _index1.USER_QUERYABLE_TABLES);
      }
    };
    BrandsRepository = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _index1.DatabaseService === "undefined" ? Object : _index1.DatabaseService
      ])
    ], BrandsRepository);
  }
});

// dist/entities/brands/brands.service.js
var require_brands_service = __commonJS({
  "dist/entities/brands/brands.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BrandsService", {
      enumerable: true,
      get: function() {
        return BrandsService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _brandsrepository = require_brands_repository();
    var _brandsschema = require_brands_schema();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var BrandsService = class BrandsService extends _index.CodedShopScopedEntityService {
      constructor(repository) {
        super(repository, "brand", _brandsschema.ImportBrandItemSchema);
      }
    };
    BrandsService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _brandsrepository.BrandsRepository === "undefined" ? Object : _brandsrepository.BrandsRepository
      ])
    ], BrandsService);
  }
});

// dist/entities/brands/brands.controller.js
var require_brands_controller = __commonJS({
  "dist/entities/brands/brands.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BrandsController", {
      enumerable: true,
      get: function() {
        return BrandsController;
      }
    });
    var _common = __require("@nestjs/common");
    var _platformexpress = __require("@nestjs/platform-express");
    var _authguard = require_auth_guard();
    var _decorators = require_decorators();
    var _index = require_common();
    var _brandsschema = require_brands_schema();
    var _brandsservice = require_brands_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var BrandsController = class BrandsController {
      async findAll(_req, ctx, query) {
        return this.brandsService.findByShopIdPaginated(ctx.shopId, query);
      }
      async findByCode(_req, ctx, code) {
        const brand = await this.brandsService.findByCodeAndShop(code, ctx.shopId);
        if (!brand || brand.tenant_id !== ctx.tenantId) {
          throw new _common.NotFoundException(`Brand with code ${code} not found`);
        }
        return brand;
      }
      async exportJson(_req, ctx, res) {
        const items = await this.brandsService.exportForShop(ctx.shopId);
        (0, _index.sendJsonExport)(res, items, "brands.json");
      }
      async exportCsv(_req, ctx, res) {
        const items = await this.brandsService.exportForShop(ctx.shopId);
        (0, _index.sendCsvExport)(res, items, "brands.csv", [
          "code",
          "title"
        ]);
      }
      async findById(_req, ctx, id) {
        const brand = await this.brandsService.findById(id);
        (0, _index.assertShopAccess)(brand, ctx, "Brand", id);
        return brand;
      }
      async create(_req, ctx, body) {
        return this.brandsService.create({
          ...body,
          shop_id: ctx.shopId,
          tenant_id: ctx.tenantId
        });
      }
      async update(_req, ctx, id, body) {
        const brand = await this.brandsService.findById(id);
        (0, _index.assertShopAccess)(brand, ctx, "Brand", id);
        const updated = await this.brandsService.update(id, body);
        if (!updated) {
          throw new _common.NotFoundException(`Brand with id ${id} not found`);
        }
        return updated;
      }
      async delete(_req, ctx, id) {
        const brand = await this.brandsService.findById(id);
        (0, _index.assertShopAccess)(brand, ctx, "Brand", id);
        await this.brandsService.delete(id);
        return {
          message: "Brand deleted successfully"
        };
      }
      async importJson(_req, ctx, items, file) {
        const validatedData = (0, _index.parseAndValidateImport)(file, items, _brandsschema.ImportBrandItemSchema);
        return this.brandsService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
      }
      async importCsv(_req, ctx, file) {
        const records = (0, _index.parseCsvImport)(file, void 0, [
          "code",
          "title"
        ]);
        const items = records.map((record) => ({
          code: record.code,
          title: record.title
        }));
        return this.brandsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
      }
      constructor(brandsService) {
        this.brandsService = brandsService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Query)(new _index.ZodValidationPipe(_index.PaginationQuerySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof PaginationQuery === "undefined" ? Object : PaginationQuery
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)("code/:code"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("code")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "findByCode", null);
    _ts_decorate([
      (0, _common.Get)("export/json"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "exportJson", null);
    _ts_decorate([
      (0, _common.Get)("export/csv"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "exportCsv", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_brandsschema.CreateBrandSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof CreateBrandRequest === "undefined" ? Object : CreateBrandRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(3, (0, _common.Body)(new _index.ZodValidationPipe(_brandsschema.UpdateBrandSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number,
        typeof UpdateBrandRequest === "undefined" ? Object : UpdateBrandRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "delete", null);
    _ts_decorate([
      (0, _common.Post)("import/json"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)()),
      _ts_param(3, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Array,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "importJson", null);
    _ts_decorate([
      (0, _common.Post)("import/csv"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], BrandsController.prototype, "importCsv", null);
    BrandsController = _ts_decorate([
      (0, _common.Controller)("brands"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _brandsservice.BrandsService === "undefined" ? Object : _brandsservice.BrandsService
      ])
    ], BrandsController);
  }
});

// dist/entities/brands/brands-examples.controller.js
var require_brands_examples_controller = __commonJS({
  "dist/entities/brands/brands-examples.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BrandsExamplesController", {
      enumerable: true,
      get: function() {
        return BrandsExamplesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var EXAMPLE_BRANDS = [
      {
        code: "apple",
        title: "Apple"
      },
      {
        code: "samsung",
        title: "Samsung"
      },
      {
        code: "dell",
        title: "Dell"
      }
    ];
    var BrandsExamplesController = class BrandsExamplesController extends _index.BaseExamplesController {
      constructor(...args) {
        super(...args), this.examples = EXAMPLE_BRANDS, this.entityName = "brands", this.csvColumns = [
          "code",
          "title"
        ];
      }
    };
    BrandsExamplesController = _ts_decorate([
      (0, _common.Controller)("brands/examples")
    ], BrandsExamplesController);
  }
});

// dist/entities/brands/brands.module.js
var require_brands_module = __commonJS({
  "dist/entities/brands/brands.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BrandsModule", {
      enumerable: true,
      get: function() {
        return BrandsModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _brandscontroller = require_brands_controller();
    var _brandsexamplescontroller = require_brands_examples_controller();
    var _brandsrepository = require_brands_repository();
    var _brandsservice = require_brands_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var BrandsModule = class BrandsModule {
    };
    BrandsModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        controllers: [
          _brandscontroller.BrandsController,
          _brandsexamplescontroller.BrandsExamplesController
        ],
        providers: [
          _brandsrepository.BrandsRepository,
          _brandsservice.BrandsService,
          _authguard.AuthGuard
        ],
        exports: [
          _brandsservice.BrandsService
        ]
      })
    ], BrandsModule);
  }
});

// dist/entities/brands/index.js
var require_brands = __commonJS({
  "dist/entities/brands/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_brands_controller(), exports);
    _export_star(require_brands_module(), exports);
    _export_star(require_brands_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/categories/categories.schema.js
var require_categories_schema = __commonJS({
  "dist/entities/categories/categories.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateCategorySchema() {
        return CreateCategorySchema;
      },
      get ImportCategoryItemSchema() {
        return ImportCategoryItemSchema;
      },
      get UpdateCategorySchema() {
        return UpdateCategorySchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { code, title } = _index.zodSchemas;
    var CreateCategorySchema = _zod.z.object({
      code: code(),
      title: title()
    });
    var UpdateCategorySchema = _zod.z.object({
      code: code().optional(),
      title: title().optional()
    });
    var ImportCategoryItemSchema = _zod.z.object({
      code: code(),
      title: title()
    });
  }
});

// dist/entities/categories/categories.repository.js
var require_categories_repository = __commonJS({
  "dist/entities/categories/categories.repository.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "CategoriesRepository", {
      enumerable: true,
      get: function() {
        return CategoriesRepository;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _index1 = require_database();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var CategoriesRepository = class CategoriesRepository extends _index.CodedShopScopedRepository {
      constructor(db) {
        super(db, "categories", _index1.USER_QUERYABLE_TABLES);
      }
    };
    CategoriesRepository = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _index1.DatabaseService === "undefined" ? Object : _index1.DatabaseService
      ])
    ], CategoriesRepository);
  }
});

// dist/entities/categories/categories.service.js
var require_categories_service = __commonJS({
  "dist/entities/categories/categories.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "CategoriesService", {
      enumerable: true,
      get: function() {
        return CategoriesService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _categoriesrepository = require_categories_repository();
    var _categoriesschema = require_categories_schema();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var CategoriesService = class CategoriesService extends _index.CodedShopScopedEntityService {
      constructor(repository) {
        super(repository, "category", _categoriesschema.ImportCategoryItemSchema);
      }
    };
    CategoriesService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _categoriesrepository.CategoriesRepository === "undefined" ? Object : _categoriesrepository.CategoriesRepository
      ])
    ], CategoriesService);
  }
});

// dist/entities/categories/categories.controller.js
var require_categories_controller = __commonJS({
  "dist/entities/categories/categories.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "CategoriesController", {
      enumerable: true,
      get: function() {
        return CategoriesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _platformexpress = __require("@nestjs/platform-express");
    var _authguard = require_auth_guard();
    var _decorators = require_decorators();
    var _index = require_common();
    var _categoriesschema = require_categories_schema();
    var _categoriesservice = require_categories_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var CategoriesController = class CategoriesController {
      async findAll(_req, ctx, query) {
        return this.categoriesService.findByShopIdPaginated(ctx.shopId, query);
      }
      async findByCode(_req, ctx, code) {
        const category = await this.categoriesService.findByCodeAndShop(code, ctx.shopId);
        if (!category || category.tenant_id !== ctx.tenantId) {
          throw new _common.NotFoundException(`Category with code ${code} not found`);
        }
        return category;
      }
      async exportJson(_req, ctx, res) {
        const items = await this.categoriesService.exportForShop(ctx.shopId);
        (0, _index.sendJsonExport)(res, items, "categories.json");
      }
      async exportCsv(_req, ctx, res) {
        const items = await this.categoriesService.exportForShop(ctx.shopId);
        (0, _index.sendCsvExport)(res, items, "categories.csv", [
          "code",
          "title"
        ]);
      }
      async findById(_req, ctx, id) {
        const category = await this.categoriesService.findById(id);
        (0, _index.assertShopAccess)(category, ctx, "Category", id);
        return category;
      }
      async create(_req, ctx, body) {
        return this.categoriesService.create({
          ...body,
          shop_id: ctx.shopId,
          tenant_id: ctx.tenantId
        });
      }
      async update(_req, ctx, id, body) {
        const category = await this.categoriesService.findById(id);
        (0, _index.assertShopAccess)(category, ctx, "Category", id);
        const updated = await this.categoriesService.update(id, body);
        if (!updated) {
          throw new _common.NotFoundException(`Category with id ${id} not found`);
        }
        return updated;
      }
      async delete(_req, ctx, id) {
        const category = await this.categoriesService.findById(id);
        (0, _index.assertShopAccess)(category, ctx, "Category", id);
        await this.categoriesService.delete(id);
        return {
          message: "Category deleted successfully"
        };
      }
      async importJson(_req, ctx, items, file) {
        const validatedData = (0, _index.parseAndValidateImport)(file, items, _categoriesschema.ImportCategoryItemSchema);
        return this.categoriesService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
      }
      async importCsv(_req, ctx, file) {
        const records = (0, _index.parseCsvImport)(file, void 0, [
          "code",
          "title"
        ]);
        const items = records.map((record) => ({
          code: record.code,
          title: record.title
        }));
        return this.categoriesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
      }
      constructor(categoriesService) {
        this.categoriesService = categoriesService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Query)(new _index.ZodValidationPipe(_index.PaginationQuerySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof PaginationQuery === "undefined" ? Object : PaginationQuery
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)("code/:code"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("code")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "findByCode", null);
    _ts_decorate([
      (0, _common.Get)("export/json"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "exportJson", null);
    _ts_decorate([
      (0, _common.Get)("export/csv"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "exportCsv", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_categoriesschema.CreateCategorySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof CreateCategoryRequest === "undefined" ? Object : CreateCategoryRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(3, (0, _common.Body)(new _index.ZodValidationPipe(_categoriesschema.UpdateCategorySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number,
        typeof UpdateCategoryRequest === "undefined" ? Object : UpdateCategoryRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "delete", null);
    _ts_decorate([
      (0, _common.Post)("import/json"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)()),
      _ts_param(3, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Array,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "importJson", null);
    _ts_decorate([
      (0, _common.Post)("import/csv"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], CategoriesController.prototype, "importCsv", null);
    CategoriesController = _ts_decorate([
      (0, _common.Controller)("categories"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _categoriesservice.CategoriesService === "undefined" ? Object : _categoriesservice.CategoriesService
      ])
    ], CategoriesController);
  }
});

// dist/entities/categories/categories-examples.controller.js
var require_categories_examples_controller = __commonJS({
  "dist/entities/categories/categories-examples.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "CategoriesExamplesController", {
      enumerable: true,
      get: function() {
        return CategoriesExamplesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var EXAMPLE_BRANDS = [
      {
        code: "apple",
        title: "Apple"
      },
      {
        code: "samsung",
        title: "Samsung"
      },
      {
        code: "dell",
        title: "Dell"
      }
    ];
    var CategoriesExamplesController = class CategoriesExamplesController extends _index.BaseExamplesController {
      constructor(...args) {
        super(...args), this.examples = EXAMPLE_BRANDS, this.entityName = "categories", this.csvColumns = [
          "code",
          "title"
        ];
      }
    };
    CategoriesExamplesController = _ts_decorate([
      (0, _common.Controller)("categories/examples")
    ], CategoriesExamplesController);
  }
});

// dist/entities/categories/categories.module.js
var require_categories_module = __commonJS({
  "dist/entities/categories/categories.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "CategoriesModule", {
      enumerable: true,
      get: function() {
        return CategoriesModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _categoriescontroller = require_categories_controller();
    var _categoriesexamplescontroller = require_categories_examples_controller();
    var _categoriesrepository = require_categories_repository();
    var _categoriesservice = require_categories_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var CategoriesModule = class CategoriesModule {
    };
    CategoriesModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        controllers: [
          _categoriescontroller.CategoriesController,
          _categoriesexamplescontroller.CategoriesExamplesController
        ],
        providers: [
          _categoriesrepository.CategoriesRepository,
          _categoriesservice.CategoriesService,
          _authguard.AuthGuard
        ],
        exports: [
          _categoriesservice.CategoriesService
        ]
      })
    ], CategoriesModule);
  }
});

// dist/entities/categories/index.js
var require_categories = __commonJS({
  "dist/entities/categories/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_categories_controller(), exports);
    _export_star(require_categories_module(), exports);
    _export_star(require_categories_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/groups/groups.schema.js
var require_groups_schema = __commonJS({
  "dist/entities/groups/groups.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateGroupSchema() {
        return CreateGroupSchema;
      },
      get ImportGroupItemSchema() {
        return ImportGroupItemSchema;
      },
      get UpdateGroupSchema() {
        return UpdateGroupSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { code, title } = _index.zodSchemas;
    var CreateGroupSchema = _zod.z.object({
      code: code(),
      title: title()
    });
    var UpdateGroupSchema = _zod.z.object({
      code: code().optional(),
      title: title().optional()
    });
    var ImportGroupItemSchema = _zod.z.object({
      code: code(),
      title: title()
    });
  }
});

// dist/entities/groups/groups.repository.js
var require_groups_repository = __commonJS({
  "dist/entities/groups/groups.repository.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "GroupsRepository", {
      enumerable: true,
      get: function() {
        return GroupsRepository;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _index1 = require_database();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var GroupsRepository = class GroupsRepository extends _index.CodedShopScopedRepository {
      constructor(db) {
        super(db, "groups", _index1.USER_QUERYABLE_TABLES);
      }
    };
    GroupsRepository = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _index1.DatabaseService === "undefined" ? Object : _index1.DatabaseService
      ])
    ], GroupsRepository);
  }
});

// dist/entities/groups/groups.service.js
var require_groups_service = __commonJS({
  "dist/entities/groups/groups.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "GroupsService", {
      enumerable: true,
      get: function() {
        return GroupsService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _groupsrepository = require_groups_repository();
    var _groupsschema = require_groups_schema();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var GroupsService = class GroupsService extends _index.CodedShopScopedEntityService {
      constructor(repository) {
        super(repository, "group", _groupsschema.ImportGroupItemSchema);
      }
    };
    GroupsService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _groupsrepository.GroupsRepository === "undefined" ? Object : _groupsrepository.GroupsRepository
      ])
    ], GroupsService);
  }
});

// dist/entities/groups/groups.controller.js
var require_groups_controller = __commonJS({
  "dist/entities/groups/groups.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "GroupsController", {
      enumerable: true,
      get: function() {
        return GroupsController;
      }
    });
    var _common = __require("@nestjs/common");
    var _platformexpress = __require("@nestjs/platform-express");
    var _authguard = require_auth_guard();
    var _decorators = require_decorators();
    var _index = require_common();
    var _groupsschema = require_groups_schema();
    var _groupsservice = require_groups_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var GroupsController = class GroupsController {
      async findAll(_req, ctx, query) {
        return this.groupsService.findByShopIdPaginated(ctx.shopId, query);
      }
      async findByCode(_req, ctx, code) {
        const group = await this.groupsService.findByCodeAndShop(code, ctx.shopId);
        if (!group || group.tenant_id !== ctx.tenantId) {
          throw new _common.NotFoundException(`Group with code ${code} not found`);
        }
        return group;
      }
      async exportJson(_req, ctx, res) {
        const items = await this.groupsService.exportForShop(ctx.shopId);
        (0, _index.sendJsonExport)(res, items, "groups.json");
      }
      async exportCsv(_req, ctx, res) {
        const items = await this.groupsService.exportForShop(ctx.shopId);
        (0, _index.sendCsvExport)(res, items, "groups.csv", [
          "code",
          "title"
        ]);
      }
      async findById(_req, ctx, id) {
        const group = await this.groupsService.findById(id);
        (0, _index.assertShopAccess)(group, ctx, "Group", id);
        return group;
      }
      async create(_req, ctx, body) {
        return this.groupsService.create({
          ...body,
          shop_id: ctx.shopId,
          tenant_id: ctx.tenantId
        });
      }
      async update(_req, ctx, id, body) {
        const group = await this.groupsService.findById(id);
        (0, _index.assertShopAccess)(group, ctx, "Group", id);
        return this.groupsService.update(id, body);
      }
      async delete(_req, ctx, id) {
        const group = await this.groupsService.findById(id);
        (0, _index.assertShopAccess)(group, ctx, "Group", id);
        await this.groupsService.delete(id);
        return {
          message: "Group deleted successfully"
        };
      }
      async importJson(_req, ctx, items, file) {
        const validatedData = (0, _index.parseAndValidateImport)(file, items, _groupsschema.ImportGroupItemSchema);
        return this.groupsService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
      }
      async importCsv(_req, ctx, file) {
        const records = (0, _index.parseCsvImport)(file, void 0, [
          "code",
          "title"
        ]);
        const items = records.map((record) => ({
          code: record.code,
          title: record.title
        }));
        return this.groupsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
      }
      constructor(groupsService) {
        this.groupsService = groupsService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Query)(new _index.ZodValidationPipe(_index.PaginationQuerySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof PaginationQuery === "undefined" ? Object : PaginationQuery
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)("code/:code"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("code")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "findByCode", null);
    _ts_decorate([
      (0, _common.Get)("export/json"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "exportJson", null);
    _ts_decorate([
      (0, _common.Get)("export/csv"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "exportCsv", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_groupsschema.CreateGroupSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof CreateGroupRequest === "undefined" ? Object : CreateGroupRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(3, (0, _common.Body)(new _index.ZodValidationPipe(_groupsschema.UpdateGroupSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number,
        typeof UpdateGroupRequest === "undefined" ? Object : UpdateGroupRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "delete", null);
    _ts_decorate([
      (0, _common.Post)("import/json"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)()),
      _ts_param(3, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Array,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "importJson", null);
    _ts_decorate([
      (0, _common.Post)("import/csv"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], GroupsController.prototype, "importCsv", null);
    GroupsController = _ts_decorate([
      (0, _common.Controller)("groups"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _groupsservice.GroupsService === "undefined" ? Object : _groupsservice.GroupsService
      ])
    ], GroupsController);
  }
});

// dist/entities/groups/groups-examples.controller.js
var require_groups_examples_controller = __commonJS({
  "dist/entities/groups/groups-examples.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "GroupsExamplesController", {
      enumerable: true,
      get: function() {
        return GroupsExamplesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var EXAMPLE_BRANDS = [
      {
        code: "apple",
        title: "Apple"
      },
      {
        code: "samsung",
        title: "Samsung"
      },
      {
        code: "dell",
        title: "Dell"
      }
    ];
    var GroupsExamplesController = class GroupsExamplesController extends _index.BaseExamplesController {
      constructor(...args) {
        super(...args), this.examples = EXAMPLE_BRANDS, this.entityName = "groups", this.csvColumns = [
          "code",
          "title"
        ];
      }
    };
    GroupsExamplesController = _ts_decorate([
      (0, _common.Controller)("groups/examples")
    ], GroupsExamplesController);
  }
});

// dist/entities/groups/groups.module.js
var require_groups_module = __commonJS({
  "dist/entities/groups/groups.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "GroupsModule", {
      enumerable: true,
      get: function() {
        return GroupsModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _groupscontroller = require_groups_controller();
    var _groupsexamplescontroller = require_groups_examples_controller();
    var _groupsrepository = require_groups_repository();
    var _groupsservice = require_groups_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var GroupsModule = class GroupsModule {
    };
    GroupsModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        controllers: [
          _groupscontroller.GroupsController,
          _groupsexamplescontroller.GroupsExamplesController
        ],
        providers: [
          _groupsrepository.GroupsRepository,
          _groupsservice.GroupsService,
          _authguard.AuthGuard
        ],
        exports: [
          _groupsservice.GroupsService
        ]
      })
    ], GroupsModule);
  }
});

// dist/entities/groups/index.js
var require_groups = __commonJS({
  "dist/entities/groups/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_groups_controller(), exports);
    _export_star(require_groups_module(), exports);
    _export_star(require_groups_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/marketplaces/index.js
var require_marketplaces = __commonJS({
  "dist/entities/marketplaces/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get MarketplacesModule() {
        return _marketplacesmodule.MarketplacesModule;
      },
      get MarketplacesService() {
        return _marketplacesservice.MarketplacesService;
      }
    });
    var _marketplacesmodule = require_marketplaces_module();
    var _marketplacesservice = require_marketplaces_service();
  }
});

// dist/me/me.controller.js
var require_me_controller = __commonJS({
  "dist/me/me.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "MeController", {
      enumerable: true,
      get: function() {
        return MeController;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysservice = require_api_keys_service();
    var _usersservice = require_users_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var MeController = class MeController {
      async getCurrentUser(apiKey) {
        if (!apiKey) {
          throw new _common.UnauthorizedException("API key is required");
        }
        const validApiKey = await this.apiKeysService.findValidByKey(apiKey);
        if (!validApiKey) {
          throw new _common.UnauthorizedException("Invalid or expired API key");
        }
        const user = await this.usersService.getUserWithRolesAndTenants(validApiKey.user_id);
        if (!user) {
          throw new _common.NotFoundException("User not found");
        }
        return user;
      }
      constructor(usersService, apiKeysService) {
        this.usersService = usersService;
        this.apiKeysService = apiKeysService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      _ts_param(0, (0, _common.Headers)("x-api-key")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], MeController.prototype, "getCurrentUser", null);
    MeController = _ts_decorate([
      (0, _common.Controller)("me"),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _apikeysservice.ApiKeysService === "undefined" ? Object : _apikeysservice.ApiKeysService
      ])
    ], MeController);
  }
});

// dist/me/me.module.js
var require_me_module = __commonJS({
  "dist/me/me.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "MeModule", {
      enumerable: true,
      get: function() {
        return MeModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _usersmodule = require_users_module();
    var _mecontroller = require_me_controller();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var MeModule = class MeModule {
    };
    MeModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _usersmodule.UsersModule,
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        controllers: [
          _mecontroller.MeController
        ]
      })
    ], MeModule);
  }
});

// dist/me/index.js
var require_me = __commonJS({
  "dist/me/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get MeController() {
        return _mecontroller.MeController;
      },
      get MeModule() {
        return _memodule.MeModule;
      }
    });
    var _mecontroller = require_me_controller();
    var _memodule = require_me_module();
  }
});

// dist/metadata/metadata.controller.js
var require_metadata_controller = __commonJS({
  "dist/metadata/metadata.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "MetadataController", {
      enumerable: true,
      get: function() {
        return MetadataController;
      }
    });
    var _common = __require("@nestjs/common");
    var _shared = __require("@sales-planner/shared");
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var MetadataController = class MetadataController {
      getEntitiesMetadata() {
        return _shared.ENTITIES_METADATA;
      }
    };
    _ts_decorate([
      (0, _common.Get)("entities"),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", []),
      _ts_metadata("design:returntype", void 0)
    ], MetadataController.prototype, "getEntitiesMetadata", null);
    MetadataController = _ts_decorate([
      (0, _common.Controller)("metadata")
    ], MetadataController);
  }
});

// dist/metadata/metadata.module.js
var require_metadata_module = __commonJS({
  "dist/metadata/metadata.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "MetadataModule", {
      enumerable: true,
      get: function() {
        return MetadataModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _metadatacontroller = require_metadata_controller();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var MetadataModule = class MetadataModule {
    };
    MetadataModule = _ts_decorate([
      (0, _common.Module)({
        controllers: [
          _metadatacontroller.MetadataController
        ]
      })
    ], MetadataModule);
  }
});

// dist/metadata/index.js
var require_metadata = __commonJS({
  "dist/metadata/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_metadata_controller(), exports);
    _export_star(require_metadata_module(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/statuses/statuses.schema.js
var require_statuses_schema = __commonJS({
  "dist/entities/statuses/statuses.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateStatusSchema() {
        return CreateStatusSchema;
      },
      get ImportStatusItemSchema() {
        return ImportStatusItemSchema;
      },
      get UpdateStatusSchema() {
        return UpdateStatusSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { code, title } = _index.zodSchemas;
    var CreateStatusSchema = _zod.z.object({
      code: code(),
      title: title()
    });
    var UpdateStatusSchema = _zod.z.object({
      code: code().optional(),
      title: title().optional()
    });
    var ImportStatusItemSchema = _zod.z.object({
      code: code(),
      title: title()
    });
  }
});

// dist/entities/statuses/statuses.repository.js
var require_statuses_repository = __commonJS({
  "dist/entities/statuses/statuses.repository.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "StatusesRepository", {
      enumerable: true,
      get: function() {
        return StatusesRepository;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _index1 = require_database();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var StatusesRepository = class StatusesRepository extends _index.CodedShopScopedRepository {
      constructor(db) {
        super(db, "statuses", _index1.USER_QUERYABLE_TABLES);
      }
    };
    StatusesRepository = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _index1.DatabaseService === "undefined" ? Object : _index1.DatabaseService
      ])
    ], StatusesRepository);
  }
});

// dist/entities/statuses/statuses.service.js
var require_statuses_service = __commonJS({
  "dist/entities/statuses/statuses.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "StatusesService", {
      enumerable: true,
      get: function() {
        return StatusesService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _statusesrepository = require_statuses_repository();
    var _statusesschema = require_statuses_schema();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var StatusesService = class StatusesService extends _index.CodedShopScopedEntityService {
      constructor(repository) {
        super(repository, "status", _statusesschema.ImportStatusItemSchema);
      }
    };
    StatusesService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _statusesrepository.StatusesRepository === "undefined" ? Object : _statusesrepository.StatusesRepository
      ])
    ], StatusesService);
  }
});

// dist/entities/statuses/statuses.controller.js
var require_statuses_controller = __commonJS({
  "dist/entities/statuses/statuses.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "StatusesController", {
      enumerable: true,
      get: function() {
        return StatusesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _platformexpress = __require("@nestjs/platform-express");
    var _authguard = require_auth_guard();
    var _decorators = require_decorators();
    var _index = require_common();
    var _statusesschema = require_statuses_schema();
    var _statusesservice = require_statuses_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var StatusesController = class StatusesController {
      async findAll(_req, ctx, query) {
        return this.statusesService.findByShopIdPaginated(ctx.shopId, query);
      }
      async findByCode(_req, ctx, code) {
        const status = await this.statusesService.findByCodeAndShop(code, ctx.shopId);
        if (!status || status.tenant_id !== ctx.tenantId) {
          throw new _common.NotFoundException(`Status with code ${code} not found`);
        }
        return status;
      }
      async exportJson(_req, ctx, res) {
        const items = await this.statusesService.exportForShop(ctx.shopId);
        (0, _index.sendJsonExport)(res, items, "statuses.json");
      }
      async exportCsv(_req, ctx, res) {
        const items = await this.statusesService.exportForShop(ctx.shopId);
        (0, _index.sendCsvExport)(res, items, "statuses.csv", [
          "code",
          "title"
        ]);
      }
      async findById(_req, ctx, id) {
        const status = await this.statusesService.findById(id);
        (0, _index.assertShopAccess)(status, ctx, "Status", id);
        return status;
      }
      async create(_req, ctx, body) {
        return this.statusesService.create({
          ...body,
          shop_id: ctx.shopId,
          tenant_id: ctx.tenantId
        });
      }
      async update(_req, ctx, id, body) {
        const status = await this.statusesService.findById(id);
        (0, _index.assertShopAccess)(status, ctx, "Status", id);
        return this.statusesService.update(id, body);
      }
      async delete(_req, ctx, id) {
        const status = await this.statusesService.findById(id);
        (0, _index.assertShopAccess)(status, ctx, "Status", id);
        await this.statusesService.delete(id);
        return {
          message: "Status deleted successfully"
        };
      }
      async importJson(_req, ctx, items, file) {
        const validatedData = (0, _index.parseAndValidateImport)(file, items, _statusesschema.ImportStatusItemSchema);
        return this.statusesService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
      }
      async importCsv(_req, ctx, file) {
        const records = (0, _index.parseCsvImport)(file, void 0, [
          "code",
          "title"
        ]);
        const items = records.map((record) => ({
          code: record.code,
          title: record.title
        }));
        return this.statusesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
      }
      constructor(statusesService) {
        this.statusesService = statusesService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Query)(new _index.ZodValidationPipe(_index.PaginationQuerySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof PaginationQuery === "undefined" ? Object : PaginationQuery
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)("code/:code"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("code")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "findByCode", null);
    _ts_decorate([
      (0, _common.Get)("export/json"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "exportJson", null);
    _ts_decorate([
      (0, _common.Get)("export/csv"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "exportCsv", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_statusesschema.CreateStatusSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof CreateStatusRequest === "undefined" ? Object : CreateStatusRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(3, (0, _common.Body)(new _index.ZodValidationPipe(_statusesschema.UpdateStatusSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number,
        typeof UpdateStatusRequest === "undefined" ? Object : UpdateStatusRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "delete", null);
    _ts_decorate([
      (0, _common.Post)("import/json"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)()),
      _ts_param(3, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Array,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "importJson", null);
    _ts_decorate([
      (0, _common.Post)("import/csv"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], StatusesController.prototype, "importCsv", null);
    StatusesController = _ts_decorate([
      (0, _common.Controller)("statuses"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _statusesservice.StatusesService === "undefined" ? Object : _statusesservice.StatusesService
      ])
    ], StatusesController);
  }
});

// dist/entities/statuses/statuses-examples.controller.js
var require_statuses_examples_controller = __commonJS({
  "dist/entities/statuses/statuses-examples.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "StatusesExamplesController", {
      enumerable: true,
      get: function() {
        return StatusesExamplesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var EXAMPLE_BRANDS = [
      {
        code: "apple",
        title: "Apple"
      },
      {
        code: "samsung",
        title: "Samsung"
      },
      {
        code: "dell",
        title: "Dell"
      }
    ];
    var StatusesExamplesController = class StatusesExamplesController extends _index.BaseExamplesController {
      constructor(...args) {
        super(...args), this.examples = EXAMPLE_BRANDS, this.entityName = "statuses", this.csvColumns = [
          "code",
          "title"
        ];
      }
    };
    StatusesExamplesController = _ts_decorate([
      (0, _common.Controller)("statuses/examples")
    ], StatusesExamplesController);
  }
});

// dist/entities/statuses/statuses.module.js
var require_statuses_module = __commonJS({
  "dist/entities/statuses/statuses.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "StatusesModule", {
      enumerable: true,
      get: function() {
        return StatusesModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _statusescontroller = require_statuses_controller();
    var _statusesexamplescontroller = require_statuses_examples_controller();
    var _statusesrepository = require_statuses_repository();
    var _statusesservice = require_statuses_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var StatusesModule = class StatusesModule {
    };
    StatusesModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        controllers: [
          _statusescontroller.StatusesController,
          _statusesexamplescontroller.StatusesExamplesController
        ],
        providers: [
          _statusesrepository.StatusesRepository,
          _statusesservice.StatusesService,
          _authguard.AuthGuard
        ],
        exports: [
          _statusesservice.StatusesService
        ]
      })
    ], StatusesModule);
  }
});

// dist/entities/statuses/index.js
var require_statuses = __commonJS({
  "dist/entities/statuses/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_statuses_controller(), exports);
    _export_star(require_statuses_module(), exports);
    _export_star(require_statuses_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/suppliers/suppliers.schema.js
var require_suppliers_schema = __commonJS({
  "dist/entities/suppliers/suppliers.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateSupplierSchema() {
        return CreateSupplierSchema;
      },
      get ImportSupplierItemSchema() {
        return ImportSupplierItemSchema;
      },
      get UpdateSupplierSchema() {
        return UpdateSupplierSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { code, title } = _index.zodSchemas;
    var CreateSupplierSchema = _zod.z.object({
      code: code(),
      title: title()
    });
    var UpdateSupplierSchema = _zod.z.object({
      code: code().optional(),
      title: title().optional()
    });
    var ImportSupplierItemSchema = _zod.z.object({
      code: code(),
      title: title()
    });
  }
});

// dist/entities/suppliers/suppliers.repository.js
var require_suppliers_repository = __commonJS({
  "dist/entities/suppliers/suppliers.repository.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SuppliersRepository", {
      enumerable: true,
      get: function() {
        return SuppliersRepository;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _index1 = require_database();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var SuppliersRepository = class SuppliersRepository extends _index.CodedShopScopedRepository {
      constructor(db) {
        super(db, "suppliers", _index1.USER_QUERYABLE_TABLES);
      }
    };
    SuppliersRepository = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _index1.DatabaseService === "undefined" ? Object : _index1.DatabaseService
      ])
    ], SuppliersRepository);
  }
});

// dist/entities/suppliers/suppliers.service.js
var require_suppliers_service = __commonJS({
  "dist/entities/suppliers/suppliers.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SuppliersService", {
      enumerable: true,
      get: function() {
        return SuppliersService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _suppliersrepository = require_suppliers_repository();
    var _suppliersschema = require_suppliers_schema();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var SuppliersService = class SuppliersService extends _index.CodedShopScopedEntityService {
      constructor(repository) {
        super(repository, "supplier", _suppliersschema.ImportSupplierItemSchema);
      }
    };
    SuppliersService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _suppliersrepository.SuppliersRepository === "undefined" ? Object : _suppliersrepository.SuppliersRepository
      ])
    ], SuppliersService);
  }
});

// dist/entities/suppliers/suppliers.controller.js
var require_suppliers_controller = __commonJS({
  "dist/entities/suppliers/suppliers.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SuppliersController", {
      enumerable: true,
      get: function() {
        return SuppliersController;
      }
    });
    var _common = __require("@nestjs/common");
    var _platformexpress = __require("@nestjs/platform-express");
    var _authguard = require_auth_guard();
    var _decorators = require_decorators();
    var _index = require_common();
    var _suppliersschema = require_suppliers_schema();
    var _suppliersservice = require_suppliers_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var SuppliersController = class SuppliersController {
      async findAll(_req, ctx, query) {
        return this.suppliersService.findByShopIdPaginated(ctx.shopId, query);
      }
      async findByCode(_req, ctx, code) {
        const supplier = await this.suppliersService.findByCodeAndShop(code, ctx.shopId);
        if (!supplier || supplier.tenant_id !== ctx.tenantId) {
          throw new _common.NotFoundException(`Supplier with code ${code} not found`);
        }
        return supplier;
      }
      async exportJson(_req, ctx, res) {
        const items = await this.suppliersService.exportForShop(ctx.shopId);
        (0, _index.sendJsonExport)(res, items, "suppliers.json");
      }
      async exportCsv(_req, ctx, res) {
        const items = await this.suppliersService.exportForShop(ctx.shopId);
        (0, _index.sendCsvExport)(res, items, "suppliers.csv", [
          "code",
          "title"
        ]);
      }
      async findById(_req, ctx, id) {
        const supplier = await this.suppliersService.findById(id);
        (0, _index.assertShopAccess)(supplier, ctx, "Supplier", id);
        return supplier;
      }
      async create(_req, ctx, body) {
        return this.suppliersService.create({
          ...body,
          shop_id: ctx.shopId,
          tenant_id: ctx.tenantId
        });
      }
      async update(_req, ctx, id, body) {
        const supplier = await this.suppliersService.findById(id);
        (0, _index.assertShopAccess)(supplier, ctx, "Supplier", id);
        return this.suppliersService.update(id, body);
      }
      async delete(_req, ctx, id) {
        const supplier = await this.suppliersService.findById(id);
        (0, _index.assertShopAccess)(supplier, ctx, "Supplier", id);
        await this.suppliersService.delete(id);
        return {
          message: "Supplier deleted successfully"
        };
      }
      async importJson(_req, ctx, items, file) {
        const validatedData = (0, _index.parseAndValidateImport)(file, items, _suppliersschema.ImportSupplierItemSchema);
        return this.suppliersService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
      }
      async importCsv(_req, ctx, file) {
        const records = (0, _index.parseCsvImport)(file, void 0, [
          "code",
          "title"
        ]);
        const items = records.map((record) => ({
          code: record.code,
          title: record.title
        }));
        return this.suppliersService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
      }
      constructor(suppliersService) {
        this.suppliersService = suppliersService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Query)(new _index.ZodValidationPipe(_index.PaginationQuerySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof PaginationQuery === "undefined" ? Object : PaginationQuery
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)("code/:code"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("code")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "findByCode", null);
    _ts_decorate([
      (0, _common.Get)("export/json"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "exportJson", null);
    _ts_decorate([
      (0, _common.Get)("export/csv"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "exportCsv", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_suppliersschema.CreateSupplierSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof CreateSupplierRequest === "undefined" ? Object : CreateSupplierRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(3, (0, _common.Body)(new _index.ZodValidationPipe(_suppliersschema.UpdateSupplierSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number,
        typeof UpdateSupplierRequest === "undefined" ? Object : UpdateSupplierRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "delete", null);
    _ts_decorate([
      (0, _common.Post)("import/json"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)()),
      _ts_param(3, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Array,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "importJson", null);
    _ts_decorate([
      (0, _common.Post)("import/csv"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SuppliersController.prototype, "importCsv", null);
    SuppliersController = _ts_decorate([
      (0, _common.Controller)("suppliers"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _suppliersservice.SuppliersService === "undefined" ? Object : _suppliersservice.SuppliersService
      ])
    ], SuppliersController);
  }
});

// dist/entities/suppliers/suppliers-examples.controller.js
var require_suppliers_examples_controller = __commonJS({
  "dist/entities/suppliers/suppliers-examples.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SuppliersExamplesController", {
      enumerable: true,
      get: function() {
        return SuppliersExamplesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var EXAMPLE_SUPPLIERS = [
      {
        code: "supplier1",
        title: "Example Supplier 1"
      },
      {
        code: "supplier2",
        title: "Example Supplier 2"
      },
      {
        code: "supplier3",
        title: "Example Supplier 3"
      }
    ];
    var SuppliersExamplesController = class SuppliersExamplesController extends _index.BaseExamplesController {
      constructor(...args) {
        super(...args), this.examples = EXAMPLE_SUPPLIERS, this.entityName = "suppliers", this.csvColumns = [
          "code",
          "title"
        ];
      }
    };
    SuppliersExamplesController = _ts_decorate([
      (0, _common.Controller)("suppliers/examples")
    ], SuppliersExamplesController);
  }
});

// dist/entities/suppliers/suppliers.module.js
var require_suppliers_module = __commonJS({
  "dist/entities/suppliers/suppliers.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SuppliersModule", {
      enumerable: true,
      get: function() {
        return SuppliersModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _supplierscontroller = require_suppliers_controller();
    var _suppliersexamplescontroller = require_suppliers_examples_controller();
    var _suppliersrepository = require_suppliers_repository();
    var _suppliersservice = require_suppliers_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var SuppliersModule = class SuppliersModule {
    };
    SuppliersModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule
        ],
        controllers: [
          _supplierscontroller.SuppliersController,
          _suppliersexamplescontroller.SuppliersExamplesController
        ],
        providers: [
          _suppliersrepository.SuppliersRepository,
          _suppliersservice.SuppliersService,
          _authguard.AuthGuard
        ],
        exports: [
          _suppliersservice.SuppliersService
        ]
      })
    ], SuppliersModule);
  }
});

// dist/entities/suppliers/index.js
var require_suppliers = __commonJS({
  "dist/entities/suppliers/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_suppliers_module(), exports);
    _export_star(require_suppliers_service(), exports);
    _export_star(require_suppliers_controller(), exports);
    _export_star(require_suppliers_examples_controller(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/roles/index.js
var require_roles = __commonJS({
  "dist/roles/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_roles_controller(), exports);
    _export_star(require_roles_module(), exports);
    _export_star(require_roles_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/sales-history/sales-history.schema.js
var require_sales_history_schema = __commonJS({
  "dist/entities/sales-history/sales-history.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateSalesHistorySchema() {
        return CreateSalesHistorySchema;
      },
      get ImportSalesHistoryItemSchema() {
        return ImportSalesHistoryItemSchema;
      },
      get PeriodQuerySchema() {
        return PeriodQuerySchema;
      },
      get SalesHistoryQuerySchema() {
        return SalesHistoryQuerySchema;
      },
      get UpdateSalesHistorySchema() {
        return UpdateSalesHistorySchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { id, quantity, period, code } = _index.zodSchemas;
    var CreateSalesHistoryRequestSchema = _zod.z.object({
      sku_id: id(),
      period: period(),
      quantity: quantity(),
      marketplace_id: id()
    });
    var PeriodQuerySchema = _zod.z.object({
      period_from: period().optional(),
      period_to: period().optional()
    });
    var SalesHistoryQuerySchema = PeriodQuerySchema.merge(_index.PaginationQuerySchema);
    var CreateSalesHistorySchema = _zod.z.object({
      shop_id: id(),
      tenant_id: id(),
      sku_id: id(),
      period: period(),
      quantity: quantity(),
      marketplace_id: id()
    });
    var UpdateSalesHistorySchema = _zod.z.object({
      quantity: quantity().optional()
    });
    var ImportSalesHistoryItemSchema = _zod.z.object({
      marketplace: _zod.z.string().min(1),
      period: period(),
      sku: code(),
      quantity: quantity()
    });
  }
});

// dist/entities/skus/skus.schema.js
var require_skus_schema = __commonJS({
  "dist/entities/skus/skus.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateSkuSchema() {
        return CreateSkuSchema;
      },
      get ImportSkuItemSchema() {
        return ImportSkuItemSchema;
      },
      get PaginationQuerySchema() {
        return PaginationQuerySchema;
      },
      get UpdateSkuSchema() {
        return UpdateSkuSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { code, title } = _index.zodSchemas;
    var CreateSkuSchema = _zod.z.object({
      code: code(),
      title: title(),
      title2: _zod.z.string().optional(),
      category_id: _zod.z.number().optional(),
      group_id: _zod.z.number().optional(),
      status_id: _zod.z.number().optional(),
      supplier_id: _zod.z.number().optional()
    });
    var UpdateSkuSchema = _zod.z.object({
      code: code().optional(),
      title: title().optional(),
      title2: _zod.z.string().optional(),
      category_id: _zod.z.number().optional(),
      group_id: _zod.z.number().optional(),
      status_id: _zod.z.number().optional(),
      supplier_id: _zod.z.number().optional()
    });
    var ImportSkuItemSchema = _zod.z.object({
      code: code(),
      title: title(),
      title2: _zod.z.string().optional(),
      category: _zod.z.string().optional(),
      group: _zod.z.string().optional(),
      status: _zod.z.string().optional(),
      supplier: _zod.z.string().optional()
    });
    var PaginationQuerySchema = _zod.z.object({
      limit: _zod.z.coerce.number().int().min(1).max(1e3).optional(),
      offset: _zod.z.coerce.number().int().min(0).optional()
    });
  }
});

// dist/entities/skus/skus.repository.js
var require_skus_repository = __commonJS({
  "dist/entities/skus/skus.repository.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SkusRepository", {
      enumerable: true,
      get: function() {
        return SkusRepository;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _index1 = require_database();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var SkusRepository = class SkusRepository extends _index.CodedShopScopedRepository {
      async bulkUpsert(tenantId, shopId, items) {
        if (items.length === 0) {
          return {
            created: 0,
            updated: 0
          };
        }
        const existingCodes = await this.findCodesByShopId(shopId, items.map((i) => i.code));
        const updated = items.filter((i) => existingCodes.has(i.code)).length;
        const created = items.length - updated;
        await this.db.insertInto("skus").values(items.map((item) => ({
          code: item.code,
          title: item.title,
          shop_id: shopId,
          tenant_id: tenantId,
          updated_at: /* @__PURE__ */ new Date()
        }))).onConflict((oc) => oc.columns([
          "code",
          "shop_id"
        ]).doUpdateSet((eb) => ({
          title: eb.ref("excluded.title"),
          updated_at: /* @__PURE__ */ new Date()
        }))).execute();
        return {
          created,
          updated
        };
      }
      /**
      * Bulk upsert with full SKU fields (used by import)
      */
      async bulkUpsertFull(tenantId, shopId, items) {
        if (items.length === 0) return;
        await this.db.insertInto("skus").values(items.map((item) => ({
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
        }))).onConflict((oc) => oc.columns([
          "code",
          "shop_id"
        ]).doUpdateSet((eb) => ({
          title: eb.ref("excluded.title"),
          title2: eb.ref("excluded.title2"),
          category_id: eb.ref("excluded.category_id"),
          group_id: eb.ref("excluded.group_id"),
          status_id: eb.ref("excluded.status_id"),
          supplier_id: eb.ref("excluded.supplier_id"),
          updated_at: /* @__PURE__ */ new Date()
        }))).execute();
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
      constructor(db) {
        super(db, "skus", _index1.USER_QUERYABLE_TABLES);
      }
    };
    SkusRepository = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _index1.DatabaseService === "undefined" ? Object : _index1.DatabaseService
      ])
    ], SkusRepository);
  }
});

// dist/entities/skus/skus.service.js
var require_skus_service = __commonJS({
  "dist/entities/skus/skus.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SkusService", {
      enumerable: true,
      get: function() {
        return SkusService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _index1 = require_lib();
    var _categoriesservice = require_categories_service();
    var _groupsservice = require_groups_service();
    var _statusesservice = require_statuses_service();
    var _suppliersservice = require_suppliers_service();
    var _skusschema = require_skus_schema();
    var _skusrepository = require_skus_repository();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var SkusService = class SkusService2 {
      /** Normalize SKU code for consistent lookups */
      normalizeCode(code) {
        return (0, _index1.normalizeSkuCode)(code);
      }
      // ============ Read Operations (delegate to repository) ============
      async findById(id) {
        return this.repository.findById(id);
      }
      async findByShopId(shopId) {
        return this.repository.findByShopId(shopId);
      }
      async findByShopIdPaginated(shopId, query = {}) {
        const normalizedQuery = {
          limit: Math.min(query.limit ?? SkusService2.DEFAULT_LIMIT, SkusService2.MAX_LIMIT),
          offset: query.offset ?? 0
        };
        return this.repository.findByShopIdPaginated(shopId, normalizedQuery);
      }
      async findByCodeAndShop(code, shopId) {
        const normalizedCode = (0, _index1.normalizeSkuCode)(code);
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
            code: (0, _index1.normalizeSkuCode)(dto.code)
          });
        } catch (error) {
          if ((0, _index.isUniqueViolation)(error)) {
            throw new _index.DuplicateResourceException("sku", dto.code, "this shop");
          }
          throw error;
        }
      }
      async update(id, dto) {
        const updated = await this.repository.update(id, {
          ...dto,
          ...dto.code !== void 0 && {
            code: (0, _index1.normalizeSkuCode)(dto.code)
          }
        });
        if (!updated) {
          throw new _common.NotFoundException(`SKU with id ${id} not found`);
        }
        return updated;
      }
      async delete(id) {
        return this.repository.delete(id);
      }
      async deleteByShopId(shopId) {
        return this.repository.deleteByShopId(shopId);
      }
      // ============ Import/Export Operations ============
      async bulkUpsert(tenantId, shopId, items) {
        const validItems = [];
        const errors = [];
        items.forEach((item, index) => {
          const result = _skusschema.ImportSkuItemSchema.safeParse(item);
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
        const categoryCodes = validItems.filter((i) => i.category).map((i) => (0, _index1.normalizeCode)(i.category));
        const groupCodes = validItems.filter((i) => i.group).map((i) => (0, _index1.normalizeCode)(i.group));
        const statusCodes = validItems.filter((i) => i.status).map((i) => (0, _index1.normalizeCode)(i.status));
        const supplierCodes = validItems.filter((i) => i.supplier).map((i) => (0, _index1.normalizeCode)(i.supplier));
        const [categoryResult, groupResult, statusResult, supplierResult] = await Promise.all([
          categoryCodes.length > 0 ? this.categoriesService.findOrCreateByCode(tenantId, shopId, categoryCodes) : {
            codeToId: /* @__PURE__ */ new Map(),
            created: 0
          },
          groupCodes.length > 0 ? this.groupsService.findOrCreateByCode(tenantId, shopId, groupCodes) : {
            codeToId: /* @__PURE__ */ new Map(),
            created: 0
          },
          statusCodes.length > 0 ? this.statusesService.findOrCreateByCode(tenantId, shopId, statusCodes) : {
            codeToId: /* @__PURE__ */ new Map(),
            created: 0
          },
          supplierCodes.length > 0 ? this.suppliersService.findOrCreateByCode(tenantId, shopId, supplierCodes) : {
            codeToId: /* @__PURE__ */ new Map(),
            created: 0
          }
        ]);
        const preparedItems = validItems.map((item) => ({
          ...item,
          category_id: item.category ? categoryResult.codeToId.get((0, _index1.normalizeCode)(item.category)) : void 0,
          group_id: item.group ? groupResult.codeToId.get((0, _index1.normalizeCode)(item.group)) : void 0,
          status_id: item.status ? statusResult.codeToId.get((0, _index1.normalizeCode)(item.status)) : void 0,
          supplier_id: item.supplier ? supplierResult.codeToId.get((0, _index1.normalizeCode)(item.supplier)) : void 0
        }));
        const normalizedCodes = preparedItems.map((i) => (0, _index1.normalizeSkuCode)(i.code));
        const existingCodes = await this.repository.findCodesByShopId(shopId, normalizedCodes);
        await this.repository.bulkUpsertFull(tenantId, shopId, preparedItems.map((item) => ({
          code: (0, _index1.normalizeSkuCode)(item.code),
          title: item.title,
          title2: item.title2,
          category_id: item.category_id,
          group_id: item.group_id,
          status_id: item.status_id,
          supplier_id: item.supplier_id
        })));
        const created = preparedItems.filter((i) => !existingCodes.has((0, _index1.normalizeSkuCode)(i.code))).length;
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
          return {
            codeToId: /* @__PURE__ */ new Map(),
            created: 0
          };
        }
        const normalizedCodes = codes.map((code) => (0, _index1.normalizeSkuCode)(code));
        return this.repository.findOrCreateByCode(tenantId, shopId, normalizedCodes);
      }
      constructor(repository, categoriesService, groupsService, statusesService, suppliersService) {
        this.repository = repository;
        this.categoriesService = categoriesService;
        this.groupsService = groupsService;
        this.statusesService = statusesService;
        this.suppliersService = suppliersService;
      }
    };
    SkusService.DEFAULT_LIMIT = 100;
    SkusService.MAX_LIMIT = 1e3;
    SkusService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _skusrepository.SkusRepository === "undefined" ? Object : _skusrepository.SkusRepository,
        typeof _categoriesservice.CategoriesService === "undefined" ? Object : _categoriesservice.CategoriesService,
        typeof _groupsservice.GroupsService === "undefined" ? Object : _groupsservice.GroupsService,
        typeof _statusesservice.StatusesService === "undefined" ? Object : _statusesservice.StatusesService,
        typeof _suppliersservice.SuppliersService === "undefined" ? Object : _suppliersservice.SuppliersService
      ])
    ], SkusService);
  }
});

// dist/entities/sales-history/sales-history.service.js
var require_sales_history_service = __commonJS({
  "dist/entities/sales-history/sales-history.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SalesHistoryService", {
      enumerable: true,
      get: function() {
        return SalesHistoryService;
      }
    });
    var _common = __require("@nestjs/common");
    var _kysely = __require("kysely");
    var _index = require_common();
    var _index1 = require_database();
    var _index2 = require_lib();
    var _marketplacesservice = require_marketplaces_service();
    var _skusservice = require_skus_service();
    var _saleshistoryschema = require_sales_history_schema();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var SalesHistoryService = class SalesHistoryService {
      mapRow(row) {
        return {
          ...row,
          period: (0, _index2.dateToPeriod)(row.period)
        };
      }
      async findAll() {
        const rows = await this.db.selectFrom("sales_history").selectAll().execute();
        return rows.map((r) => this.mapRow(r));
      }
      async findById(id) {
        const row = await this.db.selectFrom("sales_history").selectAll().where("id", "=", id).executeTakeFirst();
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
          baseQuery = baseQuery.where("period", ">=", (0, _index2.periodToDate)(periodFrom));
        }
        if (periodTo) {
          baseQuery = baseQuery.where("period", "<=", (0, _index2.periodToDate)(periodTo));
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
            period: (0, _index2.periodToDate)(dto.period),
            quantity: dto.quantity,
            marketplace_id: dto.marketplace_id,
            updated_at: /* @__PURE__ */ new Date()
          }).returningAll().executeTakeFirstOrThrow();
          return this.mapRow(result);
        } catch (error) {
          if ((0, _index.isUniqueViolation)(error)) {
            throw new _index.DuplicateResourceException("Sales History", `SKU ${dto.sku_id} for period ${dto.period}`, "this shop");
          }
          throw error;
        }
      }
      async update(id, dto) {
        const result = await this.db.updateTable("sales_history").set({
          ...dto,
          updated_at: /* @__PURE__ */ new Date()
        }).where("id", "=", id).returningAll().executeTakeFirst();
        if (!result) {
          throw new _common.NotFoundException(`Sales history record with id ${id} not found`);
        }
        return this.mapRow(result);
      }
      async delete(id) {
        await this.db.deleteFrom("sales_history").where("id", "=", id).execute();
      }
      async deleteByShopId(shopId) {
        const result = await this.db.deleteFrom("sales_history").where("shop_id", "=", shopId).executeTakeFirst();
        return Number(result.numDeletedRows);
      }
      async upsert(dto) {
        const periodDate = (0, _index2.periodToDate)(dto.period);
        const result = await this.db.insertInto("sales_history").values({
          shop_id: dto.shop_id,
          tenant_id: dto.tenant_id,
          sku_id: dto.sku_id,
          period: periodDate,
          quantity: dto.quantity,
          marketplace_id: dto.marketplace_id,
          updated_at: /* @__PURE__ */ new Date()
        }).onConflict((oc) => oc.columns([
          "shop_id",
          "sku_id",
          "period",
          "marketplace_id"
        ]).doUpdateSet({
          quantity: dto.quantity,
          updated_at: /* @__PURE__ */ new Date()
        })).returningAll().executeTakeFirstOrThrow();
        return this.mapRow(result);
      }
      async bulkUpsert(tenantId, shopId, items) {
        if (items.length === 0) {
          return {
            created: 0,
            updated: 0,
            skus_created: 0,
            marketplaces_created: 0,
            errors: []
          };
        }
        const errors = [];
        const validatedItems = [];
        items.forEach((item, i) => {
          const result = _saleshistoryschema.ImportSalesHistoryItemSchema.safeParse(item);
          if (!result.success) {
            const errorMessages = result.error.issues.map((issue) => issue.message).join(", ");
            errors.push(`Invalid item at index ${i}: ${errorMessages}`);
            return;
          }
          validatedItems.push(result.data);
        });
        if (validatedItems.length === 0) {
          return {
            created: 0,
            updated: 0,
            skus_created: 0,
            marketplaces_created: 0,
            errors
          };
        }
        const skuCodes = validatedItems.map((i) => this.skusService.normalizeCode(i.sku));
        const { codeToId: skuCodeToId, created: skusCreated } = await this.skusService.findOrCreateByCode(tenantId, shopId, skuCodes);
        const marketplaceCodes = validatedItems.map((i) => this.marketplacesService.normalizeCode(i.marketplace));
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
            for (const [code, id] of marketplaceCodeToId.entries()) {
              if (code.toLowerCase() === originalLower.replace(/[^a-z0-9]/g, "")) {
                marketplaceId = id;
                break;
              }
            }
          }
          if (skuId && marketplaceId) {
            validItems.push({
              ...item,
              sku_id: skuId,
              periodDate: (0, _index2.periodToDate)(item.period),
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
        const existingKeys = new Set((await this.db.selectFrom("sales_history").select([
          "sku_id",
          (0, _kysely.sql)`to_char(period, 'YYYY-MM')`.as("period_str"),
          "marketplace_id"
        ]).where("shop_id", "=", shopId).where("sku_id", "in", validItems.map((i) => i.sku_id)).execute()).map((r) => `${r.sku_id}-${r.period_str}-${r.marketplace_id}`));
        await this.db.insertInto("sales_history").values(validItems.map((item) => ({
          shop_id: shopId,
          tenant_id: tenantId,
          sku_id: item.sku_id,
          period: item.periodDate,
          quantity: item.quantity,
          marketplace_id: item.marketplace_id,
          updated_at: /* @__PURE__ */ new Date()
        }))).onConflict((oc) => oc.columns([
          "shop_id",
          "sku_id",
          "period",
          "marketplace_id"
        ]).doUpdateSet({
          quantity: (eb) => eb.ref("excluded.quantity"),
          updated_at: /* @__PURE__ */ new Date()
        })).execute();
        const created = validItems.filter((i) => !existingKeys.has(`${i.sku_id}-${i.period}-${i.marketplace_id}`)).length;
        const updated = validItems.filter((i) => existingKeys.has(`${i.sku_id}-${i.period}-${i.marketplace_id}`)).length;
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
          (0, _kysely.sql)`to_char(sales_history.period, 'YYYY-MM')`.as("period"),
          "sales_history.quantity",
          "marketplaces.code as marketplace_code"
        ]).where("sales_history.shop_id", "=", shopId);
        if (periodFrom) {
          query = query.where("sales_history.period", ">=", (0, _index2.periodToDate)(periodFrom));
        }
        if (periodTo) {
          query = query.where("sales_history.period", "<=", (0, _index2.periodToDate)(periodTo));
        }
        const rows = await query.orderBy("skus.code", "asc").orderBy("sales_history.period", "asc").execute();
        return rows.map((r) => ({
          marketplace: r.marketplace_code,
          period: r.period,
          sku: r.sku_code,
          quantity: r.quantity
        }));
      }
      constructor(db, skusService, marketplacesService) {
        this.db = db;
        this.skusService = skusService;
        this.marketplacesService = marketplacesService;
      }
    };
    SalesHistoryService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _index1.DatabaseService === "undefined" ? Object : _index1.DatabaseService,
        typeof _skusservice.SkusService === "undefined" ? Object : _skusservice.SkusService,
        typeof _marketplacesservice.MarketplacesService === "undefined" ? Object : _marketplacesservice.MarketplacesService
      ])
    ], SalesHistoryService);
  }
});

// dist/entities/sales-history/sales-history.controller.js
var require_sales_history_controller = __commonJS({
  "dist/entities/sales-history/sales-history.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SalesHistoryController", {
      enumerable: true,
      get: function() {
        return SalesHistoryController;
      }
    });
    var _common = __require("@nestjs/common");
    var _platformexpress = __require("@nestjs/platform-express");
    var _authguard = require_auth_guard();
    var _decorators = require_decorators();
    var _index = require_common();
    var _index1 = require_lib();
    var _saleshistoryschema = require_sales_history_schema();
    var _saleshistoryservice = require_sales_history_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var SalesHistoryController = class SalesHistoryController {
      async findAll(_req, ctx, query) {
        return this.salesHistoryService.findByShopAndPeriod(ctx.shopId, query);
      }
      async exportJson(_req, ctx, res, periodFrom, periodTo) {
        _saleshistoryschema.PeriodQuerySchema.parse({
          period_from: periodFrom,
          period_to: periodTo
        });
        const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
        (0, _index.sendJsonExport)(res, items, "sales-history.json");
      }
      async exportCsv(_req, ctx, res, periodFrom, periodTo) {
        _saleshistoryschema.PeriodQuerySchema.parse({
          period_from: periodFrom,
          period_to: periodTo
        });
        const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
        (0, _index.sendCsvExport)(res, items, "sales-history.csv", [
          "marketplace",
          "period",
          "sku",
          "quantity"
        ]);
      }
      async findById(_req, ctx, id) {
        const record = await this.salesHistoryService.findById(id);
        (0, _index.assertShopAccess)(record, ctx, "Sales history record", id);
        return record;
      }
      async create(_req, ctx, dto) {
        return this.salesHistoryService.create({
          ...dto,
          shop_id: ctx.shopId,
          tenant_id: ctx.tenantId
        });
      }
      async update(_req, ctx, id, dto) {
        const record = await this.salesHistoryService.findById(id);
        (0, _index.assertShopAccess)(record, ctx, "Sales history record", id);
        return this.salesHistoryService.update(id, dto);
      }
      async delete(_req, ctx, id) {
        const record = await this.salesHistoryService.findById(id);
        (0, _index.assertShopAccess)(record, ctx, "Sales history record", id);
        await this.salesHistoryService.delete(id);
      }
      async import(_req, ctx, items, file) {
        const validatedData = (0, _index.parseAndValidateImport)(file, items, _saleshistoryschema.ImportSalesHistoryItemSchema);
        return this.salesHistoryService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
      }
      async importCsv(_req, ctx, file) {
        if (!file) {
          throw new _common.BadRequestException("File is required");
        }
        const content = file.buffer.toString("utf-8");
        const records = (0, _index1.fromCsv)(content, [
          "marketplace",
          "period",
          "sku",
          "quantity"
        ]);
        const validatedData = records.map((record, index) => {
          const quantity = Number.parseFloat(record.quantity);
          if (Number.isNaN(quantity)) {
            throw new _common.BadRequestException(`Invalid quantity at row ${index + 1}: ${record.quantity}`);
          }
          try {
            return _saleshistoryschema.ImportSalesHistoryItemSchema.parse({
              marketplace: record.marketplace,
              period: record.period,
              sku: record.sku,
              quantity
            });
          } catch (error) {
            throw new _common.BadRequestException(`Invalid data at row ${index + 1}: ${error}`);
          }
        });
        return this.salesHistoryService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
      }
      constructor(salesHistoryService) {
        this.salesHistoryService = salesHistoryService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Query)(new _index.ZodValidationPipe(_saleshistoryschema.SalesHistoryQuerySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof SalesHistoryQuery === "undefined" ? Object : SalesHistoryQuery
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SalesHistoryController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)("export/json"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_param(3, (0, _common.Query)("period_from")),
      _ts_param(4, (0, _common.Query)("period_to")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse,
        String,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SalesHistoryController.prototype, "exportJson", null);
    _ts_decorate([
      (0, _common.Get)("export/csv"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_param(3, (0, _common.Query)("period_from")),
      _ts_param(4, (0, _common.Query)("period_to")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse,
        String,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SalesHistoryController.prototype, "exportCsv", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SalesHistoryController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_saleshistoryschema.CreateSalesHistorySchema.omit({
        shop_id: true,
        tenant_id: true
      })))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof CreateSalesHistoryRequest === "undefined" ? Object : CreateSalesHistoryRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SalesHistoryController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(3, (0, _common.Body)(new _index.ZodValidationPipe(_saleshistoryschema.UpdateSalesHistorySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number,
        typeof UpdateSalesHistoryRequest === "undefined" ? Object : UpdateSalesHistoryRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SalesHistoryController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SalesHistoryController.prototype, "delete", null);
    _ts_decorate([
      (0, _common.Post)("import/json"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)()),
      _ts_param(3, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Array,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SalesHistoryController.prototype, "import", null);
    _ts_decorate([
      (0, _common.Post)("import/csv"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SalesHistoryController.prototype, "importCsv", null);
    SalesHistoryController = _ts_decorate([
      (0, _common.Controller)("sales-history"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _saleshistoryservice.SalesHistoryService === "undefined" ? Object : _saleshistoryservice.SalesHistoryService
      ])
    ], SalesHistoryController);
  }
});

// dist/entities/skus/skus.controller.js
var require_skus_controller = __commonJS({
  "dist/entities/skus/skus.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SkusController", {
      enumerable: true,
      get: function() {
        return SkusController;
      }
    });
    var _common = __require("@nestjs/common");
    var _platformexpress = __require("@nestjs/platform-express");
    var _authguard = require_auth_guard();
    var _decorators = require_decorators();
    var _index = require_common();
    var _skusschema = require_skus_schema();
    var _skusservice = require_skus_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var SkusController = class SkusController {
      async findAll(_req, ctx, query) {
        return this.skusService.findByShopIdPaginated(ctx.shopId, query);
      }
      async findByCode(_req, ctx, code) {
        const sku = await this.skusService.findByCodeAndShop(code, ctx.shopId);
        if (!sku || sku.tenant_id !== ctx.tenantId) {
          throw new _common.NotFoundException(`SKU with code ${code} not found`);
        }
        return sku;
      }
      async exportJson(_req, ctx, res) {
        const items = await this.skusService.exportForShop(ctx.shopId);
        (0, _index.sendJsonExport)(res, items, "skus.json");
      }
      async exportCsv(_req, ctx, res) {
        const items = await this.skusService.exportForShop(ctx.shopId);
        (0, _index.sendCsvExport)(res, items, "skus.csv", [
          "code",
          "title",
          "category",
          "title2",
          "group",
          "supplier",
          "status"
        ]);
      }
      async findById(_req, ctx, id) {
        const sku = await this.skusService.findById(id);
        (0, _index.assertShopAccess)(sku, ctx, "SKU", id);
        return sku;
      }
      async create(_req, ctx, dto) {
        return this.skusService.create({
          ...dto,
          shop_id: ctx.shopId,
          tenant_id: ctx.tenantId
        });
      }
      async update(_req, ctx, id, dto) {
        const sku = await this.skusService.findById(id);
        (0, _index.assertShopAccess)(sku, ctx, "SKU", id);
        return this.skusService.update(id, dto);
      }
      async importJson(_req, ctx, items, file) {
        const validatedData = (0, _index.parseAndValidateImport)(file, items, _skusschema.ImportSkuItemSchema);
        return this.skusService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
      }
      async importCsv(_req, ctx, file) {
        const records = (0, _index.parseCsvImport)(file, void 0, [
          "code",
          "title"
        ]);
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
      async delete(_req, ctx, id) {
        const sku = await this.skusService.findById(id);
        (0, _index.assertShopAccess)(sku, ctx, "SKU", id);
        await this.skusService.delete(id);
      }
      constructor(skusService) {
        this.skusService = skusService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Query)(new _index.ZodValidationPipe(_skusschema.PaginationQuerySchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof PaginationQuery === "undefined" ? Object : PaginationQuery
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)("code/:code"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("code")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "findByCode", null);
    _ts_decorate([
      (0, _common.Get)("export/json"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "exportJson", null);
    _ts_decorate([
      (0, _common.Get)("export/csv"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Res)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof ExpressResponse === "undefined" ? Object : ExpressResponse
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "exportCsv", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      (0, _decorators.RequireReadAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_skusschema.CreateSkuSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof CreateSkuRequest === "undefined" ? Object : CreateSkuRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(3, (0, _common.Body)(new _index.ZodValidationPipe(_skusschema.UpdateSkuSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number,
        typeof UpdateSkuRequest === "undefined" ? Object : UpdateSkuRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Post)("import/json"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Body)()),
      _ts_param(3, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Array,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "importJson", null);
    _ts_decorate([
      (0, _common.Post)("import/csv"),
      (0, _decorators.RequireWriteAccess)(),
      (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.UploadedFile)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "importCsv", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      (0, _decorators.RequireWriteAccess)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _decorators.ShopContext)()),
      _ts_param(2, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof ShopContextType === "undefined" ? Object : ShopContextType,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], SkusController.prototype, "delete", null);
    SkusController = _ts_decorate([
      (0, _common.Controller)("skus"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _skusservice.SkusService === "undefined" ? Object : _skusservice.SkusService
      ])
    ], SkusController);
  }
});

// dist/entities/skus/skus-examples.controller.js
var require_skus_examples_controller = __commonJS({
  "dist/entities/skus/skus-examples.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SkusExamplesController", {
      enumerable: true,
      get: function() {
        return SkusExamplesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var EXAMPLE_SKUS = [
      {
        code: "SKU-001",
        title: "Product 1"
      },
      {
        code: "SKU-002",
        title: "Product 2"
      },
      {
        code: "SKU-003",
        title: "Product 3"
      }
    ];
    var SkusExamplesController = class SkusExamplesController extends _index.BaseExamplesController {
      constructor(...args) {
        super(...args), this.examples = EXAMPLE_SKUS, this.entityName = "skus", this.csvColumns = [
          "code",
          "title"
        ];
      }
    };
    SkusExamplesController = _ts_decorate([
      (0, _common.Controller)("skus/examples")
    ], SkusExamplesController);
  }
});

// dist/entities/skus/skus.module.js
var require_skus_module = __commonJS({
  "dist/entities/skus/skus.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SkusModule", {
      enumerable: true,
      get: function() {
        return SkusModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _categoriesmodule = require_categories_module();
    var _groupsmodule = require_groups_module();
    var _statusesmodule = require_statuses_module();
    var _suppliersmodule = require_suppliers_module();
    var _skuscontroller = require_skus_controller();
    var _skusservice = require_skus_service();
    var _skusrepository = require_skus_repository();
    var _skusexamplescontroller = require_skus_examples_controller();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var SkusModule = class SkusModule {
    };
    SkusModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule,
          _categoriesmodule.CategoriesModule,
          _groupsmodule.GroupsModule,
          _statusesmodule.StatusesModule,
          _suppliersmodule.SuppliersModule
        ],
        controllers: [
          _skuscontroller.SkusController,
          _skusexamplescontroller.SkusExamplesController
        ],
        providers: [
          _skusservice.SkusService,
          _skusrepository.SkusRepository,
          _authguard.AuthGuard
        ],
        exports: [
          _skusservice.SkusService
        ]
      })
    ], SkusModule);
  }
});

// dist/entities/sales-history/sales-history-examples.controller.js
var require_sales_history_examples_controller = __commonJS({
  "dist/entities/sales-history/sales-history-examples.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SalesHistoryExamplesController", {
      enumerable: true,
      get: function() {
        return SalesHistoryExamplesController;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var EXAMPLE_SALES_HISTORY = [
      {
        marketplace: "WB",
        period: "2026-01",
        sku: "SKU-001",
        quantity: 100
      },
      {
        marketplace: "WB",
        period: "2026-02",
        sku: "SKU-001",
        quantity: 120
      },
      {
        marketplace: "OZON",
        period: "2026-01",
        sku: "SKU-002",
        quantity: 50
      }
    ];
    var SalesHistoryExamplesController = class SalesHistoryExamplesController extends _index.BaseExamplesController {
      constructor(...args) {
        super(...args), this.examples = EXAMPLE_SALES_HISTORY, this.entityName = "sales-history", this.csvColumns = [
          "marketplace",
          "period",
          "sku",
          "quantity"
        ];
      }
    };
    SalesHistoryExamplesController = _ts_decorate([
      (0, _common.Controller)("sales-history/examples")
    ], SalesHistoryExamplesController);
  }
});

// dist/entities/sales-history/sales-history.module.js
var require_sales_history_module = __commonJS({
  "dist/entities/sales-history/sales-history.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "SalesHistoryModule", {
      enumerable: true,
      get: function() {
        return SalesHistoryModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _marketplacesmodule = require_marketplaces_module();
    var _skusmodule = require_skus_module();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _saleshistorycontroller = require_sales_history_controller();
    var _saleshistoryservice = require_sales_history_service();
    var _saleshistoryexamplescontroller = require_sales_history_examples_controller();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var SalesHistoryModule = class SalesHistoryModule {
    };
    SalesHistoryModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule,
          _skusmodule.SkusModule,
          _marketplacesmodule.MarketplacesModule
        ],
        controllers: [
          _saleshistoryexamplescontroller.SalesHistoryExamplesController,
          _saleshistorycontroller.SalesHistoryController
        ],
        providers: [
          _saleshistoryservice.SalesHistoryService,
          _authguard.AuthGuard
        ],
        exports: [
          _saleshistoryservice.SalesHistoryService
        ]
      })
    ], SalesHistoryModule);
  }
});

// dist/entities/sales-history/index.js
var require_sales_history = __commonJS({
  "dist/entities/sales-history/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateSalesHistorySchema() {
        return _saleshistoryschema.CreateSalesHistorySchema;
      },
      get ImportSalesHistoryItemSchema() {
        return _saleshistoryschema.ImportSalesHistoryItemSchema;
      },
      get PeriodQuerySchema() {
        return _saleshistoryschema.PeriodQuerySchema;
      },
      get SalesHistoryController() {
        return _saleshistorycontroller.SalesHistoryController;
      },
      get SalesHistoryModule() {
        return _saleshistorymodule.SalesHistoryModule;
      },
      get SalesHistoryQuerySchema() {
        return _saleshistoryschema.SalesHistoryQuerySchema;
      },
      get SalesHistoryService() {
        return _saleshistoryservice.SalesHistoryService;
      },
      get UpdateSalesHistorySchema() {
        return _saleshistoryschema.UpdateSalesHistorySchema;
      }
    });
    var _saleshistorycontroller = require_sales_history_controller();
    var _saleshistorymodule = require_sales_history_module();
    var _saleshistoryschema = require_sales_history_schema();
    var _saleshistoryservice = require_sales_history_service();
  }
});

// dist/entities/shops/shops.schema.js
var require_shops_schema = __commonJS({
  "dist/entities/shops/shops.schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateShopSchema() {
        return CreateShopSchema;
      },
      get UpdateShopSchema() {
        return UpdateShopSchema;
      }
    });
    var _zod = __require("zod");
    var _index = require_common();
    var { title, id } = _index.zodSchemas;
    var CreateShopSchema = _zod.z.object({
      title: title(),
      tenant_id: id()
    });
    var UpdateShopSchema = _zod.z.object({
      title: title().optional()
    });
  }
});

// dist/entities/shops/shops.service.js
var require_shops_service = __commonJS({
  "dist/entities/shops/shops.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ShopsService", {
      enumerable: true,
      get: function() {
        return ShopsService;
      }
    });
    var _common = __require("@nestjs/common");
    var _databaseservice = require_database_service();
    var _marketplacesservice = require_marketplaces_service();
    var _saleshistoryservice = require_sales_history_service();
    var _skusservice = require_skus_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var ShopsService = class ShopsService {
      async findAll() {
        return this.db.selectFrom("shops").selectAll().execute();
      }
      async findByTenantId(tenantId) {
        return this.db.selectFrom("shops").selectAll().where("tenant_id", "=", tenantId).execute();
      }
      async findById(id) {
        return this.db.selectFrom("shops").selectAll().where("id", "=", id).executeTakeFirst();
      }
      async create(dto) {
        return this.db.insertInto("shops").values(dto).returningAll().executeTakeFirstOrThrow();
      }
      async update(id, dto) {
        return this.db.updateTable("shops").set({
          ...dto,
          updated_at: /* @__PURE__ */ new Date()
        }).where("id", "=", id).returningAll().executeTakeFirst();
      }
      async delete(id) {
        await this.db.deleteFrom("shops").where("id", "=", id).execute();
      }
      async deleteData(id) {
        const salesHistoryDeleted = await this.salesHistoryService.deleteByShopId(id);
        const skusDeleted = await this.skusService.deleteByShopId(id);
        const marketplacesDeleted = await this.marketplacesService.deleteByShopId(id) ?? 0;
        return {
          skusDeleted,
          salesHistoryDeleted,
          marketplacesDeleted
        };
      }
      constructor(db, skusService, salesHistoryService, marketplacesService) {
        this.db = db;
        this.skusService = skusService;
        this.salesHistoryService = salesHistoryService;
        this.marketplacesService = marketplacesService;
      }
    };
    ShopsService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _databaseservice.DatabaseService === "undefined" ? Object : _databaseservice.DatabaseService,
        typeof _skusservice.SkusService === "undefined" ? Object : _skusservice.SkusService,
        typeof _saleshistoryservice.SalesHistoryService === "undefined" ? Object : _saleshistoryservice.SalesHistoryService,
        typeof _marketplacesservice.MarketplacesService === "undefined" ? Object : _marketplacesservice.MarketplacesService
      ])
    ], ShopsService);
  }
});

// dist/entities/shops/shops.controller.js
var require_shops_controller = __commonJS({
  "dist/entities/shops/shops.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ShopsController", {
      enumerable: true,
      get: function() {
        return ShopsController;
      }
    });
    var _common = __require("@nestjs/common");
    var _accesscontrol = require_access_control();
    var _authguard = require_auth_guard();
    var _index = require_common();
    var _shopsschema = require_shops_schema();
    var _shopsservice = require_shops_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var ShopsController = class ShopsController {
      async findAll(req, tenantId) {
        if (req.user.isSystemAdmin) {
          if (tenantId) {
            return this.shopsService.findByTenantId(Number(tenantId));
          }
          return this.shopsService.findAll();
        }
        if (tenantId) {
          const tid = Number(tenantId);
          if (!(0, _accesscontrol.hasTenantAccess)(req.user, tid)) {
            throw new _common.ForbiddenException("Access to this tenant is not allowed");
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
      async findById(req, id) {
        const shop = await this.shopsService.findById(id);
        if (!shop) {
          throw new _common.NotFoundException(`Shop with id ${id} not found`);
        }
        if (req.user.isSystemAdmin) {
          return shop;
        }
        if (!(0, _accesscontrol.hasReadAccess)(req.user, shop.id, shop.tenant_id)) {
          throw new _common.ForbiddenException("Access to this shop is not allowed");
        }
        return shop;
      }
      async create(req, dto) {
        (0, _accesscontrol.validateTenantAdminAccess)(req.user, dto.tenant_id);
        return this.shopsService.create(dto);
      }
      async update(req, id, dto) {
        const shop = await this.shopsService.findById(id);
        if (!shop) {
          throw new _common.NotFoundException(`Shop with id ${id} not found`);
        }
        (0, _accesscontrol.validateTenantAdminAccess)(req.user, shop.tenant_id);
        const updated = await this.shopsService.update(id, dto);
        if (!updated) {
          throw new _common.NotFoundException(`Shop with id ${id} not found`);
        }
        return updated;
      }
      async delete(req, id) {
        const shop = await this.shopsService.findById(id);
        if (!shop) {
          throw new _common.NotFoundException(`Shop with id ${id} not found`);
        }
        (0, _accesscontrol.validateTenantAdminAccess)(req.user, shop.tenant_id);
        await this.shopsService.delete(id);
      }
      async deleteData(req, id) {
        const shop = await this.shopsService.findById(id);
        if (!shop) {
          throw new _common.NotFoundException(`Shop with id ${id} not found`);
        }
        (0, _accesscontrol.validateWriteAccess)(req.user, id, shop.tenant_id);
        return this.shopsService.deleteData(id);
      }
      constructor(shopsService) {
        this.shopsService = shopsService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Query)("tenantId")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ShopsController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ShopsController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Body)(new _index.ZodValidationPipe(_shopsschema.CreateShopSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof CreateShopRequest === "undefined" ? Object : CreateShopRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ShopsController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Put)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_param(2, (0, _common.Body)(new _index.ZodValidationPipe(_shopsschema.UpdateShopSchema))),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number,
        typeof UpdateShopRequest === "undefined" ? Object : UpdateShopRequest
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ShopsController.prototype, "update", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ShopsController.prototype, "delete", null);
    _ts_decorate([
      (0, _common.Delete)(":id/data"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], ShopsController.prototype, "deleteData", null);
    ShopsController = _ts_decorate([
      (0, _common.Controller)("shops"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _shopsservice.ShopsService === "undefined" ? Object : _shopsservice.ShopsService
      ])
    ], ShopsController);
  }
});

// dist/entities/shops/shops.module.js
var require_shops_module = __commonJS({
  "dist/entities/shops/shops.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ShopsModule", {
      enumerable: true,
      get: function() {
        return ShopsModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _marketplacesmodule = require_marketplaces_module();
    var _saleshistorymodule = require_sales_history_module();
    var _skusmodule = require_skus_module();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _shopscontroller = require_shops_controller();
    var _shopsservice = require_shops_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var ShopsModule = class ShopsModule {
    };
    ShopsModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule,
          _skusmodule.SkusModule,
          _saleshistorymodule.SalesHistoryModule,
          _marketplacesmodule.MarketplacesModule
        ],
        controllers: [
          _shopscontroller.ShopsController
        ],
        providers: [
          _shopsservice.ShopsService,
          _authguard.AuthGuard
        ],
        exports: [
          _shopsservice.ShopsService
        ]
      })
    ], ShopsModule);
  }
});

// dist/entities/shops/index.js
var require_shops = __commonJS({
  "dist/entities/shops/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_shops_controller(), exports);
    _export_star(require_shops_module(), exports);
    _export_star(require_shops_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/skus/index.js
var require_skus = __commonJS({
  "dist/entities/skus/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
      });
    }
    _export(exports, {
      get CreateSkuSchema() {
        return _skusschema.CreateSkuSchema;
      },
      get ImportSkuItemSchema() {
        return _skusschema.ImportSkuItemSchema;
      },
      get SkusModule() {
        return _skusmodule.SkusModule;
      },
      get SkusService() {
        return _skusservice.SkusService;
      },
      get UpdateSkuSchema() {
        return _skusschema.UpdateSkuSchema;
      }
    });
    var _skusmodule = require_skus_module();
    var _skusschema = require_skus_schema();
    var _skusservice = require_skus_service();
  }
});

// dist/entities/tenants/index.js
var require_tenants = __commonJS({
  "dist/entities/tenants/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_tenants_controller(), exports);
    _export_star(require_tenants_module(), exports);
    _export_star(require_tenants_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/user-roles/index.js
var require_user_roles = __commonJS({
  "dist/entities/user-roles/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_user_roles_controller(), exports);
    _export_star(require_user_roles_module(), exports);
    _export_star(require_user_roles_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/user-shops/user-shops.service.js
var require_user_shops_service = __commonJS({
  "dist/entities/user-shops/user-shops.service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "UserShopsService", {
      enumerable: true,
      get: function() {
        return UserShopsService;
      }
    });
    var _common = __require("@nestjs/common");
    var _index = require_common();
    var _databaseservice = require_database_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    var UserShopsService = class UserShopsService {
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
      async findById(id) {
        return this.db.selectFrom("user_shops").selectAll().where("id", "=", id).executeTakeFirst();
      }
      async create(dto) {
        try {
          return this.db.insertInto("user_shops").values(dto).returningAll().executeTakeFirstOrThrow();
        } catch (error) {
          if ((0, _index.isUniqueViolation)(error)) {
            throw new _index.DuplicateResourceException("User Shop", `User ${dto.user_id} - Shop ${dto.shop_id}`);
          }
          throw error;
        }
      }
      async delete(id) {
        await this.db.deleteFrom("user_shops").where("id", "=", id).execute();
      }
      async deleteByUserAndShop(userId, shopId) {
        await this.db.deleteFrom("user_shops").where("user_id", "=", userId).where("shop_id", "=", shopId).execute();
      }
      constructor(db) {
        this.db = db;
      }
    };
    UserShopsService = _ts_decorate([
      (0, _common.Injectable)(),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _databaseservice.DatabaseService === "undefined" ? Object : _databaseservice.DatabaseService
      ])
    ], UserShopsService);
  }
});

// dist/entities/user-shops/user-shops.controller.js
var require_user_shops_controller = __commonJS({
  "dist/entities/user-shops/user-shops.controller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "UserShopsController", {
      enumerable: true,
      get: function() {
        return UserShopsController;
      }
    });
    var _common = __require("@nestjs/common");
    var _accesscontrol = require_access_control();
    var _authguard = require_auth_guard();
    var _shopsservice = require_shops_service();
    var _usershopsservice = require_user_shops_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function _ts_metadata(k, v) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    }
    function _ts_param(paramIndex, decorator) {
      return function(target, key) {
        decorator(target, key, paramIndex);
      };
    }
    var UserShopsController = class UserShopsController {
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
          if (!shop || !(0, _accesscontrol.hasTenantAccess)(req.user, shop.tenant_id)) {
            throw new _common.ForbiddenException("Access to this shop is not allowed");
          }
          return this.userShopsService.findByShopId(Number(shopId));
        }
        if (tenantId) {
          const tid = Number(tenantId);
          if (!(0, _accesscontrol.hasTenantAccess)(req.user, tid)) {
            throw new _common.ForbiddenException("Access to this tenant is not allowed");
          }
          return this.userShopsService.findByTenantId(tid);
        }
        throw new _common.ForbiddenException("shopId or tenantId query parameter is required");
      }
      async findById(req, id) {
        const userShop = await this.userShopsService.findById(id);
        if (!userShop) {
          throw new _common.NotFoundException(`UserShop with id ${id} not found`);
        }
        if (!req.user.isSystemAdmin) {
          const shop = await this.shopsService.findById(userShop.shop_id);
          if (!shop || !(0, _accesscontrol.hasTenantAccess)(req.user, shop.tenant_id)) {
            throw new _common.ForbiddenException("Access to this user-shop is not allowed");
          }
        }
        return userShop;
      }
      async create(req, dto) {
        if (!req.user.isSystemAdmin) {
          const shop = await this.shopsService.findById(dto.shop_id);
          if (!shop) {
            throw new _common.NotFoundException(`Shop with id ${dto.shop_id} not found`);
          }
          (0, _accesscontrol.validateTenantAdminAccess)(req.user, shop.tenant_id);
        }
        return this.userShopsService.create(dto);
      }
      async delete(req, id) {
        const userShop = await this.userShopsService.findById(id);
        if (!userShop) {
          throw new _common.NotFoundException(`UserShop with id ${id} not found`);
        }
        if (!req.user.isSystemAdmin) {
          const shop = await this.shopsService.findById(userShop.shop_id);
          if (!shop || !(0, _accesscontrol.hasTenantAccess)(req.user, shop.tenant_id)) {
            throw new _common.ForbiddenException("Cannot delete user-shop from another tenant");
          }
        }
        await this.userShopsService.delete(id);
      }
      constructor(userShopsService, shopsService) {
        this.userShopsService = userShopsService;
        this.shopsService = shopsService;
      }
    };
    _ts_decorate([
      (0, _common.Get)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Query)("userId")),
      _ts_param(2, (0, _common.Query)("shopId")),
      _ts_param(3, (0, _common.Query)("tenantId")),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        String,
        String,
        String
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UserShopsController.prototype, "findAll", null);
    _ts_decorate([
      (0, _common.Get)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UserShopsController.prototype, "findById", null);
    _ts_decorate([
      (0, _common.Post)(),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Body)()),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        typeof _usershopsservice.CreateUserShopDto === "undefined" ? Object : _usershopsservice.CreateUserShopDto
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UserShopsController.prototype, "create", null);
    _ts_decorate([
      (0, _common.Delete)(":id"),
      _ts_param(0, (0, _common.Req)()),
      _ts_param(1, (0, _common.Param)("id", _common.ParseIntPipe)),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _authguard.AuthenticatedRequest === "undefined" ? Object : _authguard.AuthenticatedRequest,
        Number
      ]),
      _ts_metadata("design:returntype", Promise)
    ], UserShopsController.prototype, "delete", null);
    UserShopsController = _ts_decorate([
      (0, _common.Controller)("user-shops"),
      (0, _common.UseGuards)(_authguard.AuthGuard),
      _ts_metadata("design:type", Function),
      _ts_metadata("design:paramtypes", [
        typeof _usershopsservice.UserShopsService === "undefined" ? Object : _usershopsservice.UserShopsService,
        typeof _shopsservice.ShopsService === "undefined" ? Object : _shopsservice.ShopsService
      ])
    ], UserShopsController);
  }
});

// dist/entities/user-shops/user-shops.module.js
var require_user_shops_module = __commonJS({
  "dist/entities/user-shops/user-shops.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "UserShopsModule", {
      enumerable: true,
      get: function() {
        return UserShopsModule;
      }
    });
    var _common = __require("@nestjs/common");
    var _apikeysmodule = require_api_keys_module();
    var _authguard = require_auth_guard();
    var _shopsmodule = require_shops_module();
    var _tenantsmodule = require_tenants_module();
    var _userrolesmodule = require_user_roles_module();
    var _usershopscontroller = require_user_shops_controller();
    var _usershopsservice = require_user_shops_service();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var UserShopsModule = class UserShopsModule {
    };
    UserShopsModule = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _apikeysmodule.ApiKeysModule,
          _userrolesmodule.UserRolesModule,
          _tenantsmodule.TenantsModule,
          _shopsmodule.ShopsModule
        ],
        controllers: [
          _usershopscontroller.UserShopsController
        ],
        providers: [
          _usershopsservice.UserShopsService,
          _authguard.AuthGuard
        ],
        exports: [
          _usershopsservice.UserShopsService
        ]
      })
    ], UserShopsModule);
  }
});

// dist/entities/user-shops/index.js
var require_user_shops = __commonJS({
  "dist/entities/user-shops/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_user_shops_controller(), exports);
    _export_star(require_user_shops_module(), exports);
    _export_star(require_user_shops_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/entities/users/index.js
var require_users = __commonJS({
  "dist/entities/users/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    _export_star(require_users_controller(), exports);
    _export_star(require_users_module(), exports);
    _export_star(require_users_service(), exports);
    function _export_star(from, to) {
      Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
          Object.defineProperty(to, k, {
            enumerable: true,
            get: function() {
              return from[k];
            }
          });
        }
      });
      return from;
    }
  }
});

// dist/app.module.js
var require_app_module = __commonJS({
  "dist/app.module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "AppModule", {
      enumerable: true,
      get: function() {
        return AppModule2;
      }
    });
    var _common = __require("@nestjs/common");
    var _config = __require("@nestjs/config");
    var _index = require_api_keys();
    var _appcontroller = require_app_controller();
    var _appservice = require_app_service();
    var _index1 = require_auth();
    var _index2 = require_bootstrap();
    var _index3 = require_brands();
    var _index4 = require_categories();
    var _databaseconfig = require_database_config();
    var _index5 = require_database();
    var _index6 = require_groups();
    var _index7 = require_marketplaces();
    var _index8 = require_me();
    var _index9 = require_metadata();
    var _index10 = require_statuses();
    var _index11 = require_suppliers();
    var _index12 = require_roles();
    var _index13 = require_sales_history();
    var _index14 = require_shops();
    var _index15 = require_skus();
    var _index16 = require_tenants();
    var _index17 = require_user_roles();
    var _index18 = require_user_shops();
    var _index19 = require_users();
    function _ts_decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    var AppModule2 = class AppModule {
    };
    AppModule2 = _ts_decorate([
      (0, _common.Module)({
        imports: [
          _config.ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
              ".env.local",
              ".env"
            ],
            load: [
              _databaseconfig.databaseConfig
            ]
          }),
          _index5.DatabaseModule,
          _index1.AuthModule,
          _index19.UsersModule,
          _index8.MeModule,
          _index12.RolesModule,
          _index17.UserRolesModule,
          _index16.TenantsModule,
          _index14.ShopsModule,
          _index18.UserShopsModule,
          _index.ApiKeysModule,
          _index2.BootstrapModule,
          _index7.MarketplacesModule,
          _index9.MetadataModule,
          _index15.SkusModule,
          _index3.BrandsModule,
          _index4.CategoriesModule,
          _index6.GroupsModule,
          _index10.StatusesModule,
          _index11.SuppliersModule,
          _index13.SalesHistoryModule
        ],
        controllers: [
          _appcontroller.AppController
        ],
        providers: [
          _appservice.AppService
        ]
      })
    ], AppModule2);
  }
});

// dist/serverless-entry.js
var import_app_module = __toESM(require_app_module());
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
var server = express();
var isAppInitialized = false;
async function handler(req, res) {
  try {
    if (!isAppInitialized) {
      const app = await NestFactory.create(import_app_module.AppModule, new ExpressAdapter(server));
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
