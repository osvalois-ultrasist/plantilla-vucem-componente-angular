import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { RecursoRepository, PaginatedResult } from '../../domain/interfaces/recurso.repository';
import { Recurso } from '../../domain/models/recurso.model';
import { RecursoApiService } from '../api/recurso-api.service';
import { RecursoMapper } from '../mappers/recurso.mapper';

/**
 * Implementación concreta del repositorio de recursos
 * Conecta el dominio con la capa de datos/API
 * Transforma DTOs en modelos de dominio
 */
@Injectable({
  providedIn: 'root'
})
export class RecursoRepositoryImpl extends RecursoRepository {
  private readonly apiService = inject(RecursoApiService);
  private readonly mapper = inject(RecursoMapper);

  /**
   * Obtiene todos los recursos
   */
  findAll(): Observable<Recurso[]> {
    return this.apiService.getRecursos()
      .pipe(
        map(dtos => dtos.map(dto => this.mapper.toDomain(dto)))
      );
  }

  /**
   * Busca un recurso por su ID
   */
  findById(id: string): Observable<Recurso | null> {
    return this.apiService.getRecursoById(id)
      .pipe(
        map(dto => dto ? this.mapper.toDomain(dto) : null)
      );
  }

  /**
   * Busca recursos por área funcional
   */
  findByArea(area: string): Observable<Recurso[]> {
    return this.apiService.getRecursosByArea(area)
      .pipe(
        map(dtos => dtos.map(dto => this.mapper.toDomain(dto)))
      );
  }

  /**
   * Busca un recurso por nombre y área
   */
  findByNombreAndArea(nombre: string, area: string): Observable<Recurso | null> {
    return this.apiService.getRecursoByNombreAndArea(nombre, area)
      .pipe(
        map(dto => dto ? this.mapper.toDomain(dto) : null)
      );
  }

  /**
   * Guarda un recurso (crear o actualizar)
   */
  save(recurso: Recurso): Observable<Recurso> {
    if (this.isNewRecurso(recurso)) {
      // Crear nuevo recurso
      const createDto = this.mapper.toCreateDto(recurso);
      return this.apiService.createRecurso(createDto)
        .pipe(
          map(dto => this.mapper.toDomain(dto))
        );
    } else {
      // Actualizar recurso existente
      const updateDto = this.mapper.toUpdateDto(recurso);
      return this.apiService.updateRecurso(recurso.id, updateDto)
        .pipe(
          map(dto => this.mapper.toDomain(dto))
        );
    }
  }

  /**
   * Elimina un recurso por su ID
   */
  delete(id: string): Observable<void> {
    return this.apiService.deleteRecurso(id);
  }

  /**
   * Busca recursos por texto libre
   */
  search(searchTerm: string): Observable<Recurso[]> {
    return this.apiService.searchRecursos(searchTerm)
      .pipe(
        map(dtos => dtos.map(dto => this.mapper.toDomain(dto)))
      );
  }

  /**
   * Busca recursos con paginación
   */
  findPaginated(
    page: number, 
    size: number, 
    sortBy?: string, 
    sortDirection?: 'asc' | 'desc'
  ): Observable<PaginatedResult<Recurso>> {
    return this.apiService.getRecursosPaginated(page, size, sortBy, sortDirection)
      .pipe(
        map(dto => ({
          content: dto.content.map(recursoDto => this.mapper.toDomain(recursoDto)),
          totalElements: dto.totalElements,
          totalPages: dto.totalPages,
          size: dto.size,
          page: dto.page,
          first: dto.first,
          last: dto.last,
          empty: dto.empty
        }))
      );
  }

  /**
   * Cuenta el total de recursos
   */
  count(): Observable<number> {
    return this.apiService.countRecursos();
  }

  /**
   * Verifica si existe un recurso con el ID especificado
   */
  exists(id: string): Observable<boolean> {
    return this.apiService.existsRecurso(id);
  }

  /**
   * Obtiene recursos creados en un rango de fechas
   */
  findByFechaCreacionRange(fechaInicio: Date, fechaFin: Date): Observable<Recurso[]> {
    return this.apiService.getRecursosByDateRange(fechaInicio, fechaFin)
      .pipe(
        map(dtos => dtos.map(dto => this.mapper.toDomain(dto)))
      );
  }

  /**
   * Obtiene recursos modificados después de una fecha específica
   */
  findModifiedAfter(fecha: Date): Observable<Recurso[]> {
    return this.apiService.getRecursosModifiedAfter(fecha)
      .pipe(
        map(dtos => dtos.map(dto => this.mapper.toDomain(dto)))
      );
  }

  /**
   * Elimina múltiples recursos por sus IDs
   */
  deleteMultiple(ids: string[]): Observable<void> {
    return this.apiService.deleteMultipleRecursos(ids);
  }

  /**
   * Actualiza múltiples recursos en lote
   */
  saveMultiple(recursos: Recurso[]): Observable<Recurso[]> {
    const updateDtos = recursos.map(recurso => this.mapper.toUpdateDto(recurso));
    
    return this.apiService.updateMultipleRecursos(updateDtos)
      .pipe(
        map(dtos => dtos.map(dto => this.mapper.toDomain(dto)))
      );
  }

  /**
   * Verifica si un recurso es nuevo (no tiene ID o ID temporal)
   */
  private isNewRecurso(recurso: Recurso): boolean {
    // Consideramos nuevo si no tiene ID o si el ID es temporal (UUID generado localmente)
    return !recurso.id || this.isTemporaryId(recurso.id);
  }

  /**
   * Verifica si un ID es temporal (generado localmente)
   * Los IDs temporales suelen ser UUIDs v4 generados en el cliente
   */
  private isTemporaryId(id: string): boolean {
    // Patrón UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Pattern.test(id);
  }
}