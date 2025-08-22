#!/bin/bash

#############################################################################
# crear-angular-remoto.sh - Generador Remoto Angular VUCEM
# 
# Descripción: Descarga la plantilla Angular desde GitHub y genera
#              aplicación con arquitectura limpia moderna
#
# Uso: ./crear-angular-remoto.sh <nombre> <area> [descripción]
# 
# Autor: VUCEM Team
# Versión: 1.0.0
# Fecha: 2025-08-22
#############################################################################

set -euo pipefail
IFS=$'\n\t'

# ===========================================================================
# CONFIGURACIÓN
# ===========================================================================

readonly SCRIPT_VERSION="1.0.0"
readonly GITHUB_USER="osvalois-ultrasist"
readonly GITHUB_REPO="plantilla-vucem-componente-angular"
readonly BASE_URL="https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main"
readonly ARCHIVE_URL="https://github.com/${GITHUB_USER}/${GITHUB_REPO}/archive/main.zip"

# Colores
if [[ -t 1 ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[1;33m'
    readonly BLUE='\033[0;34m'
    readonly CYAN='\033[0;36m'
    readonly PURPLE='\033[0;35m'
    readonly BOLD='\033[1m'
    readonly NC='\033[0m'
else
    readonly RED='' GREEN='' YELLOW='' BLUE='' CYAN='' PURPLE='' BOLD='' NC=''
fi

# ===========================================================================
# FUNCIONES
# ===========================================================================

log() {
    local level="$1"
    shift
    case "$level" in
        SUCCESS) echo -e "${GREEN}[✓]${NC} $*" ;;
        ERROR)   echo -e "${RED}[✗]${NC} $*" >&2 ;;
        WARNING) echo -e "${YELLOW}[⚠]${NC} $*" ;;
        INFO)    echo -e "${BLUE}[INFO]${NC} $*" ;;
        STEP)    echo -e "${CYAN}➜${NC} $*" ;;
        *)       echo "$*" ;;
    esac
}

show_header() {
    echo -e "${BOLD}${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║       GENERADOR ANGULAR VUCEM v${SCRIPT_VERSION} (desde GitHub)    ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_help() {
    show_header
    cat << EOF
${BOLD}USO:${NC}
    ${0} <nombre> <area> [descripción]

${BOLD}PARÁMETROS:${NC}
    nombre       - Nombre del componente Angular (3-50 chars, kebab-case)
    area         - Área funcional (3-50 chars, kebab-case)
    descripción  - Descripción del componente (opcional)

${BOLD}EJEMPLOS:${NC}
    ${0} mi-app usuarios
    ${0} sistema-aduanas aduanas "Sistema de gestión aduanera"

${BOLD}STACK ANGULAR 2025:${NC}
    • Angular 20.0.0 + Signal-based Reactivity
    • TypeScript 5.7 + Strict Mode
    • Angular Material 17 + Design System
    • NgRx 17 + Signals Integration
    • Vitest + Cypress Testing
    • PWA + SSR Ready
    • WCAG 2.2 AA Compliance

EOF
}

# Verificar herramientas necesarias
check_dependencies() {
    local missing=()
    
    if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
        missing+=("curl o wget")
    fi
    
    if ! command -v unzip &> /dev/null; then
        missing+=("unzip")
    fi
    
    if ! command -v node &> /dev/null; then
        missing+=("node.js")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing+=("npm")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log ERROR "Herramientas faltantes: ${missing[*]}"
        log ERROR "Instale las herramientas requeridas antes de continuar"
        return 1
    fi
    
    # Verificar versiones
    local node_version=$(node --version | sed 's/v//' | cut -d'.' -f1)
    if [[ $node_version -lt 18 ]]; then
        log ERROR "Node.js 18+ requerido. Versión actual: $(node --version)"
        return 1
    fi
    
    return 0
}

# Validar entrada
validate_component_name() {
    local name="$1"
    
    # Longitud
    if [[ ${#name} -lt 3 ]] || [[ ${#name} -gt 50 ]]; then
        log ERROR "Nombre debe tener entre 3-50 caracteres"
        return 1
    fi
    
    # Formato kebab-case
    if [[ ! "$name" =~ ^[a-z][a-z0-9-]*$ ]]; then
        log ERROR "Nombre debe estar en kebab-case (letras minúsculas, números y guiones)"
        return 1
    fi
    
    # No guiones dobles
    if [[ "$name" == *"--"* ]]; then
        log ERROR "No se permiten guiones dobles (--)"
        return 1
    fi
    
    # No debe empezar o terminar con guión
    if [[ "$name" == -* ]] || [[ "$name" == *- ]]; then
        log ERROR "No puede empezar o terminar con guión"
        return 1
    fi
    
    return 0
}

# Función para descargar archivos
download_file() {
    local url="$1"
    local output="$2"
    
    if command -v curl &> /dev/null; then
        curl -sSL "$url" -o "$output"
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$output"
    else
        log ERROR "curl o wget requerido para descargar archivos"
        return 1
    fi
}

# Crear directorio temporal
create_temp_dir() {
    local temp_dir
    if command -v mktemp &> /dev/null; then
        temp_dir=$(mktemp -d)
    else
        temp_dir="/tmp/vucem-angular-$(date +%s)-$$"
        mkdir -p "$temp_dir"
    fi
    echo "$temp_dir"
}

# Limpiar recursos
cleanup() {
    local exit_code=$?
    if [[ -n "${TEMP_DIR:-}" ]] && [[ -d "$TEMP_DIR" ]]; then
        log INFO "Limpiando archivos temporales..."
        rm -rf "$TEMP_DIR"
    fi
    exit $exit_code
}

# Configurar limpieza
trap cleanup EXIT INT TERM

# ===========================================================================
# FUNCIÓN PRINCIPAL DE GENERACIÓN
# ===========================================================================

generate_angular_app() {
    local nombre="$1"
    local area="$2"
    local descripcion="$3"
    local target_dir="vucem-${nombre}"
    
    # Crear directorio temporal
    TEMP_DIR=$(create_temp_dir)
    log INFO "Directorio temporal: $TEMP_DIR"
    
    # Descargar plantilla desde GitHub
    log STEP "Descargando plantilla Angular desde GitHub..."
    local archive_file="$TEMP_DIR/template.zip"
    
    if ! download_file "$ARCHIVE_URL" "$archive_file"; then
        log ERROR "Error al descargar plantilla desde GitHub"
        return 1
    fi
    
    log SUCCESS "Plantilla descargada"
    
    # Extraer archivo
    log STEP "Extrayendo plantilla..."
    cd "$TEMP_DIR"
    
    if ! unzip -q "$archive_file"; then
        log ERROR "Error al extraer plantilla"
        return 1
    fi
    
    local template_dir="$TEMP_DIR/plantilla-vucem-componente-angular-main"
    
    if [[ ! -d "$template_dir" ]]; then
        log ERROR "Directorio de plantilla Angular no encontrado"
        return 1
    fi
    
    log SUCCESS "Plantilla extraída"
    
    # Verificar que no existe el directorio destino
    if [[ -d "$target_dir" ]]; then
        log WARNING "El directorio $target_dir ya existe"
        read -p "¿Desea sobrescribirlo? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            log INFO "Operación cancelada por el usuario"
            return 1
        fi
        rm -rf "$target_dir"
    fi
    
    # Copiar plantilla
    log STEP "Copiando plantilla base..."
    cp -r "$template_dir" "$target_dir"
    log SUCCESS "Plantilla copiada"
    
    cd "$target_dir"
    
    # Procesar plantilla con Cookiecutter-like replacement
    log STEP "Personalizando aplicación Angular..."
    
    # Reemplazos básicos
    find . -type f \( -name "*.ts" -o -name "*.html" -o -name "*.scss" -o -name "*.json" -o -name "*.md" \) \
        -exec sed -i.bak "s/{{cookiecutter\.project_name}}/VUCEM ${nombre^}/g" {} \;
    
    find . -type f \( -name "*.ts" -o -name "*.html" -o -name "*.scss" -o -name "*.json" -o -name "*.md" \) \
        -exec sed -i.bak "s/{{cookiecutter\.project_slug}}/$nombre/g" {} \;
    
    find . -type f \( -name "*.ts" -o -name "*.html" -o -name "*.scss" -o -name "*.json" -o -name "*.md" \) \
        -exec sed -i.bak "s/{{cookiecutter\.component_area}}/$area/g" {} \;
    
    find . -type f \( -name "*.ts" -o -name "*.html" -o -name "*.scss" -o -name "*.json" -o -name "*.md" \) \
        -exec sed -i.bak "s/{{cookiecutter\.component_description}}/$descripcion/g" {} \;
    
    # Reemplazos de configuración
    local current_year=$(date +%Y)
    find . -type f \( -name "*.ts" -o -name "*.html" -o -name "*.scss" -o -name "*.json" -o -name "*.md" \) \
        -exec sed -i.bak "s/{{cookiecutter\.year}}/$current_year/g" {} \;
    
    # Eliminar archivos .bak
    find . -name "*.bak" -delete
    
    log SUCCESS "Aplicación personalizada"
    
    # Renombrar directorio de plantilla cookiecutter
    if [[ -d "{{cookiecutter.project_slug}}" ]]; then
        log STEP "Reorganizando estructura..."
        mv "{{cookiecutter.project_slug}}"/* . 2>/dev/null || true
        rm -rf "{{cookiecutter.project_slug}}" 2>/dev/null || true
        log SUCCESS "Estructura reorganizada"
    fi
    
    # Crear README personalizado
    log STEP "Generando documentación..."
    cat > README.md << EOF
# VUCEM ${nombre^}

${descripcion}

## 🚀 Stack Tecnológico Angular 2025

- **Angular 20.0.0** - Framework principal con Signals
- **TypeScript 5.7** - Lenguaje principal
- **Angular Material 17** - UI/UX Components
- **NgRx 17** - State Management con Signals
- **Vitest** - Unit Testing
- **Cypress** - E2E Testing

## 🏗️ Arquitectura Clean

\`\`\`
src/app/
├── core/                 # Infrastructure Layer
├── shared/              # Cross-cutting Concerns  
├── features/${area}/    # Domain Layer
│   ├── domain/         # Business Logic
│   ├── data/           # Data Access
│   └── presentation/   # UI Components
└── layout/             # Application Shell
\`\`\`

## ⚡ Inicio Rápido

\`\`\`bash
# Instalar dependencias
npm install

# Desarrollo
npm start

# Build producción
npm run build:prod

# Tests
npm test
npm run e2e

# Linting y formato
npm run lint
npm run format

# Análisis de accesibilidad
npm run a11y
\`\`\`

## 📱 URLs de Desarrollo

- **Aplicación**: http://localhost:4200
- **Documentación**: http://localhost:4200/docs
- **Storybook**: http://localhost:6006 (si está habilitado)

## 🎯 Características

✅ **Arquitectura Limpia** - Separación clara de responsabilidades  
✅ **Signal-based Reactivity** - Performance optimizado  
✅ **WCAG 2.2 AA** - Accesibilidad completa  
✅ **PWA Ready** - Aplicación progresiva  
✅ **SSR Support** - Server-Side Rendering  
✅ **Testing Completo** - Unit + Integration + E2E  

## 📊 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| \`npm start\` | Servidor de desarrollo |
| \`npm run build:prod\` | Build para producción |
| \`npm test\` | Tests unitarios |
| \`npm run e2e\` | Tests end-to-end |
| \`npm run lint\` | Análisis de código |
| \`npm run format\` | Formateo de código |
| \`npm run a11y\` | Tests de accesibilidad |
| \`npm run lighthouse\` | Análisis de performance |

---

**Generado con VUCEM Angular Template v${SCRIPT_VERSION}**  
Arquitectura limpia para aplicaciones gubernamentales modernas 🚀
EOF
    
    log SUCCESS "Documentación generada"
    
    # Inicializar Git
    if command -v git &> /dev/null; then
        log STEP "Inicializando repositorio Git..."
        git init
        git add .
        git commit -m "feat: Aplicación Angular VUCEM inicial

- Arquitectura Clean de 4 capas
- Angular 20 + Signal-based reactivity  
- TypeScript 5.7 + strict mode
- Material Design 3 + WCAG 2.2
- NgRx 17 + Signals integration
- Testing completo (Vitest + Cypress)

Generado con VUCEM Angular Template v${SCRIPT_VERSION}"
        
        log SUCCESS "Repositorio Git inicializado"
    fi
    
    return 0
}

# ===========================================================================
# PROGRAMA PRINCIPAL
# ===========================================================================

main() {
    # Verificar argumentos
    if [[ $# -lt 2 ]]; then
        show_help
        exit 1
    fi
    
    local nombre="$1"
    local area="$2"
    local descripcion="${3:-Aplicación Angular VUCEM para $area}"
    
    show_header
    
    # Validación
    log INFO "Validando parámetros..."
    
    if ! validate_component_name "$nombre"; then
        exit 1
    fi
    
    if ! validate_component_name "$area"; then
        log ERROR "Área inválida"
        exit 1
    fi
    
    # Mostrar configuración
    echo "Configuración:"
    echo "  Aplicación: $nombre"
    echo "  Área: $area"
    echo "  Descripción: $descripcion"
    echo "  Fuente: GitHub (${GITHUB_USER}/${GITHUB_REPO})"
    echo
    
    # Verificar dependencias
    if ! check_dependencies; then
        exit 1
    fi
    
    # Generar aplicación
    if generate_angular_app "$nombre" "$area" "$descripcion"; then
        echo
        echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════╗"
        echo -e "║    ✅ APLICACIÓN ANGULAR GENERADA EXITOSAMENTE         ║"
        echo -e "╚══════════════════════════════════════════════════════════╝${NC}"
        echo
        echo "Próximos pasos:"
        echo "  1. cd vucem-${nombre}"
        echo "  2. npm install"
        echo "  3. ng serve"
        echo
        echo "Documentación:"
        echo "  📖 README.md en el directorio de la aplicación"
        echo "  🌐 Repositorio: https://github.com/${GITHUB_USER}/${GITHUB_REPO}"
        
        return 0
    else
        log ERROR "Error al generar la aplicación Angular"
        return 1
    fi
}

# Ejecutar si no se está sourcing
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi