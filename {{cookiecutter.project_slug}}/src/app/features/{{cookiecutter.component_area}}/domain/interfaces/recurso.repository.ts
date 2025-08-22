import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Recurso } from '../models/recurso.model';

/**
 * Interfaz del repositorio para la entidad Recurso
 * Define el contrato para el acceso a datos sin depender de la implementación
 * Sigue el patrón Repository del Domain Driven Design
 */
@Injectable({
  providedIn: 'root'
})
export abstract class RecursoRepository {
  
  /**
   * Obtiene todos los recursos
   */
  abstract findAll(): Observable<Recurso[]>;

  /**
   * Busca un recurso por su ID
   * @param id - Identificador único del recurso
   * @returns Observable que emite el recurso encontrado o null si no existe
   */
  abstract findById(id: string): Observable<Recurso | null>;

  /**
   * Busca recursos por área funcional
   * @param area - Área funcional del recurso
   * @returns Observable que emite un array de recursos del área especificada
   */
  abstract findByArea(area: string): Observable<Recurso[]>;

  /**
   * Busca un recurso por nombre y área
   * @param nombre - Nombre del recurso
   * @param area - Área funcional del recurso
   * @returns Observable que emite el recurso encontrado o null si no existe
   */
  abstract findByNombreAndArea(nombre: string, area: string): Observable<Recurso | null>;

  /**
   * Guarda un recurso (crear o actualizar)
   * @param recurso - Recurso a guardar
   * @returns Observable que emite el recurso guardado
   */
  abstract save(recurso: Recurso): Observable<Recurso>;

  /**
   * Elimina un recurso por su ID
   * @param id - Identificador único del recurso
   * @returns Observable que se completa cuando la eliminación es exitosa
   */
  abstract delete(id: string): Observable<void>;

  /**
   * Busca recursos por texto libre
   * @param searchTerm - Término de búsqueda
   * @returns Observable que emite un array de recursos que coinciden con la búsqueda
   */
  abstract search(searchTerm: string): Observable<Recurso[]>;

  /**
   * Busca recursos con paginación
   * @param page - Número de página (comenzando en 0)
   * @param size - Tamaño de página
   * @param sortBy - Campo por el cual ordenar
   * @param sortDirection - Dirección del ordenamiento (asc o desc)
   * @returns Observable que emite una página de recursos
   */
  abstract findPaginated(
    page: number, 
    size: number, 
    sortBy?: string, 
    sortDirection?: 'asc' | 'desc'
  ): Observable<PaginatedResult<Recurso>>;

  /**
   * Cuenta el total de recursos
   * @returns Observable que emite el número total de recursos
   */
  abstract count(): Observable<number>;

  /**
   * Verifica si existe un recurso con el ID especificado
   * @param id - Identificador único del recurso
   * @returns Observable que emite true si existe, false en caso contrario
   */
  abstract exists(id: string): Observable<boolean>;

  /**
   * Obtiene recursos creados en un rango de fechas
   * @param fechaInicio - Fecha de inicio del rango
   * @param fechaFin - Fecha de fin del rango
   * @returns Observable que emite un array de recursos creados en el rango
   */
  abstract findByFechaCreacionRange(
    fechaInicio: Date, 
    fechaFin: Date
  ): Observable<Recurso[]>;

  /**
   * Obtiene recursos modificados después de una fecha específica
   * @param fecha - Fecha de referencia
   * @returns Observable que emite un array de recursos modificados después de la fecha
   */
  abstract findModifiedAfter(fecha: Date): Observable<Recurso[]>;

  /**
   * Elimina múltiples recursos por sus IDs
   * @param ids - Array de identificadores únicos
   * @returns Observable que se completa cuando todas las eliminaciones son exitosas
   */
  abstract deleteMultiple(ids: string[]): Observable<void>;

  /**
   * Actualiza múltiples recursos en lote
   * @param recursos - Array de recursos a actualizar
   * @returns Observable que emite un array de recursos actualizados
   */
  abstract saveMultiple(recursos: Recurso[]): Observable<Recurso[]>;
}

/**
 * Resultado paginado genérico
 */
export interface PaginatedResult<T> {
  readonly content: T[];
  readonly totalElements: number;
  readonly totalPages: number;
  readonly size: number;
  readonly page: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly empty: boolean;
}

/**
 * Opciones de consulta para repositorio
 */
export interface QueryOptions {
  readonly page?: number;
  readonly size?: number;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
  readonly filters?: Record<string, any>;
}