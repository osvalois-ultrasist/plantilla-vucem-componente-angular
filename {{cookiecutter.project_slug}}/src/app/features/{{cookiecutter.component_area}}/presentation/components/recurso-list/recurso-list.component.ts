import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { Recurso, EstadoRecurso } from '../../../domain/models/recurso.model';
import { LoadingState } from '../../../../shared/types/loading-state.type';

/**
 * Componente para mostrar lista de recursos con signals
 * Implementa las mejores prácticas de Angular 20 con signal-based reactivity
 */
@Component({
  selector: 'vucem-recurso-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule
  ],
  template: `
    <mat-card class="recurso-list-card">
      <mat-card-header>
        <mat-card-title>
          Lista de Recursos
          @if (totalRecursos() > 0) {
            <mat-chip-set>
              <mat-chip [class]="'total-chip'">
                Total: {{ totalRecursos() }}
              </mat-chip>
            </mat-chip-set>
          }
        </mat-card-title>
        
        <mat-card-subtitle>
          @if (selectedArea(); as area) {
            Área: {{ area }}
          } @else {
            Todas las áreas
          }
        </mat-card-subtitle>

        <div class="card-actions">
          <button 
            mat-raised-button 
            color="primary"
            (click)="onCreateRecurso()"
            [disabled]="isLoading()"
            aria-label="Crear nuevo recurso">
            <mat-icon>add</mat-icon>
            Nuevo Recurso
          </button>

          <button 
            mat-icon-button
            [matMenuTriggerFor]="actionsMenu"
            [disabled]="isLoading()"
            aria-label="Más acciones">
            <mat-icon>more_vert</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        @if (isLoading()) {
          <div class="loading-container">
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            <p class="loading-text">Cargando recursos...</p>
          </div>
        } @else if (hasError()) {
          <div class="error-container" role="alert">
            <mat-icon color="warn">error</mat-icon>
            <p class="error-message">{{ errorMessage() }}</p>
            <button 
              mat-button 
              color="primary"
              (click)="onRetry()"
              aria-label="Reintentar carga">
              <mat-icon>refresh</mat-icon>
              Reintentar
            </button>
          </div>
        } @else if (isEmpty()) {
          <div class="empty-container">
            <mat-icon class="empty-icon">folder_open</mat-icon>
            <p class="empty-message">No hay recursos disponibles</p>
            <button 
              mat-raised-button 
              color="primary"
              (click)="onCreateRecurso()"
              aria-label="Crear primer recurso">
              <mat-icon>add</mat-icon>
              Crear Primer Recurso
            </button>
          </div>
        } @else {
          <div class="table-container">
            <table 
              mat-table 
              [dataSource]="recursos()"
              class="recursos-table"
              aria-label="Lista de recursos">
              
              <!-- Columna Nombre -->
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let recurso">
                  <div class="nombre-cell">
                    <span class="nombre-text">{{ recurso.nombre }}</span>
                    <mat-chip-set>
                      <mat-chip 
                        [class]="'categoria-chip'"
                        [matTooltip]="'Categoría: ' + recurso.metadata.categoria">
                        {{ recurso.metadata.categoria }}
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </td>
              </ng-container>

              <!-- Columna Descripción -->
              <ng-container matColumnDef="descripcion">
                <th mat-header-cell *matHeaderCellDef>Descripción</th>
                <td mat-cell *matCellDef="let recurso">
                  <span 
                    class="descripcion-text"
                    [matTooltip]="recurso.descripcion"
                    matTooltipPosition="above">
                    {{ truncateText(recurso.descripcion, 50) }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna Área -->
              <ng-container matColumnDef="area">
                <th mat-header-cell *matHeaderCellDef>Área</th>
                <td mat-cell *matCellDef="let recurso">
                  <mat-chip [class]="'area-chip'">
                    {{ recurso.area }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Columna Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let recurso">
                  <mat-chip 
                    [class]="getEstadoChipClass(recurso.estado)"
                    [attr.aria-label]="'Estado: ' + recurso.estado">
                    <mat-icon [class]="getEstadoIconClass(recurso.estado)">
                      {{ getEstadoIcon(recurso.estado) }}
                    </mat-icon>
                    {{ recurso.estado }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Columna Tags -->
              <ng-container matColumnDef="tags">
                <th mat-header-cell *matHeaderCellDef>Tags</th>
                <td mat-cell *matCellDef="let recurso">
                  @if (recurso.metadata.tags.length > 0) {
                    <mat-chip-set>
                      @for (tag of getVisibleTags(recurso.metadata.tags); track tag) {
                        <mat-chip class="tag-chip">{{ tag }}</mat-chip>
                      }
                      @if (hasMoreTags(recurso.metadata.tags)) {
                        <mat-chip 
                          class="more-tags-chip"
                          [matTooltip]="getHiddenTagsTooltip(recurso.metadata.tags)">
                          +{{ getHiddenTagsCount(recurso.metadata.tags) }}
                        </mat-chip>
                      }
                    </mat-chip-set>
                  } @else {
                    <span class="no-tags">Sin tags</span>
                  }
                </td>
              </ng-container>

              <!-- Columna Fecha Modificación -->
              <ng-container matColumnDef="fechaModificacion">
                <th mat-header-cell *matHeaderCellDef>Última Modificación</th>
                <td mat-cell *matCellDef="let recurso">
                  <div class="fecha-cell">
                    <span class="fecha-text">{{ formatFecha(recurso.fechaModificacion) }}</span>
                    <span class="usuario-text">por {{ recurso.metadata.modifiedBy }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Columna Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let recurso">
                  <div class="acciones-cell">
                    <button 
                      mat-icon-button
                      (click)="onViewRecurso(recurso)"
                      matTooltip="Ver detalles"
                      [attr.aria-label]="'Ver detalles de ' + recurso.nombre">
                      <mat-icon>visibility</mat-icon>
                    </button>

                    <button 
                      mat-icon-button
                      (click)="onEditRecurso(recurso)"
                      matTooltip="Editar"
                      [attr.aria-label]="'Editar ' + recurso.nombre">
                      <mat-icon>edit</mat-icon>
                    </button>

                    <button 
                      mat-icon-button
                      [matMenuTriggerFor]="recursoMenu"
                      [matMenuTriggerData]="{ recurso: recurso }"
                      matTooltip="Más opciones"
                      [attr.aria-label]="'Más opciones para ' + recurso.nombre">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
              <tr 
                mat-row 
                *matRowDef="let row; columns: displayedColumns()"
                [class.selected-row]="isSelected(row)"
                (click)="onSelectRecurso(row)">
              </tr>
            </table>
          </div>
        }
      </mat-card-content>
    </mat-card>

    <!-- Menu de acciones de recurso -->
    <mat-menu #recursoMenu="matMenu">
      <ng-template matMenuContent let-recurso="recurso">
        <button mat-menu-item (click)="onDuplicateRecurso(recurso)">
          <mat-icon>content_copy</mat-icon>
          Duplicar
        </button>
        
        @if (recurso.estado !== estadoRecurso.ARCHIVADO) {
          <button mat-menu-item (click)="onArchiveRecurso(recurso)">
            <mat-icon>archive</mat-icon>
            Archivar
          </button>
        }
        
        <mat-divider></mat-divider>
        
        <button 
          mat-menu-item 
          (click)="onDeleteRecurso(recurso)"
          class="delete-action">
          <mat-icon color="warn">delete</mat-icon>
          Eliminar
        </button>
      </ng-template>
    </mat-menu>

    <!-- Menu de acciones generales -->
    <mat-menu #actionsMenu="matMenu">
      <button mat-menu-item (click)="onRefresh()">
        <mat-icon>refresh</mat-icon>
        Actualizar
      </button>
      
      <button mat-menu-item (click)="onExport()">
        <mat-icon>download</mat-icon>
        Exportar
      </button>
      
      <mat-divider></mat-divider>
      
      <button mat-menu-item (click)="onBulkActions()">
        <mat-icon>checklist</mat-icon>
        Acciones en lote
      </button>
    </mat-menu>
  `,
  styleUrls: ['./recurso-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecursoListComponent {
  // Inputs con signals
  readonly recursos = input.required<Recurso[]>();
  readonly loadingState = input<LoadingState>('idle');
  readonly errorMessage = input<string | null>(null);
  readonly selectedArea = input<string | null>(null);
  readonly selectedRecurso = input<Recurso | null>(null);

  // Outputs
  readonly createRecurso = output<void>();
  readonly viewRecurso = output<Recurso>();
  readonly editRecurso = output<Recurso>();
  readonly deleteRecurso = output<Recurso>();
  readonly archiveRecurso = output<Recurso>();
  readonly duplicateRecurso = output<Recurso>();
  readonly selectRecurso = output<Recurso>();
  readonly refresh = output<void>();
  readonly export = output<void>();
  readonly bulkActions = output<void>();
  readonly retry = output<void>();

  // Computed signals
  readonly isLoading = computed(() => this.loadingState() === 'loading');
  readonly hasError = computed(() => this.loadingState() === 'error');
  readonly isEmpty = computed(() => 
    this.loadingState() === 'success' && this.recursos().length === 0
  );
  readonly totalRecursos = computed(() => this.recursos().length);

  readonly displayedColumns = computed(() => [
    'nombre',
    'descripcion', 
    'area',
    'estado',
    'tags',
    'fechaModificacion',
    'acciones'
  ]);

  // Constants
  readonly estadoRecurso = EstadoRecurso;
  private readonly maxVisibleTags = 2;
  private readonly maxTextLength = 50;

  // Effect para logging (ejemplo de uso)
  private readonly loggingEffect = effect(() => {
    console.log(`RecursoListComponent: ${this.recursos().length} recursos cargados`);
  });

  // Event handlers
  onCreateRecurso(): void {
    this.createRecurso.emit();
  }

  onViewRecurso(recurso: Recurso): void {
    this.viewRecurso.emit(recurso);
  }

  onEditRecurso(recurso: Recurso): void {
    this.editRecurso.emit(recurso);
  }

  onDeleteRecurso(recurso: Recurso): void {
    this.deleteRecurso.emit(recurso);
  }

  onArchiveRecurso(recurso: Recurso): void {
    this.archiveRecurso.emit(recurso);
  }

  onDuplicateRecurso(recurso: Recurso): void {
    this.duplicateRecurso.emit(recurso);
  }

  onSelectRecurso(recurso: Recurso): void {
    this.selectRecurso.emit(recurso);
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onExport(): void {
    this.export.emit();
  }

  onBulkActions(): void {
    this.bulkActions.emit();
  }

  onRetry(): void {
    this.retry.emit();
  }

  // Utility methods
  isSelected(recurso: Recurso): boolean {
    return this.selectedRecurso()?.id === recurso.id;
  }

  truncateText(text: string, maxLength: number = this.maxTextLength): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  formatFecha(fecha: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha);
  }

  getEstadoChipClass(estado: EstadoRecurso): string {
    const baseClass = 'estado-chip';
    switch (estado) {
      case EstadoRecurso.ACTIVO:
        return `${baseClass} estado-activo`;
      case EstadoRecurso.INACTIVO:
        return `${baseClass} estado-inactivo`;
      case EstadoRecurso.PENDIENTE:
        return `${baseClass} estado-pendiente`;
      case EstadoRecurso.ARCHIVADO:
        return `${baseClass} estado-archivado`;
      default:
        return baseClass;
    }
  }

  getEstadoIcon(estado: EstadoRecurso): string {
    switch (estado) {
      case EstadoRecurso.ACTIVO:
        return 'check_circle';
      case EstadoRecurso.INACTIVO:
        return 'cancel';
      case EstadoRecurso.PENDIENTE:
        return 'schedule';
      case EstadoRecurso.ARCHIVADO:
        return 'archive';
      default:
        return 'help';
    }
  }

  getEstadoIconClass(estado: EstadoRecurso): string {
    return `estado-icon estado-icon-${estado.toLowerCase()}`;
  }

  getVisibleTags(tags: readonly string[]): readonly string[] {
    return tags.slice(0, this.maxVisibleTags);
  }

  hasMoreTags(tags: readonly string[]): boolean {
    return tags.length > this.maxVisibleTags;
  }

  getHiddenTagsCount(tags: readonly string[]): number {
    return Math.max(0, tags.length - this.maxVisibleTags);
  }

  getHiddenTagsTooltip(tags: readonly string[]): string {
    const hiddenTags = tags.slice(this.maxVisibleTags);
    return `Tags adicionales: ${hiddenTags.join(', ')}`;
  }
}