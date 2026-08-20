// js/data.js - DopaTodo Master Data & State Schema
// Supported Recurring Frequencies: daily, weekdays, weekends, weekly, monthly

export const APP_VERSION = '2.3.0';

export const RELEASE_NOTES = {
  version: '2.3.0',
  title: '✨ DopaTodo v2.3 UIスリム化＆広告リワード解禁！',
  date: '2026-08-20',
  giftGems: 300,
  features: [
    {
      icon: '🧹',
      title: 'UIスリム化（FEVER撤去）',
      desc: 'FEVERゲージを整理し、ToDo画面がよりシンプルで集中しやすいレイアウトに生まれ変わりました。'
    },
    {
      icon: '🎁',
      title: '広告応援リワード（💎 無料ジェム獲得）',
      desc: 'ガチャ画面に広告応援枠を新設！タップして応援するとガチャ石を無料で獲得できます。'
    },
    {
      icon: '⚔️',
      title: '超ド迫力バトルダメージ表記',
      desc: '3Dポップアップ、斬撃スラッシュ、火花パーティクル、コンボチェインバッジを完全搭載！'
    }
  ]
};

export const DIFFICULTIES = {
  1: { level: 1, stars: '★',      label: '10秒ドパ', gems: 20,  coins: 40,   gemsMin: 10,  gemsMax: 40,   coinsMin: 20,  coinsMax: 80,   color: '#00ff88', bg: 'rgba(0, 255, 136, 0.15)' },
  2: { level: 2, stars: '★★',    label: 'イージー', gems: 50,  coins: 100,  gemsMin: 30,  gemsMax: 100,  coinsMin: 60,  coinsMax: 200,  color: '#00d2ff', bg: 'rgba(0, 210, 255, 0.15)' },
  3: { level: 3, stars: '★★★',  label: 'ノーマル', gems: 120, coins: 250,  gemsMin: 60,  gemsMax: 240,  coinsMin: 120, coinsMax: 500,  color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)' },
  4: { level: 4, stars: '★★★★', label: 'ハード',   gems: 300, coins: 600,  gemsMin: 150, gemsMax: 600,  coinsMin: 300, coinsMax: 1200, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  5: { level: 5, stars: '★★★★★',label: 'ボス級',  gems: 800, coins: 1600, gemsMin: 400, gemsMax: 1600, coinsMin: 800, coinsMax: 3200, color: '#ff007f', bg: 'rgba(255, 0, 127, 0.2)' }
};

export const RARITIES = {
  N: { name: 'N', label: 'NORMAL', color: '#9e9e9e', glow: 'rgba(158, 158, 158, 0.4)', rate: 60 },
  R: { name: 'R', label: 'RARE', color: '#00d2ff', glow: 'rgba(0, 210, 255, 0.6)', rate: 25 },
  SR: { name: 'SR', label: 'SUPER RARE', color: '#ffd700', glow: 'rgba(255, 215, 0, 0.8)', rate: 10 },
  SSR: { name: 'SSR', label: 'ULTRA RARE', color: '#ff007f', glow: 'rgba(255, 0, 127, 0.9)', rate: 4 },
  UR: { name: 'UR', label: 'GOD RARE', color: '#00ff88', glow: 'rgba(0, 255, 136, 1.0)', rate: 1 }
};

export const TASK_TAGS = [
  { id: 'all', label: 'すべて', icon: '⚡' },
  { id: 'work', label: '仕事/作業', icon: '💼', color: '#00f3ff' },
  { id: 'study', label: '勉強/学習', icon: '📚', color: '#ffd700' },
  { id: 'life', label: '生活/家事', icon: '🏠', color: '#00ff88' },
  { id: 'health', label: '健康/筋トレ', icon: '💪', color: '#ff007f' },
  { id: 'easy', label: '10秒ドパ', icon: '🔥', color: '#a855f7' }
];

export const WEAPONS = [
  // Normal (N)
  { id: 'w_n1', name: '折れた竹やり', rarity: 'N', baseAtk: 15, icon: '🎋', desc: '気休め程度の棒切れ。それでも殴れば痛い。' },
  { id: 'w_n2', name: 'ブルーライトカット眼鏡', rarity: 'N', baseAtk: 25, icon: '👓', desc: '画面を見つめる目を守る。視界が黄ばむ。' },
  { id: 'w_n3', name: '使い古した付箋紙', rarity: 'N', baseAtk: 35, icon: '📑', desc: 'タスクを書いて貼ったが3秒で忘れる。' },
  { id: 'w_n4', name: '安物ボールペン', rarity: 'N', baseAtk: 50, icon: '🖊️', desc: 'インクの出が悪いが、先端で突くとそこそこ痛い。' },

  // Rare (R)
  { id: 'w_r1', name: '冷えたエナドリバズーカ', rarity: 'R', baseAtk: 220, icon: '🥫', desc: 'カフェインとタウリンを高圧噴射。脳がピリつく。' },
  { id: 'w_r2', name: 'メカニカル青軸ナックル', rarity: 'R', baseAtk: 350, icon: '⌨️', desc: 'カチカチと爆音を鳴らして精神を研ぎ澄ます。' },
  { id: 'w_r3', name: '100均タイマーボム', rarity: 'R', baseAtk: 500, icon: '⏱️', desc: 'ピピッ！と鳴るだけで心拍数が跳ね上がる。' },
  { id: 'w_r4', name: '遮音ノイキャンヘッドホン', rarity: 'R', baseAtk: 750, icon: '🎧', desc: '周囲の雑音を完全遮断。自分の鼓動だけが響く。' },

  // Super Rare (SR)
  { id: 'w_sr1', name: '覚醒の電磁レールガン', rarity: 'SR', baseAtk: 3800, icon: '⚡', desc: '電流でシナプスを直撃。思考速度が光速に達する。' },
  { id: 'w_sr2', name: '締切3分前のアドレナリン刀', rarity: 'SR', baseAtk: 6500, icon: '🗡️', desc: '死線に追い詰められた時のみ真の切れ味を発揮。' },
  { id: 'w_sr3', name: 'ゾーン突入ゲーミングチェア', rarity: 'SR', baseAtk: 9800, icon: '💺', desc: '座った瞬間にあらゆる雑念が吹き飛ぶ王座。' },
  { id: 'w_sr4', name: '超光速デュアルモニター', rarity: 'SR', baseAtk: 15000, icon: '🖥️', desc: '視界全体が情報空間に。マルチタスク粉砕。' },

  // SSR
  { id: 'w_ssr1', name: '🔥 量子ドパミン・バースト砲', rarity: 'SSR', baseAtk: 95000, icon: '💥', desc: '脳内受容体を過負荷させ、集中力を神の領域へと引き上げる。' },
  { id: 'w_ssr2', name: '🔥 禁断のタスク消滅ディスインテグレーター', rarity: 'SSR', baseAtk: 250000, icon: '☄️', desc: '分子レベルで先延ばしを分解・消滅させる禁忌の兵器。' },
  { id: 'w_ssr3', name: '🔥 全自動AIプロンプト巨神兵', rarity: 'SSR', baseAtk: 600000, icon: '🤖', desc: '思考する前に全てを終わらせるAI知能の化身。' },

  // UR
  { id: 'w_ur1', name: '🌈 時空崩壊インフィニティ・ビッグバン', rarity: 'UR', baseAtk: 77777777, icon: '🌌', desc: '宇宙開闢のエネルギーでタスクもボスも瞬時に無へと帰す。' },
  { id: 'w_ur2', name: '🌈 覚醒ドパ神の超光子オーラ', rarity: 'UR', baseAtk: 999999999, icon: '👑', desc: 'もはや作業すら不要。存在するだけで全てが達成される。' }
];

export const MONSTERS = [
  {
    id: 'm1',
    name: 'SNSスライム',
    title: '【無限通知の亡霊】',
    icon: '📱',
    color: '#00d2ff',
    baseHp: 150,
    quote: '「ちょっとTwitter見るだけでしょ…？」',
    rewardGems: 100,
    rewardCoins: 200
  },
  {
    id: 'm2',
    name: '布団の誘惑ゴーレム',
    title: '【絶対二度寝重力】',
    icon: '🛏️',
    color: '#00ff88',
    baseHp: 1200,
    quote: '「あと5分…あと5分だけ目を閉じよう…」',
    rewardGems: 300,
    rewardCoins: 600
  },
  {
    id: 'm3',
    name: '後回しドラゴン',
    title: '【明日から本気出す竜】',
    icon: '🐉',
    color: '#ffd700',
    baseHp: 15000,
    quote: '「今日はもう遅い。明日朝イチでやればいい。」',
    rewardGems: 800,
    rewardCoins: 1500
  },
  {
    id: 'm4',
    name: 'YouTubeショート亡霊騎士',
    title: '【時間強奪の怪異】',
    icon: '⏳',
    color: '#a855f7',
    baseHp: 80000,
    quote: '「スクロールが止まらない…気づけば3時間…」',
    rewardGems: 1500,
    rewardCoins: 3000
  },
  {
    id: 'm5',
    name: '締切デビル（BOSS）',
    title: '【絶対的タイムリミット】',
    icon: '👿',
    color: '#ff007f',
    baseHp: 500000,
    quote: '「残り時間はゼロだ！お前のドパミンをすべて喰らい尽くす！」',
    rewardGems: 3000,
    rewardCoins: 10000
  }
];

export const PRESET_TASKS = [
  { text: '水をコップ1杯飲む（10秒）', difficulty: 1, tag: 'easy' },
  { text: '背筋を伸ばして深呼吸3回', difficulty: 1, tag: 'easy' },
  { text: 'PCを開いて作業ファイルを表示', difficulty: 2, tag: 'work' },
  { text: '机の上のゴミを1つ捨てる', difficulty: 2, tag: 'life' },
  { text: 'メールや連絡を1通返信する', difficulty: 3, tag: 'work' },
  { text: '最初の1行だけ文章/コードを書く', difficulty: 3, tag: 'study' },
  { text: 'スマホを画面伏せて手の届かない場所に置く', difficulty: 3, tag: 'work' },
  { text: 'スクワット15回で脳血流アップ', difficulty: 3, tag: 'health' },
  { text: '45分間スマホを見ずに集中作業', difficulty: 4, tag: 'work' },
  { text: 'ジム/筋トレで限界まで追い込む', difficulty: 5, tag: 'health' }
];

export const INITIAL_ROUTINES = [
  { id: 'r_water', text: '毎朝のコップ1杯の水と深呼吸', difficulty: 1, tag: 'easy', freqType: 'daily', freqDay: 0, time: '08:00', enabled: true, lastAddedDate: '' },
  { id: 'r_muscle', text: '毎日の筋トレ/ストレッチ', difficulty: 3, tag: 'health', freqType: 'daily', freqDay: 0, time: '19:00', enabled: true, lastAddedDate: '' },
  { id: 'r_weekly_clean', text: '部屋・デスク周りの大掃除', difficulty: 3, tag: 'life', freqType: 'weekly', freqDay: 6, time: '10:00', enabled: true, lastAddedDate: '' },
  { id: 'r_monthly_review', text: '月初の目標設定＆タスク振り返り', difficulty: 4, tag: 'work', freqType: 'monthly', freqDay: 1, time: '09:00', enabled: true, lastAddedDate: '' }
];

export const ACHIEVEMENTS = [
  { id: 'ach_crush_1', title: '初粉砕！', desc: 'タスクを初めて1個粉砕する', reqType: 'crushed', reqValue: 1, rewardGems: 100 },
  { id: 'ach_crush_10', title: 'ドパ解禁', desc: 'タスクを累計10個粉砕する', reqType: 'crushed', reqValue: 10, rewardGems: 300 },
  { id: 'ach_crush_50', title: '先延ばしキラー', desc: 'タスクを累計50個粉砕する', reqType: 'crushed', reqValue: 50, rewardGems: 1000 },
  { id: 'ach_gacha_1', title: 'ガチャ中毒の始まり', desc: '初めて武器召喚を行う', reqType: 'gacha', reqValue: 1, rewardGems: 150 },
  { id: 'ach_gacha_ssr', title: '激アツ召喚師', desc: 'SSR以上の武器を初めて引く', reqType: 'has_ssr', reqValue: 1, rewardGems: 500 },
  { id: 'ach_gacha_ur', title: '神の引き', desc: 'GOD RARE (UR) 武器を引く', reqType: 'has_ur', reqValue: 1, rewardGems: 2000 },
  { id: 'ach_boss_5', title: '締切撃破者', desc: 'ボスを累計5体撃破する', reqType: 'defeated', reqValue: 5, rewardGems: 500 },
  { id: 'ach_boss_20', title: '無双の覚醒者', desc: 'ボスを累計20体撃破する', reqType: 'defeated', reqValue: 20, rewardGems: 1500 },
  { id: 'ach_upgrade_5', title: '鍛冶屋の弟子', desc: '武器レベルを累計5回強化する', reqType: 'upgraded', reqValue: 5, rewardGems: 300 }
];

export const INITIAL_STATE = {
  activeSlot: 1,
  gems: 300,
  coins: 500,
  comboCount: 0,
  dailyAdWatches: 0,
  equippedWeaponId: 'w_n1',
  inventory: ['w_n1'],
  weaponLevels: { 'w_n1': 1 },
  weaponDuplicates: { 'w_n1': 0 },
  stage: 1,
  bossCurrentHp: 150,
  bossMaxHp: 150,
  totalDefeated: 0,
  totalCrushed: 0,
  totalGachaPulls: 0,
  totalUpgrades: 0,
  autoAttackEnabled: true,
  currentTagFilter: 'all',
  tasks: [
    { id: 't_init1', text: '【体験用】このタスクを押して粉砕してみろ！', difficulty: 2, gems: 50, coins: 100, tag: 'easy', pinned: true, completed: false, createdAt: Date.now() },
    { id: 't_init2', text: 'ガチャを1回引いて武器を当てる', difficulty: 3, gems: 120, coins: 250, tag: 'work', pinned: false, completed: false, createdAt: Date.now() - 1000 },
    { id: 't_init3', text: '最初のボス「SNSスライム」をワンパン撃破！', difficulty: 4, gems: 300, coins: 600, tag: 'study', pinned: false, completed: false, createdAt: Date.now() - 2000 }
  ],
  routines: INITIAL_ROUTINES,
  completedLog: [],
  achievementsClaimed: {},
  todayStats: {
    crushed: 0,
    gemsEarned: 0,
    coinsEarned: 0,
    date: new Date().toISOString().split('T')[0]
  },
  soundEnabled: true,
  bgmEnabled: false,
  hapticsEnabled: true
};
