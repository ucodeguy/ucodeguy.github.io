window.AppConfig = {
  NEWS_API_KEY: 'pub_0c304e4e636e4fc9b1659cd3eae0482b', // Verify at https://newsdata.io/dashboard
  validSources: [
    'scmp', 'hk01', 'mingpao', 'orientaldaily', 'hkecon',
    'chinatimes', 'libertytimes', 'udn',
    'nytimes', 'bbc', 'cnn', 'reuters',
    'stheadline', 'dailymailuk', 'rthk', 'etnet', 'nypost'
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
    'etnet': 'https://via.placeholder.com/150?text=ETNet',
    'nypost': 'https://via.placeholder.com/150?text=NY+Post',
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
  }
  // To verify source_id, run: fetch('https://newsdata.io/api/1/sources?apikey=pub_0c304e4e636e4fc9b1659cd3eae0482b').then(res => res.json()).then(data => console.log(data.results.map(s => s.source_id)));
};
