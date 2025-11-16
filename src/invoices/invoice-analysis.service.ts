import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { logger } from '../helpers/Logger';
import {
  InvoiceAnalysisResponse,
  ValidatedInvoiceData,
  invoiceDataSchema,
} from './dto/invoice-analysis.dto';

/**
 * Service for analyzing invoice images and extracting structured data
 */
export class InvoiceAnalysisService {
  /**
   * Analyzes an invoice image and extracts structured data
   * @param imageBuffer - The image buffer to analyze
   * @returns Extracted invoice data
   * @throws Error if analysis fails or data cannot be extracted
   */
  async analyzeInvoice(imageBuffer: Buffer): Promise<InvoiceAnalysisResponse> {
    try {
      logger.info('Starting invoice analysis');

      // Preprocess image for better OCR results
      const processedImage = await this.preprocessImage(imageBuffer);

      // Perform OCR on the image
      const ocrText = await this.performOCR(processedImage);

      // Extract structured data from OCR text
      const extractedData = this.extractInvoiceData(ocrText);

      // Validate extracted data
      const validatedData = this.validateExtractedData(extractedData);

      logger.info('Invoice analysis completed successfully');
      return validatedData;
    } catch (error) {
      logger.error('Invoice analysis failed:', error);
      throw new Error(
        `Failed to analyze invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Preprocesses the image for better OCR results
   * @param imageBuffer - Original image buffer
   * @returns Processed image buffer
   */
  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .grayscale()
        .normalize()
        .sharpen()
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (error) {
      logger.error('Image preprocessing failed:', error);
      throw new Error('Failed to preprocess image for analysis');
    }
  }

  /**
   * Performs OCR on the processed image
   * @param imageBuffer - Processed image buffer
   * @returns Extracted text
   */
  private async performOCR(imageBuffer: Buffer): Promise<string> {
    try {
      logger.info('Performing OCR on image');

      const {
        data: { text },
      } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the image');
      }

      logger.info(`OCR completed, extracted ${text.length} characters`);
      return text;
    } catch (error) {
      logger.error('OCR failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Extracts structured invoice data from OCR text
   * @param text - OCR extracted text
   * @returns Extracted invoice data
   */
  private extractInvoiceData(text: string): Partial<ValidatedInvoiceData> {
    logger.info('Extracting structured data from OCR text');

    const extractedData: Partial<ValidatedInvoiceData> = {};

    // Extract amount and currency
    const amountMatch = this.extractAmount(text);
    if (amountMatch) {
      extractedData.amount = amountMatch.amount;
      extractedData.currency = amountMatch.currency;
    }

    // Extract date
    const dateMatch = this.extractDate(text);
    if (dateMatch) {
      extractedData.date = dateMatch;
    }

    // Extract name/vendor
    const nameMatch = this.extractName(text);
    if (nameMatch) {
      extractedData.name = nameMatch;
    }

    return extractedData;
  }

  /**
   * Extracts amount and currency from text
   */
  private extractAmount(text: string): { amount: number; currency: 'USD' | 'EUR' } | null {
    // Common amount patterns with currency symbols
    const patterns = [
      // $123.45, €123.45
      /[€$]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      // 123.45 USD, 123.45 EUR
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|usd|eur)/gi,
      // USD 123.45, EUR 123.45
      /(USD|EUR|usd|eur)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      // Total: 123.45
      /total[:\s]+[€$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      // Amount: 123.45
      /amount[:\s]+[€$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    ];

    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        let amount: number;
        let currency: 'USD' | 'EUR';

        if (match[0].includes('€')) {
          currency = 'EUR';
          amount = parseFloat(match[1].replace(/,/g, ''));
        } else if (match[0].includes('$')) {
          currency = 'USD';
          amount = parseFloat(match[1].replace(/,/g, ''));
        } else if (match[2]) {
          // Pattern with currency code
          currency = match[2].toUpperCase() as 'USD' | 'EUR';
          amount = parseFloat((match[1] || match[2]).replace(/,/g, ''));
        } else if (
          match[1] &&
          (match[0].toLowerCase().includes('usd') || match[0].toLowerCase().includes('eur'))
        ) {
          currency = match[1].toUpperCase() as 'USD' | 'EUR';
          amount = parseFloat(match[2].replace(/,/g, ''));
        } else {
          // Default to USD if no currency found
          currency = 'USD';
          amount = parseFloat(match[1].replace(/,/g, ''));
        }

        if (!isNaN(amount) && amount > 0) {
          return { amount, currency };
        }
      }
    }

    return null;
  }

  /**
   * Extracts date from text
   */
  private extractDate(text: string): string | null {
    const datePatterns = [
      // YYYY-MM-DD, YYYY/MM/DD
      /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/g,
      // MM/DD/YYYY, DD/MM/YYYY
      /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g,
      // Month DD, YYYY
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/gi,
      // DD Month YYYY
      /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/gi,
    ];

    for (const pattern of datePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        try {
          let date: Date;

          if (match[0].includes('/') || match[0].includes('-')) {
            if (match[1].length === 4) {
              // YYYY-MM-DD format
              date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
            } else {
              // Assume MM/DD/YYYY format (common in US)
              date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
            }
          } else {
            // Month name format
            const months = [
              'jan',
              'feb',
              'mar',
              'apr',
              'may',
              'jun',
              'jul',
              'aug',
              'sep',
              'oct',
              'nov',
              'dec',
            ];
            const monthIndex = months.findIndex((m) => match[2].toLowerCase().startsWith(m));
            if (monthIndex !== -1) {
              if (match[3]) {
                // Month DD, YYYY
                date = new Date(parseInt(match[3]), monthIndex, parseInt(match[1]));
              } else {
                // DD Month YYYY
                date = new Date(parseInt(match[3]), monthIndex, parseInt(match[1]));
              }
            } else {
              continue;
            }
          }

          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        } catch (error) {
          // Continue to next pattern if parsing fails
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Extracts vendor/company name from text
   */
  private extractName(text: string): string | null {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Common patterns for vendor names
    const patterns = [
      /(?:invoice|bill|receipt)\s+(?:from|to)[:]\s*(.+)/gi,
      /(?:vendor|company|business)[:]\s*(.+)/gi,
      /(?:sold\s+by|merchant)[:]\s*(.+)/gi,
    ];

    // Try pattern matching first
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length >= 2 && name.length <= 100) {
          return name;
        }
      }
    }

    // Fallback: Use the first meaningful line that looks like a company name
    for (const line of lines.slice(0, 5)) {
      // Check first 5 lines
      // Skip lines that are clearly not company names
      if (
        line.length >= 2 &&
        line.length <= 100 &&
        !/^\d+$/.test(line) && // Not just numbers
        !/^[€$]\d/.test(line) && // Not starting with currency
        !/^\d+[/-]\d+/.test(line) && // Not a date
        !line.toLowerCase().includes('invoice') &&
        !line.toLowerCase().includes('receipt') &&
        !line.toLowerCase().includes('bill')
      ) {
        return line;
      }
    }

    return null;
  }

  /**
   * Validates extracted data and provides defaults where needed
   */
  private validateExtractedData(data: Partial<ValidatedInvoiceData>): InvoiceAnalysisResponse {
    // Provide defaults for missing required fields
    const defaultData: ValidatedInvoiceData = {
      name: data.name || 'Unknown Vendor',
      amount: data.amount || 0,
      currency: data.currency || 'USD',
      date: data.date || new Date().toISOString().split('T')[0],
    };

    // Validate using Zod schema
    try {
      const validated = invoiceDataSchema.parse(defaultData);

      // Additional business logic validation
      if (validated.amount <= 0) {
        throw new Error('Could not extract a valid amount from the invoice');
      }

      return validated;
    } catch (error) {
      logger.error('Data validation failed:', error);
      throw new Error(
        `Invalid invoice data extracted: ${error instanceof Error ? error.message : 'Unknown validation error'}`
      );
    }
  }
}
