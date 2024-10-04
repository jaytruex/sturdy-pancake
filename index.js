const functions = require("firebase-functions");
const IndeedScraper = require("./functions/scraper");  // Import the IndeedScraper class

// Create a Firebase Callable Function
exports.scrapeJobs = functions.https.onCall(async (data, context) => {
    const { jobQuery, location } = data;  // Get jobQuery and location from the request data

    // Check if jobQuery and location are provided
    if (!jobQuery || !location) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with two arguments: jobQuery and location."
        );
    }

    try {
        // Create an instance of the scraper with the provided jobQuery and location
        const scraper = new IndeedScraper(jobQuery, location);

        // Scrape the jobs
        const jobs = await scraper.scrape();

        // Return the scraped jobs
        return { jobs };
    } catch (error) {
        console.error("Error scraping jobs:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Unable to scrape jobs. Try again later."
        );
    } finally {
        await scraper.close();  // Ensure the browser is closed
    }
});
