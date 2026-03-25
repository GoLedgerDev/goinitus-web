export interface Schema {
  /** Human-readable chaincode / app name */
  name: string;
  /** Chaincode version string */
  version: string;
  /** Current org's MSP identifier e.g. "Org1MSP" */
  orgMSP: string;
}

export interface LabelKey {
  assetType: string;
  dataType: string;
  tag: string;
  assetTag: string;
}

export interface AssetListElement {
  label: string;
  /** Snake-case identifier used in API paths and @assetType field */
  tag: string;
  /** MSP regex patterns with write permission */
  writers: string[];
  /** MSP regex patterns with read permission; non-empty ⟹ private data collection */
  readers: string[];
  /** True if type was created at runtime via createAssetType */
  dynamic: boolean;
  /** Private data collection name, if applicable */
  collection?: string;
  /** Fields used to build human-readable display labels for asset instances */
  labelKeys: LabelKey[];
  // Derived fields — set during bootstrap, not from API
  /** True if current org has write permission on all key props */
  canCreate: boolean;
  /** Drawer section the asset belongs to */
  drawerSection: 'readWrite' | 'readOnly' | 'unreachable';
}

export interface InputType {
  tag: string;
  label: string;
  required: boolean;
  /**
   * "string" | "number" | "boolean" | "datetime" | "url"
   * "[]string" | "[]number" | "[]datetime"
   * "<assetTag>->" | "[]<assetTag>->"
   * "@object" | "@prop"
   * or a custom dataType name
   */
  dataType: string;
  placeholder?: string;
  error: string;
  disabled: boolean;
  route: string;
  isKey: boolean;
  isEdit: boolean;
}
