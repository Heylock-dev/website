"use server";

import Firecrawl from "@mendable/firecrawl-js";

export async function scrapeURL(url) {
    const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

    const response = await firecrawl.scrape(url, {
        formats: ['markdown'],
        actions: [
            { type: 'wait', milliseconds: 1500 }
        ]
    });

    console.log(response);
    
    return response;
}

export async function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}