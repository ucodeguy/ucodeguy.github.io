const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/news', async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY; // 設置在環境變量中
  const categories = ['', 'local', 'world', 'business'];
  try {
    const results = await Promise.all(categories.map(async cat => {
      const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&language=zh${cat ? `&category=${cat}` : ''}&country=hk${cat === 'local' ? '&q=香港' : ''}`;
      const response = await fetch(url);
      return await response.json();
    }));
    res.json({
      headline: results[0],
      local: results[1],
      world: results[2],
      finance: results[3]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});