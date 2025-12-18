import pool from './db';
import { getBomDescription, checkIfLocationExists } from './db';
// Defect keywords to remove from component analysis
const DEFECT_KEYWORDS = ['FAULTY', 'DAMAGE', 'BURN', 'DEFECTIVE', 'BAD', 'ERROR'];

// Interface for validated components
export interface ValidatedComponent {
  partCode: string;
  location: string;
  description: string;
  isValid: boolean;
}

// Clean text by removing defect keywords
export function cleanComponentText(text: string): string {
  let cleanedText = text.toUpperCase();
  for (const keyword of DEFECT_KEYWORDS) {
    cleanedText = cleanedText.replace(new RegExp(keyword, 'g'), '');
  }
  return cleanedText.trim();
}

// Parse components by "/" delimiter
export function parseComponents(text: string): string[] {
  return text.split('/').map(component => component.trim()).filter(component => component.length > 0);
}

// Validate a single component against BOM
export async function validateComponent(component: string): Promise<ValidatedComponent> {
  // Parse component in format "PARTCODE-LOCATION" or "PARTCODE@LOCATION"
  const separators = ['-', '@'];
  let partCode = '';
  let location = '';
  
  for (const separator of separators) {
    if (component.includes(separator)) {
      const parts = component.split(separator);
      partCode = parts[0].trim();
      location = parts.slice(1).join(separator).trim();
      break;
    }
  }
  
  // If we couldn't parse, check if the input might be a location
  if (!partCode) {
    const potentialLocation = component.trim();
    
    // Check if this is a location in our BOM
    const locationExists = await checkIfLocationExists(potentialLocation);
    
    if (locationExists) {
      // If it's a location, return a special indicator
      return {
        partCode: '',
        location: potentialLocation,
        description: `Location found with multiple components. Please specify part code.`,
        isValid: false // Mark as invalid to prompt user for more specific info
      };
    } else {
      // Treat the whole thing as part code with empty location
      partCode = potentialLocation;
      location = '';
    }
  }
  
  // Validate against BOM
  const description = await getBomDescription(partCode, location);
  
  return {
    partCode,
    location,
    description: description || 'NA',
    isValid: !!description
  };
}
// Validate all components in the analysis text
export async function validateConsumption(analysisText: string): Promise<{
  validatedComponents: ValidatedComponent[];
  isValid: boolean;
  errorMessage: string | null;
}> {
  // Clean and parse the analysis text
  const cleanedText = cleanComponentText(analysisText);
  const componentStrings = parseComponents(cleanedText);
  
  // Validate each component
  const validatedComponents: ValidatedComponent[] = [];
  let isValid = true;
  let errorMessage: string | null = null;
  
  for (const componentStr of componentStrings) {
    const validatedComponent = await validateComponent(componentStr);
    validatedComponents.push(validatedComponent);
    
    // If any component is invalid, mark the whole validation as invalid
    if (!validatedComponent.isValid) {
      isValid = false;
      if (!errorMessage) {
        errorMessage = `Component "${componentStr}" not found in BOM`;
      }
    }
  }
  
  return {
    validatedComponents,
    isValid,
    errorMessage
  };
}

// Format validated components for display
export function formatValidatedComponents(components: ValidatedComponent[]): string {
  return components.map(comp => {
    if (comp.isValid) {
      return `${comp.partCode}@${comp.location} - ${comp.description}`;
    } else {
      return `${comp.partCode}@${comp.location} - NA`;
    }
  }).join('\n');
}

// Save consumption entry to database
export async function saveConsumptionEntry(entry: {
  id: string;
  repairDate: string;
  testing: string;
  failure: string;
  status: string;
  pcbSrNo: string;
  rfObservation: string;
  analysis: string;
  validationResult: string;
  componentChange: string;
  enggName: string;
  dispatchDate: string;
  componentConsumption: string;
  consumptionEntry: string;
  consumptionEntryDate: string;
}): Promise<boolean> {
  try {
    await pool.execute(`
      INSERT INTO consumption_entries 
      (id, repair_date, testing, failure, status, pcb_sr_no, rf_observation, analysis, 
       validation_result, component_change, engg_name, dispatch_date, component_consumption, 
       consumption_entry, consumption_entry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.id,
      entry.repairDate,
      entry.testing,
      entry.failure,
      entry.status,
      entry.pcbSrNo,
      entry.rfObservation,
      entry.analysis,
      entry.validationResult,
      entry.componentChange,
      entry.enggName,
      entry.dispatchDate,
      entry.componentConsumption,
      entry.consumptionEntry,
      entry.consumptionEntryDate
    ]);
    
    return true;
  } catch (error) {
    console.error('Error saving consumption entry:', error);
    return false;
  }
}

// Get all consumption entries
export async function getConsumptionEntries(): Promise<any[]> {
  try {
    const [rows]: any = await pool.execute('SELECT * FROM consumption_entries ORDER BY created_at DESC');
    return rows;
  } catch (error) {
    console.error('Error fetching consumption entries:', error);
    return [];
  }
}