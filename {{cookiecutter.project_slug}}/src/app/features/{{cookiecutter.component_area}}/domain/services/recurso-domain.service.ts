import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, catchError, throwError } from 'rxjs';

import { 
  Recurso, 
  CreateRecursoData, 
  UpdateRecursoData, 
  RecursoFactory, 
  RecursoValidation,
  ValidationResult,
  EstadoRecurso 
} from '../models/recurso.model';
import { RecursoRepository } from '../interfaces/recurso.repository';
import { DomainError } from '../../shared/errors/domain.error';

/**
 * Servicio de dominio para la lógica de negocio de Recurso
 * Implementa las reglas de negocio y casos de uso del dominio
 */
@Injectable({
  providedIn: 'root'
})
export class RecursoDomainService {
  private readonly repository = inject(RecursoRepository);

  /**
   * Obtiene todos los recursos activos
   */
  getRecursosActivos(): Observable<Recurso[]> {
    return this.repository.findAll().pipe(
      map(recursos => recursos.filter(r => r.estado === EstadoRecurso.ACTIVO)),
      catchError(error => throwError(() => new DomainError('Error al obtener recursos activos', error)))
    );
  }

  /**
   * Obtiene un recurso por ID
   */
  getRecursoById(id: string): Observable<Recurso | null> {
    if (!id?.trim()) {
      return throwError(() => new DomainError('ID de recurso es requerido'));
    }

    return this.repository.findById(id).pipe(
      catchError(error => throwError(() => new DomainError(`Error al obtener recurso ${id}`, error)))
    );
  }

  /**
   * Busca recursos por área funcional
   */
  getRecursosByArea(area: string): Observable<Recurso[]> {
    if (!area?.trim()) {
      return throwError(() => new DomainError('Área es requerida'));
    }

    return this.repository.findByArea(area).pipe(
      catchError(error => throwError(() => new DomainError(`Error al buscar recursos del área ${area}`, error)))
    );
  }

  /**
   * Crea un nuevo recurso aplicando validaciones de dominio
   */
  createRecurso(data: CreateRecursoData): Observable<Recurso> {
    // Validar datos de entrada
    const validation = RecursoValidation.validateRecurso(data);
    if (!validation.isValid) {
      return throwError(() => new DomainError('Datos de recurso inválidos', validation.errors));
    }

    // Verificar que no existe un recurso con el mismo nombre en la misma área
    return this.repository.findByNombreAndArea(data.nombre, data.area).pipe(
      switchMap(existing => {
        if (existing) {
          return throwError(() => new DomainError(`Ya existe un recurso con el nombre "${data.nombre}" en el área "${data.area}"`));
        }

        const nuevoRecurso = RecursoFactory.create(data);
        return this.repository.save(nuevoRecurso);
      }),
      catchError(error => {
        if (error instanceof DomainError) {
          return throwError(() => error);
        }
        return throwError(() => new DomainError('Error al crear recurso', error));
      })
    );
  }

  /**
   * Actualiza un recurso existente
   */
  updateRecurso(id: string, updates: UpdateRecursoData): Observable<Recurso> {
    if (!id?.trim()) {
      return throwError(() => new DomainError('ID de recurso es requerido'));
    }

    // Validar actualizaciones
    const validation = RecursoValidation.validateRecurso(updates);
    if (!validation.isValid) {
      return throwError(() => new DomainError('Datos de actualización inválidos', validation.errors));
    }

    return this.repository.findById(id).pipe(
      switchMap(recurso => {
        if (!recurso) {
          return throwError(() => new DomainError(`Recurso con ID ${id} no encontrado`));
        }

        // Verificar si el nuevo nombre ya existe (si se está actualizando)
        if (updates.nombre && updates.nombre !== recurso.nombre) {
          return this.repository.findByNombreAndArea(updates.nombre, updates.area || recurso.area).pipe(
            switchMap(existing => {
              if (existing && existing.id !== id) {
                return throwError(() => new DomainError(`Ya existe un recurso con el nombre "${updates.nombre}"`));
              }

              const recursoActualizado = RecursoFactory.update(recurso, updates);
              return this.repository.save(recursoActualizado);
            })
          );
        }

        const recursoActualizado = RecursoFactory.update(recurso, updates);
        return this.repository.save(recursoActualizado);
      }),
      catchError(error => {
        if (error instanceof DomainError) {
          return throwError(() => error);
        }
        return throwError(() => new DomainError('Error al actualizar recurso', error));
      })
    );
  }

  /**
   * Cambia el estado de un recurso
   */
  cambiarEstadoRecurso(id: string, nuevoEstado: EstadoRecurso, modifiedBy: string): Observable<Recurso> {
    return this.updateRecurso(id, { 
      estado: nuevoEstado, 
      modifiedBy 
    });
  }

  /**
   * Archiva un recurso (soft delete)
   */
  archivarRecurso(id: string, modifiedBy: string): Observable<Recurso> {
    return this.cambiarEstadoRecurso(id, EstadoRecurso.ARCHIVADO, modifiedBy);
  }

  /**
   * Elimina permanentemente un recurso
   */
  eliminarRecurso(id: string): Observable<void> {
    if (!id?.trim()) {
      return throwError(() => new DomainError('ID de recurso es requerido'));
    }

    return this.repository.delete(id).pipe(
      catchError(error => throwError(() => new DomainError('Error al eliminar recurso', error)))
    );
  }

  /**
   * Valida los datos de un recurso
   */
  validateRecurso(recurso: Partial<Recurso>): ValidationResult {
    return RecursoValidation.validateRecurso(recurso);
  }

  /**
   * Busca recursos por texto libre
   */
  searchRecursos(searchTerm: string): Observable<Recurso[]> {
    if (!searchTerm?.trim()) {
      return this.getRecursosActivos();
    }

    return this.repository.search(searchTerm.trim()).pipe(
      catchError(error => throwError(() => new DomainError('Error en la búsqueda de recursos', error)))
    );
  }

  /**
   * Obtiene estadísticas de recursos
   */
  getEstadisticasRecursos(): Observable<RecursoEstadisticas> {
    return this.repository.findAll().pipe(
      map(recursos => {
        const total = recursos.length;
        const porEstado = recursos.reduce((acc, recurso) => {
          acc[recurso.estado] = (acc[recurso.estado] || 0) + 1;
          return acc;
        }, {} as Record<EstadoRecurso, number>);

        const porArea = recursos.reduce((acc, recurso) => {
          acc[recurso.area] = (acc[recurso.area] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          total,
          porEstado,
          porArea
        };
      }),
      catchError(error => throwError(() => new DomainError('Error al obtener estadísticas', error)))
    );
  }
}

export interface RecursoEstadisticas {
  total: number;
  porEstado: Record<EstadoRecurso, number>;
  porArea: Record<string, number>;
}