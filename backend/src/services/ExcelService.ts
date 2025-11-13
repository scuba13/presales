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
   * Gera planilha Excel como buffer (para download on-demand)
   */
  async generateProposalBuffer(data: ProposalData): Promise<Buffer> {
    try {
      logger.info('📊 Gerando Excel buffer da proposta');

      const workbook = new ExcelJS.Workbook();

      // Configurar metadados
      workbook.creator = 'Presales AI System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Aba 1: Custo Solução e Sustentação
      await this.createCostSheet(workbook, data);

      // Aba 2: Cronograma
      await this.createScheduleSheet(workbook, data);

      // Gerar buffer
      const buffer = await workbook.xlsx.writeBuffer();

      logger.info('✅ Excel buffer gerado');
      return buffer as Buffer;
    } catch (error) {
      logger.error('Erro ao gerar Excel buffer:', error);
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
   * Cria aba "Cronograma" com visual tipo Gantt Chart
   */
  private async createScheduleSheet(workbook: ExcelJS.Workbook, data: ProposalData) {
    const sheet = workbook.addWorksheet('Cronograma');

    // Calcular número de semanas totais
    const totalWeeks = data.duration * 4;

    // Configurar largura das colunas: Fase/Sprint + Descrição + Semanas (S1-Sn)
    const columns = [
      { width: 25 }, // Fase/Sprint
      { width: 50 }, // Descrição
      ...Array(totalWeeks).fill({ width: 3 }), // S1, S2, S3... (colunas estreitas para visual compacto)
    ];
    sheet.columns = columns;

    // Calcular última coluna
    const lastColumn = String.fromCharCode(66 + totalWeeks); // B + totalWeeks

    // Título principal
    const titleRow = sheet.getRow(1);
    titleRow.height = 30;
    sheet.mergeCells(`A1:${lastColumn}1`);
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'CRONOGRAMA DO PROJETO - GANTT CHART';
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Subtítulo com duração
    const subtitleRow = sheet.getRow(2);
    subtitleRow.height = 20;
    sheet.mergeCells(`A2:${lastColumn}2`);
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Duração: ${data.duration} meses (${totalWeeks} semanas)`;
    subtitleCell.font = { size: 11, bold: true };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Headers
    const headerRow = sheet.getRow(4);
    headerRow.height = 25;

    // Header: Fase/Sprint
    const headerCell1 = headerRow.getCell(1);
    headerCell1.value = 'Fase/Sprint';
    headerCell1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerCell1.alignment = { horizontal: 'center', vertical: 'middle' };

    // Header: Descrição
    const headerCell2 = headerRow.getCell(2);
    headerCell2.value = 'Descrição / Entregas';
    headerCell2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerCell2.alignment = { horizontal: 'center', vertical: 'middle' };

    // Headers: S1, S2, S3...
    for (let i = 0; i < totalWeeks; i++) {
      const cell = headerRow.getCell(3 + i);
      cell.value = `S${i + 1}`;
      cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    }

    // Bordas nos headers principais
    headerCell1.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
    headerCell2.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };

    let currentRow = 5;

    // Sprints e suas entregas
    data.schedule.sprints.forEach((sprint) => {
      const row = sheet.getRow(currentRow);
      row.height = 25;

      // Coluna 1: Sprint número
      const sprintCell = row.getCell(1);
      sprintCell.value = `Sprint ${sprint.number}`;
      sprintCell.font = { bold: true };
      sprintCell.alignment = { horizontal: 'left', vertical: 'middle' };
      sprintCell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Coluna 2: Deliverables
      const descCell = row.getCell(2);
      descCell.value = sprint.deliverables.join(', ');
      descCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      descCell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Colunas de semanas: pintar as semanas do sprint
      // Assumir que cada sprint tem 2 semanas
      const sprintDurationWeeks = 2;
      const sprintStartWeek = (sprint.number - 1) * sprintDurationWeeks;

      for (let w = 0; w < totalWeeks; w++) {
        const weekCell = row.getCell(3 + w);

        // Se a semana está dentro do sprint, pintar
        if (w >= sprintStartWeek && w < sprintStartWeek + sprintDurationWeeks) {
          weekCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF5B9BD5' }, // Azul
          };
        }

        weekCell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      currentRow++;
    });

    // Adicionar linha em branco
    currentRow++;

    // Milestones
    if (data.schedule.milestones && data.schedule.milestones.length > 0) {
      const milestoneHeaderRow = sheet.getRow(currentRow);
      milestoneHeaderRow.height = 25;

      const milestoneHeaderCell = milestoneHeaderRow.getCell(1);
      milestoneHeaderCell.value = 'MARCOS PRINCIPAIS';
      milestoneHeaderCell.font = { bold: true, size: 11 };
      milestoneHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' },
      };
      sheet.mergeCells(`A${currentRow}:B${currentRow}`);
      currentRow++;

      data.schedule.milestones.forEach((milestone) => {
        const row = sheet.getRow(currentRow);
        row.height = 20;

        const milestoneCell = row.getCell(1);
        milestoneCell.value = milestone.date;
        milestoneCell.font = { bold: true };

        const descCell = row.getCell(2);
        descCell.value = milestone.name;

        // Adicionar ícone de milestone em uma semana específica
        // Tentar extrair o mês do milestone.date (ex: "M3" = mês 3)
        const monthMatch = milestone.date.match(/M(\d+)/);
        if (monthMatch) {
          const month = parseInt(monthMatch[1]);
          const weekIndex = (month - 1) * 4; // Primeira semana do mês
          if (weekIndex >= 0 && weekIndex < totalWeeks) {
            const milestoneWeekCell = row.getCell(3 + weekIndex);
            milestoneWeekCell.value = '🎯';
            milestoneWeekCell.alignment = { horizontal: 'center', vertical: 'middle' };
            milestoneWeekCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFD966' }, // Amarelo
            };
          }
        }

        currentRow++;
      });
    }

    // Informações adicionais
    currentRow += 2;
    const infoCell = sheet.getCell(`A${currentRow}`);
    infoCell.value = `⚠️ Buffer de risco: ${data.schedule.riskBuffer}% | Cada sprint tem 2 semanas`;
    infoCell.font = { italic: true, size: 10 };
    sheet.mergeCells(`A${currentRow}:${lastColumn}${currentRow}`);
  }
}
