import pool from './pg-db';
import { getBomDescription, checkIfLocationExists, checkComponentForPartCode } from './pg-db';

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
export async function validateComponent(component: string, parentPartCode?: string): Promise<ValidatedComponent> {
  // Parse component in format "PARTCODE-LOCATION" or "PARTCODE@LOCATION"
  // Prioritize '@' over '-' to handle cases like "RES-001@R1"
  const separators = ['@', '-'];
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
      // If it's a location, check if we have a parent part code to validate against
      if (parentPartCode) {
        // Check if the parent part code is valid for this location
        const description = await getBomDescription(parentPartCode, potentialLocation);
        if (description) {
          // Parent part code is valid for this location, use it
          partCode = parentPartCode;
          location = potentialLocation;
        } else {
          // Parent part code is not valid for this location
          return {
            partCode: '',
            location: potentialLocation,
            description: `Location found with multiple components. Please specify part code.`,
            isValid: false // Mark as invalid to prompt user for more specific info
          };
        }
      } else {
        // No parent part code, return the special indicator
        return {
          partCode: '',
          location: potentialLocation,
          description: `Location found with multiple components. Please specify part code.`,
          isValid: false // Mark as invalid to prompt user for more specific info
        };
      }
    } else {
      // Treat the whole thing as part code with empty location
      partCode = potentialLocation;
      location = '';
    }
  }
  
  // Validate against BOM
  const description = await getBomDescription(partCode, location);
  
  // If we have a parent part code, do additional validation
  let isValid = !!description;
  if (parentPartCode && isValid) {
    // Check if this component is valid for the specific parent part code
    const isComponentValidForParent = await checkComponentForPartCode(partCode, location, parentPartCode);
    isValid = isComponentValidForParent;
  }
  
  return {
    partCode,
    location,
    description: description || 'NA',
    isValid
  };
}

// Validate all components in the analysis text
export async function validateConsumption(analysisText: string, partCode?: string): Promise<{
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
    const validatedComponent = await validateComponent(componentStr, partCode);
    validatedComponents.push(validatedComponent);
    
    // If any component is invalid, mark the whole validation as invalid
    if (!validatedComponent.isValid) {
      isValid = false;
      if (!errorMessage) {
        // Use the specific error message from the component validation if available
        if (validatedComponent.description && validatedComponent.description.includes('Location found with multiple components')) {
          errorMessage = validatedComponent.description;
        } else {
          // Include part code context in error message if available
          if (partCode) {
            errorMessage = `Component "${componentStr}" not found in BOM for Part Code ${partCode}`;
          } else {
            errorMessage = `Component "${componentStr}" not found in BOM`;
          }
        }
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

// Format component consumption for the consumption field
export function formatComponentConsumption(components: ValidatedComponent[]): string {
  return components.map(comp => {
    if (comp.isValid) {
      return `${comp.location}: ${comp.description}`;
    } else {
      return `${comp.location}: Not found in BOM`;
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
    // Handle empty dates by converting them to NULL
    const dispatchDateValue = entry.dispatchDate && entry.dispatchDate.trim() !== '' ? entry.dispatchDate : null;
    const repairDateValue = entry.repairDate && entry.repairDate.trim() !== '' ? entry.repairDate : null;
    const consumptionEntryDateValue = entry.consumptionEntryDate && entry.consumptionEntryDate.trim() !== '' ? entry.consumptionEntryDate : null;
    
    await pool.query(`
      INSERT INTO consumption_entries 
      (id, repair_date, testing, failure, status, pcb_sr_no, rf_observation, analysis, 
       validation_result, component_change, engg_name, dispatch_date, component_consumption, 
       consumption_entry, consumption_entry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      entry.id,
      repairDateValue,
      entry.testing,
      entry.failure,
      entry.status,
      entry.pcbSrNo,
      entry.rfObservation,
      entry.analysis,
      entry.validationResult,
      entry.componentChange,
      entry.enggName,
      dispatchDateValue,
      entry.componentConsumption,
      entry.consumptionEntry,
      consumptionEntryDateValue
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
    const result = await pool.query('SELECT * FROM consumption_entries ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error fetching consumption entries:', error);
    return [];
  }
}