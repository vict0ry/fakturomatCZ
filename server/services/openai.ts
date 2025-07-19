// Modern AI Service - Clean and Modular
export { processUniversalAICommand } from "./ai/index.js";
export { processAICommand } from "./openai-legacy.js";
export type { InvoiceCommand } from "./ai/types.js";

// Export legacy functions from old service
export { processPublicAICommand, generateInvoiceDescription } from "./openai-old.js";