import BankCrawlerInterface from "./BankCrawlerInterface";
import BankCrawler from "./BankCrawler";

export default class AbsaCrawler extends BankCrawler implements BankCrawlerInterface
{
    public async start(): Promise<void> {
        await this.login();
    }

    public async login(): Promise<void> {
        // todo login
    }

    public async getAccounts(): Promise<void> {
        // todo getAccounts
    }

    public async getTransactions(accountIndex = 0): Promise<void> {
        // todo getTransactions
    }
}