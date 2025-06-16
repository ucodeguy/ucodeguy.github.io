const baseUrl = 'https://newsdata.io/api/1/latest';
const nextPages = { local: null, world: null, finance: null };
const { sourceLogos, regions, validSources, fallbackSources } = window.AppConfig;

// Utility Functions
const utils = {
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
    const currentTimeEl = document.getElementById('current-time');
    if (currentTimeEl) {
      currentTimeEl.textContent = utils.formatDateTime(new Date());
    } else {
      console.warn('Element #current-time not found');
    }
  },

  isWithin72Hours(pubDate) {
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
      return diffMs >= 0 && diffMs <= 72 * 60 * 60 * 1000;
    } catch (error) {
      console.error(`Error parsing pubDate: ${pubDate}`, error);
      return true;
    }
  },

  validateCategory(article, category) {
    const text = (article.title + (article.description || '')).toLowerCase();
    if (category === 'local') {
      return text.includes('香港');
    } else if (category === 'finance') {
      return !text.includes('天氣') && !text.includes('颱風');
    }
    return true;
  },

  clearInvalidCache() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('news_') || key.startsWith('seenTitles_')) {
        try {
          const { data, timestamp } = JSON.parse(localStorage.getItem(key));
          if (!data || !timestamp) {
            console.log(`Clearing invalid cache: ${key}`);
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.warn(`Clearing corrupted cache: ${key}`, error);
          localStorage.removeItem(key);
        }
      }
    });
  }
};

// Render Functions
const render = {
  renderNews(containerId, articles, isHeadline = false, append = false, region = null) {
    const container = document.getElementById(containerId);
    const errorEl = document.getElementById(`${containerId.split('-')[0]}-error`);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      if (errorEl) errorEl.textContent = `渲染錯誤：找不到容器 #${containerId}`;
      return;
    }
    if (!append) container.innerHTML = '';
    if (errorEl) errorEl.classList.add('hidden');

    const category = isHeadline ? '頭條' : region ? region : containerId.split('-')[0];
    let seenTitles = new Set(JSON.parse(localStorage.getItem(`seenTitles_${containerId}`) || '[]'));
    const filteredSources = new Set();

    const filteredArticles = articles.filter(article => {
      if (!article.title || !article.link) {
        console.warn(`Missing title or link for article:`, article);
        return false;
      }
      if (!utils.isWithin72Hours(article.pubDate)) {
        console.log(`Filtered out article due to time: ${article.title}, pubDate: ${article.pubDate}`);
        return false;
      }
      if (!region && !utils.validateCategory(article, category)) {
        console.log(`Filtered out article due to category: ${article.title}`);
        return false;
      }
      const source = (article.source_id || article.source_name || '').toLowerCase();
      // Temporary: Allow all sources for debugging
      // const isValidSource = validSources.some(valid => source.includes(valid));
      // if (!isValidSource) {
      //   console.log(`Filtered out article due to invalid source: ${source}, title: ${article.title}`);
      //   filteredSources.add(source);
      //   return false;
      // }
      return true;
    });
    console.log(`Filtered out ${articles.length - filteredArticles.length} articles for ${category}. Excluded sources:`, [...filteredSources]);

    if (filteredArticles.length === 0) {
      container.innerHTML = `<div class="text-center text-gray-500 text-sm">無新聞，可能原因：無近期數據、API限制或來源不匹配。請檢查 F12 > Console 的 source_id（例如 nypost, etnet, stheadline, rthk）。排除的 source_id：${[...filteredSources].join(', ')}</div>`;
      if (!region && containerId !== 'headline-news') {
        const loadMoreBtn = document.getElementById(`load-more-${category}`);
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
      }
      return;
    }

    if (isHeadline) {
      const article = filteredArticles[0];
      const normalizedTitle = article.title.replace(/[\s\p{P}]/gu, '').toLowerCase();
      seenTitles.add(normalizedTitle);
      const source = (article.source_id || article.source_name || 'unknown').toLowerCase();
      const safeSourceId = validSources.find(valid => source.includes(valid)) || 'default';
      container.innerHTML = `
        <div class="flex flex-col md:flex-row gap-4">
          <img src="${article.image_url || sourceLogos[safeSourceId]}" alt="${article.title}" class="rounded-lg object-cover w-full md:w-1/2 h-64" onerror="this.src='${sourceLogos['default']}'; console.warn('Failed to load image for headline: ${article.image_url || 'no image_url'}, source: ${source}');">
          <div class="flex-1 p-4">
            <h3 class="hero-title ${seenTitles.has(normalizedTitle) ? 'read' : ''}">
              ${article.title} <span class="text-xs text-gray-500 ml-2">${source}</span>
            </h3>
            <p class="mt-2 text-sm">${article.description || '無摘要'}</p>
            <a href="${article.link}" class="accent mt-2 inline-block text-sm font-medium" target="_blank">閱讀更多 <i class="fas fa-arrow-right ml-1"></i></a>
          </div>
        </div>
      `;
    } else if (region) {
      const regionArticles = filteredArticles.slice(0, 3);
      container.innerHTML += `
        <div class="region-group">
          <h4 class="text-lg font-semibold mb-2">${region}</h4>
          <div class="grid grid-cols-1 gap-4">
            ${regionArticles.map((article, index) => {
              const normalizedTitle = article.title.replace(/[\s\p{P}]/gu, '').toLowerCase();
              seenTitles.add(normalizedTitle);
              const source = (article.source_id || article.source_name || 'unknown').toLowerCase();
              return `
                <div class="card bg-white rounded-lg p-4 shadow fade-in" style="animation-delay: ${index * 0.1}s">
                  <h3 class="card-title ${seenTitles.has(normalizedTitle) ? 'read' : ''}">
                    ${article.title} <span class="text-xs text-gray-500 ml-2">${source}</span>
                  </h3>
                  <p class="mt-2 text-sm">${article.description || '無摘要'}</p>
                  <a href="${article.link}" class="accent mt-2 inline-block text-sm font-medium" target="_blank">閱讀更多 <i class="fas fa-arrow-right ml-1"></i></a>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      filteredArticles.slice(0, 12).forEach((article, index) => {
        const isLocal = category === 'local';
        const normalizedTitle = article.title.replace(/[\s\p{P}]/gu, '').toLowerCase();
        seenTitles.add(normalizedTitle);
        const hasHongKong = (article.title + (article.description || '')).toLowerCase().includes('香港');
        const source = (article.source_id || article.source_name || 'unknown').toLowerCase();
        const safeSourceId = validSources.find(valid => source.includes(valid)) || 'default';
        if (!article.image_url) console.warn(`No image_url for article: ${article.title}, using logo for source: ${source}`);
        container.innerHTML += `
          <div class="card bg-white rounded-lg p-4 shadow fade-in" style="animation-delay: ${index * 0.1}s">
            <img src="${article.image_url || sourceLogos[safeSourceId]}" alt="${article.title}" class="w-full h-32 object-cover rounded-lg mb-2" onerror="this.src='${sourceLogos['default']}'; console.warn('Failed to load image: ${article.image_url || 'no image_url'}, source: ${source}');">
            <h3 class="card-title ${seenTitles.has(normalizedTitle) ? 'read' : ''}">
              ${article.title} <span class="text-xs text-gray-500 ml-2">${source}</span>
            </h3>
            ${isLocal && hasHongKong ? '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">香港</span>' : ''}
            <p class="mt-2 text-sm">${article.description || '無摘要'}</p>
            <a href="${article.link}" class="accent mt-2 inline-block text-sm font-medium" target="_blank">閱讀更多 <i class="fas fa-arrow-right ml-1"></i></a>
          </div>
        `;
      });
      const loadMoreBtn = document.getElementById(`load-more-${category}`);
      if (loadMoreBtn) loadMoreBtn.classList.remove('hidden');
    }
    localStorage.setItem(`seenTitles_${containerId}`, JSON.stringify([...seenTitles].slice(0, 100)));
  },

  showError(containerId, message) {
    const errorEl = document.getElementById(`${containerId.split('-')[0]}-error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }
};

// Fetch Functions
const fetch = {
  async fetchNews(apiKey, category = '', containerId, isHeadline = false, append = false) {
    const cacheKey = `news_${category || 'headline'}`;
    let cachedData = null;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        console.log(`Using cached data (expired or not) for ${category || 'headline'}`);
        render.renderNews(containerId, data.results, isHeadline, append);
        if (!isHeadline && data.nextPage) nextPages[containerId.split('-')[0]] = data.nextPage;
        return;
      } catch (error) {
        console.warn(`Invalid cache for ${cacheKey}, clearing cache`, error);
        localStorage.removeItem(cacheKey);
      }
    }
    try {
      let url = `${baseUrl}?apikey=${encodeURIComponent(apiKey)}&language=zh,en`;
      if (isHeadline || category === 'local') {
        url += '&country=hk';
      }
      if (nextPages[containerId.split('-')[0]] && append) {
        url += `&page=${encodeURIComponent(nextPages[containerId.split('-')[0]])}`;
      }
      console.log(`Fetching news: ${url}`);
      const response = await window.fetch(url).catch(e => { throw new Error(`Fetch error: ${e.message}`); });
      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`);
        let errorMessage = '';
        try {
          const errorData = await response.json();
          console.error(`API error details:`, errorData);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          console.warn(`Failed to parse error response:`, e);
          errorMessage = 'Unknown error';
        }
        if (response.status === 429) {
          errorMessage = '新聞 API 請求超限，請稍後重試。';
        } else if (response.status === 401) {
          errorMessage = '新聞 API 密鑰無效，請檢查 config.js。';
        } else if (response.status === 422) {
          errorMessage = `新聞 API 請求無效（422）：${errorMessage}。請檢查 API 文檔（https://newsdata.io/documentation）或參數。`;
        }
        render.showError(containerId, errorMessage);
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log(`Raw API response for ${category || 'headline'}:`, data);
      if (data.status === 'success') {
        if (data.results && data.results.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
          render.renderNews(containerId, data.results, isHeadline, append);
          if (!isHeadline && data.nextPage) nextPages[containerId.split('-')[0]] = data.nextPage;
          if (isHeadline) {
            const lastUpdateEl = document.getElementById('last-update');
            if (lastUpdateEl) lastUpdateEl.textContent = utils.formatDateTime(new Date());
          }
        } else {
          console.warn(`No results for ${category || 'headline'}`);
          render.renderNews(containerId, [], isHeadline, append);
        }
      } else {
        console.error(`API error for ${category || 'headline'}: ${data.message}`);
        render.showError(containerId, `API 錯誤：${data.message}`);
        render.renderNews(containerId, [], isHeadline, append);
      }
    } catch (error) {
      console.error(`Error fetching ${category || 'headline'} news:`, error);
      render.showError(containerId, `載入新聞失敗：${error.message}`);
      render.renderNews(containerId, [], isHeadline, append);
    }
  },

  async fetchRegionalNews(apiKey) {
    const containerId = 'regional-news-content';
    const container = document.getElementById(containerId);
    const errorEl = document.getElementById('regional-error');
    if (!container) {
      console.error(`Container #${containerId} not found`);
      if (errorEl) errorEl.textContent = `渲染錯誤：找不到容器 #${containerId}`;
      return;
    }
    container.innerHTML = '';
    if (errorEl) errorEl.classList.add('hidden');

    for (const [region, countryCode] of Object.entries(regions)) {
      const cacheKey = `news_regional_${region}`;
      let cachedData = null;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          console.log(`Using cached data (expired or not) for ${region}`);
          render.renderNews(containerId, data.results, false, true, region);
          continue;
        } catch (error) {
          console.warn(`Invalid cache for ${cacheKey}, clearing cache`, error);
          localStorage.removeItem(cacheKey);
        }
      }
      try {
        let url = `${baseUrl}?apikey=${encodeURIComponent(apiKey)}&country=${countryCode}&language=zh,en`;
        console.log(`Fetching regional news: ${url}`);
        const response = await window.fetch(url).catch(e => { throw new Error(`Fetch error: ${e.message}`); });
        if (!response.ok) {
          console.error(`API request failed for ${region}: ${response.status} ${response.statusText}`);
          let errorMessage = '';
          try {
            const errorData = await response.json();
            console.error(`API error details:`, errorData);
            errorMessage = errorData.message || JSON.stringify(errorData);
          } catch (e) {
            console.warn(`Failed to parse error response:`, e);
            errorMessage = 'Unknown error';
          }
          if (response.status === 429) {
            errorMessage = `${region}: 新聞 API 請求超限，請稍後重試。`;
          } else if (response.status === 401) {
            errorMessage = `${region}: 新聞 API 密鑰無效，請檢查 config.js。`;
          } else if (response.status === 422) {
            errorMessage = `${region}: 新聞 API 請求無效（422）：${errorMessage}。請檢查 API 文檔。`;
          }
          if (errorEl) {
            errorEl.textContent += `${errorMessage}\n`;
            errorEl.classList.remove('hidden');
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log(`Raw API response for ${region}:`, data);
        if (data.status === 'success' && data.results && data.results.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
          render.renderNews(containerId, data.results, false, true, region);
        } else {
          console.warn(`No results for ${region}, trying broader query`);
          // Fallback: Fetch without country code
          url = `${baseUrl}?apikey=${encodeURIComponent(apiKey)}&language=zh,en&q=${encodeURIComponent(region)}`;
          console.log(`Fetching fallback regional news: ${url}`);
          const fallbackResponse = await window.fetch(url);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.status === 'success' && fallbackData.results.length > 0) {
              localStorage.setItem(cacheKey, JSON.stringify({ data: fallbackData, timestamp: Date.now() }));
              render.renderNews(containerId, fallbackData.results, false, true, region);
            } else {
              render.renderNews(containerId, [], false, true, region);
            }
          } else {
            render.renderNews(containerId, [], false, true, region);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${region} news:`, error);
        if (errorEl) {
          errorEl.textContent += `載入 ${region} 新聞失敗：${error.message}\n`;
          errorEl.classList.remove('hidden');
        }
        render.renderNews(containerId, [], false, true, region);
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
      if (button) {
        button.addEventListener('click', () => {
          try {
            fetch.loadMore(apiKey, category, `${category}-news-content`);
          } catch (error) {
            console.error(`Error loading more ${category} news:`, error);
          }
        });
      } else {
        console.warn(`Load more button #load-more-${category} not found`);
      }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        e.preventDefault();
        try {
          const target = document.querySelector(anchor.getAttribute('href'));
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          } else {
            console.warn(`Scroll target ${anchor.getAttribute('href')} not found`);
          }
        } catch (error) {
          console.error(`Error scrolling to section:`, error);
        }
      });
    });

    const searchToggle = document.getElementById('search-toggle');
    const searchBar = document.getElementById('search-bar');
    if (searchToggle && searchBar) {
      searchToggle.addEventListener('click', () => {
        try {
          searchBar.classList.toggle('hidden');
          if (!searchBar.classList.contains('hidden')) document.getElementById('search').focus();
        } catch (error) {
          console.error(`Error toggling search bar:`, error);
        }
      });
    } else {
      console.warn('Search toggle or bar not found');
    }

    const searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        try {
          const query = e.target.value.toLowerCase();
          ['local-news-content', 'world-news-content', 'finance-news-content', 'regional-news-content'].forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
              section.querySelectorAll('.card').forEach(article => {
                const title = article.querySelector('h3').textContent.toLowerCase();
                const description = article.querySelector('p')?.textContent.toLowerCase() || '';
                article.style.display = title.includes(query) || description.includes(query) ? 'block' : 'none';
              });
            }
          });
        } catch (error) {
          console.error(`Error searching news:`, error);
        }
      });
    } else {
      console.warn('Search input not found');
    }

    const themeLinks = document.querySelectorAll('.theme-link');
    const savedTheme = localStorage.getItem('theme') || 'apple';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeLinks.forEach(link => {
      if (link.getAttribute('data-theme') === savedTheme) link.classList.add('active');
      link.addEventListener('click', e => {
        e.preventDefault();
        try {
          const selectedTheme = link.getAttribute('data-theme');
          document.documentElement.setAttribute('data-theme', selectedTheme);
          localStorage.setItem('theme', selectedTheme);
          themeLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        } catch (error) {
          console.error(`Error switching theme:`, error);
        }
      });
    });
  }
};

// Initialize
function initializeNews(apiKey) {
  utils.clearInvalidCache();
  utils.updateCurrentTime();
  setInterval(utils.updateCurrentTime, 1000);
  try {
    fetch.fetchNews(apiKey, '', 'headline-news', true);
    fetch.fetchNews(apiKey, 'local', 'local-news-content');
    fetch.fetchNews(apiKey, 'world', 'world-news-content');
    fetch.fetchNews(apiKey, 'finance', 'finance-news-content');
    fetch.fetchRegionalNews(apiKey);
    events.setupEventListeners(apiKey);
  } catch (error) {
    console.error(`Error initializing news:`, error);
  }
}
