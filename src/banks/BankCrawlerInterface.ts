export default interface BankCrawlerInterface {
    start: () => Promise<void>;
    login: () => Promise<void>;
    getAccounts: () => Promise<void>;
    getTransactions: (accountIndex: number) => Promise<void>;
}