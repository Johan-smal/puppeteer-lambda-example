import BankCrawlerInterface from "./BankCrawlerInterface";
import BankCrawler, { Transaction } from "./BankCrawler";
import LoginFailed from "../errors/LoginFailed";
import { HTTPResponse } from "puppeteer-core";
import path from 'path'

export default class NedbankCrawler extends BankCrawler implements BankCrawlerInterface
{
    async start(): Promise<void> {
        await this.login();
        await this.getAccounts();
        await this.getTransactions(0);
        await this.downloadStatements(0);
    }

    public async login(): Promise<void> {
        await this.page.goto('https://secured.nedbank.co.za/');
        await this.page.waitForSelector("#username", { timeout: 10000 });
        
        /** Type username and password and submit form */
        await this.page.type("#username", this.username);
        await this.page.type("#password", this.password);
        await this.page.click('#log_in');
        
        try {
            await this.page.waitForSelector(".dashboard-container", { timeout: 8000 });
        } catch (e) {
            throw new LoginFailed();
        }
    }

    public async getAccounts(): Promise<void> {
        await this.page.waitForSelector(".Bank .account-list .account-row", { timeout: 8000 })
        this.accounts = await this.page.$$eval('.Bank .account-list .account-row',
            (accountElements: Element[]) => {
                return accountElements.map((el: Element) => {
                    return {
                        name: el.querySelector('.account-name:not(:empty)')?.textContent,
                        number: el.querySelector('.account-number')?.textContent,
                        balance: el.querySelector('.available-balance')?.textContent
                    }
                })
            });
            
        console.log(this.accounts);
    }

    public async getTransactions(accountIndex = 0): Promise<void> {
        await this.page.waitForSelector('a[aria-label="Overview"]', { timeout: 8000 });
        await this.page.click('a[aria-label="Overview"]');
        
        /** Click on account based on the index */
        const link = await this.page.waitForSelector(`.account-details-row div:nth-child(${accountIndex + 1}) > div > div > div`, { timeout: 8000 });
        if (link) await link.click();

        await this.page.waitForText('View more transactions', { timeout: 8000 });
        await this.page.click('.lazy-load-transactions button');
        await this.page.waitForText('View more transactions', { timeout: 8000 });
        await this.page.click('.lazy-load-transactions button');

        // Wait for final transactions to load 
        await this.page.waitForTimeout(2000);
        
        const transactions: Transaction[] = await this.page
            .$$eval('.transactions-list-container tr.selectable',
            (transactionElements: Element[]) => {
                return transactionElements.map((el: Element) => {
                    return {
                        date: el.querySelector('p.date')?.textContent,
                        amount: el.querySelector('td.amount')?.textContent,
                        description: el.querySelector('div.title')?.textContent,
                        balance: el.querySelector('td.balance')?.textContent
                    }
                })
            });
        
        console.log(transactions)
    }

    public async downloadStatements(accountIndex = 0): Promise<void> {
        const client = await this.page.target().createCDPSession();
        await client.send("Page.setDownloadBehavior", {
            behavior: "allow",
            downloadPath: path.resolve(__dirname, "download")
        });
        await this.page.waitForSelector('a[aria-label="Overview"]', { timeout: 10000});
        await this.page.click('a[aria-label="Overview"]');
        
        /** Click on account based on the index */
        await this.page.waitForText(this.accounts[accountIndex].number || '', { timeout: 10000 });
        const link = await this.page.waitForSelector(`.account-details-row div:nth-child(${accountIndex + 1}) > div > div > div`, { timeout: 10000 });
        if (link) {
            await this.page.waitForTimeout(500);
            await link.click(); 
        }

        await this.page.waitForXPath("//a[contains(., 'Statements and documents')]", { timeout: 10000})
        await this.page.waitForTimeout(500);
        const [statementsLink] = await this.page.$x("//a[contains(., 'Statements and documents')]");
        if (statementsLink) await statementsLink.click();

        await this.page.waitForSelector('.statement-details-container td.data-align', { timeout: 10000 })
        const downloadButton = await this.page.$('div.download-statement');
        await downloadButton?.click();

        const pdfResponse: HTTPResponse = await this.page.waitForResponse((response: HTTPResponse) => response.headers()['content-type'] === 'pdf', { timeout: 10000 })
        console.log('pdfResponse', { 
            buffer: await pdfResponse.buffer(), 
            url: pdfResponse.url(),
            'content-type': pdfResponse.headers()['content-type']
        })
        /** Download the file */
        
    }
}