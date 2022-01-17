import { APIGatewayEvent, Context } from "aws-lambda";
import chromium from "chrome-aws-lambda";
import { Browser } from "puppeteer-core";
import errorHandler from "../errors/handler";
import BankCrawlerInterface from "../banks/BankCrawlerInterface";
import NedbankCrawler from "../banks/NedbankCrawler";
import AbsaCrawler from "../banks/AbsaCrawler";

const banks = {
  nedbank: NedbankCrawler,
  absa: AbsaCrawler
} as const;

enum Banks {
  NEDBANK = "nedbank",
  ABSA = 'absa'
}

interface CrawlerLambdaEvent extends APIGatewayEvent {
  bank: Banks;
  username: string;
  password: string
}

const handler = async (event: CrawlerLambdaEvent, context: Context): Promise<any> => {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log({ event });

  const { bank, username, password } = event;

  let browser: null | Browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 800, // ensure the charts render for a4
        height: 900,
        deviceScaleFactor: 2,
      },
    });

    const page = await browser.newPage();

    const crawler: BankCrawlerInterface = new banks[bank](page, username, password);
    await crawler.start()


    console.log(`PUPPETEER SESSION COMPLETED`);
  } catch (error) {
    errorHandler(error)
    return { body: JSON.stringify({ error }, null, 2), statusCode: 400 };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
    return true;
  }
};

export { handler };
