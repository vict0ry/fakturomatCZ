# Invoice Management System - Replit Documentation

## Overview

This is a modern, full-stack invoice management system built for Czech businesses. It's designed as a comprehensive solution for creating, managing, and tracking invoices with AI-powered assistance, ARES integration for company lookup, and PDF generation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

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