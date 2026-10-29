/* ============================================================
   STORE SETTINGS — edit these to match your supermarket
   ============================================================ */
const STORE = {
  nameEn: "Ijmaal FreshMart",
  nameAr: "إجمال فرش مارت",
  taglineEn: "Fresh groceries, delivered to your door",
  taglineAr: "خضروات ومنتجات طازجة توصل لباب بيتك",
  currency: "$",                 // change to your currency symbol e.g. "ر.س" or "د.إ"
  phone: "+1 234 567 890",
  whatsapp: "1234567890",        // WhatsApp number with country code, digits only
  email: "hello@freshmart.com",
  addressEn: "12 Market Street, City Center",
  addressAr: "١٢ شارع السوق، وسط المدينة",
  hoursEn: "Open daily: 8:00 AM – 11:00 PM",
  hoursAr: "مفتوح يومياً: ٨ صباحاً – ١١ مساءً",
  mapsQuery: "City Center Mall", // used for the Google Maps embed + directions link
  deliveryFee: 10,               // flat delivery fee (admin can change in admin.html)
  freeDeliveryOver: 30,
  adminPass: "admin123",         // admin dashboard password — CHANGE THIS
  bankDetailsEn: "Bank: Example Bank\nAccount Name: Ijmaal FreshMart\nIBAN: XX00 1234 5678 9000",
  bankDetailsAr: "البنك: بنك المثال\nاسم الحساب: إجمال فرش مارت\nآيبان: XX00 1234 5678 9000"
};

/* Runtime settings (delivery fee etc.) — admin edits are saved in localStorage */
function getDeliveryFee() {
  const saved = parseFloat(localStorage.getItem("fm_delivery_fee"));
  return isNaN(saved) ? STORE.deliveryFee : saved;
}
function setDeliveryFee(v) { localStorage.setItem("fm_delivery_fee", v); }

/* Stock overrides saved by admin: {productId: false} = out of stock */
function stockOverrides() { return JSON.parse(localStorage.getItem("fm_stock") || "{}"); }
function inStock(p) { return stockOverrides()[p.id] !== false; }
function setStock(id, val) {
  const o = stockOverrides();
  o[id] = val;
  localStorage.setItem("fm_stock", JSON.stringify(o));
}

/* ============================================================
   CATEGORIES
   ============================================================ */
const CATEGORIES = [
  { id: "fruits",    en: "Fruits & Vegetables",  ar: "فواكه وخضروات",    emoji: "🥬", color: "#dcfce7" },
  { id: "meat",      en: "Meat & Poultry",       ar: "لحوم ودواجن",      emoji: "🍗", color: "#fee2e2" },
  { id: "dairy",     en: "Dairy & Eggs",         ar: "ألبان وبيض",       emoji: "🥛", color: "#e0f2fe" },
  { id: "bakery",    en: "Bakery",               ar: "مخبوزات",          emoji: "🍞", color: "#fef3c7" },
  { id: "pantry",    en: "Pantry & Dry Goods",   ar: "البقالة والحبوب",  emoji: "🍚", color: "#ede9fe" },
  { id: "beverages", en: "Beverages",            ar: "مشروبات",          emoji: "🧃", color: "#cffafe" },
  { id: "snacks",    en: "Snacks",               ar: "وجبات خفيفة",      emoji: "🍪", color: "#ffedd5" },
  { id: "household", en: "Household & Cleaning", ar: "المنزل والتنظيف",  emoji: "🧼", color: "#f0f9ff" },
  { id: "personal",  en: "Personal Care",        ar: "العناية الشخصية",  emoji: "🧴", color: "#fce7f3" }
];

/* ============================================================
   PRODUCTS
   unit: kg | pc | pack | box | l | btl
   old: original price when on offer (optional)
   featured: true → shown on home page
   ============================================================ */
const PRODUCTS = [
  /* ---- Fruits & Vegetables ---- */
  { id: 1,  cat: "fruits", en: "Bananas",        ar: "موز",            price: 1.20, unit: "kg",  emoji: "🍌", featured: true },
  { id: 2,  cat: "fruits", en: "Red Apples",     ar: "تفاح أحمر",      price: 2.50, unit: "kg",  emoji: "🍎", old: 3.20 },
  { id: 3,  cat: "fruits", en: "Tomatoes",       ar: "طماطم",          price: 1.80, unit: "kg",  emoji: "🍅" },
  { id: 4,  cat: "fruits", en: "Cucumbers",      ar: "خيار",           price: 1.50, unit: "kg",  emoji: "🥒" },
  { id: 5,  cat: "fruits", en: "Potatoes",       ar: "بطاطس",          price: 1.00, unit: "kg",  emoji: "🥔", old: 1.40 },
  { id: 6,  cat: "fruits", en: "Onions",         ar: "بصل",            price: 0.90, unit: "kg",  emoji: "🧅" },
  { id: 7,  cat: "fruits", en: "Oranges",        ar: "برتقال",         price: 2.20, unit: "kg",  emoji: "🍊", featured: true },
  { id: 8,  cat: "fruits", en: "Carrots",        ar: "جزر",            price: 1.30, unit: "kg",  emoji: "🥕" },
  { id: 9,  cat: "fruits", en: "Fresh Lettuce",  ar: "خس طازج",        price: 1.10, unit: "pc",  emoji: "🥬" },
  { id: 10, cat: "fruits", en: "Lemons",         ar: "ليمون",          price: 2.00, unit: "kg",  emoji: "🍋" },
  { id: 11, cat: "fruits", en: "Strawberries",   ar: "فراولة",         price: 4.50, unit: "box", emoji: "🍓", featured: true },
  { id: 12, cat: "fruits", en: "Watermelon",     ar: "بطيخ",           price: 5.00, unit: "pc",  emoji: "🍉", old: 6.50 },

  /* ---- Meat & Poultry ---- */
  { id: 20, cat: "meat", en: "Whole Chicken",   ar: "دجاجة كاملة",    price: 6.50,  unit: "kg", emoji: "🍗", featured: true },
  { id: 21, cat: "meat", en: "Beef Mince",      ar: "لحم مفروم",      price: 8.90,  unit: "kg", emoji: "🥩" },
  { id: 22, cat: "meat", en: "Lamb Chops",      ar: "ريش غنم",        price: 12.50, unit: "kg", emoji: "🍖", old: 14.00 },
  { id: 23, cat: "meat", en: "Chicken Breast",  ar: "صدر دجاج",       price: 7.20,  unit: "kg", emoji: "🍗" },
  { id: 24, cat: "meat", en: "Beef Steak",      ar: "ستيك بقري",      price: 11.00, unit: "kg", emoji: "🥩" },
  { id: 25, cat: "meat", en: "Fish Fillet",     ar: "فيليه سمك",      price: 9.50,  unit: "kg", emoji: "🐟" },
  { id: 26, cat: "meat", en: "Fresh Shrimp",    ar: "جمبري طازج",     price: 14.00, unit: "kg", emoji: "🦐" },
  { id: 27, cat: "meat", en: "Chicken Wings",   ar: "أجنحة دجاج",     price: 5.80,  unit: "kg", emoji: "🍗", old: 6.90 },

  /* ---- Dairy & Eggs ---- */
  { id: 40, cat: "dairy", en: "Fresh Milk 1L",   ar: "حليب طازج ١ لتر", price: 1.50, unit: "btl", emoji: "🥛", featured: true },
  { id: 41, cat: "dairy", en: "Eggs (12 pcs)",   ar: "بيض (١٢ حبة)",    price: 2.80, unit: "box", emoji: "🥚" },
  { id: 42, cat: "dairy", en: "Cheddar Cheese",  ar: "جبنة شيدر",       price: 4.20, unit: "pack", emoji: "🧀" },
  { id: 43, cat: "dairy", en: "Natural Yogurt",  ar: "زبادي طبيعي",     price: 1.90, unit: "pc",  emoji: "🥣" },
  { id: 44, cat: "dairy", en: "Butter 250g",     ar: "زبدة ٢٥٠ غ",      price: 3.10, unit: "pc",  emoji: "🧈" },
  { id: 45, cat: "dairy", en: "Feta Cheese",     ar: "جبنة فيتا",       price: 3.80, unit: "pack", emoji: "🧀", old: 4.50 },
  { id: 46, cat: "dairy", en: "Labneh",          ar: "لبنة",            price: 2.90, unit: "pc",  emoji: "🥣" },
  { id: 47, cat: "dairy", en: "Cooking Cream",   ar: "كريمة طبخ",       price: 2.20, unit: "pc",  emoji: "🥛" },

  /* ---- Bakery ---- */
  { id: 60, cat: "bakery", en: "White Bread",    ar: "خبز أبيض",       price: 1.20, unit: "pc", emoji: "🍞" },
  { id: 61, cat: "bakery", en: "Croissant",      ar: "كرواسون",        price: 0.90, unit: "pc", emoji: "🥐", featured: true },
  { id: 62, cat: "bakery", en: "Baguette",       ar: "باغيت",          price: 1.50, unit: "pc", emoji: "🥖" },
  { id: 63, cat: "bakery", en: "Arabic Bread",   ar: "خبز عربي",       price: 1.00, unit: "pack", emoji: "🫓" },
  { id: 64, cat: "bakery", en: "Donuts (4 pcs)", ar: "دونات (٤ حبات)", price: 2.50, unit: "box", emoji: "🍩", old: 3.20 },
  { id: 65, cat: "bakery", en: "Muffins (2 pcs)",ar: "مافن (حبتان)",   price: 2.80, unit: "pack", emoji: "🧁" },
  { id: 66, cat: "bakery", en: "Cake Slice",     ar: "قطعة كيك",       price: 3.50, unit: "pc", emoji: "🍰" },
  { id: 67, cat: "bakery", en: "Butter Cookies", ar: "بسكويت بالزبدة", price: 2.20, unit: "box", emoji: "🍪" },

  /* ---- Pantry & Dry Goods ---- */
  { id: 80, cat: "pantry", en: "Basmati Rice 5kg", ar: "أرز بسمتي ٥ كغ",  price: 8.50, unit: "pack", emoji: "🍚", featured: true },
  { id: 81, cat: "pantry", en: "Spaghetti 500g",   ar: "سباغيتي ٥٠٠ غ",   price: 1.40, unit: "pack", emoji: "🍝" },
  { id: 82, cat: "pantry", en: "Olive Oil 750ml",  ar: "زيت زيتون ٧٥٠ مل", price: 9.90, unit: "btl",  emoji: "🫒", old: 12.00 },
  { id: 83, cat: "pantry", en: "Sugar 1kg",        ar: "سكر ١ كغ",        price: 1.30, unit: "pack", emoji: "🍬" },
  { id: 84, cat: "pantry", en: "Flour 1kg",        ar: "دقيق ١ كغ",       price: 2.00, unit: "pack", emoji: "🌾" },
  { id: 85, cat: "pantry", en: "Natural Honey",    ar: "عسل طبيعي",       price: 6.50, unit: "btl",  emoji: "🍯", featured: true },
  { id: 86, cat: "pantry", en: "Chickpeas 400g",   ar: "حمص ٤٠٠ غ",       price: 1.80, unit: "pack", emoji: "🫘" },
  { id: 87, cat: "pantry", en: "Lentils 400g",     ar: "عدس ٤٠٠ غ",       price: 1.60, unit: "pack", emoji: "🫘" },
  { id: 88, cat: "pantry", en: "Tomato Paste",     ar: "معجون طماطم",     price: 1.10, unit: "pc",   emoji: "🥫" },
  { id: 89, cat: "pantry", en: "Black Tea",        ar: "شاي أسود",        price: 4.50, unit: "box",  emoji: "🍵" },
  { id: 90, cat: "pantry", en: "Ground Coffee",    ar: "قهوة مطحونة",     price: 7.90, unit: "pack", emoji: "☕" },
  { id: 91, cat: "pantry", en: "Spice Mix",        ar: "خلطة بهارات",     price: 2.30, unit: "pc",   emoji: "🧂" },

  /* ---- Beverages ---- */
  { id: 100, cat: "beverages", en: "Orange Juice 1L", ar: "عصير برتقال ١ لتر", price: 2.50, unit: "btl", emoji: "🧃", featured: true },
  { id: 101, cat: "beverages", en: "Cola 330ml",      ar: "كولا ٣٣٠ مل",       price: 1.00, unit: "pc",  emoji: "🥤", old: 1.25 },
  { id: 102, cat: "beverages", en: "Water 6×1.5L",    ar: "مياه ٦×١.٥ لتر",    price: 2.00, unit: "pack", emoji: "💧" },
  { id: 103, cat: "beverages", en: "Apple Juice 1L",  ar: "عصير تفاح ١ لتر",   price: 2.50, unit: "btl", emoji: "🧃" },
  { id: 104, cat: "beverages", en: "Lemonade",        ar: "ليمونادة",          price: 2.20, unit: "btl", emoji: "🍋" },
  { id: 105, cat: "beverages", en: "Iced Tea",        ar: "شاي مثلج",          price: 1.80, unit: "btl", emoji: "🥤" },
  { id: 106, cat: "beverages", en: "Energy Drink",    ar: "مشروب طاقة",        price: 2.80, unit: "pc",  emoji: "⚡" },
  { id: 107, cat: "beverages", en: "Mango Juice 1L",  ar: "عصير مانجو ١ لتر",  price: 2.60, unit: "btl", emoji: "🥭" },

  /* ---- Snacks ---- */
  { id: 120, cat: "snacks", en: "Potato Chips",   ar: "رقائق البطاطس", price: 1.50, unit: "pack", emoji: "🍟", old: 1.90 },
  { id: 121, cat: "snacks", en: "Chocolate Bar",  ar: "لوح شوكولاتة",  price: 1.20, unit: "pc",   emoji: "🍫", featured: true },
  { id: 122, cat: "snacks", en: "Mixed Nuts",     ar: "مكسرات مشكلة",  price: 5.50, unit: "pack", emoji: "🥜" },
  { id: 123, cat: "snacks", en: "Tea Biscuits",   ar: "بسكويت الشاي",  price: 1.80, unit: "pack", emoji: "🍪" },
  { id: 124, cat: "snacks", en: "Popcorn",        ar: "فشار",          price: 1.30, unit: "pack", emoji: "🍿" },
  { id: 125, cat: "snacks", en: "Candy Mix",      ar: "حلوى مشكلة",    price: 0.80, unit: "pack", emoji: "🍬" },
  { id: 126, cat: "snacks", en: "Ice Cream 1L",   ar: "آيس كريم ١ لتر", price: 3.20, unit: "box", emoji: "🍦", old: 4.00 },
  { id: 127, cat: "snacks", en: "Premium Dates",  ar: "تمر فاخر",      price: 6.00, unit: "box",  emoji: "🌴" },

  /* ---- Household & Cleaning ---- */
  { id: 140, cat: "household", en: "Dish Soap",          ar: "سائل غسيل الصحون", price: 2.10, unit: "btl",  emoji: "🧽" },
  { id: 141, cat: "household", en: "Laundry Detergent",  ar: "مسحوق غسيل",       price: 6.90, unit: "pack", emoji: "🧺", old: 8.50 },
  { id: 142, cat: "household", en: "Paper Towels",       ar: "مناشف ورقية",      price: 3.40, unit: "pack", emoji: "🧻" },
  { id: 143, cat: "household", en: "Bleach 1L",          ar: "مبيض ١ لتر",       price: 1.90, unit: "btl",  emoji: "🧴" },
  { id: 144, cat: "household", en: "Floor Cleaner",      ar: "منظف أرضيات",      price: 3.20, unit: "btl",  emoji: "🧹" },
  { id: 145, cat: "household", en: "Trash Bags (30)",    ar: "أكياس نفايات (٣٠)", price: 2.60, unit: "pack", emoji: "🗑️" },
  { id: 146, cat: "household", en: "Sponges (5 pcs)",    ar: "إسفنج (٥ حبات)",   price: 1.40, unit: "pack", emoji: "🧽" },
  { id: 147, cat: "household", en: "Air Freshener",      ar: "معطر جو",          price: 2.90, unit: "pc",   emoji: "🌸" },

  /* ---- Personal Care ---- */
  { id: 160, cat: "personal", en: "Shampoo 400ml",  ar: "شامبو ٤٠٠ مل",     price: 4.50, unit: "btl", emoji: "🧴", old: 5.50 },
  { id: 161, cat: "personal", en: "Toothpaste",     ar: "معجون أسنان",      price: 2.80, unit: "pc",  emoji: "🪥" },
  { id: 162, cat: "personal", en: "Soap Bar",       ar: "صابونة",           price: 1.50, unit: "pc",  emoji: "🧼" },
  { id: 163, cat: "personal", en: "Hand Wash",      ar: "غسول اليدين",      price: 2.40, unit: "btl", emoji: "🧴" },
  { id: 164, cat: "personal", en: "Tissues (200)",  ar: "مناديل (٢٠٠)",     price: 1.70, unit: "box", emoji: "📦" },
  { id: 165, cat: "personal", en: "Deodorant",      ar: "مزيل عرق",         price: 3.90, unit: "pc",  emoji: "🧴" },
  { id: 166, cat: "personal", en: "Razors (5 pcs)", ar: "شفرات حلاقة (٥)",  price: 3.20, unit: "pack", emoji: "🪒" },
  { id: 167, cat: "personal", en: "Body Lotion",    ar: "لوشن للجسم",       price: 5.20, unit: "btl", emoji: "🧴" }
];

/* Unit labels in both languages */
const UNITS = {
  kg:   { en: "kg",   ar: "كغ" },
  pc:   { en: "pc",   ar: "حبة" },
  pack: { en: "pack", ar: "عبوة" },
  box:  { en: "box",  ar: "علبة" },
  btl:  { en: "btl",  ar: "زجاجة" },
  l:    { en: "L",    ar: "لتر" }
};
