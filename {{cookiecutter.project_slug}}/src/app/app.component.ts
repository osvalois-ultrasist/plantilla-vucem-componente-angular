import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

import { HeaderComponent } from './layout/header/header.component';
import { SidenavComponent } from './layout/sidenav/sidenav.component';
import { FooterComponent } from './layout/footer/footer.component';

@Component({
  selector: 'vucem-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    HeaderComponent,
    SidenavComponent,
    FooterComponent
  ],
  template: `
    <div class="app-container">
      <vucem-header 
        (menuToggle)="toggleSidenav()"
        [title]="title">
      </vucem-header>
      
      <mat-sidenav-container class="app-sidenav-container">
        <mat-sidenav
          #drawer
          class="app-sidenav"
          fixedInViewport
          [attr.role]="'navigation'"
          [mode]="'side'"
          [opened]="sidenavOpened">
          <vucem-sidenav></vucem-sidenav>
        </mat-sidenav>
        
        <mat-sidenav-content class="app-main-content">
          <main 
            class="main-content"
            role="main"
            [attr.aria-label]="'Contenido principal'">
            <router-outlet></router-outlet>
          </main>
          
          <vucem-footer></vucem-footer>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = '{{cookiecutter.project_name}}';
  sidenavOpened = true;

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
}