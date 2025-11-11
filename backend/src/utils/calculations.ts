/**
 * Utilitários para cálculos financeiros
 * Baseado nas fórmulas do plano-app-prevenda.md
 */

export interface CostCalculationParams {
  totalHours: number;
  hourlyCost: number;
  taxRate: number; // 0.21 = 21%
  sgaRate: number; // 0.10 = 10%
  marginRate: number; // 0.25 = 25%
}

export interface CostCalculationResult {
  baseCost: number;
  costWithTax: number;
  costWithSGA: number;
  finalCost: number;
  finalPrice: number;
  breakdown: {
    base: number;
    tax: number;
    sga: number;
    margin: number;
  };
}

/**
 * Calcula custo base
 * Formula: Total de Horas × Custo por Hora
 */
export function calculateBaseCost(totalHours: number, hourlyCost: number): number {
  if (totalHours < 0 || hourlyCost < 0) {
    throw new Error('Horas e custo/hora devem ser valores positivos');
  }
  return totalHours * hourlyCost;
}

/**
 * Aplica taxa de imposto
 * Formula: Custo Base × (1 + Taxa de Imposto)
 */
export function applyTax(baseCost: number, taxRate: number): number {
  if (taxRate < 0 || taxRate > 1) {
    throw new Error('Taxa de imposto deve estar entre 0 e 1');
  }
  const result = baseCost * (1 + taxRate);
  console.log(`[applyTax] baseCost=${baseCost}, taxRate=${taxRate}, result=${result}`);
  return result;
}

/**
 * Aplica SG&A (Selling, General & Administrative)
 * Formula: Custo com Impostos × (1 + Taxa SG&A)
 */
export function applySGA(costWithTax: number, sgaRate: number): number {
  if (sgaRate < 0 || sgaRate > 1) {
    throw new Error('Taxa SG&A deve estar entre 0 e 1');
  }
  return costWithTax * (1 + sgaRate);
}

/**
 * Calcula preço final com margem
 * Formula: Custo Final ÷ (1 - Margem)
 */
export function calculatePrice(finalCost: number, marginRate: number): number {
  if (marginRate < 0 || marginRate >= 1) {
    throw new Error('Margem deve estar entre 0 e menor que 1');
  }
  return finalCost / (1 - marginRate);
}

/**
 * Calcula custo e preço completo com todos os componentes
 *
 * Exemplo do plano:
 * - 1000 horas × R$ 100/hora = R$ 100.000
 * - Com imposto (21%): R$ 121.000
 * - Com SG&A (10%): R$ 133.100
 * - Com margem (25%): R$ 177.467
 */
export function calculateFullCostAndPrice(
  params: CostCalculationParams
): CostCalculationResult {
  // Validações
  if (params.totalHours < 0) {
    throw new Error('Total de horas deve ser positivo');
  }
  if (params.hourlyCost < 0) {
    throw new Error('Custo por hora deve ser positivo');
  }

  // Cálculos passo a passo
  const baseCost = calculateBaseCost(params.totalHours, params.hourlyCost);
  const costWithTax = applyTax(baseCost, params.taxRate);
  const finalCost = applySGA(costWithTax, params.sgaRate);
  const finalPrice = calculatePrice(finalCost, params.marginRate);

  // Breakdown detalhado
  const taxAmount = costWithTax - baseCost;
  const sgaAmount = finalCost - costWithTax;
  const marginAmount = finalPrice - finalCost;

  return {
    baseCost: Number(baseCost.toFixed(2)),
    costWithTax: Number(costWithTax.toFixed(2)),
    costWithSGA: finalCost,
    finalCost: Number(finalCost.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
    breakdown: {
      base: Number(baseCost.toFixed(2)),
      tax: Number(taxAmount.toFixed(2)),
      sga: Number(sgaAmount.toFixed(2)),
      margin: Number(marginAmount.toFixed(2)),
    },
  };
}

/**
 * Calcula total de horas de um array de alocação mensal
 */
export function calculateTotalHours(hoursPerMonth: number[]): number {
  return hoursPerMonth.reduce((sum, hours) => sum + hours, 0);
}

/**
 * Valida array de alocação mensal (deve ter valores positivos)
 */
export function validateMonthlyAllocation(hoursPerMonth: number[]): boolean {
  if (hoursPerMonth.length === 0) {
    return false;
  }
  return hoursPerMonth.every((hours) => hours >= 0);
}

/**
 * Formata valor monetário para BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Calcula percentual entre dois valores
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}
