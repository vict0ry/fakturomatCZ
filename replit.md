# Doklad.ai - AI-Powered Czech Invoice Management System

## Overview

Doklad.ai is a comprehensive, AI-powered invoice management system designed for Czech businesses. It streamlines the creation, management, and tracking of invoices, integrating with the ARES national business registry for company lookups and generating professional PDF invoices. The project aims to provide a modern, efficient solution that significantly reduces administrative overhead and enhances financial management for small and medium-sized businesses in the Czech Republic, leveraging AI for intelligent automation and insights.

## User Preferences

Preferred communication style: Simple, everyday language.
Technical preference: Always use AI for intelligent text/product matching instead of manual word searching or pattern matching.
**KRITICKÁ BEZPEČNOSTNÍ PREFERENCE**: Před smazáním jakékoliv funkcionality (databázové sloupce, API endpointy, kód) VŽDY nejprve upozornit uživatele a počkat na jeho souhlas. Nikdy nemazat nic co by mohlo narušit funkcionalitet systému bez explicitního povolení.
**AUDIT TRAIL PREFERENCE**: Pro logování změn používat database triggers místo application-level logging pro garantované zachycení všech změn.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/UI (built on Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query for server state, React Hook Form for forms
- **Routing**: Wouter
- **Build Tool**: Vite
- **UI/UX Decisions**: Modern PDF design with orange branding, dark/light theme toggle, customizable dashboard widgets with drag-and-drop, persistent ChatGPT-style bottom AI chat interface, separation of personal profile and company settings.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM
- **Session Management**: PostgreSQL-backed sessions
- **File Processing**: Puppeteer for PDF generation
- **Architectural Patterns**: Modular structure with services (e.g., UserService, InvoiceService, AdminService), AI-first approach where AI flexibily handles requests, and a centralized system for logging and configuration. OpenAI Function Calling is utilized for structured AI responses.

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database (serverless)
- **Schema Management**: Drizzle Kit for migrations
- **Data Validation**: Zod schemas

### Key Components
- **Database Schema**: Includes Customers (with Czech-specific fields like IČO, DIČ), Invoices, Invoice Items, Expenses, Expense Items, Chat Messages, Bank Accounts, Payment Matches, and User Invitations.
- **AI-Powered Features**: Natural language command processing, automatic customer and service extraction, invoice description generation, real-time chat, advanced AI analyses (business insights, payment risk prediction, email campaign optimization, smart reporting, expense categorization), and bulk expense upload with PDF attachments.
- **Invoice Management**: Full CRUD operations for invoices and recurring invoices, smart sharing with public links, and payment matching.
- **User & Company Management**: Admin management system, enhanced customer management with ARES integration for company data lookup (by ICO or name), user invitation system, account deactivation, and comprehensive company branding settings.
- **Email System**: Integration with Amazon SES for all email types (welcome, password reset, invitation, invoice, deactivation) with professional HTML templates and branding.

## External Dependencies

- **Database**: Neon Database (PostgreSQL)
- **AI Integration**: OpenAI API
- **Czech Business Integration**: ARES API (Czech business registry)
- **Email Service**: Amazon SES
- **Payment Processing**: Stripe (for subscriptions and billing)
- **PDF Generation**: Puppeteer