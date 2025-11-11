import ExcelJS from 'exceljs';
import { logger } from '../config/logger';
import { TeamEstimation, Schedule } from './ClaudeService';
import { formatCurrency } from '../utils/calculations';
import fs from 'fs/promises';
import path from 'path';

interface ResourceCalculation {
  role: string;
  hoursPerWeek: number[];
  totalHours: number;
  hourlyCost: number;
  cost: number;
  price: number;
}

interface ProposalData {
  clientName: string;
  projectName: string;
  resources: ResourceCalculation[];
  totalCost: number;
  totalPrice: number;
  duration: number;
  schedule: Schedule;
  parameters: {
    tax: number;
    sga: number;
    margin: number;
  };
}

export class ExcelService {
  /**
   * Gera planilha Excel completa da proposta
   */
  async generateProposal(data: ProposalData): Promise<string> {
    try {
      logger.info('📊 Gerando Excel da proposta');

      const workbook = new ExcelJS.Workbook();

      // Configurar metadados
      workbook.creator = 'Presales AI System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Aba 1: Custo Solução e Sustentação
      await this.createCostSheet(workbook, data);

      // Aba 2: Cronograma
      await this.createScheduleSheet(workbook, data);

      // Salvar arquivo
      const filename = `proposta-${data.clientName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.xlsx`;
      const filepath = path.join('uploads', 'proposals', filename);

      // Criar diretório se não existir
      await fs.mkdir(path.join('uploads', 'proposals'), { recursive: true });

      // Salvar arquivo
      await workbook.xlsx.writeFile(filepath);

      logger.info(`✅ Excel gerado: ${filename}`);
      return filepath;
    } catch (error) {
      logger.error('Erro ao gerar Excel:', error);
      throw error;
    }
  }

  /**
   * Cria aba "Custo Solução e Sustentação"
   */
  private async createCostSheet(workbook: ExcelJS.Workbook, data: ProposalData) {
    const sheet = workbook.addWorksheet('Custo Solução e Sustentação');

    // Calcular número de semanas
    const totalWeeks = data.duration * 4;

    // Configurar largura das colunas dinamicamente
    const columns = [
      { width: 20 }, // Recurso
      ...Array(totalWeeks).fill({ width: 8 }), // S1, S2, S3... (width menor para caber mais colunas)
      { width: 12 }, // Total
      { width: 15 }, // Custo/Hora
      { width: 12 }, // Imposto
      { width: 12 }, // SG&A
      { width: 12 }, // Margem
      { width: 15 }, // Custo
      { width: 15 }, // Preço
    ];
    sheet.columns = columns;

    // Calcular última coluna
    const lastColumn = String.fromCharCode(65 + totalWeeks + 7); // A + weeks + 7 colunas fixas

    // Título principal
    const titleRow = sheet.getRow(1);
    titleRow.height = 30;
    sheet.mergeCells(`A1:${lastColumn}1`);
    const titleCell = sheet.getCell('A1');
    titleCell.value = `PROPOSTA COMERCIAL - ${data.clientName.toUpperCase()}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Subtítulo
    const subtitleRow = sheet.getRow(2);
    subtitleRow.height = 25;
    sheet.mergeCells(`A2:${lastColumn}2`);
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Projeto: ${data.projectName}`;
    subtitleCell.font = { size: 12, bold: true };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Headers
    const headerRow = sheet.getRow(4);
    headerRow.height = 25;
    const headers = [
      'Recurso',
      ...Array.from({ length: totalWeeks }, (_, i) => `S${i + 1}`),
      'Total Horas',
      'Custo/Hora',
      'Imposto (21%)',
      'SG&A (10%)',
      'Margem (25%)',
      'Custo Total',
      'Preço Final',
    ];

    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Dados dos recursos
    let currentRow = 5;
    data.resources.forEach((resource) => {
      const row = sheet.getRow(currentRow);
      row.height = 20;

      // Recurso
      row.getCell(1).value = resource.role;

      // S1 a Sn (horas por semana)
      resource.hoursPerWeek.forEach((hours, index) => {
        const cell = row.getCell(2 + index);
        cell.value = hours;
        cell.numFmt = '#,##0.0';
        cell.alignment = { horizontal: 'center' };
      });

      // Índice da coluna após as semanas
      const totalHoursCol = 2 + totalWeeks;
      const costPerHourCol = totalHoursCol + 1;
      const taxCol = costPerHourCol + 1;
      const sgaCol = taxCol + 1;
      const marginCol = sgaCol + 1;
      const costCol = marginCol + 1;
      const priceCol = costCol + 1;

      // Total Horas
      row.getCell(totalHoursCol).value = resource.totalHours;
      row.getCell(totalHoursCol).numFmt = '#,##0';
      row.getCell(totalHoursCol).font = { bold: true };

      // Custo/Hora
      row.getCell(costPerHourCol).value = resource.hourlyCost;
      row.getCell(costPerHourCol).numFmt = 'R$ #,##0.00';

      // Imposto (21%)
      const taxAmount = resource.totalHours * resource.hourlyCost * 0.21;
      row.getCell(taxCol).value = taxAmount;
      row.getCell(taxCol).numFmt = 'R$ #,##0.00';

      // SG&A (10%)
      const sgaAmount = (resource.totalHours * resource.hourlyCost * 1.21) * 0.10;
      row.getCell(sgaCol).value = sgaAmount;
      row.getCell(sgaCol).numFmt = 'R$ #,##0.00';

      // Margem (25%)
      const marginAmount = resource.price - resource.cost;
      row.getCell(marginCol).value = marginAmount;
      row.getCell(marginCol).numFmt = 'R$ #,##0.00';

      // Custo Total
      row.getCell(costCol).value = resource.cost;
      row.getCell(costCol).numFmt = 'R$ #,##0.00';
      row.getCell(costCol).font = { bold: true };

      // Preço Final
      row.getCell(priceCol).value = resource.price;
      row.getCell(priceCol).numFmt = 'R$ #,##0.00';
      row.getCell(priceCol).font = { bold: true };
      row.getCell(priceCol).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD966' },
      };

      // Bordas
      const totalCols = 1 + totalWeeks + 7; // Recurso + semanas + 7 colunas fixas
      for (let i = 1; i <= totalCols; i++) {
        row.getCell(i).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      currentRow++;
    });

    // Linha de TOTAL
    const totalRow = sheet.getRow(currentRow);
    totalRow.height = 25;
    const costCol = 2 + totalWeeks + 5; // Recurso + weeks + 5 colunas até Custo
    const priceCol = costCol + 1;

    totalRow.getCell(1).value = 'TOTAL GERAL';
    totalRow.getCell(1).font = { bold: true, size: 12 };
    totalRow.getCell(costCol).value = data.totalCost;
    totalRow.getCell(costCol).numFmt = 'R$ #,##0.00';
    totalRow.getCell(costCol).font = { bold: true, size: 12 };
    totalRow.getCell(priceCol).value = data.totalPrice;
    totalRow.getCell(priceCol).numFmt = 'R$ #,##0.00';
    totalRow.getCell(priceCol).font = { bold: true, size: 12 };
    totalRow.getCell(priceCol).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD966' },
    };

    // Bordas na linha de total
    const totalCols = 1 + totalWeeks + 7;
    for (let i = 1; i <= totalCols; i++) {
      totalRow.getCell(i).border = {
        top: { style: 'double' },
        bottom: { style: 'double' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    }

    // Informações adicionais
    currentRow += 2;
    sheet.getCell(`A${currentRow}`).value = 'Observações:';
    sheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
    sheet.getCell(`A${currentRow}`).value = `• Valores calculados com imposto de ${(data.parameters.tax * 100).toFixed(0)}%`;
    currentRow++;
    sheet.getCell(`A${currentRow}`).value = `• SG&A aplicado: ${(data.parameters.sga * 100).toFixed(0)}%`;
    currentRow++;
    sheet.getCell(`A${currentRow}`).value = `• Margem aplicada: ${(data.parameters.margin * 100).toFixed(0)}%`;
    currentRow++;
    sheet.getCell(`A${currentRow}`).value = `• Duração total do projeto: ${data.duration} meses (${totalWeeks} semanas)`;
  }

  /**
   * Cria aba "Cronograma"
   */
  private async createScheduleSheet(workbook: ExcelJS.Workbook, data: ProposalData) {
    const sheet = workbook.addWorksheet('Cronograma');

    // Configurar largura das colunas
    sheet.columns = [
      { width: 15 }, // Sprint/Fase
      { width: 50 }, // Descrição/Deliverables
      { width: 15 }, // Status
    ];

    // Título
    const titleRow = sheet.getRow(1);
    titleRow.height = 30;
    sheet.mergeCells('A1:C1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'CRONOGRAMA DO PROJETO';
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    let currentRow = 3;

    // Milestones
    sheet.getCell(`A${currentRow}`).value = 'MARCOS PRINCIPAIS';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
    sheet.mergeCells(`A${currentRow}:C${currentRow}`);
    currentRow++;

    data.schedule.milestones.forEach((milestone) => {
      const row = sheet.getRow(currentRow);
      row.getCell(1).value = milestone.date;
      row.getCell(2).value = milestone.name;
      row.getCell(3).value = '🎯';
      row.height = 20;
      currentRow++;
    });

    currentRow++;

    // Sprints
    sheet.getCell(`A${currentRow}`).value = 'SPRINTS E ENTREGAS';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
    sheet.mergeCells(`A${currentRow}:C${currentRow}`);
    currentRow++;

    data.schedule.sprints.forEach((sprint) => {
      const row = sheet.getRow(currentRow);
      row.getCell(1).value = `Sprint ${sprint.number}`;
      row.getCell(1).font = { bold: true };
      row.getCell(2).value = sprint.deliverables.join(', ');
      row.getCell(3).value = '📋';
      row.height = 25;

      // Bordas
      for (let i = 1; i <= 3; i++) {
        row.getCell(i).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      currentRow++;
    });

    currentRow++;

    // Dependências
    if (data.schedule.dependencies && data.schedule.dependencies.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'DEPENDÊNCIAS';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      sheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' },
      };
      sheet.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      data.schedule.dependencies.forEach((dep) => {
        const row = sheet.getRow(currentRow);
        row.getCell(1).value = dep.task;
        row.getCell(2).value = `Depende de: ${dep.dependsOn.join(', ')}`;
        row.getCell(3).value = '🔗';
        row.height = 20;
        currentRow++;
      });
    }

    // Buffer de risco
    currentRow += 2;
    sheet.getCell(`A${currentRow}`).value = `⚠️ Buffer de risco: ${data.schedule.riskBuffer}% (tempo adicional para contingências)`;
    sheet.getCell(`A${currentRow}`).font = { italic: true };
    sheet.mergeCells(`A${currentRow}:C${currentRow}`);
  }
}
