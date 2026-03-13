import feedparser

def get_world_news():

    url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"

    feed = feedparser.parse(url)

    news = []

    for entry in feed.entries[:10]:
        news.append({
            "title": entry.title,
            "link": entry.link
        })

    return news
