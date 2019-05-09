declare module FjlInputFilter {
    export interface ValidationResult {
        result: boolean,
        messages?: string[]
    }

    export type Filter = (x: any) => any

    export type Validator = (x: any) => ValidationResult

    export interface InputOptions {
        name: string,
        required: boolean,
        breakOnFailure: boolean,
        validators?: Validator[]
        filters?: Filter[]
    }

    export interface InputValidationResult extends ValidationResult {
        name: string,
        result: boolean,
        messages?: string[],
        value?: any,
        rawValue?: any,
        obscuredValue?: string,
        filteredValue?: any
    }

    export class Input implements InputOptions {
        name: string;
        required: boolean;
        breakOnFailure: boolean;

        validate(x: any): InputValidationResult

        validateIO(x: any): Promise<InputValidationResult>
    }

    export interface InputOptionsMap {
        [index: string]: InputOptions
    }

    export interface InputsData {
        [index: string]: any
    }

    export interface InputsValidationMap {
        [index: string]: InputValidationResult
    }

    export interface MessagesMap {
        [index: string]: string[]
    }

    export interface InputFilterValidationResult {
        result: boolean,
        validInputs: InputsValidationMap,
        invalidInputs: InputsValidationMap,
        validResults: [string, InputValidationResult][],
        invalidResults: [string, InputValidationResult][],
        messages: MessagesMap
    }

    export class InputFilter {
        validate(data: InputsData): InputFilterValidationResult;

        validateIO(data: InputsData): Promise<InputFilterValidationResult>;
    }
}
