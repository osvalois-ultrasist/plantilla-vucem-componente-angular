/**
 * DTOs para comunicación con la API
 * Representan la estructura de datos que llega del backend
 */

export interface RecursoDto {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly area: string;
  readonly estado: string;
  readonly fechaCreacion: string; // ISO 8601 string
  readonly fechaModificacion: string; // ISO 8601 string
  readonly metadata: RecursoMetadataDto;
}

export interface RecursoMetadataDto {
  readonly version: string;
  readonly createdBy: string;
  readonly modifiedBy: string;
  readonly tags: readonly string[];
  readonly categoria: string;
}

/**
 * DTO para crear un nuevo recurso
 */
export interface CreateRecursoDto {
  readonly nombre: string;
  readonly descripcion: string;
  readonly area: string;
  readonly estado?: string;
  readonly createdBy: string;
  readonly tags?: readonly string[];
  readonly categoria?: string;
}

/**
 * DTO para actualizar un recurso existente
 */
export interface UpdateRecursoDto {
  readonly nombre?: string;
  readonly descripcion?: string;
  readonly area?: string;
  readonly estado?: string;
  readonly modifiedBy?: string;
  readonly tags?: readonly string[];
  readonly categoria?: string;
}

/**
 * DTO para respuestas de error de la API
 */
export interface ApiErrorDto {
  readonly message: string;
  readonly code: string;
  readonly timestamp: string;
  readonly path: string;
  readonly details?: Record<string, any>;
  readonly validationErrors?: ValidationErrorDto[];
}

/**
 * DTO para errores de validación
 */
export interface ValidationErrorDto {
  readonly field: string;
  readonly message: string;
  readonly rejectedValue: any;
}

/**
 * DTO para respuestas de estado
 */
export interface StatusResponseDto {
  readonly success: boolean;
  readonly message: string;
  readonly data?: any;
}

/**
 * DTO para búsquedas avanzadas
 */
export interface SearchRecursoDto {
  readonly searchTerm?: string;
  readonly area?: string;
  readonly estado?: string;
  readonly categoria?: string;
  readonly tags?: readonly string[];
  readonly fechaCreacionDesde?: string;
  readonly fechaCreacionHasta?: string;
  readonly createdBy?: string;
}

/**
 * DTO para filtros de recursos
 */
export interface RecursoFilterDto {
  readonly areas?: readonly string[];
  readonly estados?: readonly string[];
  readonly categorias?: readonly string[];
  readonly tags?: readonly string[];
  readonly fechaCreacionMin?: string;
  readonly fechaCreacionMax?: string;
  readonly fechaModificacionMin?: string;
  readonly fechaModificacionMax?: string;
}

/**
 * DTO para estadísticas de recursos
 */
export interface RecursoEstadisticasDto {
  readonly total: number;
  readonly porEstado: Record<string, number>;
  readonly porArea: Record<string, number>;
  readonly porCategoria: Record<string, number>;
  readonly crecimientoMensual: CrecimientoMensualDto[];
  readonly top10Areas: AreaEstadisticaDto[];
}

export interface CrecimientoMensualDto {
  readonly mes: string;
  readonly cantidad: number;
  readonly porcentajeCrecimiento: number;
}

export interface AreaEstadisticaDto {
  readonly area: string;
  readonly cantidad: number;
  readonly porcentaje: number;
}