import { Page } from "puppeteer-core";

export interface Account {
    name?: string | null;
    number?: string | null;
    balance?: string | null;
}

export interface Transaction {
    date?: string | null;
    amount?: string | null;
    description?: string | null;
    balance?: string | null;
}

export default abstract class BankCrawler {
    protected accounts: Account[] = [];
    constructor(protected page: Page, protected username: string, protected password: string) {}
}