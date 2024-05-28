export type LanguageInputId = "auto" | "en" | "es" | "de";
export type LanguageInputName =
  | "Auto"
  | "English"
  | "Español"
  | "Deutsch";

export type LanguageOutputId = "en" | "es" | "de";
export type LanguageOutputName = "English" | "Español" | "Deutsch";

export interface LanguageInput {
  id: LanguageInputId;
  name: LanguageInputName;
}

export interface LanguageOutput {
  id: LanguageInputId;
  name: LanguageOutputName;
}

export function getSupportedOutputLanguages(): Array<LanguageOutput> {
  return [
    { id: "en", name: "English" },
    { id: "es", name: "Español" },
    { id: "de", name: "Deutsch" },
  ];
}

export function getSupportedInputLanguages(): Array<LanguageInput> {
  return [
    { id: "auto", name: "Auto" },
    { id: "en", name: "English" },
    { id: "es", name: "Español" },
    { id: "de", name: "Deutsch" },
  ];
}
