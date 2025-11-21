export enum AppStep {
  WELCOME = 'WELCOME',
  UPLOAD = 'UPLOAD',
  ROOM_DETAILS = 'ROOM_DETAILS',
  STYLE_PREFS = 'STYLE_PREFS',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
}

export interface DesignPreferences {
  roomType: string;
  style: string;
  colors: string[];
  functionality: string;
  budget: 'Econômico' | 'Intermediário' | 'Alto Padrão';
}

export interface ShoppingItem {
  name: string;
  description: string;
  estimatedPrice: string;
  queryTerm: string; // For creating a search link
}

export interface ImageVariation {
  id: string;
  original: string; // Base64
  generated: string | null; // Base64
}

export interface DesignResult {
  variations: ImageVariation[];
  structuralAnalysis: string;
  designConcept: string;
  shoppingList: ShoppingItem[];
}

export interface AppState {
  step: AppStep;
  preferences: DesignPreferences;
  result: DesignResult;
  isProcessing: boolean;
  loadingStage: string; // e.g., "Analyzing room...", "Generating visuals..."
}

export const INITIAL_PREFERENCES: DesignPreferences = {
  roomType: '',
  style: '',
  colors: [],
  functionality: '',
  budget: 'Intermediário',
};

export const MOCK_SHOPPING_LIST: ShoppingItem[] = [
  {
    name: "Sofá Minimalista",
    description: "Sofá de 3 lugares bege com linhas limpas.",
    estimatedPrice: "R$ 3.500",
    queryTerm: "sofá minimalista bege 3 lugares"
  }
];