window.AppConfig = {
  NEWS_API_KEY: 'pub_002054ec6eaf4e20a595bdc8f6fd81db', // 請替換為有效 NewsData.io API 密鑰，檢查 https://newsdata.io/dashboard
  validSources: [
    'scmp', 'hk01', 'mingpao', 'orientaldaily', 'hkecon',
    'chinatimes', 'libertytimes', 'udn',
    'nytimes', 'bbc', 'cnn', 'reuters',
    'stheadline', 'dailymailuk', 'rthk',
    'etnet' // 新增經濟通
  ],
  fallbackSources: false,
  sourceLogos: {
    'scmp': 'https://via.placeholder.com/150?text=SCMP',
    'hk01': 'https://via.placeholder.com/150?text=HK01',
    'mingpao': 'https://via.placeholder.com/150?text=Ming+Pao',
    'orientaldaily': 'https://via.placeholder.com/150?text=Oriental+Daily',
    'hkecon': 'https://via.placeholder.com/150?text=HK+Economic+Daily',
    'chinatimes': 'https://via.placeholder.com/150?text=China+Times',
    'libertytimes': 'https://via.placeholder.com/150?text=Liberty+Times',
    'udn': 'https://via.placeholder.com/150?text=United+Daily+News',
    'nytimes': 'https://via.placeholder.com/150?text=NYT',
    'bbc': 'https://via.placeholder.com/150?text=BBC',
    'cnn': 'https://via.placeholder.com/150?text=CNN',
    'reuters': 'https://via.placeholder.com/150?text=Reuters',
    'stheadline': 'https://via.placeholder.com/150?text=Star+Headline',
    'dailymailuk': 'https://via.placeholder.com/150?text=Daily+Mail+UK',
    'rthk': 'https://via.placeholder.com/150?text=RTHK',
    'etnet': 'https://via.placeholder.com/150?text=ETNet', // 新增
    'default': 'https://via.placeholder.com/300x200?text=News'
  },
  regions: {
    '日本': 'jp',
    '台灣': 'tw',
    '韓國': 'kr',
    '新加坡': 'sg',
    '美國': 'us',
    '英國': 'gb',
    '中國': 'cn'
  },
  traditionalChars: new Set(['個', '這', '會', '與', '為', '於', '當', '從', '學', '國', '後', '發']),
  simplifiedChars: new Set(['个', '这', '会', '与', '为', '于', '当', '从', '学', '国', '后', '发'])
  // 注意：部署後檢查 F12 > Console 的 source_id，若無 etnet、stheadline、rthk 等，執行以下代碼查詢有效 source_id：
  // fetch('https://newsdata.io/api/1/sources?apikey=YOUR_API_KEY').then(res => res.json()).then(data => console.log(data.results.map(s => s.source_id)));
};
