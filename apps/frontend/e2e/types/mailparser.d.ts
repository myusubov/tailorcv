declare module 'mailparser' {
  export interface ParsedMail {
    subject?: string | null;
    text?: string | null;
    html?: string | false | null;
  }

  export function simpleParser(source: Buffer | string): Promise<ParsedMail>;
}
