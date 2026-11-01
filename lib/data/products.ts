import type { CategoryId, Offer, Product, RetailerId, Vibe } from "@/lib/types";
import { hashString, peso, roundPrice, seeded } from "@/lib/utils";

/**
 * Mock catalog. Prices are illustrative and generated deterministically per
 * product so every retailer gets a slightly different offer.
 */
type Seed = [
  name: string,
  brand: string,
  category: CategoryId,
  subcategory: string,
  basePrice: number,
  emoji: string,
  unsplashId: string,
  vibes: Vibe[],
  tags: string[],
  retailers: RetailerId[],
  extra?: Partial<Pick<Product, "isNew" | "trending">>,
];

const SEEDS: Seed[] = [
  // Electronics
  ["Sony WH-1000XM5 Wireless Headphones", "Sony", "electronics", "Headphones", 18990, "🎧", "1505740420928-5e560c06d30e", ["workfromhome", "cozy"], ["noise cancelling", "wireless", "premium sound"], ["lazada", "shopee", "tiktok", "amazon"], { trending: true }],
  ["JBL Tune 520BT", "JBL", "electronics", "Headphones", 2490, "🎧", "1583394838336-acd977736f90", ["street", "sporty"], ["wireless", "budget", "bass"], ["shopee", "lazada", "tiktok"]],
  ["Apple AirPods Pro 2", "Apple", "electronics", "Earbuds", 13990, "🎵", "1606220588913-b3aacb4d2f46", ["workfromhome", "sporty"], ["noise cancelling", "earbuds", "wireless"], ["lazada", "shopee", "amazon"], { trending: true }],
  ["Bose QuietComfort Ultra", "Bose", "electronics", "Headphones", 21990, "🎧", "1546435770-a3e426bf472b", ["workfromhome", "cozy"], ["noise cancelling", "premium sound"], ["lazada", "shopee", "amazon"]],
  ["Samsung Galaxy Buds FE", "Samsung", "electronics", "Earbuds", 4990, "🎵", "1600294037681-c80b4cb5b434", ["sporty", "street"], ["earbuds", "wireless"], ["shopee", "lazada", "tiktok"]],
  ["Anker Soundcore Q20i", "Anker", "electronics", "Headphones", 2290, "🎧", "1618366712010-f4ae9c647dcb", ["workfromhome"], ["budget", "noise cancelling"], ["shopee", "lazada", "amazon"]],
  ["Apple Watch Series 9", "Apple", "electronics", "Smartwatch", 23990, "⌚", "1546868871-7041f2a55e12", ["sporty"], ["smartwatch", "fitness"], ["lazada", "shopee", "amazon"], { trending: true }],
  ["Xiaomi Redmi Watch 4", "Xiaomi", "electronics", "Smartwatch", 3990, "⌚", "1523275335684-37898b6baf30", ["sporty"], ["smartwatch", "budget"], ["shopee", "lazada", "tiktok", "aliexpress"]],
  ["Fujifilm Instax Mini 12", "Fujifilm", "electronics", "Cameras", 4790, "📸", "1526170375885-4d8ecf77b99f", ["cozy", "street"], ["camera", "instant", "gift idea"], ["shopee", "lazada", "tiktok"], { trending: true }],
  ["Marshall Emberton II Speaker", "Marshall", "electronics", "Speakers", 9490, "🔊", "1608043152269-423dbba4e7e1", ["cozy", "street"], ["speaker", "bluetooth"], ["lazada", "shopee", "amazon"]],
  ["Nintendo Switch OLED", "Nintendo", "electronics", "Gaming", 18490, "🎮", "1606813907291-d86efa9b94db", ["gamer", "cozy"], ["console", "gaming"], ["lazada", "shopee", "tiktok", "amazon"], { trending: true }],
  ["Logitech G Pro X Superlight 2", "Logitech", "electronics", "Gaming", 7990, "🖱️", "1527814050087-3793815479db", ["gamer", "workfromhome"], ["mouse", "gaming", "wireless"], ["shopee", "lazada", "amazon"], { isNew: true }],
  ["Keychron K2 Mechanical Keyboard", "Keychron", "electronics", "Gaming", 5490, "⌨️", "1587829741301-dc798b83add3", ["gamer", "workfromhome"], ["keyboard", "mechanical"], ["shopee", "lazada", "amazon", "aliexpress"]],
  ["Samsung Galaxy S24", "Samsung", "electronics", "Phones", 49990, "📱", "1610945415295-d9bbf067e59c", ["street"], ["phone", "android"], ["lazada", "shopee", "amazon"], { isNew: true }],
  ["iPad 10th Gen 64GB", "Apple", "electronics", "Tablets", 24990, "📲", "1544244015-0df4b3ffc6b0", ["workfromhome", "cozy"], ["tablet", "ipad"], ["lazada", "shopee", "amazon"]],

  // Fashion
  ["Nike Air Force 1 '07", "Nike", "fashion", "Sneakers", 5895, "👟", "1600269452121-4f2416e55c28", ["street"], ["sneakers", "classic", "white shoes"], ["shopee", "lazada", "tiktok", "amazon"], { trending: true }],
  ["Nike Air Max 90", "Nike", "fashion", "Sneakers", 7395, "👟", "1542291026-7eec264c27ff", ["street", "sporty"], ["sneakers", "running"], ["shopee", "lazada", "amazon"]],
  ["Adidas Samba OG", "Adidas", "fashion", "Sneakers", 6000, "👟", "1608231387042-66d1773070a5", ["street"], ["sneakers", "retro"], ["shopee", "lazada", "tiktok"], { trending: true }],
  ["New Balance 530", "New Balance", "fashion", "Sneakers", 5995, "👟", "1539185441755-769473a23570", ["street", "sporty"], ["sneakers", "dad shoe"], ["shopee", "lazada", "amazon"]],
  ["Coach Tabby Shoulder Bag 26", "Coach", "fashion", "Bags", 18900, "👜", "1548036328-c9fa89d128fa", ["glowup"], ["bag", "leather", "gift idea"], ["lazada", "shopee", "amazon"]],
  ["Michael Kors Jet Set Tote", "Michael Kors", "fashion", "Bags", 12900, "👜", "1584917865442-de89df76afd3", ["glowup", "workfromhome"], ["bag", "tote"], ["lazada", "shopee", "amazon"]],
  ["Uniqlo Oversized Hoodie", "Uniqlo", "fashion", "Clothing", 1990, "🧥", "1556821840-3a63f95609a7", ["cozy", "street"], ["hoodie", "basics"], ["shopee", "lazada", "tiktok"]],
  ["Levi's 501 Original Jeans", "Levi's", "fashion", "Clothing", 3990, "👖", "1542272604-787c3835535d", ["street"], ["denim", "classic"], ["shopee", "lazada", "amazon"]],
  ["Ray-Ban Wayfarer Classic", "Ray-Ban", "fashion", "Accessories", 8490, "🕶️", "1572635196237-14b3f281503f", ["street", "glowup"], ["sunglasses", "summer"], ["lazada", "shopee", "amazon"]],
  ["SHEIN Satin Slip Dress", "SHEIN", "fashion", "Clothing", 790, "👗", "1515886657613-9f3515b0c78f", ["glowup"], ["dress", "budget", "party"], ["shein", "shopee", "tiktok"], { isNew: true }],
  ["Casio G-Shock GA-2100", "Casio", "fashion", "Accessories", 6995, "⌚", "1524592094714-0f0654e20314", ["street", "sporty"], ["watch", "durable"], ["shopee", "lazada", "amazon"]],

  // Beauty
  ["Laneige Water Sleeping Mask", "Laneige", "beauty", "Skincare", 1280, "💧", "1556228578-8c89e6adf883", ["glowup", "cozy"], ["skincare", "hydrating", "k-beauty"], ["lazada", "shopee", "tiktok"], { trending: true }],
  ["COSRX Snail Mucin Essence", "COSRX", "beauty", "Skincare", 890, "🐌", "1620916566398-39f1143ab7be", ["glowup"], ["skincare", "k-beauty", "budget"], ["shopee", "lazada", "tiktok", "amazon"], { trending: true }],
  ["The Ordinary Niacinamide 10%", "The Ordinary", "beauty", "Skincare", 650, "🧴", "1598440947619-2c35fc9aa908", ["glowup"], ["skincare", "serum", "budget"], ["shopee", "lazada", "tiktok"]],
  ["Beauty of Joseon Sunscreen", "Beauty of Joseon", "beauty", "Skincare", 790, "☀️", "1608248543803-ba4f8c70ae0b", ["glowup", "sporty"], ["skincare", "sunscreen", "k-beauty"], ["shopee", "lazada", "tiktok"], { isNew: true }],
  ["Dyson Airwrap Multi-styler", "Dyson", "beauty", "Hair", 32900, "💨", "1522338242992-e1a54906a8da", ["glowup"], ["hair", "premium", "gift idea"], ["lazada", "shopee", "amazon"], { trending: true }],
  ["Rare Beauty Soft Pinch Blush", "Rare Beauty", "beauty", "Makeup", 1650, "🌸", "1596462502278-27bfdc403348", ["glowup"], ["makeup", "blush"], ["shopee", "lazada", "tiktok"], { trending: true }],
  ["Maybelline Sky High Mascara", "Maybelline", "beauty", "Makeup", 549, "👁️", "1522335789203-aabd1fc54bc9", ["glowup"], ["makeup", "budget"], ["shopee", "lazada", "tiktok"]],
  ["Glossier You Eau de Parfum", "Glossier", "beauty", "Fragrance", 4200, "🌷", "1585386959984-a4155224a1ad", ["glowup", "cozy"], ["fragrance", "gift idea"], ["shopee", "lazada", "amazon"]],
  ["Skincare Starter Set", "Lovioo Picks", "beauty", "Skincare", 1490, "🎀", "1570194065650-d99fb4bedf0a", ["glowup", "cozy"], ["skincare", "set", "gift idea"], ["shopee", "lazada", "tiktok"]],

  // Home
  ["Philips Hue Go Smart Lamp", "Philips", "home", "Lighting", 5490, "💡", "1513506003901-1e6a229e2d15", ["cozy", "gamer"], ["smart home", "lighting"], ["lazada", "shopee", "amazon"]],
  ["Boucle Accent Chair", "Lovioo Home", "home", "Furniture", 8990, "🪑", "1567538096630-e0c55bd6374c", ["cozy"], ["furniture", "aesthetic"], ["shopee", "lazada"], { isNew: true }],
  ["Linen Bedding Set (Queen)", "Comfort Lab", "home", "Bedding", 3490, "🛏️", "1522771739844-6a9f6d5f14af", ["cozy"], ["bedding", "linen"], ["shopee", "lazada", "tiktok"]],
  ["Nespresso Vertuo Pop", "Nespresso", "home", "Kitchen", 7990, "☕", "1495474472287-4d71bcdd2085", ["cozy", "workfromhome"], ["coffee", "kitchen"], ["lazada", "shopee", "amazon"], { trending: true }],
  ["Xiaomi Robot Vacuum S10", "Xiaomi", "home", "Appliances", 11990, "🤖", "1558317374-067fb5f30001", ["workfromhome"], ["smart home", "cleaning"], ["shopee", "lazada", "tiktok", "aliexpress"]],
  ["Monstera Plant in Ceramic Pot", "Plant Folk", "home", "Decor", 990, "🪴", "1614594975525-e45190c55d0b", ["cozy"], ["plants", "decor", "budget"], ["shopee", "lazada", "tiktok"]],
  ["Scented Soy Candle Trio", "Glow Co.", "home", "Decor", 690, "🕯️", "1602874801007-bd458bb1b8b6", ["cozy", "glowup"], ["candles", "gift idea", "budget"], ["shopee", "tiktok", "shein"]],
  ["Ergonomic Mesh Office Chair", "FlexiSpot", "home", "Furniture", 9990, "💺", "1580480055273-228ff5388ef8", ["workfromhome", "gamer"], ["furniture", "office"], ["shopee", "lazada", "amazon"]],

  // Sports
  ["Yonex Astrox 77 Pro Racket", "Yonex", "sports", "Badminton", 8990, "🏸", "1626224583764-f87db24ac4ea", ["sporty"], ["badminton", "racket"], ["shopee", "lazada"]],
  ["Lululemon Align Yoga Mat 5mm", "Lululemon", "sports", "Fitness", 5400, "🧘", "1601925260368-ae2f83cf8b7f", ["sporty", "cozy"], ["yoga", "fitness"], ["lazada", "shopee", "amazon"]],
  ["Adjustable Dumbbell Set 24kg", "PowerBlock", "sports", "Fitness", 6990, "🏋️", "1517836357463-d25dfeac3438", ["sporty"], ["gym", "home workout"], ["shopee", "lazada", "tiktok"]],
  ["Hydro Flask 32oz Wide Mouth", "Hydro Flask", "sports", "Outdoors", 2595, "🥤", "1602143407151-7111542de6e8", ["sporty", "street"], ["bottle", "outdoors"], ["shopee", "lazada", "amazon", "tiktok"], { trending: true }],
  ["Nike Pegasus 41 Running Shoes", "Nike", "sports", "Running", 6995, "🏃", "1491553895911-0055eca6402d", ["sporty"], ["running", "sneakers"], ["shopee", "lazada", "amazon"], { isNew: true }],
  ["Garmin Forerunner 165", "Garmin", "sports", "Running", 15990, "⌚", "1575311373937-040b8e1fd5b6", ["sporty"], ["gps watch", "running"], ["lazada", "shopee", "amazon"]],
  ["Coleman Sundome 4P Tent", "Coleman", "sports", "Outdoors", 5990, "⛺", "1504280390367-361c6d9f38f4", ["sporty", "cozy"], ["camping", "outdoors"], ["shopee", "lazada", "amazon"]],

  // Toys
  ["LEGO Botanical Flower Bouquet", "LEGO", "toys", "Building Sets", 3499, "💐", "1587654780291-39c9404d746b", ["cozy"], ["lego", "gift idea", "decor"], ["shopee", "lazada", "amazon", "tiktok"], { trending: true }],
  ["Pop Mart Labubu Blind Box", "Pop Mart", "toys", "Collectibles", 690, "🐰", "1559715541-5daf8a0296d0", ["cozy", "street"], ["collectible", "blind box", "budget"], ["shopee", "lazada", "tiktok"], { trending: true, isNew: true }],
  ["Squishmallows 12\" Plush", "Squishmallows", "toys", "Plush", 990, "🧸", "1559454403-b8fb88521f11", ["cozy"], ["plush", "gift idea", "budget"], ["shopee", "tiktok", "amazon"]],
  ["DJI Mini 4K Drone", "DJI", "toys", "RC & Drones", 19990, "🚁", "1473968512647-3e447244af8f", ["gamer", "sporty"], ["drone", "camera"], ["lazada", "shopee", "amazon"]],
  ["Rubik's Speed Cube Pro", "Rubik's", "toys", "Puzzles", 590, "🧩", "1591991731833-b4807cf7ef94", ["gamer"], ["puzzle", "budget"], ["shopee", "lazada", "aliexpress"]],
  ["Exploding Kittens Card Game", "Exploding Kittens", "toys", "Board Games", 1290, "🐱", "1610890716171-6b1bb98ffd09", ["cozy", "gamer"], ["board game", "party"], ["shopee", "lazada", "amazon"]],
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function makeOffers(slug: string, base: number, retailers: RetailerId[]): Offer[] {
  const rnd = seeded(hashString(slug));
  return retailers.map((retailer) => {
    const original = roundPrice(base * (1 + rnd() * 0.12));
    const discount = rnd() < 0.8 ? 0.06 + rnd() * 0.3 : 0;
    const price = roundPrice(original * (1 - discount));
    const shipping = rnd() < 0.55 ? 0 : [39, 49, 79, 99][Math.floor(rnd() * 4)];
    return {
      retailer,
      price,
      originalPrice: original,
      shipping,
      inStock: rnd() > 0.08,
      url: `https://example.com/${retailer}/${slug}`,
    };
  });
}

function describe(name: string, brand: string, sub: string, tags: string[]) {
  return `${name} by ${brand} — a fan-favourite in ${sub.toLowerCase()} loved for being ${tags
    .slice(0, 2)
    .join(" and ")}. Compare live offers across retailers and grab it at the best price.`;
}

export const PRODUCTS: Product[] = SEEDS.map(
  ([name, brand, category, subcategory, base, emoji, img, vibes, tags, retailers, extra], i) => {
    const slug = slugify(name);
    const rnd = seeded(hashString(slug + "meta"));
    return {
      id: `p${i + 1}`,
      slug,
      name,
      brand,
      category,
      subcategory,
      emoji,
      image: `https://images.unsplash.com/photo-${img}?auto=format&fit=crop&w=800&q=70`,
      tags,
      vibes,
      rating: Math.round((4.2 + rnd() * 0.75) * 10) / 10,
      reviewCount: Math.floor(300 + rnd() * 24000),
      description: describe(name, brand, subcategory, tags),
      highlights: [
        `Official ${brand} product`,
        tags[0] ? `Great for ${tags[0]}` : "Top rated",
        "Price tracked daily across retailers",
        "Free returns on most stores",
      ],
      offers: makeOffers(slug, base, retailers),
      ...extra,
    };
  },
);

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

export const bestOffer = (p: Product) =>
  [...p.offers]
    .filter((o) => o.inStock)
    .sort((a, b) => a.price + a.shipping - (b.price + b.shipping))[0] ?? p.offers[0];

/** "See prices" picks have no tracked price; the stores show live prices. */
export const isPriced = (p: Product) => p.priceTracked !== false;

/** Infinity for unpriced picks, so budget and price filters skip them and ascending sorts put them last. */
export const lowestPrice = (p: Product) => (isPriced(p) ? Math.min(...p.offers.map((o) => o.price)) : Infinity);

/** The top of the price range across stores (an offer's priceMax, else its price). Equal to lowestPrice when there's no range. */
export const highestPrice = (p: Product) => (isPriced(p) ? Math.max(...p.offers.map((o) => Math.max(o.price, o.priceMax ?? 0))) : Infinity);

/** One store's price: "₱130", or "₱130 – ₱190" when its shades/sizes are priced differently. */
export const offerPriceLabel = (o: Offer, sep = " – ") => (o.priceMax && o.priceMax > o.price ? `${peso(o.price)}${sep}${peso(o.priceMax)}` : peso(o.price));
export const hasRange = (o: Offer) => !!o.priceMax && o.priceMax > o.price;

/** "₱130" or, when shades/sizes are priced differently, "₱130 – ₱190". */
export const priceLabel = (p: Product, sep = " – ") => {
  const lo = lowestPrice(p);
  const hi = highestPrice(p);
  return hi > lo ? `${peso(lo)}${sep}${peso(hi)}` : peso(lo);
};

export const discountPct = (p: Product) => {
  if (!isPriced(p)) return 0;
  const o = [...p.offers].sort((a, b) => a.price - b.price)[0];
  return o.originalPrice > 0 ? Math.round((1 - o.price / o.originalPrice) * 100) : 0;
};

export const BRANDS: string[] = Array.from(new Set(PRODUCTS.map((p) => p.brand))).sort();

/** Browse chips and tiles only offer a category or vibe that has something in it: an empty one is a dead end. */
export const categoryHasProducts = (id: CategoryId) => PRODUCTS.some((p) => p.category === id);
export const vibeHasProducts = (id: Vibe | "under1k") =>
  PRODUCTS.some((p) => (id === "under1k" ? lowestPrice(p) <= 1000 : p.vibes.includes(id)));
