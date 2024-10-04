const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

// Initialize Chrome WebDriver
const driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().headless())  // Runs Chrome in headless mode
    .build();

(async function scrapeIndeedJobs() {
    try {
        // Step 1: Open Indeed search page for a specific query
        await driver.get('https://www.indeed.com/jobs?q=software+developer&l=Remote');

        // Step 2: Wait for job listings to load
        await driver.wait(until.elementLocated(By.css('.jobsearch-SerpJobCard')), 10000);

        let jobs = [];

        // Step 3: Scrape job listings from the first page
        let jobCards = await driver.findElements(By.css('.jobsearch-SerpJobCard'));

        for (let jobCard of jobCards) {
            let title = await jobCard.findElement(By.css('h2.title')).getText();
            let company = await jobCard.findElement(By.css('.company')).getText();
            let location = await jobCard.findElement(By.css('.location')).getText();
            let postedDate = await jobCard.findElement(By.css('.date')).getText();

            jobs.push({
                title,
                company,
                location,
                postedDate
            });
        }

        // (Optional) Step 4: Handle pagination and scrape multiple pages
        // Uncomment below if you want to scrape multiple pages
        // let nextButton = await driver.findElement(By.css('.pagination .np'));
        // while (await nextButton.isDisplayed()) {
        //     await nextButton.click();
        //     await driver.wait(until.elementLocated(By.css('.jobsearch-SerpJobCard')), 10000);
        //     let nextJobCards = await driver.findElements(By.css('.jobsearch-SerpJobCard'));
        //     // Scrape the jobs from the next page here (same process as above)
        // }

        // Step 5: Output the data (either save to a file or print to console)
        console.log(JSON.stringify(jobs, null, 2));

        // Optionally, save data to JSON file
        fs.writeFileSync('indeed_jobs.json', JSON.stringify(jobs, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Close the browser
        await driver.quit();
    }
})();
