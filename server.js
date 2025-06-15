const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 新聞 API 端點
app.get('/news', async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;
  const categories = ['', 'local', 'world', 'business'];
  try {
    const results = await Promise.all(categories.map(async cat => {
      const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&language=zh${cat ? `&category=${cat}` : ''}&country=hk${cat === 'local' ? '&q=香港' : ''}`;
      const response = await fetch(url);
      return await response.json();
    }));
    // 代理圖片 URL
    const proxiedResults = results.map(result => ({
      ...result,
      results: result.results.map(article => ({
        ...article,
        image_url: article.image_url ? `/proxy-image?url=${encodeURIComponent(article.image_url)}` : null
      }))
    }));
    res.json({
      headline: proxiedResults[0],
      local: proxiedResults[1],
      world: proxiedResults[2],
      finance: proxiedResults[3]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// 圖片代理端點
app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send('Missing image URL');
  }
  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const buffer = await response.buffer();
    res.set('Content-Type', response.headers.get('content-type'));
    res.send(buffer);
  } catch (error) {
    console.error(`Error proxying image ${imageUrl}:`, error);
    res.status(500).send('Failed to load image');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
