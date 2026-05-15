// components/engine.ts
import { Vehicle, GlobalSettings, MonthlyPlan } from './types';

export interface CalculatedVehicleMonth {
  vehicleId: number;
  monthId: number;
  monthName: string;
  workHours: number;
  revenueGross: number;
  revenueNet: number;
  expensesNetForTax: number;
  netProfit: number;
  holdingBenefit: number;
  vatPayable: number;
  totalInputVat: number;
  rentVatInput: number;
}

export function calculateMonth(
  fleet: Vehicle[],
  settings: GlobalSettings,
  plan: MonthlyPlan
) {
  let totals = {
    revenueGross: 0,
    revenueNet: 0,
    revenueExtGross: 0,
    revenueIntGross: 0,
    expensesNetForTax: 0,
    profitTax: 0,
    netProfit: 0,
    holdingBenefit: 0,
    holdingVatBenefit: 0,
    vatPayable: 0,
    rentNet: 0,
    totalInputVat: 0,
    rentVatInput: 0,
    outputVat: 0,
    fotPure: 0,
    fotNdfl: 0,
    fotSocialTaxes: 0,
  };

  const vehicles = fleet.map(v => {
    // Apply plan modifiers
    let actualLoad = Math.min(100, Math.max(0, v.loadPercent * plan.loadModifier));
    let actualInternal = Math.min(100, Math.max(0, v.internalPercent + plan.internalShift));

    const workHours = Math.round(settings.maxHours * (actualLoad / 100));
    
    const extRatio = (100 - actualInternal) / 100;
    const intRatio = actualInternal / 100;
    const extHours = workHours * extRatio;
    const intHours = workHours * intRatio;
    
    const avgRate = (v.basePrice * extRatio) + (v.internalPrice * intRatio);
    const revenueGross = workHours * avgRate;
    
    const grossSal = settings.isOfficialWorker ? v.driverSal / 0.87 : v.driverSal;
    const ndfl = settings.isOfficialWorker ? grossSal - v.driverSal : 0;
    const socialTaxesRate = settings.isAzrfResident ? 0.076 : 0.302;
    const socialTaxes = settings.isOfficialWorker ? grossSal * socialTaxesRate : 0;
    
    const fotPerHour = v.driverSal + ndfl + socialTaxes;
    // driverSal is monthly, not per hour!
    // we should use v.driverSal directly for the month, if it works for the month.
    // wait, if v.driverSal is monthly, fotPerHour logic above is actually fotPerMonth.
    const monthlyFOT = v.driverSal === 0 ? 0 : v.driverSal + ndfl + socialTaxes;

    const fuelNet = v.driverSal === 0 ? 0 : workHours * v.fuelCost;
    const fuelGross = v.vatFuel ? fuelNet * 1.20 : fuelNet;
    const fuelVatInput = v.vatFuel ? fuelGross - fuelNet : 0;

    const repairNet = v.vehicleValue * (v.repairPercent / 100);
    const repairGross = v.vatRepairs ? repairNet * 1.20 : repairNet;
    const repairVatInput = v.vatRepairs ? repairGross - repairNet : 0;

    let rentGross = 0;
    let rentNet = 0;
    
    if (v.useAmortizationRent) {
      if (v.amortizationMonths > 0) {
        rentGross = (v.vehicleValue / v.amortizationMonths) * 1.10;
        rentNet = rentGross / 1.20; // Russian VAT inclusive extraction
      }
    } else {
      // old fallback, rentCost per month
      rentGross = v.rentCost; 
      rentNet = v.vatRent ? rentGross / 1.20 : rentGross;
    }

    const rentVatInput = rentGross - rentNet;

    const totalInputVat = fuelVatInput + repairVatInput + rentVatInput;

    let outputVat = 0;
    let deductibleInputVat = 0;
    let revenueNet = revenueGross;
    let expensesNetForTax = 0;
    
    const revenueIntGross = intHours * v.internalPrice;
    let holdingVatBenefit = 0;

    if (settings.taxSystem === 'OSNO') {
      outputVat = revenueGross * (20 / 120);
      revenueNet = revenueGross - outputVat;
      deductibleInputVat = totalInputVat;
      expensesNetForTax = monthlyFOT + fuelNet + repairNet + rentNet;
      holdingVatBenefit = revenueIntGross * (20 / 120);
    } else if (settings.taxSystem === 'USN_22') {
      outputVat = revenueGross * (20 / 120); 
      revenueNet = revenueGross - outputVat;
      deductibleInputVat = totalInputVat;
      expensesNetForTax = monthlyFOT + fuelNet + repairNet + rentNet;
      holdingVatBenefit = revenueIntGross * (20 / 120);
    } else if (settings.taxSystem === 'USN_5') {
      outputVat = revenueGross * (5 / 105);
      revenueNet = revenueGross - outputVat;
      deductibleInputVat = 0;
      expensesNetForTax = monthlyFOT + fuelGross + repairGross + rentGross;
      holdingVatBenefit = 0;
    }

    const vatPayableValue = outputVat - deductibleInputVat;
    const vatPayable = vatPayableValue > 0 ? vatPayableValue : 0;

    const profitBeforeTax = revenueNet - expensesNetForTax;
    
    let profitTax = 0;
    if (settings.taxSystem === 'OSNO') {
      profitTax = profitBeforeTax > 0 ? profitBeforeTax * 0.23 : 0;
    } else {
      profitTax = profitBeforeTax > 0 ? profitBeforeTax * 0.15 : 0; // USN 15% D-R
    }

    const netProfit = profitBeforeTax - profitTax;
    const holdingBenefit = netProfit + rentNet + holdingVatBenefit; // Plus parent company's rent income and internal VAT savings

    totals.revenueGross += revenueGross;
    totals.revenueExtGross += extHours * v.basePrice;
    totals.revenueIntGross += intHours * v.internalPrice;
    totals.revenueNet += revenueNet;
    totals.expensesNetForTax += expensesNetForTax;
    totals.profitTax += profitTax;
    totals.netProfit += netProfit;
    totals.holdingBenefit += holdingBenefit;
    totals.holdingVatBenefit += holdingVatBenefit;
    totals.vatPayable += vatPayable;
    totals.rentNet += rentNet;
    totals.totalInputVat += totalInputVat;
    totals.rentVatInput += rentVatInput;
    totals.outputVat += outputVat;
    totals.fotPure += v.driverSal;
    totals.fotNdfl += ndfl;
    totals.fotSocialTaxes += socialTaxes;

    return {
      vehicleId: v.id,
      monthId: plan.monthId,
      monthName: plan.monthName,
      workHours,
      extHours,
      intHours,
      revenueGross,
      revenueNet,
      expensesNetForTax,
      netProfit,
      holdingBenefit,
      vatPayable,
      totalInputVat,
      rentVatInput,
      rentGross,
      rentNet,
      repairNet,
      fuelNet,
      monthlyFOT
    };
  });

  // Apply overhead correctly to totals
  let finalTaxOnOverhead = 0;
  if (settings.taxSystem === 'OSNO') finalTaxOnOverhead = settings.fixedOverhead * 0.20;
  else finalTaxOnOverhead = settings.fixedOverhead * 0.15;
  
  const totalNetProfit = totals.netProfit - settings.fixedOverhead + finalTaxOnOverhead;
  const totalHoldingBenefit = totalNetProfit + totals.rentNet;

  return {
    vehicles,
    totals: {
      ...totals,
      netProfit: totalNetProfit,
      holdingBenefit: totalHoldingBenefit
    }
  };
}
