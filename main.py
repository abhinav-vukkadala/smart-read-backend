import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from google import genai
from google.genai.errors import APIError
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow your React app's address
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],  # Allow all security/content headers
)

class UrlInput(BaseModel):
    url: str

def extract_article_data(url: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        # Catch common network problems (timeouts, DNS issues)
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Fallback 1: If there's no <h1>, look for an <h2> or use a default title
        title = soup.find("h1")
        if title:
            title_text = title.get_text(strip=True)
        else:
            secondary_title = soup.find("h2")
            title_text = secondary_title.get_text(strip=True) if secondary_title else "Untitled Article"
        
        paragraphs = soup.find_all("p")
        body_paragraphs = [p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 30]
        full_body_text = "\n\n".join(body_paragraphs)
        
        return {"title": title_text, "body": full_body_text}
    except requests.exceptions.Timeout:
        print(f"Error: Request timed out for {url}")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e.response.status_code} for {url}")
        return None
    except Exception as e:
        print(f"Unexpected scraping error: {str(e)}")
        return None

def generate_summary(article_text: str):
    # Guard clause: Don't hit the API if the text is completely empty
    if not article_text.strip():
        return None
        
    try:
        client = genai.Client()
        
        prompt = (
            "Analyze the following article text. Provide a highly concise summary consisting of "
            "exactly three bullet points highlighting the main key takeaways. Do not include any "
            "introductory or concluding text.\n\n"
            f"Article Text:\n{article_text}"
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        bullet_points = [line.strip("- * ") for line in response.text.strip().split("\n") if line.strip()]
        
        # Fallback 2: Ensure we always have exactly 3 items even if the AI returned fewer
        while len(bullet_points) < 3:
            bullet_points.append("No additional takeaways provided.")
            
        return bullet_points[:3]
        
    except APIError as e:
        print(f"Gemini API Error (Authentication/Quota): {str(e)}")
        return None
    except Exception as e:
        print(f"Unexpected AI layer error: {str(e)}")
        return None

@app.post("/scrape")
def scrape_endpoint(input_data: UrlInput):
    target_url = input_data.url
    
    # Validate that it's a real HTTP URL string
    if not target_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid URL format. Must start with http:// or https://")
    
    scraped_result = extract_article_data(target_url)
    if not scraped_result or not scraped_result["body"]:
        raise HTTPException(status_code=400, detail="Could not extract readable main content from this website.")
        
    summary_bullets = generate_summary(scraped_result["body"])
    if not summary_bullets:
        raise HTTPException(status_code=500, detail="The AI service was unable to generate a summary for this text.")
        
    return {
        "title": scraped_result["title"],
        "url": target_url,
        "summary": summary_bullets
    }

@app.get("/")
def read_root():
    return {"message": "Smart Read Backend is running!"}