from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup

# 1. Initialize the FastAPI app
app = FastAPI()

# 2. Define the data structure our API expects from the user
class UrlInput(BaseModel):
    url: str

# 3. Keep our core scraping logic inside a clean function
def extract_article_data(url: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        title = soup.find("h1")
        title_text = title.get_text(strip=True) if title else "No Title Found"
        
        paragraphs = soup.find_all("p")
        body_paragraphs = [p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 30]
        full_body_text = "\n\n".join(body_paragraphs)
        
        return {
            "title": title_text,
            "body": full_body_text
        }
    except Exception as e:
        # Return None if something goes wrong so our endpoint can handle the error gracefully
        return None

# 4. Our brand new API Endpoint
@app.post("/scrape")
def scrape_endpoint(input_data: UrlInput):
    """
    Accepts a JSON payload containing a 'url', scrapes the page, 
    and returns a clean title and body text.
    """
    # Grab the URL string out of the incoming JSON body
    target_url = input_data.url
    
    # Run the scraper
    scraped_result = extract_article_data(target_url)
    
    # If the scraper failed (network error, bad URL, etc.), return an HTTP 400 error code
    if not scraped_result or not scraped_result["body"]:
        raise HTTPException(status_code=400, detail="Could not extract readable content from this URL.")
        
    return scraped_result

# 5. Keep our simple health check endpoint from Day 1
@app.get("/")
def read_root():
    return {"message": "Smart Read Backend is running!"}