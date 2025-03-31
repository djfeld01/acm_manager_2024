import { Parser as XmlParser } from "xml2js";

/**
 * Converts SGML-like content to well-formed XML.
 * @param sgml - The SGML string to convert.
 * @returns The formatted XML string.
 */
function sgml2Xml(sgml: string): string {
  return sgml
    .replace(/>\s+</g, "><") // remove whitespace between tag close/open
    .replace(/\s+</g, "<") // remove whitespace before a close tag
    .replace(/>\s+/g, ">") // remove whitespace after a close tag
    .replace(/<([A-Za-z0-9_]+)>([^<]+)<\/\1>/g, "<$1>$2") // remove redundant closing tags
    .replace(/<([A-Z0-9_]*)+\.+([A-Z0-9_]*)>([^<]+)/g, "<$1$2>$3")
    .replace(/<(\w+?)>([^<]+)/g, "<$1>$2</$1>"); // Ensure all tags have closing pairs
}

/**
 * Parses an XML string into a JavaScript object.
 * @param xml - The XML string to parse.
 * @returns A promise resolving to the parsed XML object.
 */
function parseXml<T = any>(xml: string): Promise<T> {
  const xmlParser = new XmlParser({ explicitArray: false });
  return new Promise((resolve, reject) => {
    xmlParser.parseString(xml, (err: Error | null, result: T) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Represents the header structure extracted from an OFX file.
 */
interface OfxHeader {
  [key: string]: string | undefined;
}

/**
 * Represents the parsed OFX data.
 */
interface ParsedOfxData {
  OFX: {
    BANKMSGSRSV1: {
      STMTTRNRS: {
        STMTRS: {
          BANKACCTFROM: {
            ACCTID: string;
            BANKID: string;
          };
          BANKTRANLIST: {
            STMTTRN: Array<{
              TRNAMT: string;
              MEMO?: string;
              NAME?: string;
              FITID: string;
              DTPOSTED: string;
            }>;
          };
          LEDGERBAL?: {
            BALAMT?: string;
          };
        };
      };
    };
  };
}

/**
 * Parses an OFX data string.
 * @param data - The OFX data string.
 * @returns A promise resolving to the parsed data object.
 */
function parse(data: string): Promise<ParsedOfxData> {
  // Split into header attributes and footer SGML
  const ofxParts = data.split("<OFX>", 2);

  // Parse the headers
  const headerLines = ofxParts[0].split(/\r?\n/);
  const header: OfxHeader = {};
  headerLines.forEach((attrs) => {
    const headAttr = attrs.split(/:/, 2);
    if (headAttr.length === 2) {
      header[headAttr[0].trim()] = headAttr[1].trim();
    }
  });

  // Make the SGML into proper XML content
  const content = "<OFX>" + ofxParts[1];

  // Try parsing as XML first; if it fails, convert SGML to XML and try again
  return parseXml(content)
    .catch(() => parseXml(sgml2Xml(content)))
    .then((parsedData) => {
      // Include headers in the parsed output
      return { ...parsedData, header };
    });
}

// Export parse function
export { parse };
