// js/data.js - DopaTodo Master Data & State Schema
// Supported Recurring Frequencies: daily, weekdays, weekends, weekly, monthly

export const APP_VERSION = '3.0.0';

export const RELEASE_NOTES = {
  version: '3.0.0',
  title: '🛡️ 大型アップデート: 4部位マルチ装備＆セット効果システム解禁！',
  date: '2026-08-20',
  giftGems: 1000,
  features: [
    {
      icon: '🛡️',
      title: '4部位マルチ装備スロット（Loadout）',
      desc: 'メイン武器・サブ防具・頭部ヘルム・装飾品の4箇所を自由に換装可能に！'
    },
    {
      icon: '🌟',
      title: 'シリーズセット効果（Set Bonus）',
      desc: '神域・サイバー・ドパミンシリーズを2部位/4部位揃えると確定クリティカルや速度2倍が発動！'
    },
    {
      icon: '⚡',
      title: '総合戦闘力（Total Battle Power）',
      desc: '装備の合計ATK・会心率・会心倍率・報酬倍率を統合した総合戦力値を算出・表示！'
    },
    {
      icon: '💎',
      title: '装飾品＆セットでToDo報酬大ブースト',
      desc: '指輪やセット効果により、ToDo粉砕時の獲得Gems/Coinsが最大+100%以上に跳ね上がります！'
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

export const EQUIP_SLOTS = {
  weapon: { id: 'weapon', label: 'メイン武器', icon: '🗡️', statLabel: 'ATK', color: '#ff007f' },
  armor: { id: 'armor', label: 'サブ防具/鎧', icon: '🛡️', statLabel: 'CRIT DMG倍率', color: '#00f3ff' },
  head: { id: 'head', label: '頭部/ヘルム', icon: '👑', statLabel: '会心率(CRIT RATE)', color: '#ffd700' },
  accessory: { id: 'accessory', label: '装飾品/指輪', icon: '💍', statLabel: 'ToDo報酬ボーナス', color: '#00ff88' }
};

export const SET_BONUSES = {
  god: {
    id: 'god',
    name: '神域（ゴッド）シリーズ',
    color: '#00ff88',
    twoPiece: { label: '全攻撃ダメージ +50%', dmgBoost: 1.5 },
    fourPiece: { label: '全攻撃 確定クリティカル ＆ タスク報酬Gems +30%', forceCrit: true, gemBonus: 0.30 }
  },
  cyber: {
    id: 'cyber',
    name: 'サイバーネオンシリーズ',
    color: '#00f3ff',
    twoPiece: { label: 'クリティカル倍率 +1.5倍', critDmgBoost: 1.5 },
    fourPiece: { label: 'オート攻撃間隔 2倍速(0.5s) ＆ 会心率+40%', autoSpeedBoost: 0.5, critRateBoost: 0.40 }
  },
  dopa: {
    id: 'dopa',
    name: '脳汁ドパシリーズ',
    color: '#ff007f',
    twoPiece: { label: 'タスク粉砕時 コイン獲得量 +50%', coinBonus: 0.50 },
    fourPiece: { label: '報酬ルーレット JACKPOT確率2倍 ＆ Gems+20%', jackpotBoost: 2.0, gemBonus: 0.20 }
  }
};

export const EQUIPMENT_ITEMS = [
  // ================= 1. MAIN WEAPONS (🗡️ ATK) =================
  // Normal
  { id: 'w_n1', slot: 'weapon', series: 'basic', name: '折れた竹やり', rarity: 'N', baseAtk: 15, critRate: 0.05, critMult: 1.5, gemBonus: 0, icon: '🎋', desc: '気休め程度の棒切れ。それでも殴れば痛い。' },
  { id: 'w_n2', slot: 'weapon', series: 'basic', name: '安物ボールペン', rarity: 'N', baseAtk: 35, critRate: 0.05, critMult: 1.5, gemBonus: 0, icon: '🖊️', desc: 'インクの出が悪いが、先端で突くとそこそこ痛い。' },
  // Rare
  { id: 'w_r1', slot: 'weapon', series: 'cyber', name: 'エナドリバズーカ', rarity: 'R', baseAtk: 220, critRate: 0.08, critMult: 1.8, gemBonus: 0.05, icon: '🥫', desc: 'カフェインとタウリンを高圧噴射。脳がピリつく。' },
  { id: 'w_r2', slot: 'weapon', series: 'dopa', name: '青軸ナックル', rarity: 'R', baseAtk: 450, critRate: 0.10, critMult: 2.0, gemBonus: 0.05, icon: '⌨️', desc: 'カチカチと爆音を鳴らして精神を研ぎ澄ます。' },
  // Super Rare
  { id: 'w_sr1', slot: 'weapon', series: 'cyber', name: '電磁レールガン', rarity: 'SR', baseAtk: 3800, critRate: 0.15, critMult: 2.5, gemBonus: 0.10, icon: '⚡', desc: '電流でシナプスを直撃。思考速度が光速に達する。' },
  { id: 'w_sr2', slot: 'weapon', series: 'dopa', name: 'アドレナリン刀', rarity: 'SR', baseAtk: 7500, critRate: 0.20, critMult: 2.8, gemBonus: 0.10, icon: '🗡️', desc: '死線に追い詰められた時のみ真の切れ味を発揮。' },
  // SSR
  { id: 'w_ssr1', slot: 'weapon', series: 'cyber', name: '量子ドパミン砲', rarity: 'SSR', baseAtk: 95000, critRate: 0.25, critMult: 3.5, gemBonus: 0.20, icon: '💥', desc: '脳内受容体を過負荷させ、集中力を神の領域へと引き上げる。' },
  { id: 'w_ssr2', slot: 'weapon', series: 'dopa', name: 'タスク消滅砲', rarity: 'SSR', baseAtk: 350000, critRate: 0.30, critMult: 4.0, gemBonus: 0.25, icon: '☄️', desc: '分子レベルで先延ばしを分解・消滅させる禁忌の兵器。' },
  // UR
  { id: 'w_ur1', slot: 'weapon', series: 'god', name: '時空崩壊ビッグバン', rarity: 'UR', baseAtk: 77777777, critRate: 0.40, critMult: 5.0, gemBonus: 0.50, icon: '🌌', desc: '宇宙開闢のエネルギーでタスクもボスも瞬時に無へと帰す。' },

  // ================= 2. SUB ARMOR / SHIELDS (🛡️ CRIT DMG & DEF) =================
  // Normal
  { id: 'a_n1', slot: 'armor', series: 'basic', name: 'ダンボールの盾', rarity: 'N', baseAtk: 5, critRate: 0.02, critMult: 0.2, gemBonus: 0, icon: '📦', desc: '通販の空き箱。水に濡れると即座にふやける。' },
  // Rare
  { id: 'a_r1', slot: 'armor', series: 'cyber', name: 'カーボン防弾ジャケット', rarity: 'R', baseAtk: 80, critRate: 0.05, critMult: 0.5, gemBonus: 0.03, icon: '🦺', desc: '軽量かつ強固。無駄な誘惑通知を弾き返す。' },
  // Super Rare
  { id: 'a_sr1', slot: 'armor', series: 'dopa', name: 'ゲーミング防護アーマー', rarity: 'SR', baseAtk: 1200, critRate: 0.10, critMult: 1.0, gemBonus: 0.08, icon: '🛡️', desc: 'フルRGBライティングで精神を常にハイテンションに維持。' },
  // SSR
  { id: 'a_ssr1', slot: 'armor', series: 'cyber', name: 'ナノマシン電磁シールド', rarity: 'SSR', baseAtk: 45000, critRate: 0.15, critMult: 2.0, gemBonus: 0.15, icon: '🔮', desc: '先延ばしの魔力をエネルギーに変換して反射する。' },
  // UR
  { id: 'a_ur1', slot: 'armor', series: 'god', name: '神聖アークエンジェル・ローブ', rarity: 'UR', baseAtk: 33333333, critRate: 0.25, critMult: 3.5, gemBonus: 0.30, icon: '✨', desc: '神の加護を受けた聖なる鎧。あらゆる雑念を完全無効化。' },

  // ================= 3. HEAD / HELMS (👑 CRIT RATE & FOCUS) =================
  // Normal
  { id: 'h_n1', slot: 'head', series: 'basic', name: 'ブルーライト眼鏡', rarity: 'N', baseAtk: 5, critRate: 0.05, critMult: 0.1, gemBonus: 0, icon: '👓', desc: '画面を見つめる目を守る。視界が黄ばむ。' },
  // Rare
  { id: 'h_r1', slot: 'head', series: 'cyber', name: 'ノイキャンヘッドホン', rarity: 'R', baseAtk: 90, critRate: 0.10, critMult: 0.3, gemBonus: 0.03, icon: '🎧', desc: '周囲の雑音を完全遮断。自分の鼓動だけが響く。' },
  // Super Rare
  { id: 'h_sr1', slot: 'head', series: 'dopa', name: 'ゾーン覚醒バイザー', rarity: 'SR', baseAtk: 1500, critRate: 0.20, critMult: 0.6, gemBonus: 0.08, icon: '🥽', desc: '装着した瞬間に視界が超集中モードへと固定される。' },
  // SSR
  { id: 'h_ssr1', slot: 'head', series: 'cyber', name: 'サイバー・ニューロクラウン', rarity: 'SSR', baseAtk: 55000, critRate: 0.30, critMult: 1.2, gemBonus: 0.15, icon: '👑', desc: '脳波を直接同調させ、思考速度を10倍に加速させる王冠。' },
  // UR
  { id: 'h_ur1', slot: 'head', series: 'god', name: '至高神ドパの神光ティアラ', rarity: 'UR', baseAtk: 44444444, critRate: 0.45, critMult: 2.5, gemBonus: 0.35, icon: '🌟', desc: '全知全能の光を放ち、ひらめきと会心を極限まで引き上げる。' },

  // ================= 4. ACCESSORIES / RINGS (💍 REWARD BOOST) =================
  // Normal
  { id: 'acc_n1', slot: 'accessory', series: 'basic', name: '100均の輪ゴムリング', rarity: 'N', baseAtk: 5, critRate: 0.02, critMult: 0.1, gemBonus: 0.02, icon: '🧶', desc: '指にはめると少しだけやる気が出る気がする。' },
  // Rare
  { id: 'acc_r1', slot: 'accessory', series: 'dopa', name: 'カフェイン濃縮アミュレット', rarity: 'R', baseAtk: 110, critRate: 0.05, critMult: 0.2, gemBonus: 0.10, icon: '💊', desc: 'タスク完了時の報酬ジェムが +10% 増加する。' },
  // Super Rare
  { id: 'acc_sr1', slot: 'accessory', series: 'cyber', name: '暗号資産ゴールドリング', rarity: 'SR', baseAtk: 1800, critRate: 0.10, critMult: 0.5, gemBonus: 0.20, icon: '💍', desc: '富を引き寄せる指輪。ToDo報酬ジェム+20%、コイン+30%。' },
  // SSR
  { id: 'acc_ssr1', slot: 'accessory', series: 'dopa', name: '無限ドパミン生成コア', rarity: 'SSR', baseAtk: 65000, critRate: 0.20, critMult: 1.0, gemBonus: 0.35, icon: '💎', desc: '報酬ジェム+35%、コイン+50%。脳汁が止まらなくなる。' },
  // UR
  { id: 'acc_ur1', slot: 'accessory', series: 'god', name: '万物掌握インフィニティ・リング', rarity: 'UR', baseAtk: 55555555, critRate: 0.35, critMult: 2.0, gemBonus: 0.60, icon: '💠', desc: 'ToDo報酬ジェム+60%、コイン+100%。世界の富を独占する。' }
];

export const WEAPONS = EQUIPMENT_ITEMS; // Backward compatibility alias

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
  equipped: {
    weapon: 'w_n1',
    armor: 'a_n1',
    head: 'h_n1',
    accessory: 'acc_n1'
  },
  equippedWeaponId: 'w_n1', // backward compatibility
  inventory: ['w_n1', 'a_n1', 'h_n1', 'acc_n1'],
  weaponLevels: { 'w_n1': 1, 'a_n1': 1, 'h_n1': 1, 'acc_n1': 1 },
  weaponDuplicates: { 'w_n1': 0, 'a_n1': 0, 'h_n1': 0, 'acc_n1': 0 },
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
