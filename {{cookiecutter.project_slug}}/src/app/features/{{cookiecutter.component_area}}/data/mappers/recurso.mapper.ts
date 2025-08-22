import { Injectable } from '@angular/core';

import { Recurso, EstadoRecurso, RecursoMetadata } from '../../domain/models/recurso.model';
import { RecursoDto, CreateRecursoDto, UpdateRecursoDto, RecursoMetadataDto } from '../api/dto/recurso.dto';

/**
 * Mapper para convertir entre DTOs de la API y modelos de dominio
 * Implementa el patrón Mapper para aislar cambios en la API del dominio
 */
@Injectable({
  providedIn: 'root'
})
export class RecursoMapper {

  /**
   * Convierte un DTO de la API a modelo de dominio
   */
  toDomain(dto: RecursoDto): Recurso {
    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      area: dto.area,
      estado: this.mapEstadoToDomain(dto.estado),
      fechaCreacion: new Date(dto.fechaCreacion),
      fechaModificacion: new Date(dto.fechaModificacion),
      metadata: this.mapMetadataToDomain(dto.metadata)
    };
  }

  /**
   * Convierte un array de DTOs a array de modelos de dominio
   */
  toDomainArray(dtos: RecursoDto[]): Recurso[] {
    return dtos.map(dto => this.toDomain(dto));
  }

  /**
   * Convierte un modelo de dominio a DTO para crear
   */
  toCreateDto(recurso: Recurso): CreateRecursoDto {
    return {
      nombre: recurso.nombre,
      descripcion: recurso.descripcion,
      area: recurso.area,
      estado: this.mapEstadoToDto(recurso.estado),
      createdBy: recurso.metadata.createdBy,
      tags: recurso.metadata.tags,
      categoria: recurso.metadata.categoria
    };
  }

  /**
   * Convierte un modelo de dominio a DTO para actualizar
   */
  toUpdateDto(recurso: Recurso): UpdateRecursoDto {
    return {
      nombre: recurso.nombre,
      descripcion: recurso.descripcion,
      area: recurso.area,
      estado: this.mapEstadoToDto(recurso.estado),
      modifiedBy: recurso.metadata.modifiedBy,
      tags: recurso.metadata.tags,
      categoria: recurso.metadata.categoria
    };
  }

  /**
   * Convierte un DTO de la API a CreateRecursoDto
   * Útil para transformaciones intermedias
   */
  apiDtoToCreateDto(dto: RecursoDto): CreateRecursoDto {
    return {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      area: dto.area,
      estado: dto.estado,
      createdBy: dto.metadata.createdBy,
      tags: dto.metadata.tags,
      categoria: dto.metadata.categoria
    };
  }

  /**
   * Convierte estado de string a enum de dominio
   */
  private mapEstadoToDomain(estado: string): EstadoRecurso {
    switch (estado?.toUpperCase()) {
      case 'ACTIVO':
        return EstadoRecurso.ACTIVO;
      case 'INACTIVO':
        return EstadoRecurso.INACTIVO;
      case 'PENDIENTE':
        return EstadoRecurso.PENDIENTE;
      case 'ARCHIVADO':
        return EstadoRecurso.ARCHIVADO;
      default:
        console.warn(`Estado desconocido: ${estado}. Usando PENDIENTE como default.`);
        return EstadoRecurso.PENDIENTE;
    }
  }

  /**
   * Convierte enum de dominio a string para DTO
   */
  private mapEstadoToDto(estado: EstadoRecurso): string {
    return estado.toString();
  }

  /**
   * Convierte metadata DTO a modelo de dominio
   */
  private mapMetadataToDomain(metadataDto: RecursoMetadataDto): RecursoMetadata {
    return {
      version: metadataDto.version,
      createdBy: metadataDto.createdBy,
      modifiedBy: metadataDto.modifiedBy,
      tags: [...metadataDto.tags], // Crear nueva array para immutabilidad
      categoria: metadataDto.categoria
    };
  }

  /**
   * Convierte metadata de dominio a DTO
   */
  private mapMetadataToDto(metadata: RecursoMetadata): RecursoMetadataDto {
    return {
      version: metadata.version,
      createdBy: metadata.createdBy,
      modifiedBy: metadata.modifiedBy,
      tags: [...metadata.tags], // Crear nueva array para immutabilidad
      categoria: metadata.categoria
    };
  }

  /**
   * Merge parcial de datos de un DTO con un modelo existente
   * Útil para actualizaciones parciales
   */
  mergeDtoToModel(existingRecurso: Recurso, updateDto: Partial<RecursoDto>): Recurso {
    return {
      ...existingRecurso,
      ...(updateDto.nombre && { nombre: updateDto.nombre }),
      ...(updateDto.descripcion && { descripcion: updateDto.descripcion }),
      ...(updateDto.area && { area: updateDto.area }),
      ...(updateDto.estado && { estado: this.mapEstadoToDomain(updateDto.estado) }),
      ...(updateDto.fechaModificacion && { fechaModificacion: new Date(updateDto.fechaModificacion) }),
      ...(updateDto.metadata && { 
        metadata: {
          ...existingRecurso.metadata,
          ...this.mapMetadataToDomain(updateDto.metadata)
        }
      })
    };
  }

  /**
   * Valida que un DTO tenga todos los campos requeridos
   */
  validateDto(dto: RecursoDto): boolean {
    return !!(
      dto.id &&
      dto.nombre &&
      dto.descripcion &&
      dto.area &&
      dto.estado &&
      dto.fechaCreacion &&
      dto.fechaModificacion &&
      dto.metadata &&
      dto.metadata.createdBy &&
      dto.metadata.modifiedBy
    );
  }

  /**
   * Valida que un CreateRecursoDto tenga todos los campos requeridos
   */
  validateCreateDto(dto: CreateRecursoDto): boolean {
    return !!(
      dto.nombre &&
      dto.descripcion &&
      dto.area &&
      dto.createdBy
    );
  }

  /**
   * Sanitiza un DTO eliminando campos nulos o undefined
   */
  sanitizeDto<T extends Record<string, any>>(dto: T): Partial<T> {
    const sanitized: Partial<T> = {};
    
    Object.keys(dto).forEach(key => {
      const value = dto[key];
      if (value !== null && value !== undefined) {
        sanitized[key as keyof T] = value;
      }
    });

    return sanitized;
  }

  /**
   * Clona un modelo de dominio de manera profunda
   */
  cloneRecurso(recurso: Recurso): Recurso {
    return {
      ...recurso,
      fechaCreacion: new Date(recurso.fechaCreacion.getTime()),
      fechaModificacion: new Date(recurso.fechaModificacion.getTime()),
      metadata: {
        ...recurso.metadata,
        tags: [...recurso.metadata.tags]
      }
    };
  }
}