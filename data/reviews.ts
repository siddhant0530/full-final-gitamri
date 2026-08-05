export interface Review {
  id: string;
  productSlug: string;
  customerName: string;
  rating: number;
  text: string;
  photo?: string;
  homepageFeatured?: boolean;
}

export const reviews: Review[] = [
  // ── Homepage featured (4) ──
  {
    id: "1",
    productSlug: "green-chilli-pickle",
    customerName: "Nirmala Wankhede",
    rating: 5,
    text: "Absolutely loved the Green Chilli Pickle —ghargutti taste, just like homemade.",
    photo: "/nirmala wankhede.png.jpeg",
    homepageFeatured: true,
  },
  {
    id: "2",
    productSlug: "grated-mango-pickle",
    customerName: "Verified Customer",
    rating: 5,
    text: "Loved the Mango Chutney — great taste and quality.",
    homepageFeatured: true,
  },
  {
    id: "3",
    productSlug: "red-chilli-pickle",
    customerName: "Rajkumar Panyala",
    rating: 5,
    text: "super yummy Reminds my granmaa's Taste, and great packaging.",
    homepageFeatured: true,
  },
  {
    id: "4",
    productSlug: "red-chilli-pickle",
    customerName: "Ritesh Deshmukh",
    rating: 5,
    text: "glass jar reflects care and quality. Excellent flavour and presentation.",
    homepageFeatured: true,
  },

  // ── More Reviews (remaining 17, spread across the 3 products) ──
  { id: "5", productSlug: "mango-pickle", customerName: "Ankit Shahu", rating: 5, text: "Excellent quality and authentic taste. The pickle reminds me of homemade recipes from childhood. Highly recommended." },
  { id: "6", productSlug: "grated-mango-pickle", customerName: "Koti Tiwari", rating: 5, text: "Rich traditional flavour with excellent quality. You can tell it's made with care." },
  { id: "7", productSlug: "mango-pickle", customerName: "Dilip Rana", rating: 4, text: "Very tasty and fresh. The flavour is authentic, and the packaging is neat and secure." },
  { id: "8", productSlug: "red-chilli-pickle", customerName: "Tanmay Nagrale", rating: 5, text: "One of the best homemade-style pickles I've tried. Delicious with every meal." },
  { id: "9", productSlug: "grated-mango-pickle", customerName: "Pranjali Dhamgaye", rating: 5, text: "Authentic taste, premium quality, and beautifully packed. My family loved it." },
  { id: "10", productSlug: "mango-pickle", customerName: "Biplab Poddar", rating: 5, text: "Great flavour and consistent quality. It tastes just like traditional homemade pickle." },
  { id: "11", productSlug: "red-chilli-pickle", customerName: "Priyal", rating: 5, text: "Fresh, aromatic, and perfectly balanced. Definitely worth buying again." },
  { id: "12", productSlug: "grated-mango-pickle", customerName: "Gitesh", rating: 4, text: "Very good quality with rich flavours. A great product for everyday meals." },
  { id: "13", productSlug: "mango-pickle", customerName: "Mamita", rating: 5, text: "The freshness and traditional taste really stand out. Highly satisfied." },
  { id: "14", productSlug: "red-chilli-pickle", customerName: "Sharad Barsagade", rating: 5, text: "Premium quality products with authentic homemade flavour. Highly recommended." },
  { id: "15", productSlug: "grated-mango-pickle", customerName: "Rani", rating: 5, text: "Delicious taste and excellent packaging. Everyone at home enjoyed it." },
  { id: "16", productSlug: "mango-pickle", customerName: "Rahul Yelmanchi", rating: 4, text: "Great flavour and good quality ingredients. Looking forward to trying more varieties." },
  { id: "17", productSlug: "red-chilli-pickle", customerName: "Rahul Takod", rating: 5, text: "Excellent taste and consistent quality. Perfect with chapati and rice." },
  { id: "18", productSlug: "grated-mango-pickle", customerName: "Robin Dsouza", rating: 5, text: "Authentic Indian flavours with premium quality. Truly enjoyable." },
  { id: "19", productSlug: "mango-pickle", customerName: "Vijit Rathod", rating: 5, text: "Fresh ingredients and rich traditional taste. A product I'd happily recommend." },
  { id: "20", productSlug: "grated-mango-pickle", customerName: "Ishan Bargav", rating: 4, text: "Very satisfying taste with good spice balance. Great product overall." },
  { id: "21", productSlug: "mango-pickle", customerName: "Phuntsok Bhutia", rating: 5, text: "Authentic flavour, premium quality, and careful packaging. Highly impressed." },

  {
  id: "22",
  productSlug: "mixed-pickle",
  customerName: "Vanita Mane",
  rating: 5,
  text: "good product one can buy i tried 2 products and both are good",
  photo: "/vanita-mane.jpg.jpeg",
  homepageFeatured: false,
},
];