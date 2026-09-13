## Purpose

Provide a reusable enterprise application shell and page composition defaults based on Astryx navigation primitives.

## ADDED Requirements

### Requirement: Default top-navigation shell

The template MUST render all routes inside an Astryx `AppShell` using `TopNav`, a product heading, and working route links. The shell MUST NOT include ecommerce mega menus, cart controls, fake search controls, or placeholder storefront data.

#### Scenario: User opens the root route

- **WHEN** the generated application loads `/`
- **THEN** the page uses the shared application shell and displays an enterprise overview

#### Scenario: User navigates to the feature route

- **WHEN** the user selects the Hello navigation item
- **THEN** the router navigates to `/$locale/hello` without a full page reload

### Requirement: Reusable page composition

The template MUST provide shared page container and page header components so new business pages have a standard content width, spacing, title, description, and action area.

#### Scenario: Agent adds a business page

- **WHEN** an agent adds a route component
- **THEN** it can compose `TemplateShell`, `PageContainer`, and `PageHeader` without inventing layout conventions

### Requirement: Reference pages exercise the shell

The root overview and hello feature MUST both use the shared shell and page composition. The hello feature MUST remain functionally complete with its SQLite/Supabase repository flow.

#### Scenario: Hello feature renders in the shell

- **WHEN** the user opens `/$locale/hello`
- **THEN** the greeting form and stored greetings render within the shared AppShell instead of a standalone page layout

### Requirement: Astryx-first component composition

Template UI MUST prefer native Astryx components and layouts when an equivalent exists. Custom wrappers MUST represent repeated project conventions or semantic boundaries and delegate to Astryx primitives rather than reimplementing their behavior.

#### Scenario: Agent creates a page section or collection

- **WHEN** an agent needs layout, a page section, an ordered list, an empty state, centered content, or a timestamp
- **THEN** the implementation uses the native Astryx `Stack`, `Grid`, `Section`, `List`, `EmptyState`, `Center`, or `Timestamp` component instead of equivalent raw markup

#### Scenario: Agent creates a shared wrapper

- **WHEN** a repeated template convention requires a wrapper
- **THEN** the wrapper composes Astryx primitives and only adds the project-specific contract
