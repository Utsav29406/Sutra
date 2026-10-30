export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

/**
 * Attribution for a photograph used under an open licence.
 *
 * Creative Commons BY and BY-SA are free to use commercially, but only on
 * condition that the photographer, the source and the licence are credited
 * where the image appears. The product page prints this under the photo.
 */
export interface ImageCredit {
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  fabric: string;
  sizes: string[];
  images: string[];
  stock: number;
  featured: boolean;
  rating: number;
  reviewCount: number;
  state: string | null;
  craftName: string | null;
  createdAt: string;
  category: Category;
  categoryId: string;
  colors: string[];
  /** Set when the photo is openly licensed and must be credited. */
  imageCredit?: ImageCredit;
}

export const WOMEN: Category = {
  id: "cmrqik5fc0000p8gqp46l5l03",
  name: "Women",
  slug: "women",
  description: "Sarees, lehengas, dupattas, and handcrafted pieces for women.",
  imageUrl: "/images/categories/Women-icon.png",
};

export const MEN: Category = {
  id: "cmrqik7qb0001p8gqhg84q2pe",
  name: "Men",
  slug: "men",
  description: "Sherwanis, kurtas, shawls, and handcrafted pieces for men.",
  imageUrl: "/images/categories/Men-icon.png",
};

export const categories: Category[] = [MEN, WOMEN];

const COLORS = [
  "Red", "Maroon", "Gold", "Ivory", "Blue", "Teal", "Green", "Yellow",
  "Pink", "Orange", "Purple", "Black", "Grey", "Beige", "Brown",
];

const FREE_SIZE = ["Free Size"];
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const FOOTWEAR_SIZES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];

type RawProduct = Omit<Product, "categoryId" | "colors">;

const rawProducts: RawProduct[] = [
  {
    id: "cmrweodgi000104lajltxlb7n",
    name: "Patan Patola Silk Dupatta",
    slug: "patan-patola-silk-dupatta",
    description: "A double-ikat Patola dupatta from Patan, Gujarat, woven with the same tiger-and-elephant trade motifs once reserved for the Indonesian elite, in a lighter stole-weight silk.",
    price: 7999, compareAtPrice: 9499, fabric: "Double Ikat Patola Silk", sizes: FREE_SIZE,
    images: ["/images/products/patan-patola-silk-dupatta.jpg"], stock: 25, featured: true, rating: 4.5, reviewCount: 0,
    state: null, craftName: null, createdAt: "2026-07-22T18:18:22.626Z", category: WOMEN,
  },
  {
    id: "cmrwdkouw000204idx10e5v3m",
    name: "Gujarati Bridal Saree Set",
    slug: "gujarati-bridal-saree-set",
    description: "A traditional Gujarati bridal saree set in silk with a zari border, styled after the dowry ensembles gifted to brides across Gujarat for their wedding day.",
    price: 9499, compareAtPrice: 11999, fabric: "Silk with Zari Border", sizes: FREE_SIZE,
    images: ["/images/products/gujarati-bridal-saree-set.jpg"], stock: 25, featured: true, rating: 4.5, reviewCount: 0,
    state: null, craftName: null, createdAt: "2026-07-22T18:17:10.000Z", category: WOMEN,
    imageCredit: {
      title: "Woman's Wedding Sari LACMA M.71.37.2 (2 of 2)", author: "Los Angeles County Museum of Art",
      license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Woman%27s_Wedding_Sari_LACMA_M.71.37.2_(2_of_2).jpg",
    },
  },
  {
    id: "cmrwdkouw000304idx10e5v3n",
    name: "Chaniya Choli Garba Set",
    slug: "chaniya-choli-garba-set",
    description: "A flared Chaniya Choli — mirror-worked skirt, fitted choli, and a contrast dupatta — Gujarat's essential Navratri and Garba outfit, made to twirl.",
    price: 3999, compareAtPrice: 4999, fabric: "Cotton with Mirror Work Embroidery", sizes: CLOTHING_SIZES,
    images: ["/images/products/chaniya-choli-garba-set.jpg"], stock: 25, featured: true, rating: 4.5, reviewCount: 0,
    state: null, craftName: null, createdAt: "2026-07-22T18:16:04.000Z", category: WOMEN,
  },
  {
    id: "cmrwdkouw000404idx10e5v3o",
    name: "Mirror Work Kediyu-Chorno Set",
    slug: "mirror-work-kediyu-chorno-set",
    description: "A traditional Gujarati Kediyu — a flared, frock-style short top gathered at the waist — hand-embroidered with mirror work and paired with a matching Chorno. The signature Garba and Navratri outfit for men.",
    price: 2499, compareAtPrice: null, fabric: "Cotton with Mirror Work Embroidery", sizes: CLOTHING_SIZES,
    images: ["/images/products/mirror-work-kediyu-chorno-set.jpg"], stock: 25, featured: true, rating: 4.5, reviewCount: 0,
    state: null, craftName: null, createdAt: "2026-07-22T18:15:41.000Z", category: MEN,
  },
  {
    id: "cmrwdkouw000504idx10e5v3p",
    name: "Kashmiri Pashmina Shawl",
    slug: "kashmiri-pashmina-shawl",
    description: "A genuine hand-spun Pashmina shawl from Kashmir, made from the fine undercoat of Changthangi goats and hand-woven by Kashmiri artisans for exceptional warmth.",
    price: 8999, compareAtPrice: 11999, fabric: "Pure Pashmina Wool", sizes: FREE_SIZE,
    images: ["/images/products/kashmiri-pashmina-shawl.jpg"], stock: 25, featured: true, rating: 4.5, reviewCount: 0,
    state: null, craftName: null, createdAt: "2026-07-22T18:14:55.000Z", category: WOMEN,
    imageCredit: {
      title: "Embroidered-pashmina-shawl", author: "AG",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Embroidered-pashmina-shawl.jpg",
    },
  },
  {
    id: "cmrwdkouw000604idx10e5v3q",
    name: "Bengal Tant Cotton Saree",
    slug: "bengal-tant-cotton-saree",
    description: "A classic Bengal Tant saree, handwoven in fine cotton with a starched crispness and a traditional red temple border — an everyday favourite across West Bengal.",
    price: 2999, compareAtPrice: 3799, fabric: "Tant Cotton", sizes: FREE_SIZE,
    images: ["/images/products/bengal-tant-cotton-saree.jpg"], stock: 25, featured: true, rating: 4.5, reviewCount: 0,
    state: null, craftName: null, createdAt: "2026-07-22T18:13:30.000Z", category: WOMEN,
    imageCredit: {
      title: "Tant Sarees - Phulia 2016-11-12 1871", author: "Biswarup Ganguly",
      license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Tant_Sarees_-_Phulia_2016-11-12_1871.JPG",
    },
  },
  {
    id: "cmrwdkouw000704idx10e5v3r",
    name: "Pochampally Ikat Saree",
    slug: "pochampally-ikat-saree",
    description: "A Pochampally Ikat saree from Telangana, where yarn is tie-dyed before weaving to produce the geometric 'chowka' patterns unique to this GI-tagged craft.",
    price: 5499, compareAtPrice: 6999, fabric: "Pochampally Ikat Silk-Cotton", sizes: FREE_SIZE,
    images: ["/images/products/pochampally-ikat-saree.jpg"], stock: 25, featured: true, rating: 4.5, reviewCount: 0,
    state: null, craftName: null, createdAt: "2026-07-22T18:12:18.000Z", category: WOMEN,
  },
  {
    id: "cmrwdkouw000804idx10e5v3s",
    name: "Sambalpuri Ikat Saree",
    slug: "sambalpuri-ikat-saree",
    description: "A Sambalpuri Ikat saree from Odisha, tie-dyed before weaving using the resist-dye Bandha technique to create motifs like the iconic shankha and chakra.",
    price: 6999, compareAtPrice: 8499, fabric: "Sambalpuri Ikat Cotton", sizes: FREE_SIZE,
    images: ["/images/products/sambalpuri-ikat-saree.jpg"], stock: 25, featured: true, rating: 4.5, reviewCount: 0,
    state: null, craftName: null, createdAt: "2026-07-22T18:11:02.000Z", category: WOMEN,
    imageCredit: {
      title: "Sambalpuri saree pallu", author: "Rahul191313",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Sambalpuri_saree_pallu.jpg",
    },
  },
  {
    id: "sutra-banarasi-silk-saree",
    name: "Banarasi Silk Saree",
    slug: "banarasi-silk-saree",
    description: "A Banarasi silk saree from Varanasi, brocaded in real zari with dense mughal-inspired jaal and a heavy pallu — the wedding saree of north India for five centuries.",
    price: 11999, compareAtPrice: 14999, fabric: "Katan Silk with Zari Brocade", sizes: FREE_SIZE,
    images: ["/images/products/banarasi-silk-saree.jpg"], stock: 18, featured: false, rating: 4.8, reviewCount: 34,
    state: "Uttar Pradesh", craftName: "Banarasi Brocade", createdAt: "2026-08-02T09:20:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Banarasi sari pallu by ashish4", author: "आशीष भटनागर",
      license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Banarasi_sari_pallu_by_ashish4.JPG",
    },
  },
  {
    id: "sutra-velvet-bridal-lehenga",
    name: "Zardozi Velvet Bridal Lehenga",
    slug: "zardozi-velvet-bridal-lehenga",
    description: "A deep red velvet lehenga hand-worked in zardozi — raised metallic embroidery couched over silk — with a fitted choli and a scalloped net dupatta.",
    price: 18999, compareAtPrice: 24999, fabric: "Silk Velvet with Zardozi Embroidery", sizes: CLOTHING_SIZES,
    images: ["/images/products/zardozi-velvet-bridal-lehenga.jpg"], stock: 8, featured: false, rating: 4.9, reviewCount: 21,
    state: "Rajasthan", craftName: "Zardozi", createdAt: "2026-08-01T11:05:00.000Z", category: WOMEN,
  },
  {
    id: "sutra-kanjivaram-bridal-saree",
    name: "Kanjivaram Bridal Silk Saree",
    slug: "kanjivaram-bridal-silk-saree",
    description: "A Kanjivaram from Kanchipuram, woven in mulberry silk with a contrast korvai border joined by hand — the interlocked seam that makes the weave unmistakable.",
    price: 14999, compareAtPrice: 18999, fabric: "Mulberry Silk with Korvai Border", sizes: FREE_SIZE,
    images: ["/images/products/kanjivaram-bridal-silk-saree.jpg"], stock: 12, featured: false, rating: 4.7, reviewCount: 28,
    state: "Tamil Nadu", craftName: "Kanjivaram Silk", createdAt: "2026-07-30T14:40:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Traditional Silk Saree in Dark Green with Gold Zari and Maroon Border", author: "Pachiyappassilks",
      license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Traditional_Silk_Saree_in_Dark_Green_with_Gold_Zari_and_Maroon_Border.jpg",
    },
  },
  {
    id: "sutra-chikankari-saree",
    name: "Lucknowi Chikankari Saree",
    slug: "lucknowi-chikankari-saree",
    description: "Shadow-work Chikankari hand-embroidered on soft georgette by Lucknow's karigars, with a pallu worked in bakhiya and murri stitches over several weeks.",
    price: 4499, compareAtPrice: 5999, fabric: "Georgette with Chikankari Hand Embroidery", sizes: FREE_SIZE,
    images: ["/images/products/lucknowi-chikankari-saree.jpg"], stock: 22, featured: false, rating: 4.6, reviewCount: 41,
    state: "Uttar Pradesh", craftName: "Chikankari", createdAt: "2026-07-28T08:15:00.000Z", category: WOMEN,
  },
  {
    id: "sutra-chikankari-kurta-set",
    name: "Chikankari Cotton Kurta Set",
    slug: "chikankari-cotton-kurta-set",
    description: "A white-on-white Chikankari kurta in breathable cotton mul with matching palazzo — the summer staple of Awadh, light enough to wear all day.",
    price: 3499, compareAtPrice: 4299, fabric: "Cotton Mul with Chikankari Hand Embroidery", sizes: CLOTHING_SIZES,
    images: ["/images/products/chikankari-cotton-kurta-set.jpg"], stock: 30, featured: false, rating: 4.4, reviewCount: 57,
    state: "Uttar Pradesh", craftName: "Chikankari", createdAt: "2026-07-26T16:00:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Kurta closeup sandalwood buttons", author: "Fowler&fowler at English Wikipedia",
      license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kurta_closeup_sandalwood_buttons.jpg",
    },
  },
  {
    id: "sutra-bandhani-odhani",
    name: "Bandhani Odhani Dupatta",
    slug: "bandhani-odhani-dupatta",
    description: "A Kutchi Bandhani odhani, tied into thousands of tiny knots by hand before dyeing so each dot resists the colour — the knots are opened only by the wearer.",
    price: 1999, compareAtPrice: 2699, fabric: "Bandhani Tie-Dyed Cotton", sizes: FREE_SIZE,
    images: ["/images/products/bandhani-odhani-dupatta.jpg"], stock: 40, featured: false, rating: 4.3, reviewCount: 62,
    state: "Gujarat", craftName: "Bandhani", createdAt: "2026-07-24T10:30:00.000Z", category: WOMEN,
  },
  {
    id: "sutra-sanganeri-block-print-saree",
    name: "Sanganeri Block Print Saree",
    slug: "sanganeri-block-print-saree",
    description: "Hand block printed in Sanganer near Jaipur, where carved teak blocks are struck by hand across the length of the cloth in fine floral butis on a cream ground.",
    price: 2299, compareAtPrice: 2999, fabric: "Hand Block Printed Cotton", sizes: FREE_SIZE,
    images: ["/images/products/sanganeri-block-print-saree.jpg"], stock: 35, featured: false, rating: 4.2, reviewCount: 48,
    state: "Rajasthan", craftName: "Block Print", createdAt: "2026-07-23T12:45:00.000Z", category: WOMEN,
  },
  {
    id: "sutra-rajputi-brocade-sherwani",
    name: "Rajputi Brocade Sherwani",
    slug: "rajputi-brocade-sherwani",
    description: "A full-length Rajputi sherwani in brocade silk with a mandarin collar, covered buttons and zari trim, cut for the groom and finished with a matching safa.",
    price: 15999, compareAtPrice: 19999, fabric: "Brocade Silk with Zari Trim", sizes: CLOTHING_SIZES,
    images: ["/images/products/rajputi-brocade-sherwani.jpg"], stock: 10, featured: false, rating: 4.7, reviewCount: 19,
    state: "Rajasthan", craftName: "Zari Embroidery", createdAt: "2026-08-03T09:00:00.000Z", category: MEN,
    imageCredit: {
      title: "CHOGA", author: "Pakideadithya",
      license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:CHOGA.jpg",
    },
  },
  {
    id: "sutra-ivory-wedding-sherwani",
    name: "Ivory Wedding Sherwani",
    slug: "ivory-wedding-sherwani",
    description: "An ivory raw silk sherwani with tonal thread work along the placket and cuffs, worn over a churidar — restrained enough for the baraat and the reception both.",
    price: 13499, compareAtPrice: 16999, fabric: "Raw Silk with Tonal Thread Work", sizes: CLOTHING_SIZES,
    images: ["/images/products/ivory-wedding-sherwani.jpg"], stock: 14, featured: false, rating: 4.5, reviewCount: 23,
    state: "Rajasthan", craftName: "Zari Embroidery", createdAt: "2026-07-31T15:20:00.000Z", category: MEN,
  },
  {
    id: "sutra-nehru-jacket-kurta-set",
    name: "Kurta Churidar with Nehru Jacket",
    slug: "kurta-churidar-with-nehru-jacket",
    description: "A cotton-silk kurta and churidar with a structured Nehru jacket over it — the standing-collar bandi that turns everyday kurta into festive dress.",
    price: 3299, compareAtPrice: 3999, fabric: "Cotton Silk Blend", sizes: CLOTHING_SIZES,
    images: ["/images/products/kurta-churidar-with-nehru-jacket.jpg"], stock: 28, featured: false, rating: 4.4, reviewCount: 66,
    state: "Delhi", craftName: "Handloom Weaves", createdAt: "2026-07-29T13:10:00.000Z", category: MEN,
  },
  {
    id: "sutra-handloom-dhoti-kurta",
    name: "Handloom Dhoti Kurta Set",
    slug: "handloom-dhoti-kurta-set",
    description: "An unstitched handloom cotton dhoti with a matching full-sleeve kurta, woven on pit looms and finished with a fine zari-edged border.",
    price: 2899, compareAtPrice: 3499, fabric: "Handloom Cotton", sizes: CLOTHING_SIZES,
    images: ["/images/products/handloom-dhoti-kurta-set.jpg"], stock: 26, featured: false, rating: 4.3, reviewCount: 37,
    state: "Uttar Pradesh", craftName: "Handloom Weaves", createdAt: "2026-07-27T09:50:00.000Z", category: MEN,
    imageCredit: {
      title: "Dhoti, India, 2014, polyester-silk blend - Saint Ignatius Church, San Francisco, CA - DSC02646", author: "Unknown",
      license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Dhoti,_India,_2014,_polyester-silk_blend_-_Saint_Ignatius_Church,_San_Francisco,_CA_-_DSC02646.JPG",
    },
  },
  {
    id: "sutra-silk-dhoti-kurta",
    name: "Silk Dhoti Kurta with Topi",
    slug: "silk-dhoti-kurta-with-topi",
    description: "The Maharashtrian formal set — silk dhoti, kurta and Puneri pagdi-style topi — worn for weddings, Ganeshotsav and every occasion in between.",
    price: 3999, compareAtPrice: 4999, fabric: "Art Silk", sizes: CLOTHING_SIZES,
    images: ["/images/products/silk-dhoti-kurta-with-topi.jpg"], stock: 20, featured: false, rating: 4.4, reviewCount: 29,
    state: "Maharashtra", craftName: "Handloom Weaves", createdAt: "2026-07-25T11:35:00.000Z", category: MEN,
  },
  {
    id: "sutra-gj-gharchola",
    name: "Gharchola Bandhani Wedding Saree",
    slug: "gharchola-bandhani-wedding-saree",
    description: "The saree a Gujarati bride is given by her husband's family. Gajji silk tied in bandhani, then caged in a woven grid of zari squares — traditionally twelve by twelve, each square filled with tied dots. Red and green, the colours of the marriage itself.",
    price: 14999, compareAtPrice: 19999, fabric: "Gajji Silk", sizes: FREE_SIZE,
    images: ["/images/products/gharchola-bandhani-wedding-saree.jpg"], stock: 9, featured: true, rating: 4.9, reviewCount: 0,
    state: "Gujarat", craftName: "Bandhani", createdAt: "2026-09-10T09:00:00.000Z", category: WOMEN,
    imageCredit: {
      title: "India, Gujarat, 19th century - Sari - 1916.1206 - Cleveland Museum of Art", author: "Cleveland Museum of Art",
      license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:India,_Gujarat,_19th_century_-_Sari_-_1916.1206_-_Cleveland_Museum_of_Art.jpg",
    },
  },
  {
    id: "sutra-gj-panetar",
    name: "Panetar Gajji Silk Saree",
    slug: "panetar-gajji-silk-saree",
    description: "The gharchola's other half: the ivory saree a bride receives from her mother's side and wears for the first half of the ceremony. Undyed gajji silk, a red bandhani border, and a deep red pallu tied dot by dot.",
    price: 11999, compareAtPrice: 15499, fabric: "Gajji Silk", sizes: FREE_SIZE,
    images: ["/images/products/panetar-gajji-silk-saree.svg"], stock: 11, featured: true, rating: 4.8, reviewCount: 0,
    state: "Gujarat", craftName: "Bandhani", createdAt: "2026-09-10T09:10:00.000Z", category: WOMEN,
  },
  {
    id: "sutra-gj-ajrakh-saree",
    name: "Ajrakh Block Print Cotton Saree",
    slug: "ajrakh-block-print-cotton-saree",
    description: "Sixteen stages of resist printing and natural dyeing by the Khatri printers of Ajrakhpur, Kutch. Indigo and madder laid over each other in geometry that never breaks its grid, on cotton that softens with every wash.",
    price: 3499, compareAtPrice: 4299, fabric: "Cotton", sizes: FREE_SIZE,
    images: ["/images/products/ajrakh-block-print-cotton-saree.jpg"], stock: 22, featured: false, rating: 4.7, reviewCount: 0,
    state: "Gujarat", craftName: "Ajrakh", createdAt: "2026-09-10T09:20:00.000Z", category: WOMEN,
    imageCredit: {
      title: "double-sided ajrak, khatri showroom", author: "rickbradley",
      license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      sourceUrl: "https://www.flickr.com/photos/89139703@N00/4272560711",
    },
  },
  {
    id: "sutra-gj-ajrakh-kurta",
    name: "Ajrakh Cotton Kurta",
    slug: "ajrakh-cotton-kurta",
    description: "Kutchi ajrakh in its madder colourway, cut as a straight kurta. The same sixteen-stage resist printing the Khatris have done for four centuries, worn the way it has always been worn in Kutch — every day, not only at weddings.",
    price: 2799, compareAtPrice: 3499, fabric: "Cotton", sizes: CLOTHING_SIZES,
    images: ["/images/products/ajrakh-cotton-kurta.jpg"], stock: 26, featured: false, rating: 4.6, reviewCount: 0,
    state: "Gujarat", craftName: "Ajrakh", createdAt: "2026-09-10T09:30:00.000Z", category: MEN,
    imageCredit: {
      title: "double-sided ajrak detail", author: "rickbradley",
      license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      sourceUrl: "https://www.flickr.com/photos/89139703@N00/4273304940",
    },
  },
  {
    id: "sutra-gj-tangaliya",
    name: "Tangaliya Handwoven Shawl",
    slug: "tangaliya-handwoven-shawl",
    description: "A seven-hundred-year-old weave from Surendranagar, GI-protected since 2009 and made by perhaps a few hundred Dangasia weavers. Each dot is loose yarn twisted around the warp by hand at the loom — beadwork that is woven, not stitched.",
    price: 4999, compareAtPrice: 6499, fabric: "Merino Wool", sizes: FREE_SIZE,
    images: ["/images/products/tangaliya-handwoven-shawl.svg"], stock: 14, featured: true, rating: 4.8, reviewCount: 0,
    state: "Gujarat", craftName: "Tangaliya", createdAt: "2026-09-10T09:40:00.000Z", category: WOMEN,
  },
  {
    id: "sutra-gj-rajkot-patola",
    name: "Rajkot Patola Silk Saree",
    slug: "rajkot-patola-silk-saree",
    description: "Rajkot's single ikat: the weft alone is tied and dyed before weaving, so the motifs feather on one axis and the saree takes months rather than the year a Patan double ikat demands. The same lineage, within reach.",
    price: 16999, compareAtPrice: 21999, fabric: "Mulberry Silk", sizes: FREE_SIZE,
    images: ["/images/products/rajkot-patola-silk-saree.jpg"], stock: 7, featured: true, rating: 4.9, reviewCount: 0,
    state: "Gujarat", craftName: "Patola", createdAt: "2026-09-10T09:50:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Patola", author: "Cooper Hewitt, Smithsonian Design Museum",
      license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://collection.cooperhewitt.org/view/objects/asitem/id/95035",
    },
  },
  {
    id: "sutra-rj-leheriya",
    name: "Leheriya Georgette Saree",
    slug: "leheriya-georgette-saree",
    description: "Lehar means wave. The cloth is rolled corner to corner, bound at intervals and dyed, so it opens into diagonal ripples that no block or print can imitate. Jaipur and Jodhpur have tied it this way for the monsoon for centuries.",
    price: 4499, compareAtPrice: 5799, fabric: "Georgette", sizes: FREE_SIZE,
    images: ["/images/products/leheriya-georgette-saree.svg"], stock: 19, featured: true, rating: 4.7, reviewCount: 0,
    state: "Rajasthan", craftName: "Leheriya", createdAt: "2026-09-10T10:00:00.000Z", category: WOMEN,
  },
  {
    id: "sutra-rj-mothra",
    name: "Mothra Leheriya Odhani",
    slug: "mothra-leheriya-odhani",
    description: "Leheriya tied twice. The cloth is rolled, dyed, opened, rolled again the other way and dyed once more, so the waves cross into a lattice of tiny lentil-shaped squares — mothra, after the moth dal it resembles.",
    price: 2999, compareAtPrice: 3799, fabric: "Chiffon", sizes: FREE_SIZE,
    images: ["/images/products/mothra-leheriya-odhani.svg"], stock: 24, featured: false, rating: 4.6, reviewCount: 0,
    state: "Rajasthan", craftName: "Leheriya", createdAt: "2026-09-10T10:10:00.000Z", category: WOMEN,
  },
  {
    id: "sutra-rj-kota-doria",
    name: "Kota Doria Cotton Silk Saree",
    slug: "kota-doria-cotton-silk-saree",
    description: "Woven in Kaithoon near Kota in the khat check — alternating cotton and silk threads that leave a fine transparent square grid. Light enough to pass through a ring, and the reason it is what Rajasthan wears in summer.",
    price: 3299, compareAtPrice: 4199, fabric: "Kota Doria", sizes: FREE_SIZE,
    images: ["/images/products/kota-doria-cotton-silk-saree.jpg"], stock: 21, featured: false, rating: 4.7, reviewCount: 0,
    state: "Rajasthan", craftName: "Kota Doria", createdAt: "2026-09-10T10:20:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Kota-doria-saree-15", author: "Kiransboutique",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=97231607",
    },
  },
  {
    id: "sutra-rj-bagru-dabu",
    name: "Bagru Dabu Indigo Saree",
    slug: "bagru-dabu-indigo-saree",
    description: "Mud resist, not ink. In Bagru the pattern is stamped in a paste of clay, gum and chaff, the cloth is sunk in indigo, and the paste is washed away to leave the motif in undyed white. Coarser to the hand than Sanganeri, and meant to be.",
    price: 2799, compareAtPrice: 3599, fabric: "Cotton", sizes: FREE_SIZE,
    images: ["/images/products/bagru-dabu-indigo-saree.jpg"], stock: 25, featured: false, rating: 4.5, reviewCount: 0,
    state: "Rajasthan", craftName: "Dabu Block Print", createdAt: "2026-09-10T10:30:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Dabu Printed Fabric", author: "Aayushimundada",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=164322402",
    },
  },
  {
    id: "sutra-rj-gota-patti",
    name: "Gota Patti Bridal Lehenga",
    slug: "gota-patti-bridal-lehenga",
    description: "Jaipur's gold ribbon work: narrow gota is folded into leaves and petals and appliqued down by hand, so the light catches the edge rather than the thread. Lighter on the shoulders than zardozi, and louder in a courtyard at night.",
    price: 22999, compareAtPrice: 29999, fabric: "Raw Silk", sizes: CLOTHING_SIZES,
    images: ["/images/products/gota-patti-bridal-lehenga.jpg"], stock: 6, featured: true, rating: 4.9, reviewCount: 0,
    state: "Rajasthan", craftName: "Gota Patti", createdAt: "2026-09-10T10:40:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Kota sari with gota patti by ashish 01", author: "आशीष भटनागर",
      license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kota_sari_with_gota_patti_by_ashish_01.JPG",
    },
  },
  {
    id: "sutra-rj-bandhgala",
    name: "Jodhpuri Bandhgala Suit",
    slug: "jodhpuri-bandhgala-suit",
    description: "The closed-neck coat cut in Jodhpur for the court and never really altered since — mandarin collar, six buttons, nothing decorative that is not structural. Shorter and sharper than a sherwani, and correct anywhere a suit is.",
    price: 15999, compareAtPrice: 19999, fabric: "Wool Blend", sizes: CLOTHING_SIZES,
    images: ["/images/products/jodhpuri-bandhgala-suit.jpg"], stock: 12, featured: false, rating: 4.8, reviewCount: 0,
    state: "Rajasthan", craftName: "Jodhpuri Tailoring", createdAt: "2026-09-10T10:50:00.000Z", category: MEN,
    imageCredit: {
      title: "Bandhgala by Sabyasachi Mukherjee", author: "Stefan Ivanovich",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Bandhgala_by_Sabyasachi_Mukherjee.jpg",
    },
  },
  {
    id: "sutra-rj-angrakha",
    name: "Angrakha Cotton Kurta",
    slug: "angrakha-cotton-kurta",
    description: "Angrakha means a protection for the body. One panel crosses the chest and ties at the side rather than buttoning down the front, a cut older than the kurta itself and still the coolest thing to wear in a Rajasthani summer.",
    price: 2199, compareAtPrice: 2799, fabric: "Cotton", sizes: CLOTHING_SIZES,
    images: ["/images/products/angrakha-cotton-kurta.jpg"], stock: 28, featured: false, rating: 4.5, reviewCount: 0,
    state: "Rajasthan", craftName: "Angrakha", createdAt: "2026-09-10T11:00:00.000Z", category: MEN,
    imageCredit: {
      title: "Angarkha (1976.149.4)", author: "The Metropolitan Museum of Art",
      license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Angarkha_MET_1976.149.4_F.jpg",
    },
  },
  {
    id: "sutra-as-eri-kurta",
    name: "Eri Silk Handloom Kurta",
    slug: "eri-silk-handloom-kurta",
    description: "Eri is the silk Assam calls ahimsa: the moth is let out before the thread is taken, so it is spun from the open cocoon rather than reeled, and has the matte, faintly slubbed hand of fine wool. Handloomed in undyed ivory with a band collar and a short button placket. Warm in a northern winter, and it still breathes.",
    price: 4499, compareAtPrice: 5499, fabric: "Eri Silk", sizes: CLOTHING_SIZES,
    images: ["/images/products/eri-silk-handloom-kurta.jpg"], stock: 16, featured: false, rating: 4.7, reviewCount: 0,
    state: "Assam", craftName: "Eri Silk", createdAt: "2026-09-23T10:00:00.000Z", category: MEN,
    imageCredit: {
      title: "Eri Silk Handloom Kurta", author: "Gautam Daniel",
      license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=162125684",
    },
  },
  {
    id: "sutra-khadi-kurta",
    name: "Blue Khadi Cotton Kurta",
    slug: "blue-khadi-cotton-kurta",
    description: "Khadi is spun by hand as well as woven by hand, which is why no two metres are quite alike and why it breathes the way mill cotton never does. Sky blue with a fine white check and small woven butis scattered across it, cut long with a band collar.",
    price: 1899, compareAtPrice: 2399, fabric: "Khadi Cotton", sizes: CLOTHING_SIZES,
    images: ["/images/products/blue-khadi-cotton-kurta.jpg"], stock: 30, featured: false, rating: 4.5, reviewCount: 0,
    state: null, craftName: "Khadi", createdAt: "2026-09-23T10:10:00.000Z", category: MEN,
    imageCredit: {
      title: "Blue khadi kurta", author: "Purva4u",
      license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=41827963",
    },
  },
  {
    id: "sutra-rj-bandhani-safa",
    name: "Bandhani Jodhpuri Safa",
    slug: "bandhani-jodhpuri-safa",
    description: "The safa is Rajasthan's wedding turban, and at a baraat it is how you pick out the groom's side from across the courtyard. A full length of tie-dyed cotton in rani pink and red, shown tied in the Jodhpuri style with the tail left loose. It comes untied, so whoever ties it can set the height and the fall.",
    price: 1299, compareAtPrice: 1699, fabric: "Cotton", sizes: FREE_SIZE,
    images: ["/images/products/bandhani-jodhpuri-safa.jpg"], stock: 40, featured: false, rating: 4.6, reviewCount: 0,
    state: "Rajasthan", craftName: "Bandhani", createdAt: "2026-09-23T10:20:00.000Z", category: MEN,
    imageCredit: {
      title: "Jodhpuri safa", author: "Pyaaz Kachori",
      license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=189340337",
    },
  },
  {
    id: "sutra-mh-kolhapuri",
    name: "Kolhapuri Leather Chappal",
    slug: "kolhapuri-leather-chappal",
    description: "Made in and around Kolhapur for centuries and GI-tagged since 2019: vegetable-tanned leather, cut and hand-stitched without nails, with the braided toe loop and punched pattern that make them recognisable at a glance. Stiff for the first week, then shaped to your foot for good.",
    price: 1499, compareAtPrice: 1899, fabric: "Vegetable-Tanned Leather", sizes: FOOTWEAR_SIZES,
    images: ["/images/products/kolhapuri-leather-chappal.jpg"], stock: 35, featured: false, rating: 4.6, reviewCount: 0,
    state: "Maharashtra", craftName: "Kolhapuri", createdAt: "2026-09-23T10:30:00.000Z", category: MEN,
    imageCredit: {
      title: "Kolhapuri Chappals in roadside shop in Kolhapur", author: "सुबोध कुलकर्णी (Subodh Kulkarni)",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=158859003",
    },
  },
  {
    id: "sutra-paithani-silk-saree",
    name: "Paithani Silk Saree",
    slug: "paithani-silk-saree",
    description: "Woven in Yeola and Paithan, Maharashtra, in a tapestry technique: each colour in the pallu is its own silk weft, interlocked by hand, so the motifs look nearly as finished on the back as on the front. A turquoise body with a parrot-green pallu of flowering vines and a broad zari border. GI-tagged, and slow to weave: a pallu like this takes weeks.",
    price: 18999, compareAtPrice: 23999, fabric: "Pure Silk with Zari", sizes: FREE_SIZE,
    images: ["/images/products/paithani-silk-saree.jpg"], stock: 8, featured: false, rating: 4.9, reviewCount: 0,
    state: "Maharashtra", craftName: "Paithani", createdAt: "2026-10-12T09:00:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Wedding saree", author: "Only Paithani",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Wedding_saree_(1050936).jpg",
    },
  },
  {
    id: "sutra-baluchari-silk-saree",
    name: "Baluchari Silk Saree",
    slug: "baluchari-silk-saree",
    description: "From Bishnupur in West Bengal, where the pallu is woven as a picture story: panels of figures from the epics, set between rows of trees and temple motifs, in silk on a deep blue ground. Baluchari is GI-tagged, and the borders carry the same storytelling in miniature.",
    price: 12499, compareAtPrice: 15499, fabric: "Mulberry Silk", sizes: FREE_SIZE,
    images: ["/images/products/baluchari-silk-saree.jpg"], stock: 10, featured: false, rating: 4.8, reviewCount: 0,
    state: "West Bengal", craftName: "Baluchari", createdAt: "2026-10-12T09:15:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Baluchari saree of Bishnupur", author: "Sumita Roy Dutta",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Baluchari_saree_of_Bishnupur_DSC06031.jpg",
    },
  },
  {
    id: "sutra-dhakai-jamdani-saree",
    name: "Dhakai Jamdani Saree",
    slug: "dhakai-jamdani-saree",
    description: "Jamdani motifs are not embroidered. The weaver lays each one in by hand, a separate thread inserted pick by pick across the warp, so the little gold butis float on the fine black cotton as if stitched on. Woven by Dhakai jamdani families in Nadia, West Bengal, with a contrast pallu.",
    price: 8999, compareAtPrice: 10999, fabric: "Fine Cotton with Zari", sizes: FREE_SIZE,
    images: ["/images/products/dhakai-jamdani-saree.jpg"], stock: 14, featured: false, rating: 4.7, reviewCount: 0,
    state: "West Bengal", craftName: "Jamdani", createdAt: "2026-10-12T09:30:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Jamdani display at BSCIC Jamdani palli, Narayanganj 5", author: "Wasiul Bahar",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Jamdani_display_at_BSCIC_Jamdani_palli,_Narayanganj_5.jpg",
    },
  },
  {
    id: "sutra-muga-silk-mekhela-sador",
    name: "Muga Silk Mekhela Sador",
    slug: "muga-silk-mekhela-sador",
    description: "Assam's two-piece dress, the mekhela worn as a pleated wrap skirt and the sador draped over it, in muga: a wild silk found only in Assam, naturally golden and GI-tagged. Muga's sheen grows brighter with each wash. Woven with red floral motifs and a red border.",
    price: 14999, compareAtPrice: 17999, fabric: "Muga Silk", sizes: FREE_SIZE,
    images: ["/images/products/muga-silk-mekhela-sador.jpg"], stock: 9, featured: false, rating: 4.8, reviewCount: 0,
    state: "Assam", craftName: "Muga Silk", createdAt: "2026-10-12T09:45:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Muga Silk Mekhela Sador", author: "Indigenous Silk Handloom (I-Weave Silk Handloom)",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Muga_Silk_Mekhela_Sador.jpg",
    },
  },
  {
    id: "sutra-phulkari-hand-embroidered-dupatta",
    name: "Phulkari Hand-Embroidered Dupatta",
    slug: "phulkari-hand-embroidered-dupatta",
    description: "Phulkari means flower work. Punjab's darning stitch in untwisted silk floss is worked from the back of hand-spun cotton, one long stitch at a time. Here deep red flowers are scattered across an ivory ground with a worked border, the open style that leaves the cloth showing between the blooms.",
    price: 4999, compareAtPrice: 5999, fabric: "Hand-Spun Cotton with Silk Floss", sizes: FREE_SIZE,
    images: ["/images/products/phulkari-hand-embroidered-dupatta.jpg"], stock: 18, featured: false, rating: 4.7, reviewCount: 0,
    state: "Punjab", craftName: "Phulkari", createdAt: "2026-10-12T10:00:00.000Z", category: WOMEN,
    imageCredit: {
      title: "A Phulkari with traditional flower pattern on unworked background", author: "Chiswick Chap",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:A_Phulkari_with_traditional_flower_pattern_on_unworked_background.jpg",
    },
  },
  {
    id: "sutra-kalamkari-hand-painted-dupatta",
    name: "Kalamkari Hand-Painted Dupatta",
    slug: "kalamkari-hand-painted-dupatta",
    description: "Kalamkari is drawn freehand with a kalam, a sharpened bamboo pen, then coloured with mordants and plant dyes, in the tradition of Srikalahasti in Andhra Pradesh. A peacock sits among flowering branches in rose, indigo and yellow on an ivory ground. No two are drawn alike.",
    price: 3299, compareAtPrice: 3999, fabric: "Cotton, Natural Dyes", sizes: FREE_SIZE,
    images: ["/images/products/kalamkari-hand-painted-dupatta.jpg"], stock: 20, featured: false, rating: 4.6, reviewCount: 0,
    state: "Andhra Pradesh", craftName: "Kalamkari", createdAt: "2026-10-12T10:15:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Kalamkari Art", author: "Ravitheja Kumar Reddy C",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kalamkari_Art.jpg",
    },
  },
  {
    id: "sutra-maheshwari-silk-cotton-saree",
    name: "Maheshwari Silk Cotton Saree",
    slug: "maheshwari-silk-cotton-saree",
    description: "Woven in Maheshwar on the Narmada since Rani Ahilyabai Holkar brought weavers there in the eighteenth century: a silk warp with a cotton weft, so it is light enough for summer with a soft sheen. Deep teal, with the fine zari-striped border and a reversible edge that Maheshwari is known for.",
    price: 5999, compareAtPrice: 7299, fabric: "Silk-Cotton", sizes: FREE_SIZE,
    images: ["/images/products/maheshwari-silk-cotton-saree.jpg"], stock: 16, featured: false, rating: 4.6, reviewCount: 0,
    state: "Madhya Pradesh", craftName: "Maheshwari", createdAt: "2026-10-12T10:30:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Traditional Maheshwari Saree", author: "Bhaiyaji Smile 123",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Traditional_Maheshwari_Saree_02.jpg",
    },
  },
  {
    id: "sutra-bomkai-cotton-saree",
    name: "Bomkai Cotton Saree",
    slug: "bomkai-cotton-saree",
    description: "Named for a village in Ganjam, Odisha, Bomkai weaves its motifs into the cloth with an extra weft rather than printing them. A black handloom-cotton body with a border of rust and gold ovals and a tight temple edge. Sturdy enough for every day, and it softens with wear.",
    price: 4299, compareAtPrice: 5199, fabric: "Handloom Cotton", sizes: FREE_SIZE,
    images: ["/images/products/bomkai-cotton-saree.jpg"], stock: 18, featured: false, rating: 4.5, reviewCount: 0,
    state: "Odisha", craftName: "Bomkai", createdAt: "2026-10-12T10:45:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Bomkai", author: "Nayansatya",
      license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Bomkai3.jpg",
    },
  },
  {
    id: "sutra-mysore-crepe-silk-saree",
    name: "Mysore Crepe Silk Saree",
    slug: "mysore-crepe-silk-saree",
    description: "Mysore silk is Karnataka's own: a pure silk crepe with a soft, heavy fall and a quiet sheen rather than a stiff one. A deep red body with a broad border of gold paisleys and a woven zari edge. Easy to drape and hard to crush, which is why it is the saree people travel in.",
    price: 13999, compareAtPrice: 16999, fabric: "Pure Crepe Silk with Zari", sizes: FREE_SIZE,
    images: ["/images/products/mysore-crepe-silk-saree.jpg"], stock: 10, featured: false, rating: 4.8, reviewCount: 0,
    state: "Karnataka", craftName: "Mysore Silk", createdAt: "2026-10-12T11:00:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Mysore Silk Saree", author: "Kiranravikumar",
      license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mysore_Silk_Saree.jpg",
    },
  },
  {
    id: "sutra-kerala-set-mundu",
    name: "Kerala Set Mundu",
    slug: "kerala-set-mundu",
    description: "Kerala's two-piece drape: a mundu worn at the waist and a neriyathu over the shoulder, in off-white handloom cotton with a gold kasavu band. This set adds a hand-worked border of maroon and gold leaves above the kasavu. Worn for Onam and Vishu, and for temple days all year.",
    price: 2499, compareAtPrice: 2999, fabric: "Handloom Cotton with Kasavu", sizes: FREE_SIZE,
    images: ["/images/products/kerala-set-mundu.jpg"], stock: 24, featured: false, rating: 4.6, reviewCount: 0,
    state: "Kerala", craftName: "Kasavu", createdAt: "2026-10-12T11:15:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Kerala Set Mundu", author: "Ranjithsiji",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kerala_Set_Mundu_IMG_20250823_175155739.jpg",
    },
  },
  {
    id: "sutra-eri-muga-silk-nehru-jacket",
    name: "Eri & Muga Silk Nehru Jacket",
    slug: "eri-muga-silk-nehru-jacket",
    description: "A sleeveless band-collar jacket handloomed in Assam from eri and muga silk: eri for its warm, matte, wool-like body, muga for its natural gold. Five buttons and two welt pockets. Worn over a kurta for weddings and festivals; the kurta is not included.",
    price: 4999, compareAtPrice: 5999, fabric: "Eri & Muga Silk", sizes: CLOTHING_SIZES,
    images: ["/images/products/eri-muga-silk-nehru-jacket.jpg"], stock: 15, featured: false, rating: 4.7, reviewCount: 0,
    state: "Assam", craftName: "Eri Silk", createdAt: "2026-10-12T11:30:00.000Z", category: MEN,
    imageCredit: {
      title: "Eri & Muga Silk Jacket in Handloom", author: "Gautam Daniel",
      license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Eri_%26_Muga_Silk_Jacket_in_Handloom.jpg",
    },
  },
  {
    id: "sutra-eri-silk-check-shawl",
    name: "Eri Silk Check Shawl",
    slug: "eri-silk-check-shawl",
    description: "Undyed ivory eri silk, handloomed in Assam with a fine woven check and knotted tassels. Eri is spun, not reeled, from cocoons the moth has already left, which gives it the warmth and matte hand of wool without the itch. Large enough to wrap twice in a north Indian winter.",
    price: 3999, compareAtPrice: 4799, fabric: "Eri Silk", sizes: FREE_SIZE,
    images: ["/images/products/eri-silk-check-shawl.jpg"], stock: 20, featured: false, rating: 4.7, reviewCount: 0,
    state: "Assam", craftName: "Eri Silk", createdAt: "2026-10-12T11:45:00.000Z", category: MEN,
    imageCredit: {
      title: "Muga & Eri Silk Handloom Shawl", author: "Gautam Daniel",
      license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Muga_%26_Eri_Silk_Handloom_Shawl.jpg",
    },
  },
  {
    id: "sutra-kashmiri-wool-pheran",
    name: "Kashmiri Wool Pheran",
    slug: "kashmiri-wool-pheran",
    description: "The Kashmiri winter robe: a loose, knee-length wool pheran with wide sleeves and a short placket, cut roomy so a kangri, the valley's little fire-pot, can be held inside it. Soft dove-grey wool with a quiet woven texture.",
    price: 3799, compareAtPrice: 4599, fabric: "Wool", sizes: CLOTHING_SIZES,
    images: ["/images/products/kashmiri-wool-pheran.jpg"], stock: 18, featured: false, rating: 4.6, reviewCount: 0,
    state: "Jammu and Kashmir", craftName: "Pheran", createdAt: "2026-10-12T12:00:00.000Z", category: MEN,
    imageCredit: {
      title: "A Kashmiri young man dressed in a traditional pheran, holding a kangri", author: "Aadil.Farooq",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:A_kashmiri_young_man_dressed_in_a_traditional_pheran,_holding_a_kangri.jpg",
    },
  },
  {
    id: "sutra-handloom-check-lungi",
    name: "Handloom Check Lungi",
    slug: "handloom-check-lungi",
    description: "A Bengal handloom lungi in soft cotton, woven in a check of black, white and violet and sewn into a tube, ready to wrap and roll at the waist. Breathes through the hottest months and gets softer every wash.",
    price: 699, compareAtPrice: 899, fabric: "Handloom Cotton", sizes: FREE_SIZE,
    images: ["/images/products/handloom-check-lungi.jpg"], stock: 45, featured: false, rating: 4.4, reviewCount: 0,
    state: "West Bengal", craftName: "Handloom Weaves", createdAt: "2026-10-12T12:15:00.000Z", category: MEN,
    imageCredit: {
      title: "Lungi of Bangladesh", author: "Salim_Khandoker",
      license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Lungi_of_Bangladesh_2.jpg",
    },
  },
  {
    id: "sutra-zari-embroidered-punjabi-jutti",
    name: "Zari Embroidered Punjabi Jutti",
    slug: "zari-embroidered-punjabi-jutti",
    description: "A Punjabi jutti in tan leather, its closed toe covered in gold zari embroidery of vines and flowers. Juttis have no left or right: both are cut on one last and shape themselves to each foot within a few days of wear. Hand-stitched in Amritsar.",
    price: 1799, compareAtPrice: 2299, fabric: "Leather with Zari Embroidery", sizes: FOOTWEAR_SIZES,
    images: ["/images/products/zari-embroidered-punjabi-jutti.jpg"], stock: 30, featured: false, rating: 4.5, reviewCount: 0,
    state: "Punjab", craftName: "Jutti", createdAt: "2026-10-12T12:30:00.000Z", category: MEN,
    imageCredit: {
      title: "Indian jutti, 1940–1998, Bata Shoe Museum", author: "Daderot",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Indian_jutti,_1940-1998_-_Bata_Shoe_Museum_-_DSC00441.JPG",
    },
  },
  {
    id: "sutra-naga-warrior-shawl",
    name: "Naga Warrior Shawl",
    slug: "naga-warrior-shawl",
    description: "Woven on a back-strap loin loom in Nagaland, in bands of red and black around a white middle band painted with a great cat, mithun, hornbills and the human-head motif: emblems of the Ao Naga tsungkotepsu, once worn only by men who had earned them. Heavy cotton, woven in three panels and joined by hand.",
    price: 3499, compareAtPrice: 4299, fabric: "Cotton", sizes: FREE_SIZE,
    images: ["/images/products/naga-warrior-shawl.jpg"], stock: 14, featured: false, rating: 4.7, reviewCount: 0,
    state: "Nagaland", craftName: "Loin Loom Weaving", createdAt: "2026-10-12T12:45:00.000Z", category: MEN,
    imageCredit: {
      title: "Naga shawl", author: "Atcelsius",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Naga_shawl_2.jpg",
    },
  },
  {
    id: "sutra-assamese-handwoven-gamosa",
    name: "Assamese Handwoven Gamosa",
    slug: "assamese-handwoven-gamosa",
    description: "The gamosa is Assam's cloth of respect: offered to guests and elders and worn for Bihu. White handloom cotton with a red border and red phul motifs woven into both ends. Also simply the best towel and scarf you will own.",
    price: 499, compareAtPrice: 649, fabric: "Handloom Cotton", sizes: FREE_SIZE,
    images: ["/images/products/assamese-handwoven-gamosa.jpg"], stock: 60, featured: false, rating: 4.6, reviewCount: 0,
    state: "Assam", craftName: "Gamosa", createdAt: "2026-10-12T13:00:00.000Z", category: MEN,
    imageCredit: {
      title: "Gamosa of Assam", author: "Salil Kumar Mukherjee",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Gamosa_of_Assam.jpg",
    },
  },
  {
    id: "sutra-lucknowi-chikan-cotton-kurta",
    name: "Lucknowi Chikan Cotton Kurta",
    slug: "lucknowi-chikan-cotton-kurta",
    description: "A men's kurta in cream cotton with Lucknow chikankari down the placket: shadow work, stitched from the back so it shows as a soft outline, with tiny pulled-thread jaali flowers between. Fastened with sandalwood buttons.",
    price: 2699, compareAtPrice: 3299, fabric: "Cotton", sizes: CLOTHING_SIZES,
    images: ["/images/products/lucknowi-chikan-cotton-kurta.jpg"], stock: 26, featured: false, rating: 4.6, reviewCount: 0,
    state: "Uttar Pradesh", craftName: "Chikankari", createdAt: "2026-10-12T13:15:00.000Z", category: MEN,
    imageCredit: {
      title: "Kurta closeup, sandalwood buttons", author: "Fowler&fowler",
      license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kurta_closeup_sandalwood_buttons.jpg",
    },
  },
  {
    id: "sutra-kashmiri-embroidered-wool-choga",
    name: "Kashmiri Embroidered Wool Choga",
    slug: "kashmiri-embroidered-wool-choga",
    description: "The choga is a long, open coat worn over a kurta: here in olive wool, its front edges, cuffs and hem worked in Kashmiri needle embroidery of paisleys and flowers, closed at the chest with silk-cord frog fastenings. A winter coat for a wedding.",
    price: 16999, compareAtPrice: 19999, fabric: "Wool with Silk Embroidery", sizes: CLOTHING_SIZES,
    images: ["/images/products/kashmiri-embroidered-wool-choga.jpg"], stock: 6, featured: false, rating: 4.8, reviewCount: 0,
    state: "Jammu and Kashmir", craftName: "Kashmiri Embroidery", createdAt: "2026-10-12T13:30:00.000Z", category: MEN,
    imageCredit: {
      title: "Choga (CI62.43)", author: "The Metropolitan Museum of Art",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Choga_MET_CI62.43_F.jpg",
    },
  },
  {
    id: "sutra-ivory-floral-embroidered-choga",
    name: "Ivory Floral Embroidered Choga",
    slug: "ivory-floral-embroidered-choga",
    description: "A long open choga in ivory, covered all over in red flowering stems worked in fine sozni needle embroidery, the Kashmiri style so dense it reads as a print until you look close. Embroidered borders run down the front and around the cuffs.",
    price: 18999, compareAtPrice: 22999, fabric: "Fine Wool with Sozni Embroidery", sizes: CLOTHING_SIZES,
    images: ["/images/products/ivory-floral-embroidered-choga.jpg"], stock: 5, featured: false, rating: 4.9, reviewCount: 0,
    state: "Jammu and Kashmir", craftName: "Sozni Embroidery", createdAt: "2026-10-12T13:45:00.000Z", category: MEN,
    imageCredit: {
      title: "Choga (CI58.33.9)", author: "The Metropolitan Museum of Art",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Choga_MET_CI58.33.9_F.jpg",
    },
  },
  {
    id: "sutra-rabari-tie-dyed-wool-odhani",
    name: "Rabari Tie-Dyed Wool Odhani",
    slug: "rabari-tie-dyed-wool-odhani",
    description: "Rabari women in Kutch wear a heavy wool odhani over the head and shoulders. It is two loom widths joined down the middle, tie-dyed in fine dots that make diamonds and circles on a deep maroon ground. Then the women finish it themselves with a row of silk-embroidered flowers along the seam, each with a small mirror at its centre. Warm enough for desert winters.",
    price: 5999, compareAtPrice: 7499, fabric: "Hand-Spun Wool, Tie-Dyed, Mirror Embroidery", sizes: FREE_SIZE,
    images: ["/images/products/rabari-tie-dyed-wool-odhani.jpg"], stock: 10, featured: false, rating: 4.8, reviewCount: 0,
    state: "Gujarat", craftName: "Rabari Embroidery", createdAt: "2026-10-12T15:00:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Shawl from India, Rabari culture, Honolulu Museum of Art 6794.1", author: "Hiart",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Shawl_from_India,_Rabari_culture,_Honolulu_Museum_of_Art_6794.1.JPG",
    },
  },
  {
    id: "sutra-banni-mirror-work-silk-abho",
    name: "Banni Mirror-Work Silk Abho",
    slug: "banni-mirror-work-silk-abho",
    description: "The abho is the long wedding tunic of the Memon and Jat communities of Banni, the grassland north of Bhuj. The yoke is covered in tiny interlocking stitches and hundreds of small mirrors, and a pointed panel runs down below the waist. Maroon silk, worked in red, orange, ivory and gold, with embroidered bands at the cuffs.",
    price: 16999, compareAtPrice: 20999, fabric: "Silk with Mirror Embroidery", sizes: CLOTHING_SIZES,
    images: ["/images/products/banni-mirror-work-silk-abho.jpg"], stock: 6, featured: false, rating: 4.9, reviewCount: 0,
    state: "Gujarat", craftName: "Banni Embroidery", createdAt: "2026-10-12T15:15:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Wedding dress (abho), Memon or Jat, Banni, Kutch, Gujarat, India", author: "Daderot",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Wedding_dress_(abho),_Memon_or_Jat,_Banni,_Kutch,_Gujarat,_India,_late_19th_to_early_20th_century,_silk,_glass_mirrors_-_DSC00971.JPG",
    },
  },
  {
    id: "sutra-ahir-hand-embroidered-kutchi-blouse",
    name: "Ahir Hand-Embroidered Kutchi Blouse",
    slug: "ahir-hand-embroidered-kutchi-blouse",
    description: "Ahir women of Kutch embroider their own blouses so densely that the cotton barely shows: chain-stitched flowers, vines and parrots outlined in contrast colours and set with small mirrors. The two round medallions across the chest are the Ahir signature. Rose, violet, orange and gold. Wear it with a ghaghra or over a plain saree.",
    price: 3999, compareAtPrice: 4999, fabric: "Cotton with Mirror Embroidery", sizes: CLOTHING_SIZES,
    images: ["/images/products/ahir-hand-embroidered-kutchi-blouse.jpg"], stock: 14, featured: false, rating: 4.7, reviewCount: 0,
    state: "Gujarat", craftName: "Ahir Embroidery", createdAt: "2026-10-12T15:30:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Kutch blouse", author: "Calliopejen1",
      license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kutch_blouse.jpg",
    },
  },
  {
    id: "sutra-banjara-mirror-work-kanchali-ghaghra",
    name: "Banjara Mirror-Work Kanchali & Ghaghra",
    slug: "banjara-mirror-work-kanchali-ghaghra",
    description: "From the Banjara community of Saurashtra: a short kanchali blouse heavy with mirrors, shell buttons and metal discs, over a full ghaghra made of red and black cotton bands, each edged in running stitch and tiny mirrors. It is weighted to swing, which is why it is worn for garba.",
    price: 8999, compareAtPrice: 10999, fabric: "Cotton with Mirror Embroidery", sizes: CLOTHING_SIZES,
    images: ["/images/products/banjara-mirror-work-kanchali-ghaghra.jpg"], stock: 8, featured: false, rating: 4.8, reviewCount: 0,
    state: "Gujarat", craftName: "Banjara Embroidery", createdAt: "2026-10-12T15:45:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Blouse (kanchali) and skirt (ghaghara), Banjara community, Saurashtra, Gujarat, India", author: "Daderot",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Blouse_(kanchali)_and_skirt_(ghaghara),_Banjara_community,_Saurashtra,_Gujarat,_India,_view_1,_mid_20th_century,_cotton,_glass_mirrors_-_Textile_Museum_of_Canada_-_DSC00975.JPG",
    },
  },
  {
    id: "sutra-bandhani-silk-saree-madder-red",
    name: "Bandhani Silk Saree, Madder Red",
    slug: "bandhani-silk-saree-madder-red",
    description: "Bandhani is tied, not printed. Thousands of tiny points of silk are pinched up and bound with thread before dyeing, so every pale dot is a knot that kept the dye out. Here the dots draw rows of figures and flowering vines across a deep red body, inside a dark border of dotted creepers, and the pallu is plain crimson. Tied by bandhani families of Jamnagar and Kutch.",
    price: 9999, compareAtPrice: 12499, fabric: "Silk, Bandhani Tie-Dye", sizes: FREE_SIZE,
    images: ["/images/products/bandhani-silk-saree-madder-red.jpg"], stock: 10, featured: false, rating: 4.7, reviewCount: 0,
    state: "Gujarat", craftName: "Bandhani", createdAt: "2026-10-12T16:00:00.000Z", category: WOMEN,
    imageCredit: {
      title: "India, Gujarat, 19th century - Sari - 1916.1206 - Cleveland Museum of Art", author: "Cleveland Museum of Art",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:India,_Gujarat,_19th_century_-_Sari_-_1916.1206_-_Cleveland_Museum_of_Art.jpg",
    },
  },
  {
    id: "sutra-patan-patola-double-ikat-saree",
    name: "Patan Patola Double Ikat Saree",
    slug: "patan-patola-double-ikat-saree",
    description: "Patan's patola is double ikat. Both the warp and the weft threads are tied and dyed to the pattern before weaving, and the weaver lines them up thread by thread, so the design is equally sharp on both sides. A lattice of flowers and leaf-hearts in ivory and gold on a madder-red ground, with a woven end border. Only a few families in Patan still weave it, and one saree takes months.",
    price: 29999, compareAtPrice: 34999, fabric: "Mulberry Silk, Double Ikat", sizes: FREE_SIZE,
    images: ["/images/products/patan-patola-double-ikat-saree.jpg"], stock: 3, featured: false, rating: 5.0, reviewCount: 0,
    state: "Gujarat", craftName: "Patola", createdAt: "2026-10-12T16:15:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Woman's Wedding Sari, LACMA M.71.37.2", author: "Los Angeles County Museum of Art",
      license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Woman%27s_Wedding_Sari_LACMA_M.71.37.2_(2_of_2).jpg",
    },
  },
  {
    id: "sutra-kutchi-embroidered-black-wool-shawl",
    name: "Kutchi Embroidered Black Wool Shawl",
    slug: "kutchi-embroidered-black-wool-shawl",
    description: "Black wool, embroidered in Kutch in bright chain stitch: a large mandala at the centre, flowers scattered over the field, and a border of elephants and blooms in white, red, yellow and green, finished with a gold edge. Heavy enough to wear as a wrap through winter.",
    price: 4499, compareAtPrice: 5499, fabric: "Wool with Hand Embroidery", sizes: FREE_SIZE,
    images: ["/images/products/kutchi-embroidered-black-wool-shawl.jpg"], stock: 12, featured: false, rating: 4.6, reviewCount: 0,
    state: "Gujarat", craftName: "Kutch Embroidery", createdAt: "2026-10-12T16:30:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Richly embroidered woolen Kutchhi shawl", author: "RubyGoes",
      license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      sourceUrl: "https://www.flickr.com/photos/61997808@N00/4196499020",
    },
  },
  {
    id: "sutra-kathiawadi-cotton-kediyu-chorno",
    name: "Kathiawadi Cotton Kediyu & Chorno",
    slug: "kathiawadi-cotton-kediyu-chorno",
    description: "Everyday dress for the herders and farmers of Kathiawad. The kediyu is a short jacket gathered into dense pleats under the chest so it flares at the waist, and ties at the side. The chorno is a pair of trousers cut very full through the seat and thigh, then narrowed to the ankle. Plain unbleached handloom cotton, made for working in the heat. The turban is not included.",
    price: 3499, compareAtPrice: 4299, fabric: "Handloom Cotton", sizes: CLOTHING_SIZES,
    images: ["/images/products/kathiawadi-cotton-kediyu-chorno.jpg"], stock: 16, featured: false, rating: 4.6, reviewCount: 0,
    state: "Gujarat", craftName: "Kediyu", createdAt: "2026-10-12T16:45:00.000Z", category: MEN,
    imageCredit: {
      title: "India (Gujarat), man's costume, 1970s-1980s, Bunka Gakuen Costume Museum", author: "Daderot",
      license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:India_(Gujarat),_man%27s_costume,_1970s-1980s_-_Bunka_Gakuen_Costume_Museum_-_DSC05310.JPG",
    },
  },
  {
    id: "sutra-bhujodi-handwoven-shawl",
    name: "Bhujodi Handwoven Shawl",
    slug: "bhujodi-handwoven-shawl",
    description: "Woven by the Vankar weavers of Bhujodi, a village just outside Bhuj, on pit looms. The small motifs are picked into the weft by hand. Bands of tiny diamonds and stripes in rose, sand and grey run across an ivory ground. Light enough for a Gujarat winter evening.",
    price: 3999, compareAtPrice: 4799, fabric: "Cotton & Wool", sizes: FREE_SIZE,
    images: ["/images/products/bhujodi-handwoven-shawl.jpg"], stock: 15, featured: false, rating: 4.6, reviewCount: 0,
    state: "Gujarat", craftName: "Bhujodi Weaving", createdAt: "2026-10-12T17:00:00.000Z", category: MEN,
    imageCredit: {
      title: "A traditional shawl maker from Kutch, Gujarat", author: "Ekabhishek",
      license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:A_traditional_shawl_maker_from_Kutch,_Gujarat.JPG",
    },
  },
  {
    id: "sutra-kutchi-ivory-wool-shawl",
    name: "Kutchi Ivory Wool Shawl",
    slug: "kutchi-ivory-wool-shawl",
    description: "Handwoven in Kutch from local wool. The ivory body is crossed by bands of madder red, black and gold woven into the cloth, with small stitched motifs and mirrors scattered between them. This is the kind of shawl Kutchi men fold over one shoulder in winter.",
    price: 4299, compareAtPrice: 5199, fabric: "Hand-Spun Wool", sizes: FREE_SIZE,
    images: ["/images/products/kutchi-ivory-wool-shawl.jpg"], stock: 12, featured: false, rating: 4.7, reviewCount: 0,
    state: "Gujarat", craftName: "Kutch Weaving", createdAt: "2026-10-12T17:15:00.000Z", category: MEN,
    imageCredit: {
      title: "Ivory woolen Kutchhi shawl", author: "RubyGoes",
      license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      sourceUrl: "https://www.flickr.com/photos/61997808@N00/4195756667",
    },
  },
  {
    id: "sutra-kutchi-madder-red-wool-shawl",
    name: "Kutchi Madder-Red Wool Shawl",
    slug: "kutchi-madder-red-wool-shawl",
    description: "A deep red Kutchi wool shawl with ivory bands woven in and small embroidered motifs and mirrors in the field. Kutchi weavers take their reds from madder. Plain enough to wear every day, and bright enough for a wedding.",
    price: 4299, compareAtPrice: 5199, fabric: "Hand-Spun Wool", sizes: FREE_SIZE,
    images: ["/images/products/kutchi-madder-red-wool-shawl.jpg"], stock: 12, featured: false, rating: 4.6, reviewCount: 0,
    state: "Gujarat", craftName: "Kutch Weaving", createdAt: "2026-10-12T17:30:00.000Z", category: MEN,
    imageCredit: {
      title: "Kutchhi wool shawl", author: "RubyGoes",
      license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      sourceUrl: "https://www.flickr.com/photos/61997808@N00/4196437932",
    },
  },
  // Diwali festive picks, added 2026-10-27; all ten are in the Diwali Edit (lib/festival.ts).
  {
    id: "sutra-gold-tissue-silk-saree",
    name: "Gold Tissue Silk Saree",
    slug: "gold-tissue-silk-saree",
    description: "Tissue is silk woven with a metallic zari weft, so the whole cloth catches the light like beaten gold. This one has an olive-gold body and a deep border of woven vines and buttis in brighter zari. Light and crisp, with a soft sheen rather than a hard shine: the saree for Lakshmi puja night.",
    price: 12999, compareAtPrice: 15999, fabric: "Silk Tissue with Zari", sizes: FREE_SIZE,
    images: ["/images/products/gold-tissue-silk-saree.jpg"], stock: 10, featured: false, rating: 4.8, reviewCount: 0,
    state: null, craftName: "Tissue Weaving", createdAt: "2026-10-27T10:00:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Saree on display at Dilli Haat", author: "Ekabhishek",
      license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Saree_on_display_at_Dilli_Haat.JPG",
    },
  },
  {
    id: "sutra-rani-pink-chanderi-silk-saree",
    name: "Rani Pink Chanderi Silk Saree",
    slug: "rani-pink-chanderi-silk-saree",
    description: "Woven in Chanderi, Madhya Pradesh, from fine silk warp and cotton weft, which gives the cloth its sheer, airy hand. Rani pink with small zari buttis across the body and a pallu worked in rows of woven motifs. Light enough to wear through a long festival day.",
    price: 7499, compareAtPrice: 8999, fabric: "Chanderi Silk Cotton", sizes: FREE_SIZE,
    images: ["/images/products/rani-pink-chanderi-silk-saree.jpg"], stock: 14, featured: false, rating: 4.7, reviewCount: 0,
    state: "Madhya Pradesh", craftName: "Chanderi Weaving", createdAt: "2026-10-27T10:15:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Chanderi Silk Sari outside a village home in Pranpur", author: "India Untravelled",
      license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Chanderi_Silk_Sari_outside_a_village_home_in_Pranpur._(7045778685).jpg",
    },
  },
  {
    id: "sutra-royal-blue-banarasi-bandhani-saree",
    name: "Royal Blue Banarasi Bandhani Saree",
    slug: "royal-blue-banarasi-bandhani-saree",
    description: "Two crafts in one saree. Crepe silk is tied and dyed in Kutch in tiny bandhani dots, then finished with a Banarasi-style zari border and a pallu laid out in a lattice of dots. Royal blue with silver-gold zari. Made for weddings and the big festival evenings.",
    price: 14999, compareAtPrice: 17999, fabric: "Crepe Silk", sizes: FREE_SIZE,
    images: ["/images/products/royal-blue-banarasi-bandhani-saree.jpg"], stock: 8, featured: false, rating: 4.8, reviewCount: 0,
    state: "Gujarat", craftName: "Bandhani", createdAt: "2026-10-27T10:30:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Crape silk fabric Banarasi work bandhani saree", author: "Kutch.artesania",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Crape_silk_fabric_Banarasi_work_bandhani_saree.jpg",
    },
  },
  {
    id: "sutra-maroon-zari-stripe-silk-saree",
    name: "Maroon Zari-Stripe Silk Saree",
    slug: "maroon-zari-stripe-silk-saree",
    description: "A maroon silk saree crossed by fine gold zari stripes, with a diagonal pattern worked between them and a broad gold border all round. Quiet from a distance and rich up close. The photograph shows a 19th-century piece in the Cleveland Museum of Art; ours follows its colours and layout.",
    price: 9999, compareAtPrice: 11999, fabric: "Silk with Zari", sizes: FREE_SIZE,
    images: ["/images/products/maroon-zari-stripe-silk-saree.jpg"], stock: 10, featured: false, rating: 4.6, reviewCount: 0,
    state: null, craftName: "Zari Work", createdAt: "2026-10-27T10:45:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Sari, India, 19th to early 20th century (1916.1218)", author: "Cleveland Museum of Art",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:India,_19th_-_early_20th_century_-_Sari_-_1916.1218_-_Cleveland_Museum_of_Art.jpg",
    },
  },
  {
    id: "sutra-red-banarasi-kalga-silk-saree",
    name: "Red Banarasi Silk Saree with Kalga Pallu",
    slug: "red-banarasi-kalga-silk-saree",
    description: "Classic Banarasi red silk, scattered with small zari buttis, ending in a pallu of tall kalga (paisley) motifs woven in silver zari, with a matching border. The red of Diwali and of weddings in Varanasi, woven on the handlooms there.",
    price: 18999, compareAtPrice: 22999, fabric: "Katan Silk with Zari", sizes: FREE_SIZE,
    images: ["/images/products/red-banarasi-kalga-silk-saree.jpg"], stock: 8, featured: false, rating: 4.9, reviewCount: 0,
    state: "Uttar Pradesh", craftName: "Banarasi Weaving", createdAt: "2026-10-27T11:00:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Banarasi sari pallu", author: "आशीष भटनागर (Ashish Bhatnagar)",
      license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Banarasi_sari_pallu_by_ashish4.JPG",
    },
  },
  {
    id: "sutra-phulkari-embroidered-punjabi-jutti",
    name: "Phulkari-Embroidered Punjabi Jutti",
    slug: "phulkari-embroidered-punjabi-jutti",
    description: "Leather juttis from Punjab with the toe worked in bright silk thread in orange, red, green and gold, and the soles studded in a pattern of tiny metal dots. Flat, soft and made to be worn all evening, with a lehenga or a saree.",
    price: 1899, compareAtPrice: 2299, fabric: "Leather with Thread Embroidery", sizes: FOOTWEAR_SIZES,
    images: ["/images/products/phulkari-embroidered-punjabi-jutti.jpg"], stock: 20, featured: false, rating: 4.6, reviewCount: 0,
    state: "Punjab", craftName: "Jutti Embroidery", createdAt: "2026-10-27T11:15:00.000Z", category: WOMEN,
    imageCredit: {
      title: "Indian juttis, late 20th century, Punjab, Bata Shoe Museum", author: "Daderot",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Indian_juttis,_late_20th_century,_Punjab_-_Bata_Shoe_Museum_-_DSC00432.JPG",
    },
  },
  {
    id: "sutra-aubergine-silk-brocade-jacket",
    name: "Aubergine Silk Brocade Jacket",
    slug: "aubergine-silk-brocade-jacket",
    description: "A short, open-fronted jacket in aubergine silk brocade woven with a small silver lozenge, edged in gold braid, with two pockets at the hip. Wear it over a kurta for Diwali night instead of a Nehru jacket. Cut after an early 19th-century coat in the Cleveland Museum of Art, which is the piece in the photograph.",
    price: 6999, compareAtPrice: 8499, fabric: "Silk Brocade", sizes: CLOTHING_SIZES,
    images: ["/images/products/aubergine-silk-brocade-jacket.jpg"], stock: 12, featured: false, rating: 4.7, reviewCount: 0,
    state: null, craftName: "Brocade Weaving", createdAt: "2026-10-27T11:30:00.000Z", category: MEN,
    imageCredit: {
      title: "Man's Coat, India, early 19th century (1934.184)", author: "Cleveland Museum of Art",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:India,_Early_19th_century_-_Man%27s_Coat_-_1934.184_-_Cleveland_Museum_of_Art.tif",
    },
  },
  {
    id: "sutra-muga-silk-stripe-kurta",
    name: "Muga Silk-Stripe Handloom Kurta",
    slug: "muga-silk-stripe-kurta",
    description: "A handloom cotton kurta from Assam with fine stripes of golden muga silk woven into the cloth. Mandarin collar, full sleeves, side slits. Cool enough for a crowded puja and smart enough for the family dinner after it.",
    price: 3999, compareAtPrice: 4799, fabric: "Handloom Cotton with Muga Silk", sizes: CLOTHING_SIZES,
    images: ["/images/products/muga-silk-stripe-kurta.jpg"], stock: 18, featured: false, rating: 4.6, reviewCount: 0,
    state: "Assam", craftName: "Muga Silk", createdAt: "2026-10-27T11:45:00.000Z", category: MEN,
    imageCredit: {
      title: "Handloom Kurta in Muga Silk Stripes", author: "Gautam Daniel",
      license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Handloom_Kurta_in_Muga_Silk_Stripes.jpg",
    },
  },
  {
    id: "sutra-zardozi-velvet-mojari",
    name: "Zardozi Velvet Mojari",
    slug: "zardozi-velvet-mojari",
    description: "Pointed, backless mojaris in velvet, covered across the toe in zardozi: metallic thread and sequins couched by hand in a raised floral pattern. Red heels and leather soles. Made for a sherwani or a bandhgala. The photograph shows a 19th-century pair in the Los Angeles County Museum of Art.",
    price: 2999, compareAtPrice: 3599, fabric: "Velvet with Zardozi", sizes: FOOTWEAR_SIZES,
    images: ["/images/products/zardozi-velvet-mojari.jpg"], stock: 16, featured: false, rating: 4.7, reviewCount: 0,
    state: null, craftName: "Zardozi", createdAt: "2026-10-27T12:00:00.000Z", category: MEN,
    imageCredit: {
      title: "Pair of Man's Slippers, India, 19th century (M.45.3.237a-b)", author: "Los Angeles County Museum of Art",
      license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Pair_of_Man%27s_Slippers_LACMA_M.45.3.237a-b.jpg",
    },
  },
  {
    id: "sutra-palampore-floral-long-coat",
    name: "Palampore Floral Long Coat",
    slug: "palampore-floral-long-coat",
    description: "A full-length open coat in ivory cotton, painted and dyed all over with large red and blue flowers in the style of the palampore hangings of the Coromandel coast, with touches of gold. Wear it open over a kurta and churidar. Cut after an 18th-century coat made in India for the French court, now in the Cleveland Museum of Art, which is the piece in the photograph.",
    price: 11999, compareAtPrice: 13999, fabric: "Hand-Painted Cotton", sizes: CLOTHING_SIZES,
    images: ["/images/products/palampore-floral-long-coat.jpg"], stock: 8, featured: false, rating: 4.7, reviewCount: 0,
    state: null, craftName: "Kalamkari", createdAt: "2026-10-27T12:15:00.000Z", category: MEN,
    imageCredit: {
      title: "Man's morning coat, India, Mughal, 18th century (1936.443)", author: "Cleveland Museum of Art",
      license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:India,_Mughal,_18th_century_-_Man%27s_morning_coat_-_1936.443_-_Cleveland_Museum_of_Art.tif",
    },
  },
];

export const products: Product[] = rawProducts.map((p) => ({
  ...p,
  categoryId: p.category.id,
  colors: COLORS,
}));

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.category.id === product.category.id && p.id !== product.id)
    .slice(0, limit);
}
