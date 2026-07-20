import Papa from "papaparse";
import { readSheet } from "read-excel-file/node";

const DEFAULT_MAX_COLUMNS = 80;
const DEFAULT_MAX_CELL_LENGTH = 5000;
const DEFAULT_MAX_ROWS = 50000;

export type ParsedImportFile = {
  fileType: "csv" | "xlsx";
  headers: string[];
  rows: Record<string, string>[];
  sampleRows: Record<string, string>[];
  totalRows: number;
};

export type ImportParseErrorCode =
  | "EMPTY_FILE"
  | "FILE_PARSE_FAILED"
  | "MISSING_HEADER"
  | "TOO_MANY_ROWS"
  | "UNSUPPORTED_FILE_TYPE";

export class ImportParseError extends Error {
  code: ImportParseErrorCode;

  constructor(code: ImportParseErrorCode, message = code) {
    super(message);
    this.code = code;
    this.name = "ImportParseError";
  }
}

type ImportParseOptions = {
  maxCellLength?: number;
  maxColumns?: number;
  maxRows?: number;
};

function getLimits(options: ImportParseOptions = {}) {
  return {
    maxCellLength: options.maxCellLength ?? DEFAULT_MAX_CELL_LENGTH,
    maxColumns: options.maxColumns ?? DEFAULT_MAX_COLUMNS,
    maxRows: options.maxRows ?? DEFAULT_MAX_ROWS,
  };
}

function getFileType(fileName: string): "csv" | "xlsx" {
  const extension = fileName.toLowerCase().split(".").pop();

  if (extension === "csv") return "csv";
  if (extension === "xlsx") return "xlsx";

  throw new ImportParseError("UNSUPPORTED_FILE_TYPE");
}

function assertFileSignature(fileType: "csv" | "xlsx", buffer: Buffer) {
  if (fileType !== "xlsx") {
    return;
  }

  const hasZipSignature = buffer[0] === 0x50 && buffer[1] === 0x4b;

  if (!hasZipSignature) {
    throw new ImportParseError("FILE_PARSE_FAILED");
  }
}

async function toBuffer(file: File | Buffer) {
  if (Buffer.isBuffer(file)) {
    return file;
  }

  return Buffer.from(await file.arrayBuffer());
}

function cleanCell(value: unknown, maxCellLength = DEFAULT_MAX_CELL_LENGTH) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim().slice(0, maxCellLength);
}

function cleanHeaders(headers: unknown[], maxCellLength: number) {
  return headers.map((header) => cleanCell(header, maxCellLength)).map((header) => header.trim());
}

function isEmptyRow(row: Record<string, string>) {
  return Object.values(row).every((value) => !value.trim());
}

function rowsFromMatrix(matrix: unknown[][], options: ImportParseOptions = {}) {
  const limits = getLimits(options);

  if (matrix.length === 0) {
    throw new ImportParseError("EMPTY_FILE");
  }

  const headers = cleanHeaders(matrix[0] ?? [], limits.maxCellLength);
  const hasHeader = headers.some(Boolean);

  if (!hasHeader) {
    throw new ImportParseError("MISSING_HEADER");
  }

  const uniqueHeaders = headers
    .slice(0, limits.maxColumns)
    .map((header, index) => header || `Column ${index + 1}`);
  const rows = matrix
    .slice(1)
    .map((line) =>
      uniqueHeaders.reduce<Record<string, string>>((row, header, index) => {
        row[header] = cleanCell(line[index], limits.maxCellLength);
        return row;
      }, {}),
    )
    .filter((row) => !isEmptyRow(row));

  if (rows.length > limits.maxRows) {
    throw new ImportParseError("TOO_MANY_ROWS");
  }

  if (rows.length === 0) {
    throw new ImportParseError("EMPTY_FILE");
  }

  return {
    headers: uniqueHeaders,
    rows,
  };
}

function parseCsv(buffer: Buffer, options: ImportParseOptions = {}) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const result = Papa.parse<string[]>(text, {
    delimiter: "",
    skipEmptyLines: false,
  });

  if (result.errors.length > 0) {
    throw new ImportParseError("FILE_PARSE_FAILED");
  }

  return rowsFromMatrix(result.data, options);
}

async function parseXlsx(buffer: Buffer, options: ImportParseOptions = {}) {
  const matrix = await readSheet(buffer, {
    trim: true,
  });

  return rowsFromMatrix(matrix, options);
}

export async function parseImportFile(
  file: File | Buffer,
  fileName: string,
  options: ImportParseOptions = {},
): Promise<ParsedImportFile> {
  const fileType = getFileType(fileName);
  const buffer = await toBuffer(file);
  assertFileSignature(fileType, buffer);

  try {
    const parsed =
      fileType === "csv" ? parseCsv(buffer, options) : await parseXlsx(buffer, options);

    return {
      fileType,
      headers: parsed.headers,
      rows: parsed.rows,
      sampleRows: parsed.rows.slice(0, 20),
      totalRows: parsed.rows.length,
    };
  } catch (error) {
    if (error instanceof ImportParseError) {
      throw error;
    }

    throw new ImportParseError("FILE_PARSE_FAILED");
  }
}
