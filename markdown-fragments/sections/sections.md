## Sections in Readme:
- [definitions](#definitions)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Docs](#docs)
- [Motivation](#motivations)
- [Development](#development)
- [Supported Platforms](#supported-platforms)
- [License](#license)
- [Resources](#resources)
- [Change log](#change-log)

## Definitions:
(written in typescript)
- **Validation Result**
```typescript
interface ValidationResult {
    result: boolean,
    messages?: [string]
}
```
- **Validator**
```typescript
(x: any) => ValidationResult
```
- **Filters**
```typescript
(x: any) => x
``` 
- **Inputs**
```typescript
interface Input<T> {
    name: string,
    rawValue: T,
    value: T,
    filteredValue: any,
    obscuredValue: string
}
```
- **InputFilters**
