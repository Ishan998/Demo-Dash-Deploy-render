import type { Product, Collection, Testimonial, Occasion, Crystal, ProductType, NavItem, Banner, Discount, Notification, User, Address, Order } from './types';

export const festiveBanners: Banner[] = [
  {
    id: 1,
    imageUrl: 'https://picsum.photos/id/102/1200/400',
  },
  {
    id: 2,
    imageUrl: 'https://picsum.photos/id/219/1200/400',
  },
  {
    id: 3,
    imageUrl: 'https://picsum.photos/id/326/1200/400',
  },
];

export const CATEGORY_STRUCTURE = {
  "Earrings": [
    "Anti-Tarnish", "AD Earrings", "Koreans", "Ear Cuffs", "Replica", 
    "Pearl Earrings", "Oxidised", "Kundan", "Statement", "Monalisa Stone", 
    "Kashmiri", "Mosonite", "Jhumkis"
  ],
  "Rings": {
    "Anti-Tarnish": ["Plain", "AD"],
    "Korean": [],
    "Stone": [],
    "Replica": [],
    "AD": [],
    "Monalisa": [],
    "NINashkar": [],
    "Pearl": [],
    "Mosonite": [],
  },
  "Bracelets": {
    "Anti-Tarnish": ["Plain", "AD"],
    "Charms": [],
    "Korean-Stones": [],
    "Mosonite": [],
  },
  "Bangles": [
    "Gold", "Replica", "Oxidised", "AD", "Kundan", "Mosonite", "Stones"
  ],
  "Pendants Sets": [],
  "Chains": [],
  "Neck Piece": [],
};

export const products: Product[] = [
  {
    id: 1,
    name: 'Ethereal Diamond Necklace',
    category: 'Neck Piece',
    price: 195,
    originalPrice: 1380,
    imageUrl: 'https://picsum.photos/id/10/400/500',
    badge: 'Featured',
    inStock: true,
    stock: 8,
    metal: 'White Gold',
    gemstone: 'Diamond',
    color: 'Silver',
    size: '18 inch',
    occasion: 'Wedding',
    weight: '12g',
    width: '1.5cm',
    height: '2.5cm',
    depth: '0.3cm',
    deliveryDays: 3,
  },
  {
    id: 2,
    name: 'Serenity Pearl Earrings',
    category: 'Earrings',
    subcategory: 'Pearl Earrings',
    price: 150,
    originalPrice: 1250,
    imageUrl: 'https://picsum.photos/id/22/400/500',
    inStock: true,
    stock: 15,
    gemstone: 'Pearl',
    color: 'White',
    size: 'Standard',
    occasion: 'Everyday',
    weight: '5g',
    height: '2cm',
    deliveryDays: 5,
  },
  {
    id: 3,
    name: 'Celestial Gold Bangle',
    category: 'Bangles',
    subcategory: 'Gold',
    price: 210,
    originalPrice: 1420,
    imageUrl: 'https://picsum.photos/id/40/400/500',
    badge: 'New Arrivals',
    inStock: true,
    stock: 20,
    metal: 'Gold',
    color: 'Gold',
    size: '2.4 inch',
    occasion: 'Festive',
  },
  {
    id: 4,
    name: 'Royal Sapphire Ring',
    category: 'Rings',
    subcategory: 'Stone',
    price: 180,
    originalPrice: 1300,
    imageUrl: 'https://picsum.photos/id/42/400/500',
    badge: 'Featured',
    inStock: true,
    stock: 5,
    gemstone: 'Sapphire',
    color: 'Blue',
    size: '7',
    occasion: 'Party',
  },
   {
    id: 5,
    name: 'Aurora Opal Pendant',
    category: 'Pendants Sets',
    price: 165,
    originalPrice: 1480,
    imageUrl: 'https://picsum.photos/id/65/400/500',
    badge: 'New Arrivals',
    inStock: false,
    stock: 0,
    gemstone: 'Opal',
    color: 'Multi-color',
    occasion: 'Everyday',
  },
  {
    id: 6,
    name: 'Twinkling Star Studs',
    category: 'Earrings',
    subcategory: 'Statement',
    price: 130,
    originalPrice: 1210,
    imageUrl: 'https://picsum.photos/id/111/400/500',
    badge: 'Sale',
    inStock: true,
    stock: 30,
    color: 'Silver',
    occasion: 'Everyday',
  },
  {
    id: 7,
    name: 'Heirloom Emerald Ring',
    category: 'Rings',
    subcategory: 'Stone',
    price: 215,
    originalPrice: 1490,
    imageUrl: 'https://picsum.photos/id/129/400/500',
    badge: 'Featured',
    inStock: true,
    stock: 3,
    gemstone: 'Emerald',
    color: 'Green',
    size: '8',
    occasion: 'Anniversary',
  },
  {
    id: 8,
    name: 'Moonstone Charm Bracelet',
    category: 'Bracelets',
    subcategory: 'Charms',
    price: 140,
    originalPrice: 1280,
    imageUrl: 'https://picsum.photos/id/160/400/500',
    badge: 'Sale',
    inStock: true,
    stock: 12,
    gemstone: 'Moonstone',
    color: 'White',
    size: 'Adjustable',
    occasion: 'Everyday',
  },
  {
    id: 9,
    name: 'Golden Sunburst Locket',
    category: 'Pendants Sets',
    price: 175,
    originalPrice: 1350,
    imageUrl: 'https://picsum.photos/id/180/400/500',
    badge: 'New Arrivals',
    inStock: true,
    stock: 18,
    metal: 'Gold',
    color: 'Gold',
    occasion: 'Festive',
  },
  {
    id: 10,
    name: 'Rose Gold Hoops',
    category: 'Earrings',
    subcategory: 'Koreans',
    price: 200,
    originalPrice: 1450,
    imageUrl: 'https://picsum.photos/id/201/400/500',
    badge: 'Best Seller',
    inStock: true,
    stock: 25,
    metal: 'Rose Gold',
    color: 'Rose Gold',
    occasion: 'Party',
  },
  {
    id: 11,
    name: 'Ocean Jasper Ring',
    category: 'Rings',
    subcategory: 'Stone',
    price: 185,
    originalPrice: 1320,
    imageUrl: 'https://picsum.photos/id/211/400/500',
    badge: 'Featured',
    inStock: true,
    stock: 7,
    gemstone: 'Jasper',
    color: 'Blue',
    size: '6',
    occasion: 'Everyday',
  },
  {
    id: 12,
    name: 'Braided Silver Bracelet',
    category: 'Bracelets',
    subcategory: 'Anti-Tarnish',
    style: 'Plain',
    price: 125,
    originalPrice: 1200,
    imageUrl: 'https://picsum.photos/id/233/400/500',
    badge: 'Limited',
    inStock: true,
    stock: 10,
    expiryDate: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    metal: 'Silver',
    color: 'Silver',
    size: '18cm',
    occasion: 'Everyday',
  },
  {
    id: 13,
    name: 'Midnight Onyx Pendant',
    category: 'Pendants Sets',
    price: 155,
    originalPrice: 1400,
    imageUrl: 'https://picsum.photos/id/249/400/500',
    badge: 'Sale',
    inStock: false,
    stock: 0,
    gemstone: 'Onyx',
    color: 'Black',
    occasion: 'Party',
  },
  {
    id: 14,
    name: 'Garnet Drop Earrings',
    category: 'Earrings',
    subcategory: 'Statement',
    price: 190,
    originalPrice: 1370,
    imageUrl: 'https://picsum.photos/id/257/400/500',
    badge: 'New Arrivals',
    inStock: true,
    stock: 22,
    gemstone: 'Garnet',
    color: 'Red',
    occasion: 'Wedding',
  },
  {
    id: 15,
    name: 'Infinity Knot Ring',
    category: 'Rings',
    subcategory: 'Replica',
    price: 220,
    originalPrice: 1500,
    imageUrl: 'https://picsum.photos/id/305/400/500',
    badge: 'Best Seller',
    inStock: true,
    stock: 40,
    color: 'Silver',
    size: '7',
    occasion: 'Anniversary',
  },
  {
    id: 16,
    name: 'Engravable Heart Bangle',
    category: 'Bangles',
    subcategory: 'Gold',
    price: 160,
    originalPrice: 1290,
    imageUrl: 'https://picsum.photos/id/312/400/500',
    inStock: true,
    stock: 50,
    metal: 'Gold',
    color: 'Gold',
    size: '2.6 inch',
    occasion: 'Anniversary',
  },
  {
    id: 17,
    name: 'Ruby Red Pendant',
    category: 'Pendants Sets',
    price: 800,
    originalPrice: 1000, // 20% off
    imageUrl: 'https://picsum.photos/id/327/400/500',
    badge: 'Sale',
    inStock: true,
    stock: 10,
    gemstone: 'Ruby',
    color: 'Red',
    occasion: 'Anniversary',
  },
  {
    id: 18,
    name: 'Aqua Marine Drops',
    category: 'Earrings',
    price: 600,
    originalPrice: 900, // 33.3% off
    imageUrl: 'https://picsum.photos/id/500/400/500',
    badge: 'Sale',
    inStock: true,
    stock: 10,
    gemstone: 'Aquamarine',
    color: 'Blue',
    occasion: 'Party',
  },
  {
    id: 19,
    name: 'Onyx Power Ring',
    category: 'Rings',
    price: 450,
    originalPrice: 1000, // 55% off
    imageUrl: 'https://picsum.photos/id/249/400/500',
    badge: 'Sale',
    inStock: true,
    stock: 5,
    gemstone: 'Onyx',
    color: 'Black',
    size: '9',
    occasion: 'Everyday',
  },
];

export const featuredProducts: Product[] = products.filter(p => p.badge === 'Featured');
export const newArrivals: Product[] = products.filter(p => p.badge === 'New Arrivals').slice(0, 8);
export const bestSellers: Product[] = products.filter(p => p.badge === 'Best Seller').slice(0, 8);
export const festiveSaleProducts: Product[] = products.filter(p => p.originalPrice).slice(0, 8); // Updated to show any product with a discount
export const limitedOffers: Product[] = products.filter(p => p.badge === 'Limited').slice(0, 8);


export const collections: Collection[] = [
  {
    id: 1,
    name: 'The Bridal Collection',
    description: 'Exquisite pieces for your special day.',
    imageUrl: 'https://picsum.photos/id/1074/800/600',
  },
  {
    id: 2,
    name: 'Everyday Elegance',
    description: 'Subtle luxury for your daily life.',
    imageUrl: 'https://picsum.photos/id/367/800/600',
  },
  {
    id: 3,
    name: 'Statement Pieces',
    description: 'Bold designs that command attention.',
    imageUrl: 'https://picsum.photos/id/659/800/600',
  },
];

export const occasions: Occasion[] = [
    {
        id: 1,
        name: 'Wedding & Bridal',
        imageUrl: 'https://picsum.photos/id/1011/1200/600',
        gridClass: 'md:col-span-2',
    },
    {
        id: 2,
        name: 'Anniversary Gifts',
        imageUrl: 'https://picsum.photos/id/1025/1200/600',
        gridClass: 'md:col-span-2',
    },
    {
        id: 3,
        name: 'Birthday Glamour',
        imageUrl: 'https://picsum.photos/id/107/600/600',
        gridClass: '',
    },
    {
        id: 4,
        name: 'Festive Celebrations',
        imageUrl: 'https://picsum.photos/id/21/600/600',
        gridClass: '',
    },
    {
        id: 5,
        name: 'Corporate Gifting',
        imageUrl: 'https://picsum.photos/id/30/600/600',
        gridClass: '',
    },
    {
        id: 6,
        name: 'Just Because',
        imageUrl: 'https://picsum.photos/id/48/600/600',
        gridClass: '',
    }
];


export const crystals: Crystal[] = [
    { id: 1, name: 'Amethyst', imageUrl: 'https://picsum.photos/id/250/800/600', gridClass: 'md:col-span-2' },
    { id: 2, name: 'Rose Quartz', imageUrl: 'https://picsum.photos/id/1016/600/600', gridClass: '' },
    { id: 3, name: 'Emerald', imageUrl: 'https://picsum.photos/id/1075/600/600', gridClass: '' },
    { id: 4, name: 'Moonstone', imageUrl: 'https://picsum.photos/id/15/600/600', gridClass: '' },
    { id: 5, name: 'Diamond', imageUrl: 'https://picsum.photos/id/1080/600/600', gridClass: '' },
    { id: 6, name: 'Ruby', imageUrl: 'https://picsum.photos/id/327/800/600', gridClass: 'md:col-span-2' },
    { id: 7, name: 'Sapphire', imageUrl: 'https://picsum.photos/id/338/600/600', gridClass: '' },
    { id: 8, name: 'Opal', imageUrl: 'https://picsum.photos/id/431/800/600', gridClass: 'md:col-span-2' },
    { id: 9, name: 'Turquoise', imageUrl: 'https://picsum.photos/id/435/600/600', gridClass: '' },
    { id: 10, name: 'Garnet', imageUrl: 'https://picsum.photos/id/440/600/600', gridClass: '' },
    { id: 11, name: 'Aquamarine', imageUrl: 'https://picsum.photos/id/500/600/600', gridClass: '' },
    { id: 12, name: 'Peridot', imageUrl: 'https://picsum.photos/id/525/800/600', gridClass: 'md:col-span-2' },
];

export const productTypes: ProductType[] = [
    { id: 1, name: 'Rings', imageUrl: 'https://picsum.photos/id/42/800/800', gridClass: 'md:col-span-2 md:row-span-2' },
    { id: 2, name: 'Necklaces', imageUrl: 'https://picsum.photos/id/10/800/600', gridClass: '' },
    { id: 3, name: 'Earrings', imageUrl: 'https://picsum.photos/id/22/800/600', gridClass: '' },
    { id: 4, name: 'Bracelets', imageUrl: 'https://picsum.photos/id/40/800/600', gridClass: 'md:col-span-2' },
    { id: 5, name: 'Pendants', imageUrl: 'https://picsum.photos/id/65/800/600', gridClass: '' },
    { id: 6, name: 'Bangles', imageUrl: 'https://picsum.photos/id/160/800/600', gridClass: '' },
    { id: 7, name: 'Charms', imageUrl: 'https://picsum.photos/id/180/800/600', gridClass: 'md:col-span-2' },
    { id: 8, name: 'Brooches', imageUrl: 'https://picsum.photos/id/201/800/600', gridClass: '' },
    { id: 9, name: 'Anklets', imageUrl: 'https://picsum.photos/id/211/800/600', gridClass: '' },
    { id: 10, name: 'Cufflinks', imageUrl: 'https://picsum.photos/id/233/800/800', gridClass: 'md:col-span-2' },
];


export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Eleanor Vance',
    quote: 'The craftsmanship is simply breathtaking. My necklace from Blessing Ornaments is a piece I will cherish forever.',
    rating: 5,
  },
  {
    id: 2,
    name: 'James Alistair',
    quote: 'I purchased an engagement ring, and the service and quality were exceptional. She was overjoyed!',
    rating: 5,
  },
  {
    id: 3,
    name: 'Chloe Dubois',
    quote: 'Absolutely in love with my earrings. They are the perfect blend of modern design and timeless elegance.',
    rating: 5,
  },
];

export const navigation: NavItem[] = [
  {
    name: 'Jewellery',
    menuType: 'mega',
    megaMenu: {
      sections: [
        {
          title: 'By Category',
          links: [
            { name: 'Rings', href: '#', filter: { type: 'category', value: 'Rings' } },
            { name: 'Neck Piece', href: '#', filter: { type: 'category', value: 'Neck Piece' } },
            { name: 'Earrings', href: '#', filter: { type: 'category', value: 'Earrings' } },
            { name: 'Bracelets', href: '#', filter: { type: 'category', value: 'Bracelets' } },
            { name: 'Pendants Sets', href: '#', filter: { type: 'category', value: 'Pendants Sets' } },
            { name: 'Bangles', href: '#', filter: { type: 'category', value: 'Bangles' } },
          ],
        },
        {
          title: 'By Material',
          links: [
            { name: 'Kundan', href: '#', filter: { type: 'subcategory', value: 'Kundan' } },
            { name: 'Pearl', href: '#', filter: { type: 'gemstone', value: 'Pearl' } },
            { name: 'Mosonite', href: '#', filter: { type: 'subcategory', value: 'Mosonite' } },
            { name: 'Oxidised', href: '#', filter: { type: 'subcategory', value: 'Oxidised' } },
            { name: 'American Diamond', href: '#', filter: { type: 'subcategory', value: 'AD' } },
            { name: 'Monalisa Stone', href: '#', filter: { type: 'subcategory', value: 'Monalisa Stone' } },
          ],
        },
        {
          title: 'Collections & More',
          links: [
            { name: 'Featured Products', href: '#', filter: { type: 'badge', value: 'Featured' } },
            { name: 'Best Sellers', href: '#', filter: { type: 'badge', value: 'Best Seller' } },
            { name: 'New Arrivals', href: '#', filter: { type: 'badge', value: 'New Arrivals' } },
            { name: 'Festive Sale', href: '#', filter: { type: 'badge', value: 'Festive Sale' } },
            { name: 'Limited Offers', href: '#', filter: { type: 'badge', value: 'Limited' } },
          ],
        },
      ],
    },
  },
  {
    name: 'Crystal Name',
    menuType: 'simple',
    megaMenu: {
      sections: [
        {
          title: 'By Crystal',
          links: [
            { name: 'Amethyst', href: '#' },
            { name: 'Rose Quartz', href: '#' },
            { name: 'Emerald', href: '#', filter: { type: 'gemstone', value: 'Emerald' } },
            { name: 'Moonstone', href: '#', filter: { type: 'gemstone', value: 'Moonstone' } },
            { name: 'Diamond', href: '#', filter: { type: 'gemstone', value: 'Diamond' } },
            { name: 'Ruby', href: '#' },
            { name: 'Sapphire', href: '#', filter: { type: 'gemstone', value: 'Sapphire' } },
          ],
        },
      ],
    },
  },
  {
    name: 'Color',
    menuType: 'simple',
    megaMenu: {
      sections: [
        {
          title: 'Shop by Color',
          links: [
            { name: 'Gold', href: '#', filter: { type: 'metal', value: 'Gold' } },
            { name: 'Silver', href: '#', filter: { type: 'metal', value: 'Silver' } },
            { name: 'Rose Gold', href: '#', filter: { type: 'metal', value: 'Rose Gold' } },
            { name: 'White', href: '#', filter: { type: 'metal', value: 'White Gold' } },
            { name: 'Blue', href: '#' },
            { name: 'Green', href: '#' },
            { name: 'Red', href: '#' },
          ],
        },
         {
          title: 'Shop by Shade',
          links: [
            { name: 'Pastel', href: '#' },
            { name: 'Vibrant', href: '#' },
            { name: 'Deep & Dark', href: '#' },
            { name: 'Earthy Tones', href: '#' },
          ],
        },
      ],
    },
  },
  { name: 'All Products', href: '#' },
  { name: 'About Us', href: '#' },
];

export const detailedProduct: Product = {
    ...products[0],
    images: [
        'https://picsum.photos/id/10/800/1000',
        'https://picsum.photos/id/10/800/1000?grayscale',
        'https://picsum.photos/id/10/800/1000?blur=1',
        'https://picsum.photos/seed/pendant/800/1000',
        'https://picsum.photos/seed/lifestyle/800/1000',
    ],
    description: "The Ethereal Diamond Necklace is a masterpiece of design, featuring a scintillating round-cut diamond cradled in a delicate 18k white gold setting. Its timeless elegance makes it the perfect accessory for both grand occasions and everyday luxury. Suspended from a fine, adjustable chain, this necklace captures and reflects light with every movement, promising a constant sparkle that will draw all eyes. A symbol of purity and eternal love, it's not just a piece of jewellery, but a future heirloom.",
    specifications: [
        // This is now dynamically generated in App.tsx
    ],
    reviews: [
        { id: 1, name: 'Priya Sharma', rating: 5, quote: "Absolutely breathtaking! The diamond sparkles more than I could have imagined. I receive compliments every time I wear it." },
        { id: 2, name: 'Aarav Patel', rating: 5, quote: "Bought this for my wife for our anniversary and she wasspeechless. The quality and craftsmanship are top-notch. Thank you, Blessing Ornaments!" },
        { id: 3, name: 'Sana Khan', rating: 4, quote: "A beautiful necklace, very elegant and classic. The chain is a bit thinner than I expected, but it feels sturdy enough." },
        { id: 4, name: 'Vikram Singh', rating: 5, quote: "Excellent customer service and a stunning product. The packaging was also very luxurious. Highly recommend." },
        { id: 5, name: 'Ananya Reddy', rating: 5, quote: "My dream necklace! It's the perfect size and sits beautifully. So happy with my purchase." },
    ],
    discounts: [
        { id: 1, code: 'AURA10', description: 'Get 10% off on your first purchase.', value: 10, type: 'percentage' },
        { id: 2, code: 'DIWALI5K', description: 'Flat ₹5,000 off for the festive season.', value: 5000, type: 'flat' },
    ],
    richDescription: [
        {
            id: 'rd1',
            type: 'image-text',
            imageUrl: 'https://picsum.photos/id/53/1200/800',
            title: 'A Legacy of Brilliance',
            text: 'Our Ethereal Diamond Necklace is more than just an accessory; it is the culmination of generations of artisanal skill. Each diamond is hand-selected for its exceptional fire and brilliance, ensuring that your piece is as unique as your own story. The minimalist design puts the focus squarely on the stone\'s natural beauty, creating a classic look that transcends fleeting trends.',
            imagePosition: 'right',
        },
        {
            id: 'rd2',
            type: 'three-column',
            columns: [
                { iconUrl: 'https://picsum.photos/id/11/100/100', title: 'Certified Quality', text: 'Every diamond is GIA certified, guaranteeing its quality and your peace of mind.' },
                { iconUrl: 'https://picsum.photos/id/21/100/100', title: 'Sustainable Luxury', text: 'Crafted with recycled 18k gold and ethically sourced diamonds for a conscious choice.' },
                { iconUrl: 'https://picsum.photos/id/31/100/100', title: 'Lifetime Warranty', text: 'We stand by our craftsmanship with a comprehensive lifetime warranty on your piece.' },
            ],
        },
        {
            id: 'rd3',
            type: 'banner',
            imageUrl: 'https://picsum.photos/id/145/1200/400',
            title: 'Wear Your Story',
        },
    ]
};

export const sampleNotifications: Notification[] = [
  {
    id: 1,
    type: 'welcome',
    title: 'Welcome to Blessing Ornaments!',
    message: 'Discover timeless elegance. Enjoy 10% off your first order with code: AURA10.',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: 2,
    type: 'new_arrival',
    title: 'Fresh & Sparkling',
    message: 'The new Solstice Collection has arrived. Explore pieces inspired by the celestial dance.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: false,
  },
  {
    id: 3,
    type: 'sale',
    title: 'The Festive Sale is ON!',
    message: 'Enjoy up to 30% off on all diamond jewellery. A limited time offer!',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    read: false,
  },
  {
    id: 4,
    type: 'shipping',
    title: 'Order Shipped',
    message: 'Your order ORD-2024-003 is on its way to you!',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    read: true,
  },
];

export const sampleUser: User = {
  id: 1,
  fullName: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  phone: '+91 98765 43210',
};

export const sampleAddresses: Address[] = [
  {
    id: 1,
    type: 'Home',
    line1: 'A-123, Rosewood Apartments',
    line2: 'Malabar Hill',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip: '400006',
    country: 'India',
    isDefault: true,
  },
  {
    id: 2,
    type: 'Work',
    line1: 'Floor 15, The Corporate Hub',
    line2: 'Bandra Kurla Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip: '400051',
    country: 'India',
    isDefault: false,
  },
];

export const sampleOrders: Order[] = [
  {
    id: 1,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
    total: 99999,
    items: [{ productId: 1, quantity: 1 }],
  },
  {
    id: 2,
    date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'accepted',
    total: 79500,
    items: [{ productId: 2, quantity: 1 }, { productId: 6, quantity: 1 }],
  },
  {
    id: 3,
    date: new Date('2023-11-20T10:00:00Z').toISOString(),
    status: 'dispatched',
    total: 168000,
    items: [{ productId: 4, quantity: 1 }],
  },
   {
    id: 4,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    total: 31000,
    items: [{ productId: 10, quantity: 1 }],
  }
];
