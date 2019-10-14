import requests
from datetime import datetime
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import time
import mysql.connector

start_time = time.time()

# Connect to database
mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    database="memoryDB"
)

mycursor = mydb.cursor()

# Set start URL
url = "http://memory.gov.ua/news"

# Main loop
while url != "":
    print(url)
    r = requests.get(url)
    site = BeautifulSoup(r.text, "html.parser")
    
    for news in site.select(".page.news"):
        header = news.select_one(".title")
        date_raw = header.contents[0].strip() 
        title = header.contents[1].text.lower()
        link = urljoin(url, news.find('a')['href'])
        date = datetime.strptime(date_raw, "%d.%m.%Y - %H:%M")
        timestamp = date.timestamp()
        main_body = news.select(".body")
        
        # Retrieve and format teaser
        teaser = ""
        for item in main_body:
            if len(item.text) > 3:
                if teaser == "":
                    teaser = item.text.strip()
                else:
                    teaser = teaser + "\n" + item.text.strip()
            else:
                continue
        
        ## SQL insert
        sql = "INSERT INTO memory (title,date,link,teaser) VALUES (%s, %s, %s, %s)"
        val = (title, date, link, teaser)
        mycursor.execute(sql,val)        
        mydb.commit()
    
    # Check existence of next page, create next URL to crawl
    navbutton_next = site.select_one(".pager-next .active")
    if navbutton_next:
        url = urljoin(url, navbutton_next.attrs["href"])
    else:
        url = ""
        print("No further pages to crawl!")
    
print("Time elapsed: %s seconds." % (time.time() - start_time))
print("News column scraped!")

start_time = time.time()

# Read DB in order to get id and link
mycursor.execute("SELECT `id`, `link` FROM memory WHERE 1")
myresult = mycursor.fetchall()

# Loop over result object in order to obtain content
# Update SQL-table
for entry in myresult:
    url = entry[1]
    ident = entry[0]
    
    t = requests.get(url)
    article = BeautifulSoup(t.text)
    a = article.select(".page.news.node .body")
    content = a[0].text.strip()
    
    mycursor.execute("UPDATE memory SET text=%s WHERE id=%s", (content, ident))
    mydb.commit()
    print("Time elapsed to crawl %s URLs: %s seconds." % (ident, time.time() - start_time))


print("Time elapsed: %s seconds." % (time.time() - start_time))
print("Articles scraped!")
