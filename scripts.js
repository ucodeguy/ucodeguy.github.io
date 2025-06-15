const baseUrl = 'https://newsdata.io/api/1/latest';
const nextPages = { local: null, world: null, finance: null };
const { sourceLogos, regions, traditionalChars, simplifiedChars, DEEPL_API_KEY } = window.AppConfig;
const translationCache = JSON.parse(localStorage.getItem('translationCache') || '{}');

// Utility Functions
const utils = {
  isTraditionalChinese(text) {
    let tradCount = 0, simpCount = 0;
    for (const char of text) {
      if (traditionalChars.has(char)) tradCount++;
      if (simplifiedChars.has(char)) simpCount++;
    }
    return tradCount > simpCount && tradCount > 5 ? tradCount / (tradCount + simpCount + 1) : 0;
  },

  isEnglish(text) {
    const cleanText = text.replace(/[\u4e00-\u9fff]/g, '');
    return /^[A-Za-z0-9\s.,!?]+$/.test(cleanText) && cleanText.length > 10;
  },

  async translateText(text, targetLang) {
    const cacheKey = `${text.slice(0, 100)}:${targetLang}`;
    if (translationCache[cacheKey] && Date.now() - translationCache[cacheKey].timestamp < 60 * 60 * 1000) {
      console.log(`Using cached translation for ${cacheKey}`);
      return translationCache[cacheKey].translated;
    }
    try {
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          auth_key: DEEPL_API_KEY,
          text: text,
          target_lang: targetLang === 'zh-TW' ? 'ZH' : 'EN' // DeepL 使用 ZH 自動適配繁體
        })
      });
      if (!response.ok) {
        console.error(`Translation failed: ${response.status} ${response.statusText}`);
        if (response.status === 429) {
          return `${text} (翻譯超限)`;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.translations && data.translations[0]) {
        const translated = data.translations[0].text;
        translationCache[cacheKey] = { translated, timestamp: Date.now() };
        localStorage.setItem('translationCache', JSON.stringify(translationCache));
        return translated;
      }
      throw new Error('Invalid translation response');
    } catch (error) {
      console.error(`Error translating to ${targetLang}:`, error);
      return `${text} (翻譯失敗)`;
    }
  },

  formatDateTime(date) {
    return date.toLocaleString('zh-TW', {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  },

  updateCurrentTime() {
    document.getElementById('current-time').textContent = utils.formatDateTime(new Date());
  },

  isWithin48Hours(pubDate) {
    if (!pubDate) {
      console.warn('No pubDate, assuming current time');
      return true;
    }
    try {
      let articleDate = new Date(pubDate);
      if (isNaN(articleDate.getTime())) {
        articleDate = new Date(pubDate.replace(' ', 'T'));
      }
      if (isNaN(articleDate.getTime())) {
        console.warn(`Invalid pubDate: ${pubDate}, assuming current time`);
        return true;
      }
      const now = new Date();
      const diffMs = now - articleDate;
      return diffMs >= 0 && diffMs <= 48 * 60 * 60 * 1000;
    } catch (error) {
      console.error(`Error parsing pubDate: ${pubDate}`, error);
      return true;
    }
  },

  validateCategory(article, category) {
    const text = (article.title + (article.description || '')).toLowerCase();
    if (category === 'local' || category === 'world' || category === 'regional') {
      return true;
    } else if (category === 'finance') {
      return !text.includes('天氣') && !text.includes('颱風');
    }
    return true;
  }
};

// Render Functions
const render = {
  async renderNews(containerId, articles, isHeadline = false, append = false, region = null) {
    const container = document.getElementById(containerId);
    if (!append) container.innerHTML = '';
    const category = isHeadline ? '頭條' : region ? region : containerId.split('-')[0];

    let seenTitles = new Set(JSON.parse(localStorage.getItem('seenTitles') || '[]'));

    const filteredArticles = articles.filter(article => {
      if (!article.title || !article.link) {
        console.warn(`Missing title or link for article:`, article);
        return false;
      }
      if (!utils.isWithin48Hours(article.pubDate)) {
        console.log(`Filtered out article due to time: ${article.title}, pubDate: ${article.pubDate}`);
        return false;
      }
      if (!region && !utils.validateCategory(article, category)) {
        console.log(`Filtered out article due to category: ${article.title}`);
        return false;
      }
      return true;
    });
    console.log(`Filtered out ${articles.length - filteredArticles.length} articles for ${category}`);

    const articlesWithTranslations = await Promise.all(filteredArticles.map(async article => {
      const isTrad = utils.isTraditionalChinese(article.title);
      const isEng = utils.isEnglish(article.title);
      let tradTitle = isTrad ? article.title : await utils.translateText(article.title, 'zh-TW');
      let engTitle = isEng ? article.title : await utils.translateText(article.title, 'en');
      let tradDesc = isTrad ? (article.description || '無摘要') : await utils.translateText(article.description || '無摘要', 'zh-TW');
      let engDesc = isEng ? (article.description || '無摘要') : await utils.translateText(article.description || '無摘要', 'en');
      return {
        article,
        tradTitle: tradTitle || (isTrad ? article.title : `${article.title} (翻譯失敗)`),
        engTitle: engTitle || (isEng ? article.title : `${article.title} (翻譯失敗)`),
        tradDesc: tradDesc || (isTrad ? (article.description || '無摘要') : `${article.description || '無摘要'} (翻譯失敗)`),
        engDesc: engDesc || (isEng ? (article.description || '無摘要') : `${article.description || '無摘要'} (翻譯失敗)`),
        tradScore: isTrad ? 1 : 0.5,
        engScore: isEng ? 1 : 0.5
      };
    }));

    articlesWithTranslations.sort((a, b) => (b.tradScore + b.engScore) - (a.tradScore + a.engScore));
    const sortedArticles = articlesWithTranslations;

    if (sortedArticles.length === 0) {
      container.innerHTML = `<div class="text-center text-gray-500">無可用新聞，可能原因：無近期數據或API限制，請稍後重試</div>`;
      if (!region) document.getElementById(`load-more-${category}`)?.classList.add('hidden');
      return;
    }

    if (isHeadline) {
      const { article, tradTitle, engTitle, tradDesc, engDesc } = sortedArticles[0];
      const normalizedTitle = article.title.replace(/[\s\p{P}]/gu, '').toLowerCase();
      seenTitles.add(normalizedTitle);
      const source = article.source_id || article.source_name || '未知來源';
      const isYahooOrRTHK = source.toLowerCase().includes('yahoo') || source.toLowerCase().includes('rthk');
      container.innerHTML = `
        <img src="${isYahooOrRTHK ? (sourceLogos[source.toLowerCase()] || sourceLogos['default']) : (article.image_url || sourceLogos['default'])}" alt="${article.title}" class="rounded-lg object-contain" onerror="this.src=sourceLogos['${article.source_id || 'default'}'] || sourceLogos['default']; console.warn('Failed to load image: ${article.image_url}');">
        <div class="ml-6 flex-1">
          <h3 class="font-semibold ${seenTitles.has(normalizedTitle) ? 'read' : ''}">
            [繁] ${tradTitle} <br> [Eng] ${engTitle}
            <span class="text-sm text-gray-500 ml-2">${source}</span>
          </h3>
          <p class="mt-4">[繁] ${tradDesc} <br> [Eng] ${engDesc}</p>
          <a href="${article.link}" class="accent mt-4 inline-block font-medium" target="_blank">閱讀更多 <i class="fas fa-arrow-right ml-1"></i></a>
        </div>
      `;
    } else if (region) {
      const regionArticles = sortedArticles.slice(0, 3);
      container.innerHTML += `
        <div class="region-group">
          <h4 class="fade-in">${region}</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${regionArticles.map(({ article, tradTitle, engTitle, tradDesc, engDesc }, index) => {
              const normalizedTitle = article.title.replace(/[\s\p{P}]/gu, '').toLowerCase();
              seenTitles.add(normalizedTitle);
              const source = article.source_id || article.source_name || '未知來源';
              return `
                <div class="card rounded-xl p-6 fade-in" style="animation-delay: ${index * 0.1}s">
                  <h3 class="text-xl font-semibold ${seenTitles.has(normalizedTitle) ? 'read' : ''}">
                    [繁] ${tradTitle} <br> [Eng] ${engTitle}
                    <span class="text-sm text-gray-500 ml-2">${source}</span>
                  </h3>
                  <p class="mt-2">[繁] ${tradDesc} <br> [Eng] ${engDesc}</p>
                  <a href="${article.link}" class="accent mt-4 inline-block font-medium" target="_blank">閱讀更多 <i class="fas fa-arrow-right ml-1"></i></a>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      sortedArticles.slice(0, 6).forEach(({ article, tradTitle, engTitle, tradDesc, engDesc }, index) => {
        const isLocal = category === 'local';
        const normalizedTitle = article.title.replace(/[\s\p{P}]/gu, '').toLowerCase();
        seenTitles.add(normalizedTitle);
        const hasHongKong = (article.title + (article.description || '')).toLowerCase().includes('香港');
        const source = article.source_id || article.source_name || '未知來源';
        const isYahooOrRTHK = source.toLowerCase().includes('yahoo') || source.toLowerCase().includes('rthk');
        if (!article.image_url) console.warn(`No image_url for article: ${article.title}`);
        container.innerHTML += `
          <div class="card rounded-xl p-6 fade-in" style="animation-delay: ${index * 0.1}s">
            <img src="${isYahooOrRTHK ? (sourceLogos[source.toLowerCase()] || sourceLogos['default']) : (article.image_url || sourceLogos['default'])}" alt="${article.title}" class="w-full h-48 object-contain rounded-lg mb-4" onerror="this.src=sourceLogos['${article.source_id || 'default'}'] || sourceLogos['default']; console.warn('Failed to load image: ${article.image_url}');">
            <h3 class="text-xl font-semibold ${seenTitles.has(normalizedTitle) ? 'read' : ''}">
              [繁] ${tradTitle} <br> [Eng] ${engTitle}
              <span class="text-sm text-gray-500 ml-2">${source}</span>
            </h3>
            ${isLocal && hasHongKong ? '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">香港</span>' : ''}
            <p class="mt-2">[繁] ${tradDesc} <br> [Eng] ${engDesc}</p>
            <a href="${article.link}" class="accent mt-4 inline-block font-medium" target="_blank">閱讀更多 <i class="fas fa-arrow-right ml-1"></i></a>
          </div>
        `;
      });
      document.getElementById(`load-more-${category}`)?.classList.remove('hidden');
    }
    localStorage.setItem('seenTitles', JSON.stringify([...seenTitles].slice(0, 100)));
  }
};

// Fetch Functions
const fetch = {
  async fetchNews(apiKey, category = '', containerId, isHeadline = false, append = false, fallback = false) {
    const cacheKey = `news_${category || 'headline'}_${fallback}`;
    let cachedData = null;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 3 * 60 * 1000) {
          console.log(`Using cached data for ${category || 'headline'}`);
          await render.renderNews(containerId, data.results, isHeadline, append);
          if (!isHeadline && data.nextPage) nextPages[containerId.split('-')[0]] = data.nextPage;
          return;
        }
        cachedData = data;
      } catch (error) {
        console.warn(`Invalid cache for ${cacheKey}, clearing cache`, error);
        localStorage.removeItem(cacheKey);
      }
    }
    try {
      let url = `${baseUrl}?apikey=${encodeURIComponent(apiKey)}`;
      if (isHeadline) {
        url += '&category=top&country=hk';
      } else if (category === 'local' && !fallback) {
        url += '&category=local&country=hk';
      } else if (category === 'world') {
        url += '&category=world';
      } else if (category === 'business') {
        url += '&category=business';
      } else if (fallback) {
        url += '&country=hk';
      }
      if (nextPages[containerId.split('-')[0]] && append) {
        url += `&page=${encodeURIComponent(nextPages[containerId.split('-')[0]])}`;
      }
      console.log(`Fetching news: ${url}`);
      const response = await window.fetch(url);
      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`);
        if (response.status === 429) {
          document.getElementById(containerId).innerHTML = '<div class="text-center text-red-500">News API 請求超限，請稍後重試</div>';
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log(`API response for ${category || 'headline'}:`, data);
      if (data.status === 'success') {
        if (data.results && data.results.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
          await render.renderNews(containerId, data.results, isHeadline, append);
          if (!isHeadline && data.nextPage) nextPages[containerId.split('-')[0]] = data.nextPage;
          if (isHeadline) document.getElementById('last-update').textContent = utils.formatDateTime(new Date());
        } else {
          console.warn(`No results for ${category || 'headline'}`);
          if (cachedData) {
            console.log(`Using expired cached data for ${category || 'headline'}`);
            await render.renderNews(containerId, cachedData.results, isHeadline, append);
          } else {
            await render.renderNews(containerId, [], isHeadline);
            if (category === 'local' && !fallback) {
              console.log('Falling back to country=hk for local news');
              fetch.fetchNews(apiKey, '', 'local-news', false, append, true);
            }
          }
        }
      } else {
        console.error(`API error for ${category || 'headline'}: ${data.message}`);
        if (cachedData) {
          console.log(`Using expired cached data for ${category || 'headline'}`);
          await render.renderNews(containerId, cachedData.results, isHeadline, append);
        } else {
          await render.renderNews(containerId, [], isHeadline);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${category || 'headline'} news:`, error);
      if (cachedData) {
        console.log(`Using expired cached data for ${category || 'headline'}`);
        await render.renderNews(containerId, cachedData.results, isHeadline, append);
      } else {
        await render.renderNews(containerId, [], isHeadline);
      }
    }
  },

  async fetchRegionalNews(apiKey) {
    const container = document.getElementById('regional-news');
    container.innerHTML = '';
    for (const [region, countryCode] of Object.entries(regions)) {
      const cacheKey = `news_regional_${region}`;
      let cachedData = null;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 3 * 60 * 1000) {
            console.log(`Using cached data for ${region}`);
            await render.renderNews('regional-news', data.results, false, true, region);
            continue;
          }
          cachedData = data;
        } catch (error) {
          console.warn(`Invalid cache for ${cacheKey}, clearing cache`, error);
          localStorage.removeItem(cacheKey);
        }
      }
      try {
        const url = `${baseUrl}?apikey=${encodeURIComponent(apiKey)}&country=${countryCode}`;
        console.log(`Fetching regional news: ${url}`);
        const response = await window.fetch(url);
        if (!response.ok) {
          console.error(`API request failed for ${region}: ${response.status} ${response.statusText}`);
          if (response.status === 429) {
            container.innerHTML += `<div class="text-center text-red-500">${region}: News API 請求超限，請稍後重試</div>`;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log(`API response for ${region}:`, data);
        if (data.status === 'success' && data.results && data.results.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
          await render.renderNews('regional-news', data.results, false, true, region);
        } else {
          console.warn(`No results for ${region}`);
          if (cachedData) {
            console.log(`Using expired cached data for ${region}`);
            await render.renderNews('regional-news', cachedData.results, false, true, region);
          } else {
            await render.renderNews('regional-news', [], false, true, region);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${region} news:`, error);
        if (cachedData) {
          console.log(`Using expired cached data for ${region}`);
          await render.renderNews('regional-news', cachedData.results, false, true, region);
        } else {
          await render.renderNews('regional-news', [], false, true, region);
        }
      }
    }
  },

  loadMore(apiKey, category, containerId) {
    fetch.fetchNews(apiKey, category, containerId, false, true);
  }
};

// Event Handlers
const events = {
  setupEventListeners(apiKey) {
    ['local', 'world', 'finance'].forEach(category => {
      const button = document.getElementById(`load-more-${category}`);
      if (button) button.addEventListener('click', () => fetch.loadMore(apiKey, category, `${category}-news`));
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector(anchor.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
      });
    });

    const searchToggle = document.getElementById('search-toggle');
    const searchBar = document.getElementById('search-bar');
    searchToggle.addEventListener('click', () => {
      searchBar.classList.toggle('hidden');
      if (!searchBar.classList.contains('hidden')) document.getElementById('search').focus();
    });

    document.getElementById('search').addEventListener('input', e => {
      const query = e.target.value.toLowerCase();
      ['local-news', 'world-news', 'finance-news', 'regional-news'].forEach(sectionId => {
        document.querySelectorAll(`#${sectionId} .card`).forEach(article => {
          const title = article.querySelector('h3').textContent.toLowerCase();
          const description = article.querySelector('p')?.textContent.toLowerCase() || '';
          article.style.display = title.includes(query) || description.includes(query) ? 'block' : 'none';
        });
      });
    });

    const themeLinks = document.querySelectorAll('.theme-link');
    const savedTheme = localStorage.getItem('theme') || 'apple';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeLinks.forEach(link => {
      if (link.getAttribute('data-theme') === savedTheme) link.classList.add('active');
      link.addEventListener('click', e => {
        e.preventDefault();
        const selectedTheme = link.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', selectedTheme);
        localStorage.setItem('theme', selectedTheme);
        themeLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }
};

// Initialize
function initializeNews(apiKey) {
  utils.updateCurrentTime();
  setInterval(utils.updateCurrentTime, 1000);
  fetch.fetchNews(apiKey, '', 'headline', true);
  fetch.fetchNews(apiKey, 'local', 'local-news');
  fetch.fetchNews(apiKey, 'world', 'world-news');
  fetch.fetchNews(apiKey, 'business', 'finance-news');
  fetch.fetchRegionalNews(apiKey);
  events.setupEventListeners(apiKey);
}
