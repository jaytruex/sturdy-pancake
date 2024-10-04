/* eslint-disable no-constant-condition */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const {Builder, By, until} = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

class IndeedScraper {
  constructor(jobQuery, location) {
    this.jobQuery = encodeURIComponent(jobQuery);
    this.location = encodeURIComponent(location);

    const chromeOptions = new chrome.Options();

    // Enable headless mode with additional flags for better behavior
    chromeOptions.addArguments("--headless");
    chromeOptions.addArguments("--disable-gpu");
    chromeOptions.addArguments("--no-sandbox");
    chromeOptions.addArguments("--window-size=1920,1080"); // Set a larger window size for better rendering
    chromeOptions.addArguments("--disable-features=NetworkService");
    chromeOptions.addArguments("--disable-dev-shm-usage"); // Helps prevent resource bottlenecks

    // Set a custom user-agent to mimic a real browser
    chromeOptions.addArguments("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");

    this.driver = new Builder()
        .forBrowser("chrome")
        .setChromeOptions(chromeOptions)
        .build();
  }

  // Method to open the Indeed page with the job query and location
  async openIndeed() {
    try {
      const url = `https://www.indeed.com/jobs?q=${this.jobQuery}&l=${this.location}`;

      console.log(`Opening Indeed website for job query: "${this.jobQuery}" and location: "${this.location}"...`);
      await this.driver.get(url);

      const currentTitle = await this.driver.getTitle();
      console.log(`Current page title: ${currentTitle}`);

      console.log("Waiting for the page title to contain 'Jobs'...");
      await this.driver.wait(until.titleContains("Jobs"), 40000); // Increased timeout to 40 seconds
      console.log("Page loaded successfully.");
    } catch (error) {
      console.error("Failed to load the Indeed website or match the page title:", error);
    }
  }

  // Method to scroll the page to the bottom to load all job listings
  async scrollToBottom() {
    console.log("Starting to scroll the page...");
    let lastHeight = await this.driver.executeScript("return document.body.scrollHeight");

    while (true) {
      console.log("Scrolling further down...");
      await this.driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
      await this.driver.sleep(2000); // Wait for lazy-loaded content to load

      const newHeight = await this.driver.executeScript("return document.body.scrollHeight");
      if (newHeight === lastHeight) {
        console.log("Reached the bottom of the page.");
        break;
      }
      console.log("New content loaded, continuing to scroll...");
      lastHeight = newHeight;
    }
  }

  // Method to scrape job data from the loaded job listings
  async scrapeJobData() {
    try {
      console.log("Waiting for job listings to appear...");
      await this.driver.wait(until.elementLocated(By.css("td.resultContent")), 40000); // Increased timeout for element location
      console.log("Job listings found.");

      const jobCards = await this.driver.findElements(By.css("td.resultContent"));
      const jobs = [];

      for (let i = 0; i < jobCards.length; i++) {
        const jobCard = jobCards[i];
        console.log(`Processing job card ${i + 1} of ${jobCards.length}...`);

        if (await jobCard.isDisplayed()) {
          const jobTitle = await this.safeGetText(jobCard, "h2.jobTitle a span", "Job Title");
          const company = await this.safeGetText(jobCard, "span[data-testid=\"company-name\"]", "Company Name");
          const location = await this.safeGetText(jobCard, "div[data-testid=\"text-location\"]", "Location");
          const salary = await this.safeGetText(jobCard, "div[data-testid=\"attribute_snippet_testid\"].css-1cvvo1b", "Salary", true);
          const jobLinkElement = await jobCard.findElement(By.css("h2.jobTitle a"));
          const jobUrl = await jobLinkElement.getAttribute("href"); // Get the URL

          jobs.push({
            title: jobTitle,
            company: company,
            location: location,
            salary: salary || "Not available",
            url: jobUrl,
          });

          console.log(`Successfully processed job card ${i + 1}:`, {
            title: jobTitle,
            company: company,
            location: location,
            salary: salary || "Not available",
            url: jobUrl,
          });
        } else {
          console.log(`Job card ${i + 1} is not visible, skipping...`);
        }
      }

      console.log("All jobs processed:", jobs);
      return jobs;
    } catch (error) {
      console.error("Error scraping job data:", error);
    }
  }

  // Helper method to safely extract text from an element
  async safeGetText(parentElement, cssSelector, fieldName, optional = false) {
    try {
      const element = await parentElement.findElement(By.css(cssSelector));
      if (await element.isDisplayed()) {
        console.log(`Extracting text from ${fieldName}...`);
        const text = await element.getText();
        console.log(`${fieldName} extracted: ${text}`);
        return text;
      } else {
        throw new Error(`${fieldName} is not visible.`);
      }
    } catch (error) {
      if (!optional) {
        console.error(`Error locating ${fieldName}: ${error.message}`);
      }
      return null;
    }
  }

  // Method to close the browser
  async close() {
    await this.driver.quit();
  }

  // Combined method to perform the entire scraping process
  async scrape() {
    await this.openIndeed(); // Step 1: Open Indeed with the specified query and location
    await this.scrollToBottom(); // Step 2: Scroll to the bottom of the page to load all job listings
    const jobs = await this.scrapeJobData(); // Step 3: Scrape the job listings
    return jobs; // Return the scraped job data
  }
}

// Export the IndeedScraper class
module.exports = IndeedScraper;
