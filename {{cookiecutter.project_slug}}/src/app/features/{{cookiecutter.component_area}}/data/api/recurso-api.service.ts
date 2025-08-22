import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RecursoDto, CreateRecursoDto, UpdateRecursoDto } from './dto/recurso.dto';
import { PaginatedResponseDto } from './dto/common.dto';
import { ApiError } from '../../shared/errors/api.error';

/**
 * Servicio para comunicación con la API REST de recursos
 * Maneja todas las operaciones HTTP hacia el backend
 */
@Injectable({
  providedIn: 'root'
})
export class RecursoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/recursos`;

  /**
   * Obtiene todos los recursos
   */
  getRecursos(): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(this.baseUrl)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene un recurso por ID
   */
  getRecursoById(id: string): Observable<RecursoDto> {
    return this.http.get<RecursoDto>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene recursos por área funcional
   */
  getRecursosByArea(area: string): Observable<RecursoDto[]> {
    const params = new HttpParams().set('area', area);
    
    return this.http.get<RecursoDto[]>(`${this.baseUrl}/area`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Busca recursos por nombre y área
   */
  getRecursoByNombreAndArea(nombre: string, area: string): Observable<RecursoDto | null> {
    const params = new HttpParams()
      .set('nombre', nombre)
      .set('area', area);

    return this.http.get<RecursoDto>(`${this.baseUrl}/search/nombre-area`, { params })
      .pipe(
        map(response => response || null),
        catchError(error => {
          if (error.status === 404) {
            return [null];
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Crea un nuevo recurso
   */
  createRecurso(recurso: CreateRecursoDto): Observable<RecursoDto> {
    return this.http.post<RecursoDto>(this.baseUrl, recurso)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Actualiza un recurso existente
   */
  updateRecurso(id: string, recurso: UpdateRecursoDto): Observable<RecursoDto> {
    return this.http.put<RecursoDto>(`${this.baseUrl}/${id}`, recurso)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Elimina un recurso
   */
  deleteRecurso(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Busca recursos por texto libre
   */
  searchRecursos(searchTerm: string): Observable<RecursoDto[]> {
    const params = new HttpParams().set('q', searchTerm);
    
    return this.http.get<RecursoDto[]>(`${this.baseUrl}/search`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene recursos paginados
   */
  getRecursosPaginated(
    page: number,
    size: number,
    sortBy?: string,
    sortDirection?: 'asc' | 'desc'
  ): Observable<PaginatedResponseDto<RecursoDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sortBy) {
      params = params.set('sort', sortBy);
    }

    if (sortDirection) {
      params = params.set('direction', sortDirection);
    }

    return this.http.get<PaginatedResponseDto<RecursoDto>>(`${this.baseUrl}/paginated`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Cuenta el total de recursos
   */
  countRecursos(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/count`)
      .pipe(
        map(response => response.count),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Verifica si existe un recurso
   */
  existsRecurso(id: string): Observable<boolean> {
    return this.http.head(`${this.baseUrl}/${id}`)
      .pipe(
        map(() => true),
        catchError(error => {
          if (error.status === 404) {
            return [false];
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtiene recursos por rango de fechas
   */
  getRecursosByDateRange(fechaInicio: Date, fechaFin: Date): Observable<RecursoDto[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());

    return this.http.get<RecursoDto[]>(`${this.baseUrl}/date-range`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene recursos modificados después de una fecha
   */
  getRecursosModifiedAfter(fecha: Date): Observable<RecursoDto[]> {
    const params = new HttpParams().set('after', fecha.toISOString());

    return this.http.get<RecursoDto[]>(`${this.baseUrl}/modified-after`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Elimina múltiples recursos
   */
  deleteMultipleRecursos(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/multiple`, {
      body: { ids }
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Actualiza múltiples recursos
   */
  updateMultipleRecursos(recursos: UpdateRecursoDto[]): Observable<RecursoDto[]> {
    return this.http.put<RecursoDto[]>(`${this.baseUrl}/multiple`, recursos)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Maneja errores HTTP de manera consistente
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
      errorCode = 'CLIENT_ERROR';
    } else {
      // Error del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Datos inválidos';
          errorCode = 'BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'No autorizado';
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'Acceso prohibido';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          errorCode = 'NOT_FOUND';
          break;
        case 409:
          errorMessage = 'Conflicto - recurso ya existe';
          errorCode = 'CONFLICT';
          break;
        case 422:
          errorMessage = 'Datos no procesables';
          errorCode = 'UNPROCESSABLE_ENTITY';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          errorCode = 'INTERNAL_SERVER_ERROR';
          break;
        case 503:
          errorMessage = 'Servicio no disponible';
          errorCode = 'SERVICE_UNAVAILABLE';
          break;
        default:
          errorMessage = `Error HTTP ${error.status}: ${error.message}`;
          errorCode = `HTTP_${error.status}`;
      }

      // Si el servidor devuelve un mensaje específico, usarlo
      if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    const apiError = new ApiError(errorMessage, error.status, errorCode);
    console.error('API Error:', apiError);
    
    return throwError(() => apiError);
  }
}