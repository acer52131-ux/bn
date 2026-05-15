export type VehicleType = 'light' | 'truck' | 'heavy' | 'auto';

export interface Vehicle {
  id: number;
  name: string;
  plate: string;
  type: VehicleType;
  basePrice: number;
  internalPrice: number;
  loadPercent: number;
  internalPercent: number;
  driverSal: number;
  fuelCost: number;
  vatFuel: boolean;
  vehicleValue: number;
  amortizationMonths: number;
  useAmortizationRent: boolean;
  repairPercent: number; // monthly repair percentage
  vatRepairs: boolean;
  rentCost: number; // monthly rent to holding (used if !useAmortizationRent)
  vatRent: boolean;
}

export type TaxSystem = 'OSNO' | 'USN_5' | 'USN_22';

export interface GlobalSettings {
  maxHours: number;
  isAzrfResident: boolean;
  isOfficialWorker: boolean;
  taxSystem: TaxSystem;
  fixedOverhead: number;
  totalRepairBudget: number;
}

export interface MonthlyPlan {
  monthId: number;
  monthName: string;
  loadModifier: number; // e.g. 1.0 = 100% of base load
  internalShift: number; // e.g. -10 = subtract 10% from base internalPercent
}
