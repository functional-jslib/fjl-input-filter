## Change log

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
