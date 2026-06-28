import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from google import genai
from dotenv import load_dotenv

# 1. Load the secret environment variables from the .env file
load_dotenv()

app = FastAPI()

class UrlInput(BaseModel):
    url: str

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
        
        return {"title": title_text, "body": full_body_text}
    except Exception:
        return None

# 2. Define the AI summarization logic
def generate_summary(article_text: str):
    """
    Passes the scraped text to Gemini and forces it to return 
    exactly three concise bullet points.
    """
    try:
        # Initialize the client (it automatically looks for GEMINI_API_KEY in your env)
        client = genai.Client()
        
        prompt = (
            "Analyze the following article text. Provide a highly concise summary consisting of "
            "exactly three bullet points highlighting the main key takeaways. Do not include any "
            "introductory or concluding text.\n\n"
            f"Article Text:\n{article_text}"
        )
        
        # Use the fast and highly capable gemini-2.5-flash model
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        # Split the generated text into an array of lines/bullet points
        bullet_points = [line.strip("- * ") for line in response.text.strip().split("\n") if line.strip()]
        
        # Ensure we always return exactly 3 items for our React UI to map over cleanly
        return bullet_points[:3]
        
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return None

# 3. Update the API endpoint to bundle everything together
@app.post("/scrape")
def scrape_endpoint(input_data: UrlInput):
    target_url = input_data.url
    
    # Step A: Scrape the webpage
    scraped_result = extract_article_data(target_url)
    if not scraped_result or not scraped_result["body"]:
        raise HTTPException(status_code=400, detail="Could not extract readable content from this URL.")
        
    # Step B: Pass the text to Gemini for the summary
    summary_bullets = generate_summary(scraped_result["body"])
    if not summary_bullets:
        raise HTTPException(status_code=500, detail="Failed to generate AI summary.")
        
    # Step C: Return the clean, aggregated payload
    return {
        "title": scraped_result["title"],
        "url": target_url,
        "summary": summary_bullets
    }

@app.get("/")
def read_root():
    return {"message": "Smart Read Backend is running!"}