window.AppConfig = {
  NEWS_API_KEY: 'pub_002054ec6eaf4e20a595bdc8f6fd81db', // 請替換為有效 NewsData.io API 密鑰
  validSources: [
    'scmp', 'hk01', // 香港現有
    'mingpao', 'orientaldaily', 'hkecon', // 香港新增
    'chinatimes', 'libertytimes', 'udn', // 台灣新增
    'nytimes', 'bbc', 'cnn', 'reuters' // 英文
  ],
  fallbackSources: false, // 禁用非指定來源
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
    'default': 'https://via.placeholder.com/300x200?text=News' // 預設圖片
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
  // 注意：部署後檢查 F12 > Console 的 source_id，若無 mingpao、libertytimes 等，聯繫 NewsData.io 或更新 validSources
};
