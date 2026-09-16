import { useEffect, useMemo, useState } from "react";
import {
  Menu,
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Leaf,
  Truck,
  Headphones,
  LogOut,
  Save,
  Pencil,
  Package,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  MapPin,
  Search,
  Phone,
  Eye,
  Download,
  Printer,
  BadgeCheck,
  AlertTriangle,
  Users,
  Share2,
  Clock,
  Star,
  RotateCcw,
  ClipboardCheck,
  Mail,
} from "lucide-react";
import { api } from "./api";
import { fallbackProducts, defaultSettings } from "./data";
import { readCart, reconcileCart } from "./cart";
const money = (n) => `৳${Number(n).toLocaleString("bn-BD")}`,
  bn = (n) => Number(n).toLocaleString("bn-BD");
const orderStatusLabels = {
  pending: "অপেক্ষমাণ",
  confirmed: "নিশ্চিত",
  shipped: "পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল",
};
const pricing = (p) => {
  if (Number.isFinite(p.currentPrice))
    return {
      original: Number(p.originalPrice ?? p.price),
      current: Number(p.currentPrice),
      savings: Number(p.savings || 0),
      offer: p.activeDiscount || null,
    };
  const d = p.discount,
    now = new Date(),
    active =
      d?.enabled &&
      (!d.startAt || new Date(d.startAt) <= now) &&
      (!d.endAt || new Date(d.endAt) > now) &&
      (d.quantityLimit == null || d.quantityUsed < d.quantityLimit);
  if (!active)
    return {
      original: Number(p.price),
      current: Number(p.price),
      savings: 0,
      offer: null,
    };
  const current =
    d.type === "percentage"
      ? Math.max(0, Math.round(p.price - (p.price * d.value) / 100))
      : Math.max(0, Math.round(p.price - d.value));
  return {
    original: Number(p.price),
    current,
    savings: Number(p.price) - current,
    offer: { type: d.type, value: Number(d.value), quantityRemaining: d.quantityLimit == null ? null : Math.max(0, d.quantityLimit - (d.quantityUsed || 0)), endAt: d.endAt || null },
  };
};
const offerText = (offer) =>
  offer?.type === "percentage"
    ? `${bn(offer.value)}% OFF`
    : `${money(offer?.value || 0)} OFF`;
const discountLabel = (status) =>
  ({
    active: "Active",
    scheduled: "Scheduled",
    expired: "Expired",
    sold_out: "Limit Reached",
    none: "No Discount",
  })[status] || "No Discount";
const dateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
function useStore() {
  const [products, setProducts] = useState(fallbackProducts),
    [settings, setSettings] = useState(defaultSettings),
    [online, setOnline] = useState(false);
  useEffect(() => {
    Promise.all([api.products(), api.settings()])
      .then(([p, s]) => {
        setProducts(Array.isArray(p.products) ? p.products : []);
        if (s.settings) setSettings(s.settings);
        setOnline(true);
      })
      .catch(() => {});
  }, []);
  return { products, settings, online };
}
function Storefront() {
  const { products, settings, online } = useStore();
  const [category, setCategory] = useState("সব"),
    [cart, setCart] = useState(() => readCart(localStorage.getItem("tripti-cart"))),
    [drawer, setDrawer] = useState(false),
    [checkout, setCheckout] = useState(false),
    [selectedProduct, setSelectedProduct] = useState(null),
    [search, setSearch] = useState(""),
    [tracking, setTracking] = useState(false),
    [recentIds, setRecentIds] = useState(() => JSON.parse(localStorage.getItem("tripti-recent") || "[]")),
    [heroIndex, setHeroIndex] = useState(0),
    [notice, setNotice] = useState(""),
    [addedFeedback, setAddedFeedback] = useState(null),
    [cartPulse, setCartPulse] = useState(false);
  const categories = ["সব", ...new Set(products.map((p) => p.category))],
    heroProducts = products.filter((p) => p.featured && p.stock > 0),
    heroProduct = heroProducts.length
      ? heroProducts[heroIndex % heroProducts.length]
      : null,
    shown = products.filter((p) => (category === "সব" || p.category === category) && (!search.trim() || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(search.trim().toLowerCase()))),
    recentProducts = recentIds.map((id) => products.find((p) => p._id === id)).filter(Boolean).slice(0, 4);
  useEffect(
    () => localStorage.setItem("tripti-cart", JSON.stringify(cart)),
    [cart],
  );
  useEffect(() => {
    if (online) setCart((current) => reconcileCart(current, products, fallbackProducts));
  }, [online, products]);
  useEffect(() => {
    if (heroIndex >= heroProducts.length) setHeroIndex(0);
  }, [heroIndex, heroProducts.length]);
  useEffect(() => {
    if (heroProducts.length < 2) return;
    const timer = setInterval(
      () => setHeroIndex((index) => (index + 1) % heroProducts.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [heroProducts.length]);
  const detailed = cart
      .map((l) => ({
        ...l,
        product: products.find((p) => p._id === l.productId),
      }))
      .filter((x) => x.product),
    subtotal = detailed.reduce(
      (s, x) => s + pricing(x.product).current * x.quantity,
      0,
    );
  function add(p) {
    const feedbackId = Date.now();
    setCart((c) => {
      const line = c.find((x) => x.productId === p._id);
      return line
        ? c.map((x) =>
            x === line
              ? { ...x, quantity: Math.min(x.quantity + 1, p.stock) }
              : x,
          )
        : [...c, { productId: p._id, quantity: 1 }];
    });
    setNotice(`${p.name} কার্টে যোগ হয়েছে`);
    setAddedFeedback({ product: p, id: feedbackId });
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 650);
    setTimeout(() => {
      setAddedFeedback((current) => current?.id === feedbackId ? null : current);
      setNotice("");
    }, 1900);
  }
  function quantity(id, delta) {
    setCart((c) =>
      c
        .map((x) =>
          x.productId === id ? { ...x, quantity: x.quantity + delta } : x,
        )
        .filter((x) => x.quantity > 0),
    );
  }
  function goToProduct(product) {
    setCategory("সব");
    location.hash = `product-${product._id}`;
    requestAnimationFrame(() =>
      document
        .getElementById(`product-${product._id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }
  function openProduct(product) {
    setSelectedProduct(product);
    setRecentIds((current) => {
      const next = [product._id, ...current.filter((id) => id !== product._id)].slice(0, 8);
      localStorage.setItem("tripti-recent", JSON.stringify(next));
      return next;
    });
  }
  function repeatOrder(order) {
    const next = (order.items || []).map((item) => ({ productId: String(item.product), quantity: Math.min(Number(item.quantity), products.find((p) => p._id === String(item.product))?.stock || 0) })).filter((item) => item.quantity > 0);
    setCart(next);
    setTracking(false);
    setDrawer(true);
  }
  const wa = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("আসসালামু আলাইকুম, তৃপ্তি ফুড থেকে অর্ডার করতে চাই।")}`;
  return (
    <>
      <div className="topbar">
        ঢাকার ভেতরে দ্রুত ডেলিভারি · ক্যাশ অন ডেলিভারি
      </div>
      <header className="header wrap">
        <a className="brand" href="#home">
          <img src="/assets/logo.png" alt="তৃপ্তি ফুড" />
        </a>
        <nav>
          <a href="#products">পণ্য</a>
          <button type="button" className="nav-track" onClick={() => setTracking(true)}>অর্ডার ট্র্যাক</button>
          <a href="#quality">আমাদের গল্প</a>
          <a href="#faq">জিজ্ঞাসা</a>
        </nav>
        <button className={`cart-button${cartPulse ? " cart-pulse" : ""}`} onClick={() => setDrawer(true)}>
          <ShoppingBag size={18} /> কার্ট{" "}
          <span>{bn(cart.reduce((s, x) => s + x.quantity, 0))}</span>
        </button>
      </header>
      <main id="home">
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow">১০০% খাঁটি ও প্রাকৃতিক</p>
            <h1>
              প্রকৃতির ভালোটা,
              <br />
              <em>প্রতিদিনের তৃপ্তিতে</em>
            </h1>
            <p className="hero-text">
              বাছাই করা মধু, খেজুর, বাদাম ও সিড—স্বাদ আর যত্নে প্রস্তুত আপনার
              পরিবারের জন্য।
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#products">
                পণ্য দেখুন
              </a>
              <a
                className="button ghost"
                href={wa}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp-এ অর্ডার
              </a>
            </div>
            <div className="trust-row">
              <span>✓ বাছাই করা উপাদান</span>
              <span>✓ নিরাপদ প্যাকেজিং</span>
              <span>✓ সহজ পেমেন্ট</span>
            </div>
          </div>
          {heroProduct ? (
            <div className="hero-visual hero-slider" aria-roledescription="carousel" aria-label="বিশেষ পণ্য">
              <button className="hero-product" onClick={() => goToProduct(heroProduct)} aria-label={`${heroProduct.name} পণ্যটি দেখুন`}>
                <img src={heroProduct.image} alt={heroProduct.name} key={heroProduct._id} />
                <div className="hero-badge">
                  <strong>{pricing(heroProduct).offer ? offerText(pricing(heroProduct).offer) : "বিশেষ"}</strong>
                  <span>{heroProduct.name}</span>
                  <small>{money(pricing(heroProduct).current)}</small>
                </div>
              </button>
              {heroProducts.length > 1 && (
                <>
                  <button className="hero-arrow prev" onClick={() => setHeroIndex((heroIndex - 1 + heroProducts.length) % heroProducts.length)} aria-label="আগের পণ্য"><ChevronLeft /></button>
                  <button className="hero-arrow next" onClick={() => setHeroIndex((heroIndex + 1) % heroProducts.length)} aria-label="পরের পণ্য"><ChevronRight /></button>
                  <div className="hero-dots" aria-label="Slider navigation">
                    {heroProducts.map((product, index) => <button key={product._id} className={index === heroIndex ? "active" : ""} onClick={() => setHeroIndex(index)} aria-label={`${bn(index + 1)} নম্বর পণ্য`} />)}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hero-empty"><ShoppingBag /><strong>শিগগিরই নতুন পণ্য আসছে</strong></div>
          )}
        </section>
        <section className="benefits wrap">
          <article>
            <Leaf />
            <div>
              <b>প্রাকৃতিক উপাদান</b>
              <span>অপ্রয়োজনীয় সংযোজন ছাড়া</span>
            </div>
          </article>
          <article>
            <Truck />
            <div>
              <b>দেশজুড়ে ডেলিভারি</b>
              <span>নির্ভরযোগ্য কুরিয়ারে</span>
            </div>
          </article>
          <article>
            <Headphones />
            <div>
              <b>সরাসরি সহায়তা</b>
              <span>কল বা WhatsApp করুন</span>
            </div>
          </article>
        </section>
        <section className="products-section wrap" id="products">
          <div className="section-head">
            <div>
              <p className="eyebrow">আপনার জন্য বাছাই</p>
              <h2>জনপ্রিয় পণ্য</h2>
            </div>
            <div className="filters">
              {categories.map((c) => (
                <button
                  key={c}
                  className={`filter ${c === category ? "active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <label className="store-search"><Search /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="পণ্যের নাম বা category খুঁজুন" /></label>
          {!online && (
            <p className="demo-note">
              Demo catalogue দেখানো হচ্ছে—backend চালু হলে live data আসবে।
            </p>
          )}
          <div className="product-grid">
            {shown.map((p) => {
              const price = pricing(p);
              return (
              <article className="product-card" id={`product-${p._id}`} key={p._id}>
                <button className="product-open" onClick={() => openProduct(p)} aria-label={`${p.name} বিস্তারিত দেখুন`}>
                  <img src={p.image} alt={p.name} loading="lazy" />
                  {price.offer && <span className="offer-badge">{offerText(price.offer)}</span>}
                </button>
                <div className="product-info">
                  <div className="product-meta">
                    <span className="category">{p.category}</span>
                    <span className={`stock ${p.stock > 0 && p.stock <= 5 ? "stock-low" : ""}`}>
                      {p.stock > 0 ? (p.stock <= 5 ? `মাত্র ${bn(p.stock)}টি বাকি` : "স্টকে আছে") : "স্টক শেষ"}
                    </span>
                  </div>
                  <h3><button className="product-name" onClick={() => openProduct(p)}>{p.name}</button></h3>
                  <p>{p.description}</p>
                  <div className="price-row">
                    <span className="price-stack">
                      {price.offer && <del>{money(price.original)}</del>}
                      <strong>{money(price.current)}</strong> <small>/ {p.weight}</small>
                    </span>
                    <button
                      className="add-button"
                      onClick={() => add(p)}
                      disabled={!p.stock}
                      aria-label={`${p.name} কার্টে যোগ করুন`}
                    >
                      <Plus />
                    </button>
                  </div>
                </div>
              </article>
            )})}
          </div>
        </section>
        {recentProducts.length > 0 && <section className="recent-section wrap"><div className="section-head"><div><p className="eyebrow">আবার দেখে নিন</p><h2>সম্প্রতি দেখা</h2></div></div><div className="recent-products">{recentProducts.map((p) => <button key={p._id} onClick={() => openProduct(p)}><img src={p.image} alt="" /><span>{p.name}</span><strong>{money(pricing(p).current)}</strong></button>)}</div></section>}
        <section className="story" id="quality">
          <div className="wrap story-grid">
            <img
              src="/assets/nuts-dates.webp"
              alt="বাছাই করা খেজুর, বাদাম ও সিড"
            />
            <div>
              <p className="eyebrow light">আমাদের অঙ্গীকার</p>
              <h2>
                স্বাদে তৃপ্তি,
                <br />
                বিশ্বাসে নিশ্চিন্ত
              </h2>
              <p>
                উপাদান বাছাই থেকে প্যাকেজিং পর্যন্ত প্রতিটি ধাপে পরিচ্ছন্নতা ও
                গুণমানকে গুরুত্ব দিই।
              </p>
              <ul>
                <li>বাছাই করা কাঁচামাল</li>
                <li>ছোট ব্যাচে প্রস্তুত</li>
                <li>স্পষ্ট উপাদান ও সংরক্ষণ তথ্য</li>
              </ul>
            </div>
          </div>
        </section>
        <section className="how wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">একদম সহজ</p>
              <h2>তিন ধাপে অর্ডার</h2>
            </div>
          </div>
          <div className="steps">
            <article>
              <span>১</span>
              <h3>পণ্য বাছুন</h3>
              <p>পছন্দের পণ্য ও পরিমাণ কার্টে যোগ করুন।</p>
            </article>
            <article>
              <span>২</span>
              <h3>তথ্য দিন</h3>
              <p>নাম, ফোন ও ডেলিভারি ঠিকানা লিখুন।</p>
            </article>
            <article>
              <span>৩</span>
              <h3>অর্ডার নিশ্চিত</h3>
              <p>COD বা মোবাইল পেমেন্ট বেছে নিশ্চিত করুন।</p>
            </article>
          </div>
        </section>
        <section className="faq wrap" id="faq">
          <p className="eyebrow">সাধারণ জিজ্ঞাসা</p>
          <h2>জানতে চান?</h2>
          <details>
            <summary>ডেলিভারি কত দিনে পাব?</summary>
            <p>ঢাকায় সাধারণত ১–২ এবং ঢাকার বাইরে ২–৪ কর্মদিবস লাগতে পারে।</p>
          </details>
          <details><summary>অর্ডার বাতিল ও refund কীভাবে হবে?</summary><p>অর্ডার courier-এ দেওয়ার আগে আমাদের কল বা WhatsApp করুন। Online payment refund যাচাইয়ের পরে ব্যবহৃত payment মাধ্যমেই দেওয়া হবে।</p></details>
          <details><summary>পণ্য গ্রহণের সময় সমস্যা পেলে কী করব?</summary><p>প্যাকেট খোলার ভিডিওসহ ২৪ ঘণ্টার মধ্যে যোগাযোগ করুন। ভুল বা ক্ষতিগ্রস্ত পণ্য যাচাই করে সমাধান দেওয়া হবে।</p></details>
          <details>
            <summary>কীভাবে পেমেন্ট করব?</summary>
            <p>ক্যাশ অন ডেলিভারি অথবা bKash/Nagad-এ পেমেন্ট করতে পারবেন।</p>
          </details>
        </section>
      </main>
      <footer>
        <div className="wrap footer-cta">
          <div><span>বিশুদ্ধ খাবার, নিশ্চিন্ত কেনাকাটা</span><h2>প্রয়োজনে আমরা আছি আপনার পাশে</h2></div>
          <div><a className="footer-call" href={`tel:${settings.phone}`}><Phone size={18} /> কল করুন</a><a className="footer-whatsapp" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a></div>
        </div>
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <img src="/assets/logo.png" alt="তৃপ্তি ফুড" />
            <p>বাছাই করা প্রাকৃতিক খাবার—স্বাদ, গুণমান ও বিশ্বাসের সঙ্গে পৌঁছে দিই আপনার পরিবারের কাছে।</p>
            <a className="facebook-link" href="https://www.facebook.com/TriptiFoodsbd/" target="_blank" rel="noreferrer"><span>f</span> Facebook page</a>
          </div>
          <div className="footer-links">
            <h3>দ্রুত লিংক</h3>
            <a href="#products">সব পণ্য</a>
            <a href="#quality">আমাদের গল্প</a>
            <a href="#faq">জিজ্ঞাসা ও নীতিমালা</a>
            <button type="button" onClick={() => setTracking(true)}>অর্ডার ট্র্যাক করুন</button>
          </div>
          <div className="footer-contact">
            <h3>যোগাযোগ</h3>
            <a href={`tel:${settings.phone}`}><Phone size={17} /><span>{settings.phone}</span></a>
            {settings.email && settings.email !== "admin@example.com" && <a href={`mailto:${settings.email}`}><Mail size={17} /><span>{settings.email}</span></a>}
            <a href={wa} target="_blank" rel="noreferrer"><MessageCircle size={17} /><span>WhatsApp support</span></a>
            <p><MapPin size={17} /><span>{settings.address}</span></p>
          </div>
          <div className="footer-payment">
            <h3>পেমেন্ট ও ডেলিভারি</h3>
            <p>নিরাপদ ও সহজ পেমেন্ট</p>
            <div><span>COD</span><span>bKash</span><span>Nagad</span></div>
            <small><Truck size={17} /> দেশজুড়ে courier delivery</small>
          </div>
        </div>
        <div className="wrap copyright"><p>© {new Date().getFullYear()} তৃপ্তি ফুড। সর্বস্বত্ব সংরক্ষিত।</p><p>Pure food · Honest service · Happy family</p></div>
      </footer>
      {drawer && (
        <>
          <button
            className="drawer-overlay"
            onClick={() => setDrawer(false)}
            aria-label="কার্ট বন্ধ করুন"
          />
          <aside className="cart-drawer open">
            <div className="drawer-head">
              <h2>আপনার কার্ট</h2>
              <button onClick={() => setDrawer(false)}>
                <X />
              </button>
            </div>
            <div className="cart-items">
              {detailed.length ? (
                detailed.map((x) => (
                  <div className="cart-item" key={x.productId}>
                    <img src={x.product.image} alt="" />
                    <div>
                      <h4>{x.product.name}</h4>
                      <small>
                        {money(pricing(x.product).current)} · {x.product.weight}
                      </small>
                      <div className="qty">
                        <button onClick={() => quantity(x.productId, -1)}>
                          <Minus />
                        </button>
                        <span>{bn(x.quantity)}</span>
                        <button onClick={() => quantity(x.productId, 1)}>
                          <Plus />
                        </button>
                      </div>
                    </div>
                    <button
                      className="remove"
                      onClick={() =>
                        setCart((c) =>
                          c.filter((l) => l.productId !== x.productId),
                        )
                      }
                    >
                      <Trash2 />
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty">আপনার কার্ট এখন খালি।</p>
              )}
            </div>
            <div className="cart-summary">
              <div>
                <span>সাবটোটাল</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <small>চেকআউটে ডেলিভারি চার্জ যোগ হবে</small>
              <button
                className="button primary full"
                disabled={!detailed.length || !online}
                onClick={() => {
                  setDrawer(false);
                  setCheckout(true);
                }}
              >
                {online ? "চেকআউট করুন" : "সার্ভারের জন্য অপেক্ষা করুন"}
              </button>
            </div>
          </aside>
        </>
      )}
      {checkout && (
        <Checkout
          items={detailed}
          settings={settings}
          subtotal={subtotal}
          onClose={() => setCheckout(false)}
          onSuccess={() => setCart([])}
        />
      )}
      {selectedProduct && (
        <ProductDetails product={selectedProduct} products={products} onOpen={openProduct} onClose={() => setSelectedProduct(null)} onAdd={add} />
      )}
      {tracking && <OrderTracker onClose={() => setTracking(false)} onRepeat={repeatOrder} />}
      {detailed.length > 0 && !drawer && !checkout && <button className="mobile-cart-bar" onClick={() => setDrawer(true)}><ShoppingBag /><span>{bn(detailed.reduce((sum, item) => sum + item.quantity, 0))}টি পণ্য</span><strong>{money(subtotal)}</strong></button>}
      <a className="whatsapp-float" href={wa} aria-label="WhatsApp">
        <MessageCircle />
      </a>
      <div className="sr-only" role="status" aria-live="polite">{notice}</div>
      {addedFeedback && (
        <div className="cart-feedback" key={addedFeedback.id} role="presentation">
          <div className="cart-feedback-image">
            <img src={addedFeedback.product.image} alt="" />
            <span><CircleCheck size={18} strokeWidth={3} /></span>
          </div>
          <div>
            <strong>কার্টে যোগ হয়েছে!</strong>
            <small>{addedFeedback.product.name}</small>
          </div>
          <ShoppingBag className="cart-feedback-bag" size={25} />
          <i aria-hidden="true" />
        </div>
      )}
    </>
  );
}
function ProductDetails({ product, products, onOpen, onClose, onAdd }) {
  const price = pricing(product),
    [reviews, setReviews] = useState([]),
    related = products.filter((item) => item._id !== product._id && item.category === product.category && item.stock > 0).slice(0, 3);
  useEffect(() => { api.reviews(product._id).then((data) => setReviews(data.reviews || [])).catch(() => setReviews([])); }, [product._id]);
  const offerEnds = price.offer?.endAt ? new Date(price.offer.endAt) : null,
    offerTime = offerEnds && offerEnds > new Date() ? `${Math.max(1, Math.ceil((offerEnds - new Date()) / 86400000))} দিনের মধ্যে offer শেষ` : "";
  async function shareProduct() {
    const url = `${location.origin}${location.pathname}#product-${product._id}`;
    if (navigator.share) await navigator.share({ title: product.name, text: product.description, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); alert("পণ্যের link copy হয়েছে।"); }
  }
  return (
    <div className="modal-backdrop">
      <section className="product-details" aria-modal="true" role="dialog" aria-label={`${product.name} বিস্তারিত`}>
        <button className="dialog-close" onClick={onClose} aria-label="বন্ধ করুন"><X /></button>
        <div className="product-details-image">
          <img src={product.image} alt={product.name} />
          {price.offer && <span className="offer-badge">{offerText(price.offer)}</span>}
        </div>
        <div className="product-details-copy">
          <span className="category">{product.category} · {product.weight}</span>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <div className="details-price">
            {price.offer && <del>{money(price.original)}</del>}
            <strong>{money(price.current)}</strong>
          </div>
          {price.offer && <p className="saving">আপনি সাশ্রয় করছেন {money(price.savings)}</p>}
          {offerTime && <p className="offer-countdown"><Clock size={16} /> {offerTime}</p>}
          {price.offer?.quantityRemaining != null && <p className="offer-remaining">Offer-এ আর {bn(price.offer.quantityRemaining)}টি বাকি</p>}
          {product.stock > 0 && product.stock <= 5 && <p className="stock-warning">মাত্র {bn(product.stock)}টি বাকি</p>}
          <div className="detail-actions"><button className="button primary" disabled={!product.stock} onClick={() => { onAdd(product); onClose(); }}><ShoppingBag size={18} /> কার্টে যোগ করুন</button><button className="button ghost" onClick={shareProduct}><Share2 size={18} /> Share</button></div>
          {reviews.length > 0 && <div className="review-summary"><h3>Verified reviews</h3>{reviews.slice(0, 3).map((review) => <article key={review._id}><span>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span><p>{review.comment}</p><small>{review.customerName}</small></article>)}</div>}
          {related.length > 0 && <div className="related-products"><h3>সম্পর্কিত পণ্য</h3>{related.map((item) => <button key={item._id} onClick={() => onOpen(item)}><img src={item.image} alt="" /><span>{item.name}</span></button>)}</div>}
        </div>
      </section>
    </div>
  );
}
function Checkout({ items, settings, subtotal, onClose, onSuccess }) {
  const [area, setArea] = useState("dhaka"),
    [payment, setPayment] = useState("cod"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState(null),
    savedCustomer = JSON.parse(localStorage.getItem("tripti-customer") || "{}");
  const fee =
      area === "dhaka" ? settings.deliveryDhaka : settings.deliveryOutside,
    isMobilePayment = payment === "bkash" || payment === "nagad";
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const f = new FormData(e.currentTarget),
      comment = f.get("comment").trim(),
      payload = {
        customer: {
          name: f.get("name"),
          phone: f.get("phone"),
          email: f.get("email"),
          address: f.get("address"),
          area,
        },
        comment,
        payment,
        paymentDetails: isMobilePayment
          ? {
              senderNumber: f.get("senderNumber"),
              transactionId: f.get("transactionId"),
            }
          : {},
        items: items.map((x) => ({
          productId: x.productId,
          quantity: x.quantity,
        })),
      };
    try {
      const d = await api.createOrder(payload);
      if (f.get("saveInfo") === "on") localStorage.setItem("tripti-customer", JSON.stringify(payload.customer));
      else localStorage.removeItem("tripti-customer");
      setReceipt({ ...d.order, customer: payload.customer, payment, items: items.map((item) => ({ name: item.product.name, quantity: item.quantity, total: pricing(item.product).current * item.quantity })), subtotal, deliveryFee: fee });
      onSuccess();
    } catch (err) {
      const text = `অর্ডার: ${items.map((x) => `${x.product.name} × ${x.quantity}`).join(", ")}. নাম: ${f.get("name")}, ফোন: ${f.get("phone")}, ইমেইল: ${f.get("email")}, ঠিকানা: ${f.get("address")}${comment ? `, মন্তব্য: ${comment}` : ""}${isMobilePayment ? `, পেমেন্ট: ${payment}, পাঠানো নম্বর: ${f.get("senderNumber")}, Transaction ID: ${f.get("transactionId")}` : ""}`;
      setMessage(
        <span>
          {err.message}{" "}
          <a
            href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp-এ পাঠান
          </a>
        </span>,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section className="checkout-dialog">
        {receipt ? <div className="success-receipt"><button type="button" className="dialog-close" onClick={onClose}><X /></button><CircleCheck /><p className="eyebrow">অর্ডার সফল</p><h2>ধন্যবাদ!</h2><p>Order number</p><strong className="receipt-number">{receipt.orderNumber}</strong><div>{receipt.items.map((item, index) => <p key={index}><span>{item.name} × {bn(item.quantity)}</span><b>{money(item.total)}</b></p>)}<p><span>ডেলিভারি</span><b>{money(receipt.deliveryFee)}</b></p><p className="receipt-total"><span>সর্বমোট</span><b>{money(receipt.total)}</b></p></div><small>Order tracking-এর জন্য order number ও ফোন নম্বর সংরক্ষণ করুন।</small><button className="button primary" onClick={() => window.print()}><Printer size={18} /> Receipt print করুন</button></div> :
        <form onSubmit={submit}>
          <button type="button" className="dialog-close" onClick={onClose}>
            <X />
          </button>
          <p className="eyebrow">শেষ ধাপ</p>
          <h2>অর্ডার সম্পন্ন করুন</h2>
          <div className="form-grid">
            <label>
              আপনার নাম
              <input
                name="name"
                required
                minLength="2"
                maxLength="80"
                autoComplete="name"
                defaultValue={savedCustomer.name || ""}
              />
            </label>
            <label>
              মোবাইল নম্বর
              <input
                name="phone"
                required
                inputMode="numeric"
                pattern="01[3-9][0-9]{8}"
                placeholder="01XXXXXXXXX"
                autoComplete="tel"
                defaultValue={savedCustomer.phone || ""}
              />
            </label>
            <label className="wide">
              ইমেইল ঠিকানা
              <input
                name="email"
                type="email"
                required
                maxLength="120"
                placeholder="name@example.com"
                autoComplete="email"
                defaultValue={savedCustomer.email || ""}
              />
            </label>
            <label className="wide">
              সম্পূর্ণ ঠিকানা
              <textarea
                name="address"
                required
                minLength="8"
                maxLength="300"
                autoComplete="street-address"
                defaultValue={savedCustomer.address || ""}
              />
            </label>
            <label>
              ডেলিভারি এলাকা
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="dhaka">
                  ঢাকার ভিতরে — {money(settings.deliveryDhaka)}
                </option>
                <option value="outside">
                  ঢাকার বাইরে — {money(settings.deliveryOutside)}
                </option>
              </select>
            </label>
            <label>
              পেমেন্ট
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
              >
                <option value="cod">ক্যাশ অন ডেলিভারি</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
            </label>
            {isMobilePayment && (
              <>
                <div className="payment-instructions wide">
                  <strong>
                    {payment === "bkash" ? "bKash" : "Nagad"}-এ Send Money করুন
                  </strong>
                  <span>পেমেন্ট নম্বর: {settings.phone}</span>
                </div>
                <label>
                  যে নম্বর থেকে পাঠিয়েছেন
                  <input
                    name="senderNumber"
                    required
                    inputMode="numeric"
                    pattern="01[3-9][0-9]{8}"
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                  />
                </label>
                <label>
                  Transaction ID
                  <input
                    name="transactionId"
                    required
                    minLength="6"
                    maxLength="24"
                    pattern="[A-Za-z0-9-]{6,24}"
                    placeholder="যেমন: 9AB12C3DEF"
                    autoCapitalize="characters"
                  />
                </label>
              </>
            )}
            <label className="wide">
              অর্ডার সম্পর্কে মন্তব্য <span className="optional">(ঐচ্ছিক)</span>
              <textarea
                name="comment"
                maxLength="500"
                autoComplete="off"
                placeholder="বিশেষ নির্দেশনা থাকলে লিখুন"
              />
            </label>
            <label className="wide save-info"><input type="checkbox" name="saveInfo" defaultChecked={Boolean(savedCustomer.phone)} /> পরের order-এর জন্য এই browser-এ নাম, ফোন ও ঠিকানা সংরক্ষণ করুন</label>
          </div>
          <p className="delivery-estimate"><Truck size={17} /> সম্ভাব্য ডেলিভারি: {area === "dhaka" ? "১–২ কর্মদিবস" : "২–৪ কর্মদিবস"}</p>
          <div className="order-total">
            <span>সর্বমোট</span>
            <strong>{money(subtotal + fee)}</strong>
          </div>
          {isMobilePayment && (
            <p className="payment-note">
              পেমেন্ট যাচাইয়ের পর অর্ডার নিশ্চিত করা হবে।
            </p>
          )}
          <button className="button primary full" disabled={busy}>
            {busy ? "পাঠানো হচ্ছে…" : "অর্ডার নিশ্চিত করুন"}
          </button>
          <p className="form-message">{message}</p>
        </form>}
      </section>
    </div>
  );
}
function OrderTracker({ onClose, onRepeat }) {
  const [order, setOrder] = useState(null), [message, setMessage] = useState(""), [reviewed, setReviewed] = useState([]), [lookupPhone, setLookupPhone] = useState("");
  async function lookup(event) {
    event.preventDefault(); const fields = new FormData(event.currentTarget); setMessage("খোঁজা হচ্ছে…");
    try { const phone = fields.get("phone"); const data = await api.lookupOrder({ orderNumber: fields.get("orderNumber"), phone }); setLookupPhone(phone); setOrder(data.order); setMessage(""); }
    catch (error) { setOrder(null); setMessage(error.message); }
  }
  async function review(event, productId) {
    event.preventDefault(); const fields = new FormData(event.currentTarget);
    try { const data = await api.createReview({ orderNumber: order.orderNumber, phone: fields.get("phone"), productId, rating: Number(fields.get("rating")), comment: fields.get("comment") }); setReviewed((items) => [...items, String(productId)]); setMessage(data.message); }
    catch (error) { setMessage(error.message); }
  }
  return <div className="modal-backdrop"><section className="tracking-modal"><button className="dialog-close" onClick={onClose}><X /></button><p className="eyebrow">Account ছাড়াই</p><h2>অর্ডার ট্র্যাক করুন</h2><form className="tracking-search" onSubmit={lookup}><label>Order number<input name="orderNumber" required placeholder="TF-..." /></label><label>অর্ডারের ফোন নম্বর<input name="phone" required pattern="01[3-9][0-9]{8}" placeholder="01XXXXXXXXX" /></label><button className="button primary"><Search size={18} /> খুঁজুন</button></form><p role="status">{message}</p>{order && <div className="tracking-result"><div className={`tracking-status status-${order.status}`}><ClipboardCheck /><div><small>বর্তমান অবস্থা</small><strong>{orderStatusLabels[order.status]}</strong></div></div><p><strong>{order.orderNumber}</strong> · {new Date(order.createdAt).toLocaleDateString("bn-BD")}</p><div className="tracking-items">{order.items.map((item, index) => <div key={index}><span>{item.name} × {bn(item.quantity)}</span><strong>{money(item.lineTotal)}</strong></div>)}</div>{order.courier?.trackingId && <div className="public-courier"><strong>{order.courier.company}</strong><span>Tracking ID: {order.courier.trackingId}</span>{order.courier.trackingUrl && <a className="button ghost" href={order.courier.trackingUrl} target="_blank" rel="noreferrer"><Truck size={17} /> Track parcel</a>}</div>}<button className="button primary" onClick={() => onRepeat(order)}><RotateCcw size={17} /> আবার order করুন</button>{order.status === "delivered" && <div className="review-forms"><h3>পণ্য review করুন</h3>{order.items.map((item) => reviewed.includes(String(item.product)) ? <p key={String(item.product)}>✓ {item.name}-এর review জমা হয়েছে</p> : <form key={String(item.product)} onSubmit={(event) => review(event, String(item.product))}><strong>{item.name}</strong><input type="hidden" name="phone" value={lookupPhone} /><label>Rating<select name="rating" defaultValue="5"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option><option value="2">★★☆☆☆</option><option value="1">★☆☆☆☆</option></select></label><label>মতামত<textarea name="comment" required minLength="3" maxLength="500" /></label><button className="button ghost"><Star size={17} /> জমা দিন</button></form>)}</div>}</div>}</section></div>;
}
function Admin() {
  const [token, setToken] = useState(
    sessionStorage.getItem("tripti-admin-token") || "",
  );
  const [authenticated, setAuthenticated] = useState(false),
    [orders, setOrders] = useState([]),
    [products, setProducts] = useState([]),
    [reviews, setReviews] = useState([]),
    [settings, setSettings] = useState(defaultSettings),
    [edit, setEdit] = useState(null),
    [notice, setNotice] = useState(""),
    [orderQuery, setOrderQuery] = useState(""),
    [orderStatus, setOrderStatus] = useState("all"),
    [selectedOrder, setSelectedOrder] = useState(null),
    [module, setModule] = useState(() =>
      ["dashboard", "orders", "products", "reviews", "settings"].includes(
        location.hash.slice(1),
      )
        ? location.hash.slice(1)
        : "dashboard",
    );
  async function load() {
    const [o, p, s, r] = await Promise.all([
      api.orders(),
      api.adminProducts(),
      api.settings(),
      api.adminReviews(),
    ]);
    setOrders(o.orders);
    setProducts(p.products);
    setSettings(s.settings);
    setReviews(r.reviews || []);
    setAuthenticated(true);
  }
  useEffect(() => {
    if (token)
      load().catch(() => {
        sessionStorage.removeItem("tripti-admin-token");
        setToken("");
      });
  }, []);
  function openModule(next) {
    setModule(next);
    history.replaceState(null, "", `#${next}`);
    setNotice("");
  }
  async function login(e) {
    e.preventDefault();
    try {
      const d = await api.login({
        email: e.currentTarget.email.value,
        password: e.currentTarget.password.value,
      });
      sessionStorage.setItem("tripti-admin-token", d.token);
      setToken(d.token);
      await load();
    } catch (err) {
      setNotice(err.message);
    }
  }
  async function saveProduct(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      data = {
        name: f.get("name"),
        slug: f.get("slug"),
        category: f.get("category"),
        weight: f.get("weight"),
        price: Number(f.get("price")),
        stock: Number(f.get("stock")),
        description: f.get("description"),
        image: f.get("image"),
        featured: f.get("featured") === "on",
        discount: {
          enabled: f.get("discountEnabled") === "on",
          type: f.get("discountType"),
          value: Number(f.get("discountValue")),
          startAt: f.get("discountStart") || null,
          endAt: f.get("discountEnd") || null,
          quantityLimit: f.get("discountQuantity") || null,
          quantityUsed: Number(f.get("discountQuantityUsed") || 0),
        },
        active: true,
      };
    try {
      if (edit?._id) await api.updateProduct(edit._id, data);
      else await api.createProduct(data);
      setEdit(null);
      setNotice("পণ্য সংরক্ষিত হয়েছে।");
      await load();
    } catch (err) {
      setNotice(err.message);
    }
  }
  if (!authenticated)
    return (
      <main className="admin-page">
        <section className="admin-login">
          <img src="/assets/logo.png" alt="তৃপ্তি ফুড" />
          <p className="eyebrow">নিরাপদ Admin</p>
          <h1>Dashboard-এ প্রবেশ</h1>
          <form onSubmit={login}>
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength="8"
                autoComplete="current-password"
              />
            </label>
            <button className="button primary full">প্রবেশ করুন</button>
            <p role="status">{notice}</p>
          </form>
          <a href="/">← দোকানে ফিরুন</a>
        </section>
      </main>
    );
  const pending = orders.filter((o) => o.status === "pending").length,
    stock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0),
    lowStock = products.filter((p) => p.active !== false && Number(p.stock) <= 5),
    deliveredOrders = orders.filter((o) => o.status === "delivered"),
    deliveredSales = deliveredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    uniqueCustomers = new Set(orders.map((o) => o.customer?.phone).filter(Boolean)).size,
    titles = {
      dashboard: "ব্যবসার নিয়ন্ত্রণ",
      orders: "সাম্প্রতিক অর্ডার",
      products: "পণ্যসমূহ",
      reviews: "Customer reviews",
      settings: "দোকানের সেটিংস",
    },
    normalizedOrderQuery = orderQuery.trim().toLowerCase(),
    filteredOrders = orders.filter((order) => {
      if (orderStatus !== "all" && order.status !== orderStatus) return false;
      if (!normalizedOrderQuery) return true;
      const customer = order.customer || {};
      return [
        order.orderNumber,
        customer.name,
        customer.phone,
        customer.email,
        customer.address,
        order.comment,
        order.paymentDetails?.senderNumber,
        order.paymentDetails?.transactionId,
      ].some((value) => String(value || "").toLowerCase().includes(normalizedOrderQuery));
    });
  function exportOrders() {
    const cells = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["Order", "Date", "Customer", "Phone", "Email", "Address", "Payment", "Payment verified", "Status", "Total"]];
    filteredOrders.forEach((o) => rows.push([o.orderNumber, new Date(o.createdAt).toLocaleString("en-GB"), o.customer?.name, o.customer?.phone, o.customer?.email, o.customer?.address, o.payment, o.paymentVerified ? "Yes" : "No", orderStatusLabels[o.status], o.total]));
    const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(cells).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tripti-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <main className="admin-shell">
      <aside className="admin-side">
        <img src="/assets/logo.png" alt="তৃপ্তি ফুড" />
        <button
          className={module === "dashboard" ? "active" : ""}
          onClick={() => openModule("dashboard")}
        >
          <LayoutDashboard /> Dashboard
        </button>
        <button
          className={module === "orders" ? "active" : ""}
          onClick={() => openModule("orders")}
        >
          <ClipboardList /> অর্ডার
        </button>
        <button
          className={module === "products" ? "active" : ""}
          onClick={() => openModule("products")}
        >
          <Package /> পণ্য
        </button>
        <button className={module === "reviews" ? "active" : ""} onClick={() => openModule("reviews")}><Star /> Reviews</button>
        <button
          className={module === "settings" ? "active" : ""}
          onClick={() => openModule("settings")}
        >
          <Settings /> সেটিংস
        </button>
        <button
          className="logout"
          onClick={() => {
            sessionStorage.removeItem("tripti-admin-token");
            location.reload();
          }}
        >
          <LogOut /> বের হোন
        </button>
      </aside>
      <div className="admin-content">
        <header>
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>{titles[module]}</h1>
          </div>
          <a className="button ghost" href="/">
            দোকান দেখুন
          </a>
        </header>
        {module === "dashboard" && (
          <section className="dashboard-module">
            <div className="stat-grid">
              <button onClick={() => openModule("orders")}>
                <span>মোট অর্ডার</span>
                <strong>{bn(orders.length)}</strong>
                <small>সব অর্ডার দেখুন</small>
              </button>
              <button onClick={() => openModule("orders")}>
                <span>অপেক্ষমাণ অর্ডার</span>
                <strong>{bn(pending)}</strong>
                <small>এখনই যাচাই করুন</small>
              </button>
              <button onClick={() => openModule("products")}>
                <span>মোট পণ্য</span>
                <strong>{bn(products.length)}</strong>
                <small>পণ্য পরিচালনা করুন</small>
              </button>
              <button onClick={() => openModule("products")}>
                <span>মোট স্টক</span>
                <strong>{bn(stock)}</strong>
                <small>স্টক দেখুন</small>
              </button>
              <button onClick={() => openModule("orders")}>
                <span>সম্পন্ন বিক্রি</span>
                <strong>{money(deliveredSales)}</strong>
                <small>{bn(deliveredOrders.length)}টি delivered order</small>
              </button>
              <button onClick={() => openModule("orders")}>
                <span>Guest ক্রেতা</span>
                <strong>{bn(uniqueCustomers)}</strong>
                <small>ফোন নম্বর অনুযায়ী</small>
              </button>
            </div>
            {lowStock.length > 0 && (
              <div className="admin-card low-stock-card">
                <div><AlertTriangle /><h2>Low stock সতর্কতা</h2></div>
                <p>{lowStock.map((p) => `${p.name} (${bn(p.stock)})`).join(" · ")}</p>
                <button className="button ghost" onClick={() => openModule("products")}>স্টক আপডেট করুন</button>
              </div>
            )}
            <div className="admin-card quick-links">
              <h2>দ্রুত কাজ</h2>
              <button
                className="button primary"
                onClick={() => {
                  openModule("products");
                  setEdit({});
                }}
              >
                <Plus /> নতুন পণ্য যোগ করুন
              </button>
              <button
                className="button ghost"
                onClick={() => openModule("settings")}
              >
                <Settings /> দোকানের তথ্য বদলান
              </button>
            </div>
          </section>
        )}
        {module === "orders" && (
          <section className="admin-card module-card">
            <div className="admin-row">
              <div>
                <h2>সাম্প্রতিক অর্ডার</h2>
                <p>নতুন অর্ডার দেখুন এবং ডেলিভারি স্ট্যাটাস পরিবর্তন করুন।</p>
              </div>
              <button className="button ghost" type="button" onClick={exportOrders}><Download /> CSV Export</button>
            </div>
            <div className="order-filters" role="search">
              <label className="order-search">
                <Search size={19} />
                <input
                  type="search"
                  value={orderQuery}
                  onChange={(event) => setOrderQuery(event.target.value)}
                  placeholder="নাম, ফোন, ইমেইল, অর্ডার নম্বর বা ঠিকানা খুঁজুন"
                  aria-label="অর্ডার বা ক্রেতা খুঁজুন"
                />
              </label>
              <select
                value={orderStatus}
                onChange={(event) => setOrderStatus(event.target.value)}
                aria-label="স্ট্যাটাস অনুযায়ী অর্ডার ফিল্টার করুন"
              >
                <option value="all">সব স্ট্যাটাস</option>
                {Object.entries(orderStatusLabels).map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
              <span className="filter-count">{bn(filteredOrders.length)}টি পাওয়া গেছে</span>
              {(orderQuery || orderStatus !== "all") && (
                <button type="button" onClick={() => { setOrderQuery(""); setOrderStatus("all"); }}>ফিল্টার মুছুন</button>
              )}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>অর্ডার</th>
                    <th>ক্রেতা</th>
                    <th>ডেলিভারি ঠিকানা</th>
                    <th>মোট</th>
                    <th>পেমেন্ট</th>
                    <th>স্ট্যাটাস</th>
                    <th>কাজ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length ? (
                    filteredOrders.map((o) => (
                      <tr key={o._id} className={`order-row status-${o.status}`}>
                        <td>
                          {o.orderNumber}
                          <small>
                            {new Date(o.createdAt).toLocaleString("bn-BD")}
                          </small>
                        </td>
                        <td>
                          {o.customer.name}
                          <small>{o.customer.phone}</small>
                          <small>{o.customer.email}</small>
                          {o.comment && <small>মন্তব্য: {o.comment}</small>}
                        </td>
                        <td className="order-address">
                          <span><MapPin size={16} />{o.customer.address || "ঠিকানা দেওয়া হয়নি"}</span>
                          <small>{o.customer.area === "dhaka" ? "ঢাকার ভিতরে" : "ঢাকার বাইরে"}</small>
                        </td>
                        <td>{money(o.total)}</td>
                        <td>
                          {o.payment}
                          {(o.payment === "bkash" || o.payment === "nagad") && (
                            <small className={o.paymentVerified ? "payment-ok" : "payment-waiting"}>
                              {o.paymentVerified ? "যাচাইকৃত" : "যাচাই হয়নি"}
                            </small>
                          )}
                        </td>
                        <td>
                          <select
                            className={`order-status status-${o.status}`}
                            aria-label={`${o.orderNumber} অর্ডারের স্ট্যাটাস`}
                            value={o.status}
                            onChange={async (e) => {
                              await api.updateOrder(o._id, e.target.value);
                              load();
                            }}
                          >
                            {Object.entries(orderStatusLabels).map(([value, label]) => (
                              <option
                                value={value}
                                key={value}
                                disabled={(o.payment === "bkash" || o.payment === "nagad") && !o.paymentVerified && ![o.status, "cancelled"].includes(value)}
                              >{label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button className="order-view" type="button" onClick={() => setSelectedOrder(o)}><Eye size={17} /> বিস্তারিত</button>
                          {o.courier?.trackingId && <small>{o.courier.company}: {o.courier.trackingId}</small>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">{orders.length ? "এই ফিল্টারে কোনো অর্ডার পাওয়া যায়নি।" : "এখনো কোনো অর্ডার নেই।"}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {module === "products" && (
          <section className="admin-card module-card">
            <div className="admin-row">
              <div>
                <h2>পণ্যসমূহ</h2>
                <p>পণ্যের তথ্য, মূল্য ও স্টক পরিচালনা করুন।</p>
              </div>
              <button className="button primary" onClick={() => setEdit({})}>
                <Plus /> নতুন পণ্য
              </button>
            </div>
            <div className="admin-products">
              {products.map((p) => (
                <article key={p._id}>
                  <img src={p.image} alt="" />
                  <div>
                    <h3>{p.name}</h3>
                    <p>
                      {p.discountStatus === "active" && <del>{money(p.price)}</del>}{" "}
                      {money(p.currentPrice ?? p.price)} · Stock {p.stock}
                    </p>
                    <span className={`discount-status ${p.discountStatus || "none"}`}>{discountLabel(p.discountStatus)}</span>
                  </div>
                  <button
                    aria-label={`${p.name} সম্পাদনা করুন`}
                    onClick={() => setEdit(p)}
                  >
                    <Pencil />
                  </button>
                  <button
                    aria-label={`${p.name} মুছে ফেলুন`}
                    className="danger"
                    onClick={async () => {
                      if (confirm("পণ্যটি মুছে ফেলবেন?")) {
                        await api.deleteProduct(p._id);
                        load();
                      }
                    }}
                  >
                    <Trash2 />
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
        {module === "reviews" && <section className="admin-card module-card"><div className="admin-row"><div><h2>Customer reviews</h2><p>Verified delivered order থেকে আসা review অনুমোদন করুন।</p></div><span className="filter-count">{bn(reviews.filter((review) => !review.approved).length)}টি অপেক্ষমাণ</span></div><div className="admin-reviews">{reviews.length ? reviews.map((review) => <article key={review._id} className={review.approved ? "approved" : "pending"}><div><span className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span><h3>{review.product?.name || "পণ্য"}</h3><p>{review.comment}</p><small>{review.customerName} · Order {review.orderNumber}</small></div><div>{!review.approved && <button className="button primary" onClick={async () => { await api.approveReview(review._id, true); load(); }}><BadgeCheck size={17} /> অনুমোদন</button>}<button className="button danger-button" onClick={async () => { if (confirm("Review মুছে ফেলবেন?")) { await api.deleteReview(review._id); load(); } }}><Trash2 size={17} /> মুছুন</button></div></article>) : <p>এখনো কোনো review নেই।</p>}</div></section>}
        {module === "settings" && (
          <section className="admin-card module-card">
            <h2>দোকানের সেটিংস</h2>
            <p>যোগাযোগ ও ডেলিভারি চার্জের তথ্য পরিবর্তন করুন।</p>
            <form
              className="settings-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await api.updateSettings({
                  email: f.get("email"),
                  phone: f.get("phone"),
                  whatsapp: f.get("whatsapp"),
                  address: f.get("address"),
                  deliveryDhaka: Number(f.get("deliveryDhaka")),
                  deliveryOutside: Number(f.get("deliveryOutside")),
                });
                setNotice("সেটিংস সংরক্ষিত হয়েছে।");
                load();
              }}
            >
              <label>
                ইমেইল
                <input name="email" type="email" required maxLength="120" defaultValue={settings.email || ""} />
              </label>
              <label>
                ফোন
                <input name="phone" defaultValue={settings.phone} />
              </label>
              <label>
                WhatsApp
                <input name="whatsapp" defaultValue={settings.whatsapp} />
              </label>
              <label>
                ঠিকানা
                <input name="address" defaultValue={settings.address} />
              </label>
              <label>
                ঢাকা delivery
                <input
                  name="deliveryDhaka"
                  type="number"
                  defaultValue={settings.deliveryDhaka}
                />
              </label>
              <label>
                ঢাকার বাইরে
                <input
                  name="deliveryOutside"
                  type="number"
                  defaultValue={settings.deliveryOutside}
                />
              </label>
              <button className="button primary">
                <Save /> সংরক্ষণ
              </button>
            </form>
            <hr />
            <h3>Admin password পরিবর্তন</h3>
            <form
              className="settings-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                try {
                  const result = await api.changePassword({ currentPassword: f.get("currentPassword"), newPassword: f.get("newPassword") });
                  form.reset();
                  sessionStorage.removeItem("tripti-admin-token");
                  setToken("");
                  setAuthenticated(false);
                  setNotice(result.message);
                } catch (error) {
                  setNotice(error.message);
                }
              }}
            >
              <label>
                বর্তমান password
                <input name="currentPassword" type="password" required minLength="8" maxLength="128" autoComplete="current-password" />
              </label>
              <label>
                নতুন password
                <input name="newPassword" type="password" required minLength="12" maxLength="128" autoComplete="new-password" />
              </label>
              <button className="button primary"><Save /> Password পরিবর্তন</button>
            </form>
            <p role="status">{notice}</p>
          </section>
        )}
      </div>
      {edit !== null && (
        <ProductModal
          product={edit}
          onClose={() => setEdit(null)}
          onSave={saveProduct}
        />
      )}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          history={orders.filter((o) => o.customer?.phone === selectedOrder.customer?.phone)}
          onClose={() => setSelectedOrder(null)}
          onVerify={async (value) => {
            const result = await api.verifyPayment(selectedOrder._id, value);
            setSelectedOrder(result.order);
            await load();
          }}
          onCourier={async (courier) => {
            const result = await api.saveCourier(selectedOrder._id, courier);
            setSelectedOrder(result.order);
            await load();
            return result.order;
          }}
        />
      )}
    </main>
  );
}
function OrderDetails({ order, history, onClose, onVerify, onCourier }) {
  const mobilePayment = order.payment === "bkash" || order.payment === "nagad",
    [courierMessage, setCourierMessage] = useState("");
  async function saveCourier(event) {
    event.preventDefault();
    const form = event.currentTarget, fields = new FormData(form);
    try {
      await onCourier({ company: fields.get("company"), trackingId: fields.get("trackingId"), trackingUrl: fields.get("trackingUrl"), charge: Number(fields.get("charge") || 0), shippedAt: fields.get("shippedAt") || null });
      setCourierMessage("Courier-এর তথ্য সংরক্ষিত হয়েছে।");
    } catch (error) { setCourierMessage(error.message); }
  }
  const courierText = order.courier?.trackingId
    ? `আসসালামু আলাইকুম, আপনার ${order.orderNumber} অর্ডারটি ${order.courier.company} Courier-এ পাঠানো হয়েছে। Tracking ID: ${order.courier.trackingId}${order.courier.trackingUrl ? `। Track করুন: ${order.courier.trackingUrl}` : ""}`
    : `আসসালামু আলাইকুম, তৃপ্তি ফুড থেকে আপনার ${order.orderNumber} অর্ডার সম্পর্কে যোগাযোগ করছি।`;
  return (
    <div className="modal-backdrop order-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="order-details-modal" role="dialog" aria-modal="true" aria-labelledby="order-details-title">
        <button className="dialog-close" onClick={onClose} aria-label="বন্ধ করুন"><X /></button>
        <div className="invoice-heading">
          <img src="/assets/logo.png" alt="তৃপ্তি ফুড" />
          <div><p>অর্ডার</p><h2 id="order-details-title">{order.orderNumber}</h2><small>{new Date(order.createdAt).toLocaleString("bn-BD")}</small></div>
        </div>
        <div className="order-detail-grid">
          <article><h3>ক্রেতা ও ডেলিভারি</h3><p><strong>{order.customer?.name}</strong></p><p>{order.customer?.phone} · {order.customer?.email}</p><p>{order.customer?.address}</p><p>{order.customer?.area === "dhaka" ? "ঢাকার ভিতরে" : "ঢাকার বাইরে"}</p>{order.comment && <p className="customer-comment">মন্তব্য: {order.comment}</p>}</article>
          <article><h3>পেমেন্ট</h3><p>{order.payment?.toUpperCase()}</p>{mobilePayment && <><p>পাঠানো নম্বর: <strong>{order.paymentDetails?.senderNumber}</strong></p><p>Transaction ID: <strong>{order.paymentDetails?.transactionId}</strong></p><button className={`verify-payment ${order.paymentVerified ? "verified" : ""}`} onClick={() => onVerify(!order.paymentVerified)}><BadgeCheck size={18} /> {order.paymentVerified ? "পেমেন্ট যাচাই হয়েছে" : "পেমেন্ট যাচাই করুন"}</button></>}</article>
        </div>
        <div className="invoice-items">
          {order.items?.map((item, index) => <div key={`${item.product}-${index}`}><span>{item.name} × {bn(item.quantity)}</span><strong>{money(item.lineTotal)}</strong></div>)}
          <div><span>পণ্যের মূল্য</span><strong>{money(order.subtotal)}</strong></div>
          <div><span>ডেলিভারি</span><strong>{money(order.deliveryFee)}</strong></div>
          <div className="invoice-total"><span>সর্বমোট</span><strong>{money(order.total)}</strong></div>
        </div>
        <form className="courier-form" onSubmit={saveCourier}>
          <h3><Truck size={19} /> Courier tracking</h3>
          <label>Courier company<select name="company" required defaultValue={order.courier?.company || ""}><option value="" disabled>নির্বাচন করুন</option><option>Pathao</option><option>Steadfast</option><option>RedX</option><option>Paperfly</option><option>Sundarban</option><option>SA Paribahan</option><option>অন্যান্য</option></select></label>
          <label>Tracking / Consignment ID<input name="trackingId" required maxLength="80" defaultValue={order.courier?.trackingId || ""} /></label>
          <label>Tracking link <span className="optional">(ঐচ্ছিক)</span><input name="trackingUrl" type="url" placeholder="https://..." maxLength="500" defaultValue={order.courier?.trackingUrl || ""} /></label>
          <label>Courier charge<input name="charge" type="number" min="0" max="100000" defaultValue={order.courier?.charge || 0} /></label>
          <label>পাঠানোর তারিখ <span className="optional">(ঐচ্ছিক)</span><input name="shippedAt" type="date" defaultValue={order.courier?.shippedAt ? new Date(order.courier.shippedAt).toISOString().slice(0, 10) : ""} /></label>
          <button className="button primary"><Save /> সংরক্ষণ</button>
          <p role="status">{courierMessage}</p>
        </form>
        <div className="customer-history"><h3><Users size={18} /> একই ফোনে আগের অর্ডার</h3><p>মোট {bn(history.length)}টি · {money(history.reduce((sum, item) => sum + Number(item.total || 0), 0))}</p></div>
        <div className="order-actions">
          <a className="button ghost" href={`tel:${order.customer?.phone}`}><Phone /> কল করুন</a>
          <a className="button whatsapp-action" target="_blank" rel="noreferrer" href={`https://wa.me/88${order.customer?.phone}?text=${encodeURIComponent(courierText)}`}><MessageCircle /> WhatsApp</a>
          {order.courier?.trackingUrl && <a className="button ghost" target="_blank" rel="noreferrer" href={order.courier.trackingUrl}><Truck /> Track parcel</a>}
          <button className="button primary" onClick={() => window.print()}><Printer /> Invoice / Label</button>
        </div>
      </section>
    </div>
  );
}
function ProductModal({ product, onClose, onSave }) {
  const baseCategories = ["মিক্স", "মধু", "খেজুর", "বাদাম", "সিড"],
    categories =
      product.category && !baseCategories.includes(product.category)
        ? [product.category, ...baseCategories]
        : baseCategories,
    [image, setImage] = useState(product.image || ""),
    [uploading, setUploading] = useState(false),
    [uploadMessage, setUploadMessage] = useState(""),
    [discountEnabled, setDiscountEnabled] = useState(Boolean(product.discount?.enabled));
  async function chooseImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage("ছবির আকার সর্বোচ্চ ৫ MB হতে পারবে।");
      return;
    }
    setUploading(true);
    setUploadMessage("Cloudinary-তে upload হচ্ছে…");
    try {
      const result = await api.uploadImage(file);
      setImage(result.image.url);
      setUploadMessage("ছবি সফলভাবে upload হয়েছে।");
    } catch (err) {
      setUploadMessage(err.message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section className="product-modal">
        <button className="dialog-close" onClick={onClose}>
          <X />
        </button>
        <h2>{product._id ? "পণ্য সম্পাদনা" : "নতুন পণ্য"}</h2>
        <form onSubmit={onSave} className="settings-form">
          <label>
            নাম
            <input name="name" required minLength="2" maxLength="100" autoComplete="off" defaultValue={product.name} />
          </label>
          <label>
            Slug
            <input
              name="slug"
              required
              pattern="[a-z0-9-]+"
              autoComplete="off"
              defaultValue={product.slug}
            />
          </label>
          <label>
            Category
            <select
              name="category"
              required
              defaultValue={product.category || ""}
            >
              <option value="" disabled>
                Category নির্বাচন করুন
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            ওজন
            <input name="weight" required defaultValue={product.weight} />
          </label>
          <label>
            মূল্য
            <input
              name="price"
              type="number"
              min="0"
              required
              defaultValue={product.price}
            />
          </label>
          <label>
            Stock
            <input
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={product.stock}
            />
          </label>
          <label className="wide hero-choice">
            <input name="featured" type="checkbox" defaultChecked={Boolean(product.featured)} />
            Hero slider-এ এই পণ্যটি দেখান
          </label>
          <label className="wide">
            বর্ণনা
            <textarea
              name="description"
              required
              minLength="5"
              maxLength="600"
              autoComplete="off"
              defaultValue={product.description}
            />
          </label>
          <fieldset className="wide discount-editor">
            <legend>Discount / Offer</legend>
            <label className="discount-toggle">
              <input name="discountEnabled" type="checkbox" checked={discountEnabled} onChange={(e) => setDiscountEnabled(e.target.checked)} />
              Discount চালু করুন
            </label>
            {discountEnabled && (
              <div className="discount-fields">
                <div className="discount-type" role="radiogroup" aria-label="Discount type">
                  <label><input type="radio" name="discountType" value="percentage" defaultChecked={product.discount?.type !== "fixed"} /> Percentage (%)</label>
                  <label><input type="radio" name="discountType" value="fixed" defaultChecked={product.discount?.type === "fixed"} /> Fixed Amount (৳)</label>
                </div>
                <label>Discount Value<input name="discountValue" type="number" min="0.01" step="0.01" required defaultValue={product.discount?.value || ""} /></label>
                <label>শুরুর তারিখ ও সময় <span className="optional">(ঐচ্ছিক)</span><input name="discountStart" type="datetime-local" defaultValue={dateTimeLocal(product.discount?.startAt)} /></label>
                <label>শেষের তারিখ ও সময় <span className="optional">(ঐচ্ছিক)</span><input name="discountEnd" type="datetime-local" defaultValue={dateTimeLocal(product.discount?.endAt)} /></label>
                <label>Quantity Limit <span className="optional">(ঐচ্ছিক)</span><input name="discountQuantity" type="number" min="1" step="1" defaultValue={product.discount?.quantityLimit ?? ""} /></label>
                <input name="discountQuantityUsed" type="hidden" value={product.discount?.quantityUsed || 0} />
                {product._id && <p className="discount-current">বর্তমান অবস্থা: <strong>{discountLabel(product.discountStatus)}</strong>{product.discount?.quantityLimit != null && <> · ব্যবহার হয়েছে {bn(product.discount.quantityUsed || 0)}/{bn(product.discount.quantityLimit)}</>}</p>}
              </div>
            )}
          </fieldset>
          <label className="wide image-upload">
            পণ্যের ছবি
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={chooseImage}
            />
            <small>JPG, PNG, WebP বা AVIF · সর্বোচ্চ ৫ MB</small>
          </label>
          <input name="image" type="hidden" value={image} />
          {image && (
            <div className="wide upload-preview">
              <img src={image} alt="নির্বাচিত পণ্যের preview" />
              <span>{uploadMessage || "বর্তমান ছবি"}</span>
            </div>
          )}
          {!image && uploadMessage && (
            <p className="wide upload-status" role="status">
              {uploadMessage}
            </p>
          )}
          <button
            className="button primary full"
            disabled={uploading || !image}
          >
            {uploading ? "Upload হচ্ছে…" : "সংরক্ষণ"}
          </button>
        </form>
      </section>
    </div>
  );
}
export default function App() {
  return location.pathname.startsWith("/admin") ? <Admin /> : <Storefront />;
}
