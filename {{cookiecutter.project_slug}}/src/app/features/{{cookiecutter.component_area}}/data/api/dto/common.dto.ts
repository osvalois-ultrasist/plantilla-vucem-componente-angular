/**
 * DTOs comunes para toda la aplicación
 */

/**
 * DTO para respuestas paginadas
 */
export interface PaginatedResponseDto<T> {
  readonly content: T[];
  readonly totalElements: number;
  readonly totalPages: number;
  readonly size: number;
  readonly page: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly empty: boolean;
  readonly sort?: SortDto;
}

/**
 * DTO para información de ordenamiento
 */
export interface SortDto {
  readonly sorted: boolean;
  readonly empty: boolean;
  readonly unsorted: boolean;
  readonly orders: SortOrderDto[];
}

export interface SortOrderDto {
  readonly property: string;
  readonly direction: 'ASC' | 'DESC';
  readonly nullHandling: 'NATIVE' | 'NULLS_FIRST' | 'NULLS_LAST';
}

/**
 * DTO para parámetros de paginación
 */
export interface PaginationParamsDto {
  readonly page: number;
  readonly size: number;
  readonly sort?: string;
  readonly direction?: 'asc' | 'desc';
}

/**
 * DTO genérico para respuestas de la API
 */
export interface ApiResponseDto<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T;
  readonly timestamp: string;
  readonly path: string;
}

/**
 * DTO para respuestas de lista
 */
export interface ListResponseDto<T> {
  readonly items: T[];
  readonly total: number;
  readonly hasMore: boolean;
  readonly nextPageToken?: string;
}

/**
 * DTO para metadatos de respuesta
 */
export interface ResponseMetadataDto {
  readonly requestId: string;
  readonly timestamp: string;
  readonly version: string;
  readonly processingTime: number;
}

/**
 * DTO para enlaces de navegación (HATEOAS)
 */
export interface LinkDto {
  readonly href: string;
  readonly rel: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly title?: string;
}

/**
 * DTO para recursos con enlaces
 */
export interface ResourceDto<T> {
  readonly data: T;
  readonly links: LinkDto[];
  readonly metadata?: ResponseMetadataDto;
}

/**
 * DTO para operaciones en lote
 */
export interface BatchOperationDto<T> {
  readonly operation: 'CREATE' | 'UPDATE' | 'DELETE';
  readonly data: T;
  readonly id?: string;
}

export interface BatchResponseDto<T> {
  readonly successful: T[];
  readonly failed: BatchErrorDto[];
  readonly totalProcessed: number;
  readonly successCount: number;
  readonly errorCount: number;
}

export interface BatchErrorDto {
  readonly id?: string;
  readonly error: string;
  readonly code: string;
  readonly data: any;
}

/**
 * DTO para health check
 */
export interface HealthCheckDto {
  readonly status: 'UP' | 'DOWN' | 'DEGRADED';
  readonly timestamp: string;
  readonly details: Record<string, ComponentHealthDto>;
}

export interface ComponentHealthDto {
  readonly status: 'UP' | 'DOWN' | 'DEGRADED';
  readonly details?: Record<string, any>;
}

/**
 * DTO para configuración de la aplicación
 */
export interface AppConfigDto {
  readonly version: string;
  readonly environment: string;
  readonly features: FeatureFlagDto[];
  readonly limits: AppLimitsDto;
  readonly api: ApiConfigDto;
}

export interface FeatureFlagDto {
  readonly name: string;
  readonly enabled: boolean;
  readonly description?: string;
}

export interface AppLimitsDto {
  readonly maxFileSize: number;
  readonly maxRequestSize: number;
  readonly maxItemsPerPage: number;
  readonly requestTimeoutMs: number;
}

export interface ApiConfigDto {
  readonly baseUrl: string;
  readonly version: string;
  readonly timeout: number;
  readonly retryAttempts: number;
}