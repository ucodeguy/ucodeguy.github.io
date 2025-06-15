window.AppConfig = {
  NEWS_API_KEY: 'pub_002054ec6eaf4e20a595bdc8f6fd81db', // 請替換為有效 NewsData.io API 密鑰
  DEEPL_API_KEY: 'YOUR_DEEPL_API_KEY', // 請替換為有效 DeepL API Free 密鑰
  sourceLogos: {
    'scmp': 'https://via.placeholder.com/150?text=SCMP',
    'rthk': 'https://via.placeholder.com/150?text=RTHK',
    'hk01': 'https://via.placeholder.com/150?text=HK01',
    'yahoo': 'https://via.placeholder.com/150?text=Yahoo',
    'nytimes': 'https://via.placeholder.com/150?text=NYT',
    'bbc': 'https://via.placeholder.com/150?text=BBC',
    'cnn': 'https://via.placeholder.com/150?text=CNN',
    'reuters': 'https://via.placeholder.com/150?text=Reuters',
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
};
