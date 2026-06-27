import type { Recipe } from '../types';

export const seedRecipes: Recipe[] = [
  {
    id: 'joojeh-kabab',
    name: {
      de: 'Persisches Safran-Hähnchen',
      fa: 'جوجه کباب زعفرانی',
    },
    description: {
      de: 'Saftiges, in Safran-Joghurt mariniertes Hähnchen vom Grill.',
      fa: 'جوجه آبدار که در ماست و زعفران مزه‌دار شده است.',
    },
    category: 'main',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAWMnNHzcJrI1b2hIWQCSk2mLRV62KsvgDMdTplKV_-EhfEbKZHInIkEC22CQNso0iOZzHAqCvUSrSjcUZmo8rc28K3YRcXdFGow_8tzpYwciykjkWsvqB5st80AErCLMCqRB7rtA_Kr2kcdaPuauMkLG3VfEUd0B5bqnjFowURXHCXbCwy77Xmz9sL4ahIW4TlDEmcszKYtdI1AQ8FRMIGc8TTu7qTlIrPaG0YkoQ_XBqEU-GLDD6RbsZPwLWgHvAiKU5Aq3XhE93w',
    calories: 480,
    prepTimeMinutes: 25,
    servings: 2,
    macros: { protein: 42, carbs: 12, fat: 28 },
    ingredients: [
      {
        id: 'chicken-breast',
        name: { de: 'Hähnchenbrust', fa: 'سینه مرغ' },
        amount: 200,
        unit: 'g',
      },
      {
        id: 'saffron',
        name: { de: 'Safran (gemörsert)', fa: 'زعفران دم‌کرده' },
        amount: 0.5,
        unit: 'g',
      },
      {
        id: 'greek-yogurt',
        name: { de: 'Griechischer Joghurt', fa: 'ماست یونانی' },
        amount: 50,
        unit: 'g',
      },
      {
        id: 'yellow-onion',
        name: { de: 'Gelbe Zwiebel', fa: 'پیاز زرد' },
        amount: 100,
        unit: 'g',
      },
      {
        id: 'lemon-juice',
        name: { de: 'Zitronensaft', fa: 'آبلیمو' },
        amount: 2,
        unit: 'tbsp',
      },
      {
        id: 'olive-oil',
        name: { de: 'Olivenöl', fa: 'روغن زیتون' },
        amount: 1,
        unit: 'tbsp',
      },
    ],
    instructions: [
      {
        de: 'Zwiebel fein hobeln und mit Joghurt, Safran, Zitronensaft und Salz in einer Schüssel vermengen.',
        fa: 'پیاز را نازک رنده کنید و با ماست، زعفران، آبلیمو و نمک در کاسه‌ای بزرگ مخلوط کنید.',
      },
      {
        de: 'Hähnchen in 2 cm Würfel schneiden, in die Marinade geben und mindestens 4 Stunden (idealerweise über Nacht) kalt stellen.',
        fa: 'مرغ را به مکعب‌های ۲ سانتی برش بزنید، در مارینیت بریزید و حداقل ۴ ساعت (ترجیحاً یک شب) در یخچال بگذارید.',
      },
      {
        de: 'Auf flache Spieße stecken und 12–15 Minuten bei starker Hitze grillen, gelegentlich wenden.',
        fa: 'روی سیخ‌های پهن بکشید و ۱۲ تا ۱۵ دقیقه روی حرارت زیاد بپزید و گه‌گاه برگردانید.',
      },
    ],
  },
  {
    id: 'lemon-salmon-bowl',
    name: {
      de: 'Zitronen-Lachs Quinoa-Bowl',
      fa: 'بول سالمون و کینوآ با لیمو',
    },
    description: {
      de: 'Gebackener Lachs auf fluffiger Quinoa mit Brokkoli und Avocado.',
      fa: 'سالمون فر با کینوآی نرم، بروکلی و آووکادو.',
    },
    category: 'main',
    imageUrl:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1080&q=80',
    calories: 520,
    prepTimeMinutes: 30,
    servings: 2,
    macros: { protein: 38, carbs: 35, fat: 22 },
    ingredients: [
      {
        id: 'salmon-fillet',
        name: { de: 'Lachsfilet', fa: 'فیله سالمون' },
        amount: 250,
        unit: 'g',
      },
      {
        id: 'quinoa',
        name: { de: 'Quinoa (trocken)', fa: 'کینوآ (خشک)' },
        amount: 120,
        unit: 'g',
      },
      {
        id: 'broccoli',
        name: { de: 'Brokkoli', fa: 'کلم بروکلی' },
        amount: 200,
        unit: 'g',
      },
      {
        id: 'avocado',
        name: { de: 'Avocado', fa: 'آووکادو' },
        amount: 1,
        unit: 'piece',
      },
      {
        id: 'lemon',
        name: { de: 'Zitrone', fa: 'لیمو' },
        amount: 1,
        unit: 'piece',
      },
      {
        id: 'olive-oil',
        name: { de: 'Olivenöl', fa: 'روغن زیتون' },
        amount: 2,
        unit: 'tbsp',
      },
      {
        id: 'garlic',
        name: { de: 'Knoblauchzehe', fa: 'حبه سیر' },
        amount: 2,
        unit: 'piece',
      },
    ],
    instructions: [
      {
        de: 'Ofen auf 200 °C vorheizen. Quinoa nach Packungsanleitung kochen.',
        fa: 'فر را روی ۲۰۰ درجه گرم کنید. کینوآ را طبق دستور بسته بپزید.',
      },
      {
        de: 'Lachs mit Olivenöl, gehacktem Knoblauch, Zitronensaft, Salz und Pfeffer bestreichen. 12–15 Minuten backen.',
        fa: 'سالمون را با روغن زیتون، سیر خردشده، آبلیمو، نمک و فلفل بپوشانید و ۱۲ تا ۱۵ دقیقه در فر بپزید.',
      },
      {
        de: 'Brokkoli in Röschen teilen und 5 Minuten dämpfen.',
        fa: 'بروکلی را به گل‌گل کنید و ۵ دقیقه بخارپز کنید.',
      },
      {
        de: 'Quinoa, Brokkoli und Lachs in einer Schüssel anrichten, mit Avocado-Scheiben und Zitronenspalten servieren.',
        fa: 'کینوآ، بروکلی و سالمون را در کاسه بچینید، با برش‌های آووکادو و لیمو سرو کنید.',
      },
    ],
  },
  {
    id: 'mediterranean-chickpea',
    name: {
      de: 'Mediterrane Kichererbsen-Bowl',
      fa: 'بول نخود مدیترانه‌ای',
    },
    description: {
      de: 'Proteinreiche Kichererbsen mit knackigem Gemüse und Tahini-Dressing.',
      fa: 'نخود پرپروتئین با سبزیجات تازه و سس طحینی.',
    },
    category: 'main',
    imageUrl:
      'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1080&q=80',
    calories: 420,
    prepTimeMinutes: 20,
    servings: 2,
    macros: { protein: 22, carbs: 48, fat: 16 },
    ingredients: [
      {
        id: 'chickpeas',
        name: { de: 'Kichererbsen (gekocht)', fa: 'نخود پخته' },
        amount: 250,
        unit: 'g',
      },
      {
        id: 'cherry-tomato',
        name: { de: 'Kirschtomaten', fa: 'گوجه گیلاسی' },
        amount: 150,
        unit: 'g',
      },
      {
        id: 'cucumber',
        name: { de: 'Salatgurke', fa: 'خیار' },
        amount: 1,
        unit: 'piece',
      },
      {
        id: 'red-onion',
        name: { de: 'Rote Zwiebel', fa: 'پیاز قرمز' },
        amount: 50,
        unit: 'g',
      },
      {
        id: 'parsley',
        name: { de: 'Petersilie', fa: 'جعفری' },
        amount: 20,
        unit: 'g',
      },
      {
        id: 'tahini',
        name: { de: 'Tahini', fa: 'طحینی' },
        amount: 2,
        unit: 'tbsp',
      },
      {
        id: 'lemon-juice',
        name: { de: 'Zitronensaft', fa: 'آبلیمو' },
        amount: 1,
        unit: 'tbsp',
      },
      {
        id: 'olive-oil',
        name: { de: 'Olivenöl', fa: 'روغن زیتون' },
        amount: 1,
        unit: 'tbsp',
      },
    ],
    instructions: [
      {
        de: 'Tomaten halbieren, Gurke würfeln, rote Zwiebel fein hacken und Petersilie zerkleinern.',
        fa: 'گوجه را نصف، خیار را نگینی، پیاز قرمز را ریز خرد کنید و جعفری را خرد کنید.',
      },
      {
        de: 'Kichererbsen mit Gemüse und Kräutern in einer Schüssel mischen.',
        fa: 'نخود را با سبزیجات و جعفری در کاسه‌ای مخلوط کنید.',
      },
      {
        de: 'Tahini mit Zitronensaft, Olivenöl, Salz und 2 EL Wasser glatt rühren.',
        fa: 'طحینی را با آبلیمو، روغن زیتون، نمک و ۲ قاشق آب کاملاً مخلوط کنید تا یکدست شود.',
      },
      {
        de: 'Dressing über die Bowl träufeln und gut vermengen.',
        fa: 'سس را روی بول بریزید و خوب مخلوط کنید.',
      },
    ],
  },
  {
    id: 'overnight-oats-berry',
    name: {
      de: 'Beeren-Overnight-Oats',
      fa: 'اوتمیل شبانه با توت‌ها',
    },
    description: {
      de: 'Cremige Haferflocken mit frischen Beeren und Mandeln.',
      fa: 'جو دوسر خامه‌ای با توت‌های تازه و بادام.',
    },
    category: 'breakfast',
    imageUrl:
      'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=1080&q=80',
    calories: 350,
    prepTimeMinutes: 5,
    servings: 1,
    macros: { protein: 14, carbs: 48, fat: 11 },
    ingredients: [
      {
        id: 'rolled-oats',
        name: { de: 'Haferflocken', fa: 'جو دوسر' },
        amount: 60,
        unit: 'g',
      },
      {
        id: 'milk-oat',
        name: { de: 'Hafermilch', fa: 'شیر جو دوسر' },
        amount: 180,
        unit: 'ml',
      },
      {
        id: 'greek-yogurt',
        name: { de: 'Griechischer Joghurt', fa: 'ماست یونانی' },
        amount: 80,
        unit: 'g',
      },
      {
        id: 'mixed-berries',
        name: { de: 'Beerenmischung', fa: 'مخلوط توت‌ها' },
        amount: 80,
        unit: 'g',
      },
      {
        id: 'chia-seeds',
        name: { de: 'Chiasamen', fa: 'دانه چیا' },
        amount: 1,
        unit: 'tbsp',
      },
      {
        id: 'maple-syrup',
        name: { de: 'Ahornsirup', fa: 'شیره افرا' },
        amount: 1,
        unit: 'tsp',
      },
      {
        id: 'almond-slivered',
        name: { de: 'Mandelblättchen', fa: 'خلال بادام' },
        amount: 10,
        unit: 'g',
      },
    ],
    instructions: [
      {
        de: 'Haferflocken, Hafermilch, Joghurt, Chiasamen und Ahornsirup in einem Glas verrühren.',
        fa: 'جو دوسر، شیر، ماست، دانه چیا و شیره افرا را در یک لیوان مخلوط کنید.',
      },
      {
        de: 'Über Nacht (mind. 6 h) im Kühlschrank ziehen lassen.',
        fa: 'حداقل ۶ ساعت یا یک شب در یخچال بگذارید.',
      },
      {
        de: 'Am Morgen mit Beeren und Mandelblättchen toppen und genießen.',
        fa: 'صبح با توت‌های تازه و خلال بادام تزئین و سرو کنید.',
      },
    ],
  },
  {
    id: 'date-energy-balls',
    name: {
      de: 'Dattel-Kakao-Energybällchen',
      fa: 'توپک انرژی خرما و کاکائو',
    },
    description: {
      de: 'Süße Bällchen aus Datteln, Nüssen und Kakao – ideal für zwischendurch.',
      fa: 'توپک‌های شیرین از خرما، آجیل و کاکائو، عالی برای میان‌وعده.',
    },
    category: 'snack',
    imageUrl:
      'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=1080&q=80',
    calories: 180,
    prepTimeMinutes: 15,
    servings: 4,
    macros: { protein: 5, carbs: 22, fat: 9 },
    ingredients: [
      {
        id: 'medjool-dates',
        name: { de: 'Medjool-Datteln', fa: 'خرما مجول' },
        amount: 150,
        unit: 'g',
      },
      {
        id: 'almonds',
        name: { de: 'Mandeln', fa: 'بادام' },
        amount: 80,
        unit: 'g',
      },
      {
        id: 'cocoa-powder',
        name: { de: 'Kakaopulver', fa: 'پودر کاکائو' },
        amount: 2,
        unit: 'tbsp',
      },
      {
        id: 'coconut-shredded',
        name: { de: 'Kokosraspeln', fa: 'نارگیل رنده‌شده' },
        amount: 20,
        unit: 'g',
      },
      {
        id: 'vanilla-extract',
        name: { de: 'Vanilleextrakt', fa: 'عصاره وانیل' },
        amount: 1,
        unit: 'tsp',
      },
      {
        id: 'salt',
        name: { de: 'Meersalz', fa: 'نمک دریا' },
        amount: 1,
        unit: 'pinch',
      },
    ],
    instructions: [
      {
        de: 'Entsteinte Datteln und Mandeln im Mixer fein zerkleinern.',
        fa: 'خرمای هسته‌گرفته و بادام را در مخلوط‌کن ریز خرد کنید.',
      },
      {
        de: 'Kakao, Vanille und Salz zugeben und zu einer klebrigen Masse mixen.',
        fa: 'کاکائو، وانیل و نمک را اضافه و تا چسبناک‌شدن مخلوط کنید.',
      },
      {
        de: 'Mit feuchten Händen 12 Bällchen formen und in Kokosraspeln wälzen.',
        fa: 'با دست مرطوب ۱۲ توپک شکل دهید و در نارگیل بغلتانید.',
      },
      {
        de: 'Mindestens 30 Minuten kühl stellen.',
        fa: 'حداقل ۳۰ دقیقه در یخچال بگذارید.',
      },
    ],
  },
  {
    id: 'red-pepper-tahini-sauce',
    name: {
      de: 'Geröstete Paprika-Tahini-Sauce',
      fa: 'سس فلفل کبابی و طحینی',
    },
    description: {
      de: 'Cremige, leicht rauchige Sauce – passt zu Bowls, Salaten oder Brot.',
      fa: 'سس خامه‌ای و کمی دودی، عالی برای بول، سالاد یا نان.',
    },
    category: 'sauce',
    imageUrl:
      'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=1080&q=80',
    calories: 90,
    prepTimeMinutes: 10,
    servings: 4,
    macros: { protein: 3, carbs: 6, fat: 7 },
    ingredients: [
      {
        id: 'red-pepper-roasted',
        name: { de: 'Geröstete Paprika', fa: 'فلفل دلمه کبابی' },
        amount: 200,
        unit: 'g',
      },
      {
        id: 'tahini',
        name: { de: 'Tahini', fa: 'طحینی' },
        amount: 3,
        unit: 'tbsp',
      },
      {
        id: 'lemon-juice',
        name: { de: 'Zitronensaft', fa: 'آبلیمو' },
        amount: 1,
        unit: 'tbsp',
      },
      {
        id: 'garlic',
        name: { de: 'Knoblauchzehe', fa: 'حبه سیر' },
        amount: 1,
        unit: 'piece',
      },
      {
        id: 'smoked-paprika',
        name: { de: 'Geräuchertes Paprikapulver', fa: 'پاپریکا دودی' },
        amount: 0.5,
        unit: 'tsp',
      },
      {
        id: 'olive-oil',
        name: { de: 'Olivenöl', fa: 'روغن زیتون' },
        amount: 1,
        unit: 'tbsp',
      },
      {
        id: 'salt',
        name: { de: 'Salz', fa: 'نمک' },
        amount: 1,
        unit: 'pinch',
      },
    ],
    instructions: [
      {
        de: 'Alle Zutaten in einen Mixer geben.',
        fa: 'همه مواد را در مخلوط‌کن بریزید.',
      },
      {
        de: 'Mixen, bis die Sauce glatt ist – bei Bedarf 1–2 EL Wasser zugeben.',
        fa: 'مخلوط کنید تا یکدست شود – در صورت نیاز ۱ تا ۲ قاشق آب اضافه کنید.',
      },
      {
        de: 'Abschmecken und im Kühlschrank bis zu 4 Tage aufbewahren.',
        fa: 'مزه را تنظیم کنید؛ تا ۴ روز در یخچال نگه می‌ماند.',
      },
    ],
  },
  {
    id: 'green-power-smoothie',
    name: {
      de: 'Grüner Power-Smoothie',
      fa: 'اسموتی سبز پرانرژی',
    },
    description: {
      de: 'Erfrischender Spinat-Bananen-Smoothie mit Mango und Leinsamen.',
      fa: 'اسموتی خنک‌کننده اسفناج و موز با انبه و دانه کتان.',
    },
    category: 'smoothie',
    imageUrl:
      'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1080&q=80',
    calories: 280,
    prepTimeMinutes: 5,
    servings: 1,
    macros: { protein: 8, carbs: 52, fat: 6 },
    ingredients: [
      {
        id: 'baby-spinach',
        name: { de: 'Babyspinat', fa: 'اسفناج تازه' },
        amount: 50,
        unit: 'g',
      },
      {
        id: 'banana',
        name: { de: 'Banane', fa: 'موز' },
        amount: 1,
        unit: 'piece',
      },
      {
        id: 'mango-frozen',
        name: { de: 'Mango (gefroren)', fa: 'انبه یخ‌زده' },
        amount: 120,
        unit: 'g',
      },
      {
        id: 'almond-milk',
        name: { de: 'Mandelmilch', fa: 'شیر بادام' },
        amount: 250,
        unit: 'ml',
      },
      {
        id: 'flaxseed-ground',
        name: { de: 'Geschrotete Leinsamen', fa: 'دانه کتان آسیاب‌شده' },
        amount: 1,
        unit: 'tbsp',
      },
      {
        id: 'lime-juice',
        name: { de: 'Limettensaft', fa: 'آب لیموترش' },
        amount: 1,
        unit: 'tsp',
      },
    ],
    instructions: [
      {
        de: 'Alle Zutaten in den Mixer geben.',
        fa: 'همه مواد را داخل مخلوط‌کن بریزید.',
      },
      {
        de: '45–60 Sekunden auf höchster Stufe mixen, bis alles glatt ist.',
        fa: '۴۵ تا ۶۰ ثانیه با حداکثر سرعت مخلوط کنید تا کاملاً صاف شود.',
      },
      {
        de: 'In ein Glas gießen und sofort genießen.',
        fa: 'در لیوان بریزید و فوراً سرو کنید.',
      },
    ],
  },
];
