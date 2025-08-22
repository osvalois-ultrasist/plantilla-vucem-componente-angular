/**
 * Modelo de dominio para Recurso
 * Representa las reglas de negocio y entidades del dominio VUCEM
 */

export interface Recurso {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly area: string;
  readonly estado: EstadoRecurso;
  readonly fechaCreacion: Date;
  readonly fechaModificacion: Date;
  readonly metadata: RecursoMetadata;
}

export enum EstadoRecurso {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  PENDIENTE = 'PENDIENTE',
  ARCHIVADO = 'ARCHIVADO'
}

export interface RecursoMetadata {
  readonly version: string;
  readonly createdBy: string;
  readonly modifiedBy: string;
  readonly tags: readonly string[];
  readonly categoria: string;
}

/**
 * Value Object para validación de Recurso
 */
export class RecursoValidation {
  static readonly MIN_NOMBRE_LENGTH = 3;
  static readonly MAX_NOMBRE_LENGTH = 100;
  static readonly MIN_DESCRIPCION_LENGTH = 10;
  static readonly MAX_DESCRIPCION_LENGTH = 500;

  static validateNombre(nombre: string): ValidationResult {
    if (!nombre || nombre.trim().length < this.MIN_NOMBRE_LENGTH) {
      return {
        isValid: false,
        errors: ['El nombre debe tener al menos 3 caracteres']
      };
    }

    if (nombre.length > this.MAX_NOMBRE_LENGTH) {
      return {
        isValid: false,
        errors: ['El nombre no puede exceder 100 caracteres']
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateDescripcion(descripcion: string): ValidationResult {
    if (!descripcion || descripcion.trim().length < this.MIN_DESCRIPCION_LENGTH) {
      return {
        isValid: false,
        errors: ['La descripción debe tener al menos 10 caracteres']
      };
    }

    if (descripcion.length > this.MAX_DESCRIPCION_LENGTH) {
      return {
        isValid: false,
        errors: ['La descripción no puede exceder 500 caracteres']
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateRecurso(recurso: Partial<Recurso>): ValidationResult {
    const errors: string[] = [];

    if (recurso.nombre) {
      const nombreValidation = this.validateNombre(recurso.nombre);
      if (!nombreValidation.isValid) {
        errors.push(...nombreValidation.errors);
      }
    }

    if (recurso.descripcion) {
      const descripcionValidation = this.validateDescripcion(recurso.descripcion);
      if (!descripcionValidation.isValid) {
        errors.push(...descripcionValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Factory para crear instancias de Recurso
 */
export class RecursoFactory {
  static create(data: CreateRecursoData): Recurso {
    const now = new Date();
    
    return {
      id: data.id || crypto.randomUUID(),
      nombre: data.nombre,
      descripcion: data.descripcion,
      area: data.area,
      estado: data.estado || EstadoRecurso.PENDIENTE,
      fechaCreacion: now,
      fechaModificacion: now,
      metadata: {
        version: '1.0.0',
        createdBy: data.createdBy,
        modifiedBy: data.createdBy,
        tags: data.tags || [],
        categoria: data.categoria || 'general'
      }
    };
  }

  static update(recurso: Recurso, updates: UpdateRecursoData): Recurso {
    return {
      ...recurso,
      ...updates,
      fechaModificacion: new Date(),
      metadata: {
        ...recurso.metadata,
        modifiedBy: updates.modifiedBy || recurso.metadata.modifiedBy,
        tags: updates.tags || recurso.metadata.tags,
        categoria: updates.categoria || recurso.metadata.categoria
      }
    };
  }
}

export interface CreateRecursoData {
  readonly id?: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly area: string;
  readonly estado?: EstadoRecurso;
  readonly createdBy: string;
  readonly tags?: readonly string[];
  readonly categoria?: string;
}

export interface UpdateRecursoData {
  readonly nombre?: string;
  readonly descripcion?: string;
  readonly area?: string;
  readonly estado?: EstadoRecurso;
  readonly modifiedBy?: string;
  readonly tags?: readonly string[];
  readonly categoria?: string;
}