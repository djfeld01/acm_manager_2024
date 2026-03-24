import { parse as parseOFX } from "@/lib/ofxParser";

// Define a type for the parsed OFX structure
interface OFXTransaction {
  TRNAMT: string;
  MEMO?: string;
  NAME?: string;
  FITID: string;
  DTPOSTED: string;
}

interface OFXStatementResponse {
  BANKACCTFROM: {
    ACCTID: string;
    BANKID: string;
  };
  BANKTRANLIST?: {
    STMTTRN?: OFXTransaction | OFXTransaction[];
  };
  LEDGERBAL?: {
    BALAMT?: string;
    DTASOF?: string;
  };
}

interface OFXStatementTrnRs {
  STMTRS?: OFXStatementResponse;
}

interface ParsedOFXData {
  OFX?: {
    BANKMSGSRSV1?: {
      // Some banks (e.g. Huntington) include multiple accounts in one file,
      // which xml2js parses as an array rather than a single object.
      STMTTRNRS?: OFXStatementTrnRs | OFXStatementTrnRs[];
    };
  };
}

// Define a type for the parsed deposit transaction
interface ParsedDeposit {
  accountNumber: string;
  routingNumber: string;
  transactionId: string;
  transactionType: "creditCard" | "cash";
  transactionAmount: number;
  transactionDate: Date;
}

// Define the return type of the function
export interface ParsedBankFile {
  balanceDate: Date;
  availableBalance: number;
  deposits: ParsedDeposit[];
  accountNumber: string;
  routingNumber: string;
}

function parseStatementResponse(statementResponse: OFXStatementResponse): ParsedBankFile {
  const availableBalance = parseFloat(
    statementResponse.LEDGERBAL?.BALAMT || "0"
  );
  const DTASOF = statementResponse.LEDGERBAL?.DTASOF;
  const balanceDate: Date =
    DTASOF && DTASOF.length >= 8
      ? new Date(
          parseInt(DTASOF.slice(0, 4), 10),
          parseInt(DTASOF.slice(4, 6), 10) - 1,
          parseInt(DTASOF.slice(6, 8), 10)
        )
      : new Date();

  const accountNumber = statementResponse.BANKACCTFROM.ACCTID;
  const routingNumber = statementResponse.BANKACCTFROM.BANKID;

  const rawTransactions = statementResponse.BANKTRANLIST?.STMTTRN;
  const normalizedTransactions: OFXTransaction[] = rawTransactions
    ? Array.isArray(rawTransactions)
      ? rawTransactions
      : [rawTransactions]
    : [];

  const deposits: ParsedDeposit[] = normalizedTransactions.reduce(
    (act: ParsedDeposit[], transaction: OFXTransaction) => {
      const { TRNAMT, MEMO, NAME, FITID, DTPOSTED } = transaction;

      if (!DTPOSTED || DTPOSTED.length < 8) return act;

      const transactionYear = parseInt(DTPOSTED.slice(0, 4), 10);
      const transactionMonth = parseInt(DTPOSTED.slice(4, 6), 10) - 1;
      const transactionDay = parseInt(DTPOSTED.slice(6, 8), 10);
      const transactionId = `${FITID}`;
      const transactionDate = new Date(transactionYear, transactionMonth, transactionDay);
      const transactionAmount = parseFloat(TRNAMT);

      if (transactionAmount <= 0) return act;

      const transactionType: "creditCard" | "cash" =
        MEMO?.toLowerCase().includes("merchpayout") ||
        NAME?.toLowerCase().includes("merchpayout")
          ? "creditCard"
          : "cash";

      return [
        ...act,
        { accountNumber, routingNumber, transactionId, transactionType, transactionAmount, transactionDate },
      ];
    },
    []
  );

  return { availableBalance, balanceDate, deposits, accountNumber, routingNumber };
}

export async function parseBankDownloads(
  files: FileList
): Promise<ParsedBankFile[]> {
  const filesArray = Array.from(files);

  const results = await Promise.all(
    filesArray.map(async (file): Promise<ParsedBankFile[]> => {
      const data = await file.text();
      const parsedData: ParsedOFXData = await parseOFX(data);

      if (!parsedData.OFX?.BANKMSGSRSV1?.STMTTRNRS) {
        throw new Error("Invalid OFX format: Missing required fields.");
      }

      // Normalize to array — some banks include multiple accounts per file
      const stmttrnrs = parsedData.OFX.BANKMSGSRSV1.STMTTRNRS;
      const stmttrnrsArray = Array.isArray(stmttrnrs) ? stmttrnrs : [stmttrnrs];

      return stmttrnrsArray
        .map((item) => item.STMTRS)
        .filter((sr): sr is OFXStatementResponse => sr != null)
        .map(parseStatementResponse);
    })
  );

  return results.flat();
}
