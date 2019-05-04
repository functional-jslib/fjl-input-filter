## Change log
### 1.2.5
- Dependencies and dev-dependencies updated to latest.
- Tests updated to reflect updated dev-dependencies (jest complained about nested 'describe' blocks and nested 'test' blocks (primarily issue had to do with async and non-async tests)).
 
### 0.18.0
#### Breaking changes
- Removed uncurried methods (methods ending with `$`) (use curried methods instead).
*Removed*:
- `errorIfNotTypeOnTarget$` - ('fjl' provides this now)
- `errorIfNotTypeOnTarget` - ("")
- `defineEnumProps$`
- `defineProps$`

- Renamed auxillary methods:
    - `_descriptorForSettable` becomes `createTypedDescriptor`.
    - `_makeDescriptorEnumerable` becomes `toEnumerableDescriptor`.
    - `_targetDescriptorTuple` becomes `toTargetDescriptorTuple`.
    
#### Other changes:
- Normalized API (removed un-curried methods from exports and non-api specific (un-required) methods).
- Updated build process (using babel7 now).
- Replaced `mocha` and `chai` with `jest`.
- Changed license from "MIT" to "BSD3".
- Version and build tag links to top of readme file.
- Et. al.
