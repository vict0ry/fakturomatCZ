# Invoice Management System - Replit Documentation

## Overview

This is a modern, full-stack invoice management system built for Czech businesses. It's designed as a comprehensive solution for creating, managing, and tracking invoices with AI-powered assistance, ARES integration for company lookup, and PDF generation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.
Technical preference: Always use AI for intelligent text/product matching instead of manual word searching or pattern matching.

## Recent Changes

### Complete AI Feature Parity Implementation (2025-07-20)
- ✅ **Pokročilé AI analýzy** - `analyze_business_insights` funkce pro inteligentní business insights
- ✅ **Predikce platebních rizik** - `predict_payment_risk` pro hodnocení rizika zákazníků  
- ✅ **Optimalizace email kampaní** - `optimize_email_campaign` pro vylepšení marketingu
- ✅ **Inteligentní reporty** - `generate_smart_report` s předpovědi a analýzami
- ✅ **Smart kategorizace nákladů** - `smart_expense_categorization` s AI detekcí duplicit
- ✅ **Kompletní Function Calling** - Všech 15 AI funkcí implementováno
- ✅ **Úplná feature parita** - AI nyní umí vše co UI + pokročilé funkce navíc
- ✅ **Zvýšené payload limity** - Express.json limit na 50MB pro Vision API
- ✅ **Opravené storage metódy** - Všetky expense CRUD operácie funkčné

### File Upload AI Chat + Expense Management (2025-07-20)  
- ✅ Implementováno nahrávání souborů do AI chatu (drag & drop + klik)
- ✅ Podpora JPG, PNG, PDF souborů až 10MB
- ✅ Vizuální feedback při nahrávání a preview příloh
- ✅ Zobrazení příloh v chat historii s ikonami
- ✅ Backend připraven na OpenAI Vision API pro čtení účtenek
- ✅ Vytvořena kompletní stránka /expenses/new pro vytváření nákladů  
- ✅ Přidán routing pro /expenses/new do React aplikace
- ✅ Formulář s automatickým výpočtem DPH a celkové částky
- ✅ Kategorizace nákladů (Office, Travel, IT, Utilities, atd.)
- ✅ Integrace s databází a API endpointy pro náklady

### Smart Invoice Sharing + Email Setup (2025-07-20)
- ✅ Rozšířené databázové schema o sharing sloupce (shareToken, expiresAt, viewCount)
- ✅ Implementováno bezpečné generování tokenů s expirací
- ✅ Backend API pro vytváření/deaktivaci sdílených odkazů
- ✅ Public endpoint pro zobrazení faktur bez autentifikace
- ✅ Frontend komponenta pro správu sdílení s dialogem
- ✅ Kompletní veřejná stránka pro zobrazení faktury
- ✅ PDF download pro sdílené faktury
- ✅ Tracking počtu zobrazení a expirace odkazů
- ✅ Bezpečnostní kontroly a validace tokenů
- ✅ Amazon SES setup pro profesionální email delivery
- ✅ Anti-spam email templates s správnými subject lines
- ✅ Opraveny poznámky v AI systému - správný refresh mechanismus

### Previous OpenAI Function Calling Migration (2025-07-20)
- ✅ Backup současného action-based systému do ai-backup/
- ✅ Implementace OpenAI Function Calling architektury
- ✅ Definice 6 specializovaných funkcí pro různé operace
- ✅ Přesné rozlišení mezi poznámkami a aktualizací cen
- ✅ Zachována kompatibilita s existujícím API
- ✅ Vylepšená přesnost AI díky strukturovanému volání funkcí
- ✅ Všechny testy úspěšně projdou (8/8 API testů)
- ✅ Opraveny LSP diagnostiky - kód bez chyb
- ✅ Function Calling poskytuje přesnější a strukturovanější AI odpovědi

### Previous AI-First Architecture Implementation (2025-07-19)
- ✅ Přechod na AI-first přístup - odstraněny pevné includes() podmínky
- ✅ AI nyní řeší téměř všechny požadavky flexibilně a inteligentně
- ✅ Rozumí různým formulacím téhož příkazu bez omezení
- ✅ Kontextově chytré interpretace záměrů uživatele
- ✅ Všech 14/14 AI testů stále prochází úspěšně
- ✅ Významně vyšší flexibilita bez ztráty funkcionality

### Major Architecture Refactoring (2025-07-19)
- ✓ Rozdělil obrovský openai.ts soubor (889 řádků → 3 řádky hlavní + 5 modulů)
- ✓ Vyčistil duplicitní PDF služby (odstraněno 5 souborů)
- ✓ Vytvořil modulární AI architektura:
  - server/services/ai/index.ts - hlavní koordinátor
  - server/services/ai/types.ts - TypeScript typy
  - server/services/ai/prompts.ts - AI prompty
  - server/services/ai/invoice-processor.ts - zpracování faktur
  - server/services/ai/navigation-handler.ts - navigace
- ✓ Přidal centralizované logování (server/utils/logger.ts)
- ✓ Vytvořil konfigurační konstanty (server/config/constants.ts)
- ✓ Vytvořil ARCHITECTURE.md dokumentaci
- ✅ Všech 14/14 AI testů nyní prochází - plně funkční modulární AI

### PDF Generation & Calculation Fixes (2025-07-19)
- ✓ Fixed critical invoice calculation bug - totals now calculate correctly instead of showing 0
- ✓ Replaced broken jsPDF implementation with working Puppeteer + fallback solution
- ✓ Resolved Czech character encoding issues in PDF generation
- ✓ Created modern PDF design with orange branding and professional layout
- ✓ Implemented robust fallback system: Puppeteer → html-pdf-node → jsPDF
- ✓ Fixed form layout issues by removing problematic grid sidebar layout
- ✓ Added proper error handling and logging for PDF generation pipeline

### Dashboard Enhancements (2025-07-19)
- ✓ Added dark/light theme toggle functionality with ThemeProvider
- ✓ Implemented customizable dashboard widgets with drag-and-drop using React Beautiful DND
- ✓ Created comprehensive draggable dashboard with 6 widget types:
  - Statistics cards (revenue, invoices, unpaid, customers)
  - Interactive revenue and expense charts
  - Recent invoices table
  - Quick actions panel
  - AI assistant widget
  - Calendar widget (placeholder)
- ✓ Enhanced theme switching with system preference detection
- ✓ Added widget enable/disable functionality with localStorage persistence
- ✓ Implemented edit mode for dashboard customization
- ✓ Added proper dark mode CSS variables and styling

### Universal AI Assistant Enhancement (2025-07-19)
- ✓ Expanded AI chat to support ALL application functionalities
- ✓ Added comprehensive command recognition for:
  - Invoice creation, editing, status updates, PDF generation
  - Customer management with ARES integration
  - Advanced analytics and financial reporting
  - Payment tracking and reminder systems
  - Data export (CSV/Excel) functionality
  - Navigation and system configuration
- ✓ Implemented natural language processing for complex queries
- ✓ Added support for multi-action commands and contextual responses
- ✓ Enhanced AI with real-time data analysis and customer insights
- ✓ Created intelligent help system with comprehensive command examples

### AI-Powered Invoice Creation (2025-07-19)
- ✓ Replaced rigid regex patterns with intelligent AI understanding
- ✓ AI now automatically extracts precise data from Czech language commands:
  - Customer/company names (with ARES integration)
  - Product/service descriptions
  - Quantities and units (kg, ks, hodiny)
  - Total amounts (supporting shorthand like "25k" = 25000)
- ✓ System creates complete invoices directly in database
- ✓ Enhanced natural language processing for better command recognition
- ✓ Automatic customer lookup and creation via ARES API
- ✓ Smart VAT calculation and invoice item generation

### ChatGPT-Style Bottom AI Interface (2025-07-19)
- ✓ Implemented persistent bottom chat bar similar to OpenAI's interface
- ✓ Replaced floating widget with expandable bottom panel design
- ✓ Added persistent chat history saved in localStorage
- ✓ Chat no longer resets when navigating between pages
- ✓ Smooth expand/collapse animations with proper mobile responsive design
- ✓ Enhanced dark mode support throughout chat interface
- ✓ Improved UX with message timestamps and loading indicators
- ✓ AI-first approach - chat input always visible and accessible

### Smart Invoice Draft Creation (2025-07-19)
- ✓ Replaced complete invoice creation with intelligent draft approach
- ✓ AI now creates pre-filled invoices that can be completed manually or via AI
- ✓ Perfect handling of multi-item invoices (e.g., "5kg květy, 10kg hašiš, 30kg biomassa")
- ✓ Flexible amount handling - works with or without specified total price
- ✓ Automatic navigation to edit form for further customization
- ✓ Users can choose between: manual form completion or continued AI assistance
- ✓ Maintains full customer integration with ARES database lookup

### Comprehensive Test Suite (2025-07-19)
- ✓ Created automated testing framework for all core functions
- ✓ API tests covering authentication, CRUD operations, and AI communication
- ✓ AI tests validating natural language processing and invoice creation
- ✓ PDF tests ensuring document generation and Czech character support
- ✓ Integration tests verifying complete user workflows
- ✓ Quick test for rapid verification of critical functions
- ✓ Test commands: `node tests/quick-test.js` and `node tests/run-all.js`
- ✓ Comprehensive documentation in `tests/README.md` and `TEST_COMMANDS.md`

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state, React Hook Form for forms
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with development optimizations

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-backed sessions
- **File Processing**: Puppeteer for PDF generation

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database
- **Schema Management**: Drizzle Kit for migrations
- **Connection Pooling**: Neon serverless connection pooling
- **Data Validation**: Zod schemas with Drizzle integration

## Key Components

### Database Schema
- **Customers**: Company information with Czech-specific fields (IČO, DIČ)
- **Invoices**: Full invoice lifecycle management with status tracking
- **Invoice Items**: Line items with VAT calculations
- **Chat Messages**: AI conversation history

### API Integration Services
- **ARES API**: Czech business registry integration for company lookup
- **OpenAI**: AI-powered invoice creation and natural language processing
- **PDF Generation**: Server-side PDF creation using Puppeteer

### Frontend Components
- **Dashboard**: Real-time statistics and recent activity
- **Invoice Management**: CRUD operations with status workflow
- **Customer Management**: Company database with ARES integration
- **AI Chat Widget**: Conversational invoice creation interface

## Data Flow

### Invoice Creation Flow
1. User initiates via UI form or AI chat
2. Customer lookup through local database or ARES API
3. Form validation using Zod schemas
4. Database persistence via Drizzle ORM
5. Real-time UI updates through TanStack Query

### AI-Powered Features
1. Natural language command processing
2. Automatic customer and service extraction
3. Invoice description generation
4. Real-time chat interface with WebSocket support

### PDF Generation Pipeline
1. Invoice data retrieval with related entities
2. HTML template generation with Czech formatting
3. Server-side rendering using Puppeteer
4. Binary file download to client

## External Dependencies

### Core Runtime Dependencies
- **Database**: @neondatabase/serverless, drizzle-orm
- **UI Framework**: React ecosystem with Radix UI components
- **AI Integration**: OpenAI API client
- **PDF Processing**: Puppeteer for server-side rendering
- **Validation**: Zod for schema validation
- **HTTP Client**: Built-in fetch with TanStack Query

### Czech Business Integration
- **ARES API**: Government business registry (no auth required)
- **VAT Calculations**: Built-in Czech VAT rate handling (21%)
- **Address Formatting**: Czech postal code and address standards

### Development Tools
- **Type Safety**: Full TypeScript coverage across stack
- **Code Quality**: ESLint and TypeScript compiler checks
- **Build Pipeline**: Vite for frontend, esbuild for backend
- **Development**: Hot reloading with Vite middleware

## Deployment Strategy

### Production Build Process
1. Frontend: Vite builds optimized React bundle
2. Backend: esbuild bundles Node.js application
3. Database: Drizzle migrations applied automatically
4. Assets: Static files served from Express

### Environment Configuration
- **Database**: Requires DATABASE_URL environment variable
- **AI Features**: Optional OPENAI_API_KEY for AI functionality
- **Production**: NODE_ENV=production for optimizations

### Scaling Considerations
- **Database**: Neon provides automatic scaling and connection pooling
- **File Storage**: PDFs generated on-demand (could be cached)
- **API Limits**: ARES API and OpenAI rate limiting handled gracefully
- **Session Storage**: PostgreSQL-backed sessions for horizontal scaling

The system is designed to be deployment-ready with minimal configuration, leveraging serverless database architecture and modern web standards for reliability and performance.