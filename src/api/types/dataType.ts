export interface DataTypeDefinition {
  acceptedFormats: string[];
  dropDownValues?: Record<string, string>;
}

export type DataTypeMap = Record<string, DataTypeDefinition>;
