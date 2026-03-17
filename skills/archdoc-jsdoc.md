---
name: archdoc-jsdoc
description: Add ArcDoc-optimized JSDoc comments to TypeScript source code. Scans for missing JSDoc on classes, methods, functions, and adds @businessRule, @param, @returns, @throws tags.
---

# ArcDoc JSDoc Comment Generator

Add comprehensive JSDoc comments to TypeScript source files for optimal ArcDoc documentation output.

**Target**: $ARGUMENTS

## Context

ArcDoc extracts the following JSDoc information to generate architecture documentation:
- **Class/Interface description** — used in feature list, component overview
- **Method description** — used in feature list, API spec
- **`@param`** — parameter documentation
- **`@returns`** — return value documentation
- **`@throws`** — error/exception documentation
- **`@businessRule`** — business rules (shown in feature list and business rules summary)

Missing JSDoc results in "—" in generated documentation, reducing its usefulness.

## Steps

### 1. Scan Target Directory

Read all `.ts` files in the target directory (recursively).
For each file, identify:
- Exported classes missing JSDoc on class declaration
- Public methods missing JSDoc
- Exported functions missing JSDoc
- Exported interfaces missing JSDoc on interface declaration
- Interface method signatures missing JSDoc

Create a summary list of what needs JSDoc comments.

### 2. Analyze Code Context

For each item missing JSDoc, read the surrounding code to understand:
- **What it does** — from implementation, naming, types
- **Business rules** — validation logic, invariants, constraints
- **Error cases** — throw statements, error handling
- **Parameters** — types and purpose
- **Return values** — what is returned and when

### 3. Generate JSDoc Comments

Write JSDoc following these rules:

**Language**: Match the project's `layers.yaml` locale setting.
- If `locale: ja` → Write descriptions in Japanese
- If `locale: en` or unset → Write descriptions in English

**Class/Interface JSDoc**:
```typescript
/**
 * [1-2 sentence description of purpose and responsibility]
 *
 * @businessRule [invariant or constraint, if applicable]
 */
export class OrderService {
```

**Method/Function JSDoc**:
```typescript
/**
 * [1 sentence description of what this method does]
 *
 * @param item - [what this parameter represents]
 * @returns [what is returned]
 * @throws {NotFoundError} [when this error occurs]
 * @businessRule [business rule enforced by this method, if applicable]
 */
addItem(item: OrderItem): Money {
```

**Rules**:
- Do NOT add JSDoc to private methods (ArcDoc only extracts public)
- Do NOT add JSDoc to trivial getters (e.g., `getId()`, `getName()`) unless they have business logic
- Do NOT overwrite existing JSDoc — only add where missing
- Keep descriptions concise (1-2 sentences max)
- `@businessRule` is only for actual business rules, not technical implementation details
- `@throws` should include the error type in curly braces

### 4. Apply Changes

Edit each file to add the generated JSDoc comments.
Process one file at a time to ensure accuracy.

### 5. Verify

After adding JSDoc, run ArcDoc to verify the output improved:

```bash
npx archdoc features
```

Check that previously empty "—" descriptions are now populated.

## Examples

### Entity with Business Rules

```typescript
/**
 * Represents a scheduled training session for a course.
 *
 * @businessRule Training must have at least 1 capacity
 * @businessRule Cannot enroll after enrollment period ends
 */
export class Training {
  /**
   * Publish the training to make it available for enrollment.
   *
   * @throws {DomainError} If training is already cancelled
   * @businessRule Only draft trainings can be published
   */
  publish(): void {
```

### Use Case

```typescript
/**
 * Create a new enrollment for a user in a training session.
 */
export class CreateEnrollmentUseCase {
  /**
   * Execute the enrollment creation workflow.
   *
   * @param params - User ID and training ID for enrollment
   * @returns The created enrollment entity
   * @throws {ConflictError} If user is already enrolled
   * @throws {NotFoundError} If training does not exist
   * @businessRule User cannot enroll in cancelled trainings
   */
  async execute(params: CreateEnrollmentParams): Promise<Enrollment> {
```

### Value Object

```typescript
/**
 * Validated email address ensuring RFC-compliant format.
 *
 * @businessRule Email must contain @ and valid domain
 */
export class Email extends ValueObject<string> {
  /**
   * Create a validated Email instance.
   *
   * @param value - Raw email string to validate
   * @returns Email instance
   * @throws {ValidationError} If email format is invalid
   */
  static create(value: string): Email {
```

### Repository Interface

```typescript
/**
 * Persistence interface for Training aggregate.
 */
export interface ITrainingRepository {
  /**
   * Find a training by its unique identifier.
   *
   * @param id - Training ID to look up
   * @returns Training entity or null if not found
   */
  findById(id: TrainingId): Promise<Training | null>;
```

## Notes

- Focus on **exported** classes/functions/interfaces only (these are what ArcDoc extracts)
- Prioritize **domain layer** first (entities, value objects, domain services) as they contain business rules
- Then **application layer** (use cases) for feature descriptions
- Then **presentation layer** (routes) for API endpoint descriptions
- **Infrastructure layer** is lowest priority (repository implementations)
- If `layers.yaml` exists, read it to understand the project's layer structure
