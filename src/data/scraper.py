import requests
from bs4 import BeautifulSoup
import urllib.parse
import time

def crawl(url, visited=None, max_depth=2):
    # ... (error handling and visited set remain the same) ...

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")

        # ... (rest of the code remains the same) ...

        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")

        sidebar_elements = soup.find_all(class_="sidebar")
        body_elements = soup.find_all(class_="docs__body stage_body")

        def extract_headings_paragraphs(elements):
            headings_paragraphs = []
            for element in elements:
                headings = element.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
                paragraphs = element.find_all("p")
                headings_paragraphs.extend(headings)
                headings_paragraphs.extend(paragraphs)
            return headings_paragraphs

        sidebar_hp = extract_headings_paragraphs(sidebar_elements)
        body_hp = extract_headings_paragraphs(body_elements)

        print("\nSidebar Headings and Paragraphs:")
        for item in sidebar_hp:
            print(item.get_text(strip=True))

        print("\nBody Headings and Paragraphs:")
        for item in body_hp:
            print(item.get_text(strip=True))

        time.sleep(2) # add delay of 2 seconds between requests

    except requests.exceptions.RequestException as e:
        print(f"Error accessing {url}: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

#Start crawling
start_url = "https://segment.com/docs/?ref=nav"
crawl(start_url)