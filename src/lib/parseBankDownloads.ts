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
  BANKTRANLIST: {
    STMTTRN: OFXTransaction[];
  };
  LEDGERBAL?: {
    BALAMT?: string;
    DTASOF?: string;
  };
}

interface ParsedOFXData {
  OFX?: {
    BANKMSGSRSV1?: {
      STMTTRNRS?: {
        STMTRS?: OFXStatementResponse;
      };
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

// given a date Find if it was today, or yesterday, otherwise day of the week.
export async function parseBankDownloads(
  files: FileList
): Promise<ParsedBankFile[]> {
  const filesArray = Array.from(files);

  const result = await Promise.all(
    filesArray.map(async (file): Promise<ParsedBankFile> => {
      const data = await file.text();
      const parsedData: ParsedOFXData = await parseOFX(data);
      // Ensure parsedData.OFX exists before accessing its properties
      if (!parsedData.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS) {
        throw new Error("Invalid OFX format: Missing required fields.");
      }

      const statementResponse = parsedData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS;
      const availableBalance = parseFloat(
        statementResponse.LEDGERBAL?.BALAMT || "0"
      );
      const DTASOF = statementResponse?.LEDGERBAL?.DTASOF;
      const balanceDate: Date =
        DTASOF && DTASOF.length >= 8
          ? new Date(
              parseInt(DTASOF.slice(0, 4), 10), // Year
              parseInt(DTASOF.slice(4, 6), 10) - 1, // Month (0-indexed)
              parseInt(DTASOF.slice(6, 8), 10) // Day
            )
          : new Date();

      const accountNumber = statementResponse.BANKACCTFROM.ACCTID;
      const routingNumber = statementResponse.BANKACCTFROM.BANKID;
      const transactions = statementResponse.BANKTRANLIST.STMTTRN || [];
      const normalizedTransactions = transactions
        ? Array.isArray(transactions)
          ? transactions
          : [transactions]
        : [];
      const deposits: ParsedDeposit[] = normalizedTransactions.reduce(
        (act: ParsedDeposit[], transaction: OFXTransaction) => {
          const { TRNAMT, MEMO, NAME, FITID, DTPOSTED } = transaction;

          if (!DTPOSTED || DTPOSTED.length < 8) return act; // Ensure valid date format

          const transactionYear = parseInt(DTPOSTED.slice(0, 4), 10);
          const transactionMonth = parseInt(DTPOSTED.slice(4, 6), 10) - 1; // Month is 0-indexed
          const transactionDay = parseInt(DTPOSTED.slice(6, 8), 10);
          const transactionId = `${FITID}`;
          const transactionDate = new Date(
            transactionYear,
            transactionMonth,
            transactionDay
          );
          const transactionAmount = parseFloat(TRNAMT);

          if (transactionAmount <= 0) return act;

          let transactionType: "creditCard" | "cash" =
            MEMO?.toLowerCase().includes("merchpayout") ||
            NAME?.toLowerCase().includes("merchpayout")
              ? "creditCard"
              : "cash";

          return [
            ...act,
            {
              accountNumber,
              routingNumber,
              transactionId,
              transactionType,
              transactionAmount,
              transactionDate,
            },
          ];
        },
        []
      );

      return {
        availableBalance,
        balanceDate,
        deposits,
        accountNumber,
        routingNumber,
      };
    })
  );
  return result;
}
