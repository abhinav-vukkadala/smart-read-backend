import requests
from bs4 import BeautifulSoup

def scrape_article(url: str):
    # 1. Define a User-Agent header so websites don't immediately block our request
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        # 2. Fetch the webpage HTML
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Throws an error if the page failed to load
        
        # 3. Parse the HTML text
        soup = BeautifulSoup(response.text, "html.parser")
        
        # 4. Extract the main headline (usually the h1 tag)
        title = soup.find("h1")
        title_text = title.get_text(strip=True) if title else "No Title Found"
        
        # 5. Extract the article body text
        # Most modern news articles wrap their content inside <p> tags
        paragraphs = soup.find_all("p")
        
        # Clean and combine the paragraph texts
        body_paragraphs = []
        for p in paragraphs:
            text = p.get_text(strip=True)
            # Filter out incredibly short fragments (like "Share this article" or footer copyright notes)
            if len(text) > 30:
                body_paragraphs.append(text)
                
        full_body_text = "\n\n".join(body_paragraphs)
        
        return {
            "title": title_text,
            "body": full_body_text
        }
        
    except Exception as e:
        return {"error": f"Failed to parse the website: {str(e)}"}

# --- Test the scraper below ---
if __name__ == "__main__":
    # Feel free to swap this test URL out with a public blog post or news article link!
    test_url = "http://elizabethtai.com/2026/06/10/substack-writers-you-need-a-website/" 
    print(f"Testing scraper on: {test_url}\n")
    
    result = scrape_article(test_url)
    print(f"TITLE: {result.get('title')}\n")
    print(f"BODY SNAPSHOT:\n{result.get('body')[:500]}...")  # Prints the first 500 characters