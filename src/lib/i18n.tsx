import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const dict = {
  en: {
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.categories": "Categories",
    "nav.offers": "Offers",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.newArrivals": "New Arrivals",
    "nav.necklaces": "Necklaces",
    "nav.bracelets": "Bracelets",
    "nav.bangles": "Bangles",
    "nav.handcuffs": "Handcuffs",
    "nav.anklets": "Anklets",
    "nav.rings": "Rings",
    "nav.brandBoxes": "Brand Boxes",
    "nav.bestSelling": "Best Selling",
    "nav.track": "Track Order",
    "nav.account": "Account",
    "nav.wishlist": "Wishlist",
    "nav.cart": "Cart",
    "nav.search": "Search jewelry, collections…",
    "brand.tagline": "Big Brand · Small Price",
    "hero.eyebrow": "The Lastella Edit · Autumn Collection",
    "hero.title": "Timeless luxury,\nwhispered in pink.",
    "hero.subtitle":
      "Discover handcrafted jewelry that pairs the elegance of a heritage house with prices meant for everyday indulgence.",
    "hero.cta.shop": "Shop the Collection",
    "hero.cta.explore": "Explore Categories",
    "hero.slide2.title": "Radiance,\nrefined in rose.",
    "hero.slide2.subtitle": "Pink sapphire and rose gold — a study in modern romance.",
    "hero.slide3.title": "Every day, a statement.",
    "hero.slide3.subtitle": "Pearls, diamonds, and quiet confidence.",
    "section.categories.eyebrow": "Curated Categories",
    "section.categories.title": "Shop by Category",
    "section.trending.eyebrow": "Trending Now",
    "section.trending.title": "The New Arrivals",
    "section.trending.subtitle": "Freshly unveiled — the pieces our editors can't stop wearing.",
    "section.bestsellers.title": "Combos",
    "section.flash.eyebrow": "Flash Sale · 48 hours",
    "section.flash.title": "Up to 40% off the Rose Edit",
    "section.flash.cta": "Shop the Sale",
    "section.testimonials.title": "Whispered by our clients",
    "section.newsletter.title": "Join the Lastella Circle",
    "section.newsletter.subtitle":
      "Private previews, early sales, and a welcome gift with your first order.",
    "newsletter.placeholder": "Your email address",
    "newsletter.cta": "Subscribe",
    "cat.necklace": "Necklaces",
    "cat.bracelet": "Bracelets",
    "cat.bangle": "Bangles",
    "cat.handcuff": "Handcuffs",
    "cat.anklet": "Anklets",
    "cat.ring": "Rings",
    "cat.earrings": "Earrings",
    "cat.pendant": "Pendants",
    "cat.watch": "Watches",
    "cat.luxury": "Luxury Edit",
    "product.new": "New",
    "product.sale": "Sale",
    "product.bestseller": "Best Seller",
    "product.addToCart": "Add to Cart",
    "product.quickView": "Quick View",
    "product.viewAll": "View all",
    "product.color": "Color",
    "product.size": "Size",
    "product.ringSize": "Ring Size",
    "product.quantity": "Quantity",
    "product.decrease": "Decrease quantity",
    "product.increase": "Increase quantity",
    "product.wishlist": "Wishlist",
    "product.unavailable": "Currently unavailable",
    "product.optionUnavailable": "This product option is unavailable",
    "product.chooseOptions": "Choose options",
    "product.updateCartItem": "Update cart item",
    "product.selectColor": "Select a color",
    "product.selectSize": "Select a size",
    "product.selectOptions": "Choose all product options to continue",
    "product.reviews": "reviews",
    "product.deliveryOman": "Delivery across Oman",
    "product.pairWithRings": "Rings to pair with your bangles",
    "product.ringsIn": "Rings in",
    "product.jeweleryBox": "Jewelery Box",
    "checkout.jeweleryBoxes": "Jewelery Boxes",
    "product.fallbackJewelry": "Jewelry piece",
    "cart.optionRequired": "Choose product options before checkout",
    "footer.about": "About Lastella",
    "footer.aboutText":
      "Lastella crafts luxury jewelry the world can afford — big-brand elegance, small-brand prices.",
    "footer.shop": "Shop",
    "footer.help": "Help",
    "footer.faq": "FAQ",
    "footer.shipping": "Shipping",
    "footer.returns": "Returns",
    "footer.contact": "Contact",
    "footer.follow": "Follow",
    "footer.rights": "All rights reserved.",
    "contact.phone": "Phone",
    "contact.whatsapp": "WhatsApp",
    "contact.hours": "Business hours",
    "contact.hoursValue": "10:00 AM – 10:00 PM",
    "common.currency": "OMR",
    "common.free_shipping": "Home and office delivery across Oman",
    "common.returns": "7-day easy returns · Bank transfer",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.shop": "المتجر",
    "nav.categories": "الفئات",
    "nav.offers": "العروض",
    "nav.about": "من نحن",
    "nav.contact": "تواصل",
    "nav.newArrivals": "أحدث الوصولات",
    "nav.necklaces": "قلادات",
    "nav.bracelets": "أساور",
    "nav.bangles": "أساور مفتوحة",
    "nav.handcuffs": "أساور الكف",
    "nav.anklets": "خلخال",
    "nav.rings": "خواتم",
    "nav.brandBoxes": "علب الماركات",
    "nav.bestSelling": "الأكثر مبيعًا",
    "nav.track": "تتبع الطلب",
    "nav.account": "حسابي",
    "nav.wishlist": "المفضلة",
    "nav.cart": "السلة",
    "nav.search": "ابحث عن مجوهرات ومجموعات…",
    "brand.tagline": "علامة كبرى · بسعر صغير",
    "hero.eyebrow": "مجموعة لاستيلا · خريف",
    "hero.title": "فخامة خالدة\nبلمسة وردية.",
    "hero.subtitle":
      "اكتشفي مجوهرات مصنوعة يدويًا تجمع بين أناقة الدور العريقة وأسعار تليق بتدليل يومي.",
    "hero.cta.shop": "تسوقي المجموعة",
    "hero.cta.explore": "اكتشفي الفئات",
    "hero.slide2.title": "إشراق\nبلون الورد.",
    "hero.slide2.subtitle": "الياقوت الوردي والذهب الوردي — دراسة في الرومانسية الحديثة.",
    "hero.slide3.title": "كل يوم، حضور مميز.",
    "hero.slide3.subtitle": "لآلئ وألماس وثقة هادئة.",
    "section.categories.eyebrow": "فئات مختارة",
    "section.categories.title": "تسوقي حسب الفئة",
    "section.trending.eyebrow": "الرائج الآن",
    "section.trending.title": "أحدث الوصولات",
    "section.trending.subtitle": "قطع لا تفارق محررينا هذا الموسم.",
    "section.bestsellers.title": "أطقم",
    "section.flash.eyebrow": "تخفيضات · 48 ساعة",
    "section.flash.title": "خصم حتى 40٪ على مجموعة الوردي",
    "section.flash.cta": "تسوقي التخفيضات",
    "section.testimonials.title": "بكلمات عميلاتنا",
    "section.newsletter.title": "انضمي إلى دائرة لاستيلا",
    "section.newsletter.subtitle": "معاينات خاصة، تخفيضات مبكرة، وهدية ترحيب مع أول طلب.",
    "newsletter.placeholder": "بريدك الإلكتروني",
    "newsletter.cta": "اشتركي",
    "cat.necklace": "قلادات",
    "cat.bracelet": "أساور",
    "cat.bangle": "أساور مفتوحة",
    "cat.handcuff": "أساور الكف",
    "cat.anklet": "خلخال",
    "cat.ring": "خواتم",
    "cat.earrings": "أقراط",
    "cat.pendant": "دلايات",
    "cat.watch": "ساعات",
    "cat.luxury": "المجموعة الفاخرة",
    "product.new": "جديد",
    "product.sale": "خصم",
    "product.bestseller": "الأكثر مبيعًا",
    "product.addToCart": "أضيفي للسلة",
    "product.quickView": "معاينة سريعة",
    "product.viewAll": "عرض الكل",
    "product.color": "اللون",
    "product.size": "المقاس",
    "product.ringSize": "مقاس الخاتم",
    "product.quantity": "الكمية",
    "product.decrease": "تقليل الكمية",
    "product.increase": "زيادة الكمية",
    "product.wishlist": "المفضلة",
    "product.unavailable": "غير متوفر حاليًا",
    "product.optionUnavailable": "هذا الخيار من المنتج غير متوفر",
    "product.chooseOptions": "اختاري الخيارات",
    "product.updateCartItem": "تحديث المنتج في السلة",
    "product.selectColor": "اختاري اللون",
    "product.selectSize": "اختاري المقاس",
    "product.selectOptions": "اختاري جميع خيارات المنتج للمتابعة",
    "product.reviews": "تقييمات",
    "product.deliveryOman": "التوصيل إلى جميع أنحاء عُمان",
    "product.pairWithRings": "خواتم تتناسق مع أساورك",
    "product.ringsIn": "خواتم بلون",
    "product.jeweleryBox": "صندوق مجوهرات",
    "checkout.jeweleryBoxes": "صناديق المجوهرات",
    "product.fallbackJewelry": "قطعة مجوهرات",
    "cart.optionRequired": "اختاري خيارات المنتج قبل إتمام الشراء",
    "footer.about": "عن لاستيلا",
    "footer.aboutText": "لاستيلا تصنع مجوهرات فاخرة بأسعار في متناول الجميع.",
    "footer.shop": "المتجر",
    "footer.help": "المساعدة",
    "footer.faq": "الأسئلة الشائعة",
    "footer.shipping": "الشحن",
    "footer.returns": "الإرجاع",
    "footer.contact": "تواصل",
    "footer.follow": "تابعينا",
    "footer.rights": "جميع الحقوق محفوظة.",
    "contact.phone": "الهاتف",
    "contact.whatsapp": "واتساب",
    "contact.hours": "ساعات العمل",
    "contact.hoursValue": "١٠:٠٠ صباحًا – ١٠:٠٠ مساءً",
    "common.currency": "OMR",
    "common.free_shipping": "توصيل للمنزل أو المكتب داخل سلطنة عُمان",
    "common.returns": "إرجاع خلال 7 أيام · تحويل بنكي",
  },
} as const;

type Key = keyof typeof dict.en;

interface I18nCtx {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (k: Key) => string;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastella-lang");
      if (saved === "ar" || saved === "en") {
        setLangState(saved);
      } else {
        localStorage.setItem("lastella-lang", "ar");
      }
    } catch {
      // Keep the Arabic default when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lastella-lang", l);
    } catch {
      // Language persistence is optional when storage is unavailable.
    }
  };

  const value: I18nCtx = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    t: (k) => dict[lang][k] ?? dict.en[k] ?? k,
    setLang,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
}
