// Restaurant App - Firebase Version
const RestaurantApp = {
    // Configuration
    config: {
        firebaseConfig: {
            apiKey: "AIzaSyAjOIquX2hmKOTNzpdGqJghVvmidlR_np4",
            authDomain: "fir-interaktive-web-rian.firebaseapp.com",
            projectId: "fir-interaktive-web-rian",
            storageBucket: "fir-interaktive-web-rian.firebasestorage.app",
            messagingSenderId: "384829764040",
            appId: "1:384829764040:web:78b0c600259b340cce10fd"
        },
        TAX_PERCENTAGE: 10, // 10% tax
        SERVICE_FEE_PERCENTAGE: 5, // 5% service fee
        TAX_NAME: "PPN",
        SERVICE_FEE_NAME: "Service Charge"
    },
    
    // State
    bag: [],
    menu: [],
    categories: [],
    selectedMethod: null,
    orderMethod: null,
    language: 'id', // Default Indonesian
    translations: {},
    db: null,
    auth: null,
    
    // Country to Language Mapping
    countryLanguageMap: {
        // Indonesia & Southeast Asia
        'ID': 'id', 'MY': 'id', 'SG': 'id', 'BN': 'id',
        // English-speaking countries
        'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en',
        // Spanish-speaking countries
        'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'PE': 'es',
        'CL': 'es', 'VE': 'es', 'EC': 'es', 'GT': 'es', 'CU': 'es',
        // Arabic-speaking countries
        'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'IQ': 'ar', 'JO': 'ar',
        'KW': 'ar', 'QA': 'ar', 'BH': 'ar', 'OM': 'ar', 'YE': 'ar',
        // Chinese-speaking regions
        'CN': 'zh', 'TW': 'zh', 'HK': 'zh', 'MO': 'zh', 'SG': 'zh'
    },
    
    // Initialize App
    async init() {
        console.log('Initializing Restaurant App...');
        
        this.loadTranslations();
        this.setupEventListeners();
        
        // Detect user language based on browser/region
        await this.detectUserLanguage();
        this.updateLanguage();
        
        // Initialize Firebase
        await this.initializeFirebase();
        
        // Load menu from Firebase
        await this.loadMenuFromFirebase();
        
        console.log('App initialized with language:', this.language);
    },
    
    // Detect user language
    async detectUserLanguage() {
        // Check localStorage first (user preference)
        const savedLang = localStorage.getItem('lang');
        if (savedLang) {
            this.language = savedLang;
            console.log('Using saved language:', savedLang);
            return;
        }
        
        // Get browser language
        const browserLang = navigator.language || navigator.userLanguage;
        console.log('Browser language:', browserLang);
        
        // Check browser language first
        if (browserLang.startsWith('id')) {
            this.language = 'id';
        } else if (browserLang.startsWith('en')) {
            this.language = 'en';
        } else if (browserLang.startsWith('es')) {
            this.language = 'es';
        } else if (browserLang.startsWith('ar')) {
            this.language = 'ar';
        } else if (browserLang.startsWith('zh')) {
            this.language = 'zh';
        } else {
            // Try to get user's country from IP
            try {
                const country = await this.getUserCountry();
                console.log('Detected country:', country);
                
                // Map country to language
                if (this.countryLanguageMap[country]) {
                    this.language = this.countryLanguageMap[country];
                } else {
                    // Default to English for other countries
                    this.language = 'en';
                }
            } catch (error) {
                console.log('Could not detect country, defaulting to Indonesian');
                this.language = 'id'; // Default to Indonesian for Indonesia
            }
        }
        
        // Save detected language
        localStorage.setItem('lang', this.language);
    },
    
    // Get user country from IP
    async getUserCountry() {
        try {
            // Using ipapi.co free API
            const response = await fetch('https://ipapi.co/country/');
            if (!response.ok) throw new Error('Country detection failed');
            
            const countryCode = await response.text();
            return countryCode.trim();
        } catch (error) {
            console.warn('Country detection failed:', error);
            
            // Fallback: Use browser's timezone
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timezone.includes('Asia/Jakarta') || 
                timezone.includes('Asia/Makassar') || 
                timezone.includes('Asia/Jayapura')) {
                return 'ID';
            }
            
            // Default to Indonesia if in Indonesia, otherwise US
            return 'ID';
        }
    },
    
    // Initialize Firebase
    async initializeFirebase() {
        try {
            // Check if Firebase is already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(this.config.firebaseConfig);
            }
            
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.showAlert('Error initializing database', 'error');
            return false;
        }
    },
    
    // Load translation data for 5 languages
    loadTranslations() {
        this.translations = {
            id: {
                // Header
                tagline: "Rasa Otentik, Sentuhan Modern.",
                view_menu: "Lihat Menu",
                order_now: "Pesan Sekarang",
                
                // Menu
                all_menu: "SEMUA MENU",
                
                // How it works
                how_it_works: "CARA PEMESANAN",
                step1: "Lihat Menu",
                step1_desc: "Jelajahi hidangan eksklusif kami",
                step2: "Tambahkan ke Keranjang",
                step2_desc: "Pilih favorit Anda",
                step3: "Pilih Metode",
                step3_desc: "Makan di tempat, Reservasi, atau Bawa pulang",
                step4: "Bayar & Checkout",
                step4_desc: "Selesaikan pembayaran & dapatkan invoice via email",
                
                // Footer
                footer_desc: "Pengalaman makan eksklusif dimana tradisi bertemu inovasi.",
                location_title: "Lokasi",
                contact_title: "Kontak & Jam Operasi",
                admin_portal: "PORTAL ADMIN",
                all_rights: "Semua hak dilindungi.",
                payment_methods: "Metode Pembayaran",
                
                // Shopping Bag
                your_selection: "PILIHAN ANDA",
                empty_bag: "Keranjang Anda kosong",
                empty_subtext: "Tambahkan beberapa item lezat untuk memulai!",
                select_method: "Pilih Metode Pesanan",
                reservation: "Reservasi",
                dinein: "Makan di Tempat",
                takeaway: "Bawa Pulang",
                subtotal: "Subtotal",
                discount: "Diskon",
                est_total: "TOTAL PERKIRAAN",
                confirm_btn: "KONFIRMASI PESANAN",
                
                // Form labels
                name: "Nama Lengkap",
                email: "Email",
                phone: "Nomor Telepon",
                date: "Tanggal",
                time: "Jam",
                people: "Jumlah Orang",
                table: "Nomor Meja",
                pickup_time: "Jam Ambil",
                notes: "Catatan Tambahan",
                
                // Form titles
                reserve_title: "Form Reservasi",
                dinein_title: "Form Makan di Tempat",
                takeaway_title: "Form Bawa Pulang",
                
                // Success/Error messages
                order_success: "Pesanan berhasil! Invoice akan dikirim ke email Anda.",
                add_success: "Ditambahkan ke keranjang",
                out_of_stock: "Stok habis",
                select_method_first: "Silakan pilih metode pesanan terlebih dahulu",
                fill_required: "Harap isi semua field yang wajib diisi",
                loading_menu: "Memuat menu..."
            },
            en: {
                // Header
                tagline: "Authentic Flavors, Modern Touch.",
                view_menu: "View Menu",
                order_now: "Order Now",
                
                // Menu
                all_menu: "ALL MENU",
                
                // How it works
                how_it_works: "HOW IT WORKS",
                step1: "Browse Menu",
                step1_desc: "Explore our exquisite dishes",
                step2: "Add to Bag",
                step2_desc: "Select your favorites",
                step3: "Choose Method",
                step3_desc: "Dine-in, Reservation, or Takeaway",
                step4: "Checkout & Pay",
                step4_desc: "Complete payment & get invoice via email",
                
                // Footer
                footer_desc: "An exquisite dining experience where tradition meets innovation.",
                location_title: "Location",
                contact_title: "Contact & Hours",
                admin_portal: "ADMIN PORTAL",
                all_rights: "All rights reserved.",
                payment_methods: "Payment Methods",
                
                // Shopping Bag
                your_selection: "YOUR SELECTION",
                empty_bag: "Your bag is empty",
                empty_subtext: "Add some delicious items to get started!",
                select_method: "Select Order Method",
                reservation: "Reservation",
                dinein: "Dine-In",
                takeaway: "Takeaway",
                subtotal: "Subtotal",
                discount: "Discount",
                est_total: "ESTIMATED TOTAL",
                confirm_btn: "CONFIRM ORDER",
                
                // Form labels
                name: "Full Name",
                email: "Email Address",
                phone: "Phone Number",
                date: "Date",
                time: "Time",
                people: "Number of People",
                table: "Table Number",
                pickup_time: "Pickup Time",
                notes: "Additional Notes",
                
                // Form titles
                reserve_title: "Reservation Form",
                dinein_title: "Dine-In Form",
                takeaway_title: "Takeaway Form",
                
                // Success/Error messages
                order_success: "Order successful! Invoice will be sent to your email.",
                add_success: "Added to bag",
                out_of_stock: "Out of stock",
                select_method_first: "Please select order method first",
                fill_required: "Please fill all required fields",
                loading_menu: "Loading menu..."
            },
            es: {
                // Header
                tagline: "Sabores Auténticos, Toque Moderno.",
                view_menu: "Ver Menú",
                order_now: "Ordenar Ahora",
                
                // Menu
                all_menu: "TODO EL MENÚ",
                
                // How it works
                how_it_works: "CÓMO FUNCIONA",
                step1: "Explorar Menú",
                step1_desc: "Descubre nuestros platos exquisitos",
                step2: "Añadir a la Bolsa",
                step2_desc: "Selecciona tus favoritos",
                step3: "Elegir Método",
                step3_desc: "Comer aquí, Reserva, o Para llevar",
                step4: "Pagar y Finalizar",
                step4_desc: "Completa el pago y recibe factura por email",
                
                // Footer
                footer_desc: "Una experiencia gastronómica exquisita donde la tradición se encuentra con la innovación.",
                location_title: "Ubicación",
                contact_title: "Contacto y Horarios",
                admin_portal: "PORTAL ADMIN",
                all_rights: "Todos los derechos reservados.",
                payment_methods: "Métodos de Pago",
                
                // Shopping Bag
                your_selection: "TU SELECCIÓN",
                empty_bag: "Tu bolsa está vacía",
                empty_subtext: "¡Añade algunos artículos deliciosos para empezar!",
                select_method: "Seleccionar Método de Pedido",
                reservation: "Reserva",
                dinein: "Comer Aquí",
                takeaway: "Para Llevar",
                subtotal: "Subtotal",
                discount: "Descuento",
                est_total: "TOTAL ESTIMADO",
                confirm_btn: "CONFIRMAR PEDIDO",
                
                // Form labels
                name: "Nombre Completo",
                email: "Correo Electrónico",
                phone: "Número de Teléfono",
                date: "Fecha",
                time: "Hora",
                people: "Número de Personas",
                table: "Número de Mesa",
                pickup_time: "Hora de Recogida",
                notes: "Notas Adicionales",
                
                // Form titles
                reserve_title: "Formulario de Reserva",
                dinein_title: "Formulario para Comer Aquí",
                takeaway_title: "Formulario Para Llevar",
                
                // Success/Error messages
                order_success: "¡Pedido exitoso! La factura se enviará a tu email.",
                add_success: "Añadido a la bolsa",
                out_of_stock: "Agotado",
                select_method_first: "Por favor selecciona un método de pedido primero",
                fill_required: "Por favor completa todos los campos requeridos",
                loading_menu: "Cargando menú..."
            },
            ar: {
                // Header
                tagline: "نكهات أصلية، لمسة عصرية.",
                view_menu: "عرض القائمة",
                order_now: "اطلب الآن",
                
                // Menu
                all_menu: "كل القائمة",
                
                // How it works
                how_it_works: "كيف تعمل",
                step1: "تصفح القائمة",
                step1_desc: "استكشف أطباقنا الفاخرة",
                step2: "أضف إلى السلة",
                step2_desc: "اختر مفضلاتك",
                step3: "اختر الطريقة",
                step3_desc: "تناول في المطعم، حجز، أو طلب خارجي",
                step4: "الدفع والإنهاء",
                step4_desc: "أكمل الدفع واحصل على الفاتورة عبر البريد الإلكتروني",
                
                // Footer
                footer_desc: "تجربة طعام فاخرة حيث يلتقي التقليد بالابتكار.",
                location_title: "الموقع",
                contact_title: "الاتصال وساعات العمل",
                admin_portal: "بوابة المشرف",
                all_rights: "جميع الحقوق محفوظة.",
                payment_methods: "طرق الدفع",
                
                // Shopping Bag
                your_selection: "اختياراتك",
                empty_bag: "سلة التسوق فارغة",
                empty_subtext: "أضف بعض العناصر اللذيذة للبدء!",
                select_method: "اختر طريقة الطلب",
                reservation: "حجز",
                dinein: "تناول في المطعم",
                takeaway: "طلب خارجي",
                subtotal: "المجموع الفرعي",
                discount: "خصم",
                est_total: "المجموع التقديري",
                confirm_btn: "تأكيد الطلب",
                
                // Form labels
                name: "الاسم الكامل",
                email: "البريد الإلكتروني",
                phone: "رقم الهاتف",
                date: "التاريخ",
                time: "الوقت",
                people: "عدد الأشخاص",
                table: "رقم الطاولة",
                pickup_time: "وقت الاستلام",
                notes: "ملاحظات إضافية",
                
                // Form titles
                reserve_title: "نموذج الحجز",
                dinein_title: "نموذج تناول في المطعم",
                takeaway_title: "نموذج طلب خارجي",
                
                // Success/Error messages
                order_success: "تم الطلب بنجاح! سيتم إرسال الفاتورة إلى بريدك الإلكتروني.",
                add_success: "تمت الإضافة إلى السلة",
                out_of_stock: "نفذت الكمية",
                select_method_first: "يرجى اختيار طريقة الطلب أولاً",
                fill_required: "يرجى ملء جميع الحقول المطلوبة",
                loading_menu: "جارٍ تحميل القائمة..."
            },
            zh: {
                // Header
                tagline: "正宗风味，现代触感。",
                view_menu: "查看菜单",
                order_now: "立即订购",
                
                // Menu
                all_menu: "全部菜单",
                
                // How it works
                how_it_works: "如何使用",
                step1: "浏览菜单",
                step1_desc: "探索我们的精美菜肴",
                step2: "添加到购物袋",
                step2_desc: "选择您的最爱",
                step3: "选择方式",
                step3_desc: "堂食、预订或外卖",
                step4: "结账付款",
                step4_desc: "完成付款并通过电子邮件获取发票",
                
                // Footer
                footer_desc: "传统与创新相遇的精致用餐体验。",
                location_title: "位置",
                contact_title: "联系方式和营业时间",
                admin_portal: "管理员门户",
                all_rights: "版权所有。",
                payment_methods: "付款方式",
                
                // Shopping Bag
                your_selection: "您的选择",
                empty_bag: "您的购物袋是空的",
                empty_subtext: "添加一些美味的物品开始吧！",
                select_method: "选择订购方式",
                reservation: "预订",
                dinein: "堂食",
                takeaway: "外卖",
                subtotal: "小计",
                discount: "折扣",
                est_total: "估计总额",
                confirm_btn: "确认订单",
                
                // Form labels
                name: "全名",
                email: "电子邮件",
                phone: "电话号码",
                date: "日期",
                time: "时间",
                people: "人数",
                table: "桌号",
                pickup_time: "取货时间",
                notes: "附加说明",
                
                // Form titles
                reserve_title: "预订表格",
                dinein_title: "堂食表格",
                takeaway_title: "外卖表格",
                
                // Success/Error messages
                order_success: "订购成功！发票将发送到您的电子邮件。",
                add_success: "已添加到购物袋",
                out_of_stock: "缺货",
                select_method_first: "请先选择订购方式",
                fill_required: "请填写所有必填字段",
                loading_menu: "正在加载菜单..."
            }
        };
    },
    
    // Update language UI with RTL support
    updateLanguage() {
        const lang = this.language;
        const t = this.translations[lang] || this.translations.id;
        
        // Set RTL for Arabic
        if (lang === 'ar') {
            document.body.setAttribute('dir', 'rtl');
            document.body.classList.remove('chinese-font');
        } else if (lang === 'zh') {
            document.body.removeAttribute('dir');
            document.body.classList.add('chinese-font');
        } else {
            document.body.removeAttribute('dir');
            document.body.classList.remove('chinese-font');
        }
        
        // Update all translatable elements
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (t[key]) {
                el.textContent = t[key];
            }
        });
        
        // Update tax and service labels
        const taxLabel = document.getElementById('taxLabel');
        const serviceLabel = document.getElementById('serviceLabel');
        
        if (taxLabel && serviceLabel) {
            taxLabel.textContent = `${this.config.TAX_NAME} (${this.config.TAX_PERCENTAGE}%)`;
            serviceLabel.textContent = `${this.config.SERVICE_FEE_NAME} (${this.config.SERVICE_FEE_PERCENTAGE}%)`;
        }
        
        // Update bag if exists
        if (this.bag.length > 0) {
            this.updateBagUI();
        }
        
        // Update language switcher active state
        this.updateLangSwitcher();
        
        // Show auto-detect badge
        this.showAutoDetectBadge();
    },
    
    // Update language switcher active state
    updateLangSwitcher() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const btnLang = btn.getAttribute('data-lang');
            btn.classList.toggle('active', btnLang === this.language);
        });
    },
    
    // Show auto-detect badge
    showAutoDetectBadge() {
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            // Remove any existing badge
            const existingBadge = btn.querySelector('.auto-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
        });
    },
    
    // Switch language (manual override)
    switchLanguage(lang) {
        this.language = lang;
        localStorage.setItem('lang', lang); // Save user preference
        this.updateLanguage();
        
        // Show message based on language
        const langNames = {
            'id': 'Indonesia',
            'en': 'English',
            'es': 'Español',
            'ar': 'العربية',
            'zh': '中文'
        };
        
        this.showAlert(`${lang === 'id' ? 'Bahasa diganti ke' : 'Language changed to'} ${langNames[lang]}`, 'success');
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Language switcher
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                this.switchLanguage(lang);
            });
        });
        
        // Order now button
        document.querySelector('.hero-buttons .gold')?.addEventListener('click', () => {
            this.toggleBag();
        });
        
        // Escape key to close bag
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeBag();
            }
        });
        
        // Initialize method buttons
        this.initMethodButtons();
    },
    
    // Initialize method buttons
    initMethodButtons() {
        const methodButtons = document.querySelectorAll('.method-btn');
        methodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = e.currentTarget.getAttribute('data-method');
                this.selectMethod(method);
            });
        });
    },
    
    // Show loading menu
    showLoadingMenu() {
        const grid = document.getElementById('menuGrid');
        if (!grid) return;
        
        const t = this.translations[this.language];
        
        grid.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>${t.loading_menu || 'Loading menu...'}</p>
            </div>
        `;
        
        // Show empty categories
        this.renderCategories();
    },
    
    // Render categories
    renderCategories() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;
        
        const t = this.translations[this.language];
        
        // Start with "All" button
        let html = `<button class="cat-btn active" onclick="RestaurantApp.renderMenu('all')">${t.all_menu}</button>`;
        
        // Add category buttons
        this.categories.forEach(category => {
            html += `<button class="cat-btn" onclick="RestaurantApp.renderMenu('${category}')">${category.toUpperCase()}</button>`;
        });
        
        container.innerHTML = html;
    },
    
    // Load menu from Firebase
    async loadMenuFromFirebase() {
        try {
            this.showLoadingMenu();
            
            // Get menu items from Firebase
            const menuSnapshot = await this.db.collection('menu')
                .where('active', '==', true)
                .get();
            
            this.menu = [];
            const categoriesSet = new Set(['all']);
            
            menuSnapshot.forEach(doc => {
                const item = {
                    id: doc.id,
                    ...doc.data()
                };
                this.menu.push(item);
                
                // Add category to set
                if (item.category) {
                    categoriesSet.add(item.category.toLowerCase());
                }
            });
            
            // Convert Set to Array
            this.categories = Array.from(categoriesSet).filter(cat => cat !== 'all');
            
            if (this.menu.length > 0) {
                this.renderCategories();
                this.renderMenu('all');
                this.showAlert(`Menu loaded: ${this.menu.length} items`, 'success');
            } else {
                this.showAlert('Menu is empty', 'info');
                this.renderEmptyMenu();
            }
        } catch (error) {
            console.error('Error loading menu:', error);
            this.showAlert('Failed to load menu: ' + error.message, 'error');
            this.renderEmptyMenu();
        }
    },
    
    // Render menu based on category
    renderMenu(category) {
        const grid = document.getElementById('menuGrid');
        if (!grid) return;
        
        // Update active category button
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event?.target.classList.add('active');
        
        // Filter menu items by category
        let filteredMenu = this.menu;
        if (category !== 'all') {
            filteredMenu = this.menu.filter(item => 
                item.category && item.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        if (filteredMenu.length === 0) {
            grid.innerHTML = `
                <div class="empty-menu">
                    <i class="fas fa-utensils"></i>
                    <h3>No items in this category</h3>
                    <p>Try selecting a different category</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = filteredMenu.map(item => {
            const hasDiscount = item.discount && item.discount > 0;
            const discountType = item.discountType || 'percentage';
            const discountValue = item.discount || 0;
            
            let finalPrice = item.price;
            let discountText = '';
            
            if (hasDiscount) {
                if (discountType === 'percentage') {
                    finalPrice = item.price - (item.price * discountValue / 100);
                    discountText = `${discountValue}% OFF`;
                } else {
                    finalPrice = item.price - discountValue;
                    discountText = `Rp ${discountValue.toLocaleString('id-ID')} OFF`;
                }
            }
            
            return `
                <div class="menu-card">
                    ${hasDiscount ? `<div class="discount-badge">${discountText}</div>` : ''}
                    <img src="${item.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38'}" 
                         alt="${item.name}" 
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1565299624946-b28f40a0ae38'">
                    <div class="menu-card-content">
                        <h3>${item.name}</h3>
                        <p>${item.description || 'Delicious dish'}</p>
                        <div class="menu-card-footer">
                            <div class="price-container">
                                ${hasDiscount ? `
                                    <div class="original-price">Rp ${parseInt(item.price || 0).toLocaleString('id-ID')}</div>
                                    <div class="discounted-price">Rp ${parseInt(finalPrice).toLocaleString('id-ID')}</div>
                                ` : `
                                    <div class="regular-price">Rp ${parseInt(item.price || 0).toLocaleString('id-ID')}</div>
                                `}
                            </div>
                            <button class="add-btn" onclick="RestaurantApp.addToBag('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price || 0}, ${discountValue}, '${discountType}')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // Render empty menu
    renderEmptyMenu() {
        const grid = document.getElementById('menuGrid');
        if (!grid) return;
        
        grid.innerHTML = `
            <div class="empty-menu">
                <i class="fas fa-utensils"></i>
                <h3>Menu is empty</h3>
                <p>Admin can add menu items through Admin Portal</p>
            </div>
        `;
    },
    
    // Bag Management
    toggleBag() {
        const sidebar = document.querySelector('.bag-sidebar');
        const overlay = document.querySelector('.bag-overlay');
        
        if (sidebar.classList.contains('active')) {
            this.closeBag();
        } else {
            this.openBag();
        }
    },
    
    openBag() {
        const sidebar = document.querySelector('.bag-sidebar');
        const overlay = document.querySelector('.bag-overlay');
        
        sidebar.classList.add('active');
        overlay.style.display = 'block';
        this.updateBagUI();
    },
    
    closeBag() {
        const sidebar = document.querySelector('.bag-sidebar');
        const overlay = document.querySelector('.bag-overlay');
        
        sidebar.classList.remove('active');
        overlay.style.display = 'none';
    },
    
    // Add to bag with item data including discount
    addToBag(itemId, name, price, discount = 0, discountType = 'percentage') {
        const existingItem = this.bag.find(item => item.id === itemId);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.bag.push({
                id: itemId,
                name: name,
                price: parseInt(price),
                discount: parseFloat(discount),
                discountType: discountType,
                quantity: 1
            });
        }
        
        this.updateBagUI();
        this.showAlert(this.translations[this.language].add_success, 'success');
    },
    
    // Remove item from bag
    removeFromBag(itemId) {
        const index = this.bag.findIndex(item => item.id === itemId);
        if (index > -1) {
            this.bag.splice(index, 1);
            this.updateBagUI();
        }
    },
    
    // Update quantity
    updateQuantity(itemId, change) {
        const item = this.bag.find(item => item.id === itemId);
        if (!item) return;
        
        item.quantity += change;
        
        if (item.quantity <= 0) {
            this.removeFromBag(itemId);
            return;
        }
        
        this.updateBagUI();
    },
    
    // Calculate item final price with discount
    calculateItemPrice(item) {
        let finalPrice = item.price;
        
        if (item.discount && item.discount > 0) {
            if (item.discountType === 'percentage') {
                finalPrice = item.price - (item.price * item.discount / 100);
            } else {
                finalPrice = item.price - item.discount;
            }
        }
        
        return finalPrice;
    },
    
    // Calculate bag totals
    calculateBagTotals() {
        let subtotal = 0;
        let totalDiscount = 0;
        
        this.bag.forEach(item => {
            const itemPrice = this.calculateItemPrice(item);
            const itemTotal = itemPrice * item.quantity;
            subtotal += itemTotal;
            
            // Calculate discount amount
            if (item.discount && item.discount > 0) {
                let discountAmount = 0;
                if (item.discountType === 'percentage') {
                    discountAmount = item.price * item.discount / 100;
                } else {
                    discountAmount = item.discount;
                }
                totalDiscount += discountAmount * item.quantity;
            }
        });
        
        const taxAmount = subtotal * (this.config.TAX_PERCENTAGE / 100);
        const serviceFeeAmount = subtotal * (this.config.SERVICE_FEE_PERCENTAGE / 100);
        const total = subtotal + taxAmount + serviceFeeAmount;
        
        return {
            subtotal: subtotal,
            discount: totalDiscount,
            tax: taxAmount,
            serviceFee: serviceFeeAmount,
            total: total
        };
    },
    
    // Update bag UI
    updateBagUI() {
        const bagList = document.getElementById('bagList');
        const bagCount = document.getElementById('bagCount');
        const bagSummary = document.getElementById('bagSummary');
        const checkoutForm = document.getElementById('checkoutForm');
        const checkoutButton = document.getElementById('checkoutButton');
        
        if (!bagList || !bagCount || !bagSummary) return;
        
        // Update count
        const totalItems = this.bag.reduce((sum, item) => sum + item.quantity, 0);
        bagCount.textContent = totalItems;
        
        // Empty bag
        if (this.bag.length === 0) {
            this.renderEmptyBag();
            bagSummary.style.display = 'none';
            if (checkoutForm) checkoutForm.style.display = 'none';
            checkoutButton.disabled = true;
            return;
        }
        
        // Render items
        bagList.innerHTML = '';
        
        this.bag.forEach(item => {
            const itemPrice = this.calculateItemPrice(item);
            const itemTotal = itemPrice * item.quantity;
            
            bagList.innerHTML += `
                <div class="bag-item">
                    <div class="bag-item-info">
                        <div class="bag-item-name">${item.name}</div>
                        <div class="bag-item-price">
                            ${item.discount && item.discount > 0 ? `
                                <div style="text-decoration: line-through; color: var(--gray-light); font-size: 0.8rem;">
                                    Rp ${item.price.toLocaleString('id-ID')} × ${item.quantity}
                                </div>
                                <div>
                                    Rp ${itemPrice.toLocaleString('id-ID')} × ${item.quantity}
                                </div>
                            ` : `
                                Rp ${item.price.toLocaleString('id-ID')} × ${item.quantity}
                            `}
                        </div>
                        <div class="bag-item-total">Subtotal: Rp ${itemTotal.toLocaleString('id-ID')}</div>
                    </div>
                    <div class="bag-item-controls">
                        <button class="qty-btn minus" onclick="RestaurantApp.updateQuantity('${item.id}', -1)">-</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn plus" onclick="RestaurantApp.updateQuantity('${item.id}', 1)">+</button>
                        <button class="remove-btn" onclick="RestaurantApp.removeFromBag('${item.id}')" title="Remove">×</button>
                    </div>
                </div>
            `;
        });
        
        // Calculate and update summary
        const totals = this.calculateBagTotals();
        
        document.getElementById('subtotalPrice').textContent = `Rp ${totals.subtotal.toLocaleString('id-ID')}`;
        
        // Show/hide discount row
        const discountRow = document.getElementById('discountRow');
        if (totals.discount > 0) {
            discountRow.style.display = 'flex';
            document.getElementById('discountAmount').textContent = `-Rp ${totals.discount.toLocaleString('id-ID')}`;
        } else {
            discountRow.style.display = 'none';
        }
        
        document.getElementById('taxAmount').textContent = `Rp ${totals.tax.toLocaleString('id-ID')}`;
        document.getElementById('serviceAmount').textContent = `Rp ${totals.serviceFee.toLocaleString('id-ID')}`;
        document.getElementById('totalPrice').textContent = `Rp ${totals.total.toLocaleString('id-ID')}`;
        
        // Show summary and checkout form
        bagSummary.style.display = 'block';
        if (checkoutForm) checkoutForm.style.display = 'block';
        checkoutButton.disabled = false;
    },
    
    // Render empty bag
    renderEmptyBag() {
        const bagList = document.getElementById('bagList');
        const t = this.translations[this.language];
        
        bagList.innerHTML = `
            <div class="empty-bag">
                <i class="fas fa-shopping-bag"></i>
                <p>${t.empty_bag}</p>
                <p class="empty-subtext">${t.empty_subtext}</p>
            </div>
        `;
        
        document.getElementById('bagCount').textContent = '0';
    },
    
    // Select order method
    selectMethod(method) {
        this.orderMethod = method;
        
        // Update UI
        document.querySelectorAll('.method-btn').forEach(btn => {
            const btnMethod = btn.getAttribute('data-method');
            btn.classList.toggle('active', btnMethod === method);
        });
        
        // Render form
        this.renderForm(method);
    },
    
    // Render form based on method
    renderForm(method) {
        const formContainer = document.getElementById('dynamicForm');
        if (!formContainer) return;
        
        const t = this.translations[this.language];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        let formHTML = '';
        
        switch(method) {
            case 'reservation':
                formHTML = `
                    <div class="form-title">
                        <i class="fas fa-calendar-check"></i>
                        <span>${t.reserve_title}</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.name} *</label>
                        <input type="text" class="form-input" id="customerName" placeholder="${t.name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.email} *</label>
                        <input type="email" class="form-input" id="customerEmail" placeholder="email@example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.phone}</label>
                        <input type="tel" class="form-input" id="customerPhone" placeholder="${t.phone}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">${t.date} *</label>
                            <input type="date" class="form-input" id="reservationDate" required min="${tomorrowStr}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">${t.time} *</label>
                            <select class="form-input" id="reservationTime" required>
                                <option value="">${t.time}</option>
                                <option value="18:00">18:00</option>
                                <option value="18:30">18:30</option>
                                <option value="19:00">19:00</option>
                                <option value="19:30">19:30</option>
                                <option value="20:00">20:00</option>
                                <option value="20:30">20:30</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.people} *</label>
                        <select class="form-input" id="peopleCount" required>
                            <option value="1">1 ${t.people}</option>
                            <option value="2" selected>2 ${t.people}</option>
                            <option value="3">3 ${t.people}</option>
                            <option value="4">4 ${t.people}</option>
                            <option value="5">5 ${t.people}</option>
                            <option value="6">6 ${t.people}</option>
                            <option value="7">7 ${t.people}</option>
                            <option value="8">8 ${t.people}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.notes}</label>
                        <textarea class="form-input" id="customerNotes" placeholder="${t.notes}" rows="3"></textarea>
                    </div>
                `;
                break;
                
            case 'dinein':
                formHTML = `
                    <div class="form-title">
                        <i class="fas fa-utensils"></i>
                        <span>${t.dinein_title}</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.name} *</label>
                        <input type="text" class="form-input" id="customerName" placeholder="${t.name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.email} *</label>
                        <input type="email" class="form-input" id="customerEmail" placeholder="email@example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.table}</label>
                        <input type="text" class="form-input" id="tableNumber" placeholder="${t.table}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.notes}</label>
                        <textarea class="form-input" id="customerNotes" placeholder="${t.notes}" rows="3"></textarea>
                    </div>
                `;
                break;
                
            case 'takeaway':
                formHTML = `
                    <div class="form-title">
                        <i class="fas fa-shopping-bag"></i>
                        <span>${t.takeaway_title}</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.name} *</label>
                        <input type="text" class="form-input" id="customerName" placeholder="${t.name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.email} *</label>
                        <input type="email" class="form-input" id="customerEmail" placeholder="email@example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.pickup_time} *</label>
                        <input type="datetime-local" class="form-input" id="pickupTime" required min="${new Date().toISOString().slice(0, 16)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t.notes}</label>
                        <textarea class="form-input" id="customerNotes" placeholder="${t.notes}" rows="3"></textarea>
                    </div>
                `;
                break;
        }
        
        formContainer.innerHTML = formHTML;
        
        // Set default values
        if (method === 'reservation') {
            document.getElementById('reservationDate').value = tomorrowStr;
            document.getElementById('reservationTime').value = '19:00';
        }
    },
    
    // Process checkout
    async processCheckout() {
        const t = this.translations[this.language];
        
        // Validation
        if (this.bag.length === 0) {
            this.showAlert(t.empty_bag, 'error');
            return;
        }
        
        if (!this.orderMethod) {
            this.showAlert(t.select_method_first, 'error');
            return;
        }
        
        // Get form data
        const formData = this.getFormData();
        if (!formData) return;
        
        // Calculate totals
        const totals = this.calculateBagTotals();
        
        // Prepare order data for Firebase
        const orderData = {
            items: this.bag.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                discount: item.discount,
                discountType: item.discountType,
                quantity: item.quantity
            })),
            subtotal: totals.subtotal,
            discount: totals.discount,
            tax: totals.tax,
            serviceFee: totals.serviceFee,
            total: totals.total,
            method: this.orderMethod,
            customer: formData,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            orderNumber: this.generateOrderNumber(),
            language: this.language
        };
        
        try {
            // Save order to Firebase
            const orderRef = await this.db.collection('orders').add(orderData);
            
            // Show success message
            this.showAlert(t.order_success, 'success');
            
            // Reset
            this.resetAfterOrder();
            
        } catch (error) {
            console.error('Error saving order:', error);
            this.showAlert('Failed to save order: ' + error.message, 'error');
        }
    },
    
    // Generate order number
    generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `GB${year}${month}${day}${random}`;
    },
    
    // Get form data
    getFormData() {
        const t = this.translations[this.language];
        
        const name = document.getElementById('customerName')?.value?.trim();
        const email = document.getElementById('customerEmail')?.value?.trim();
        
        if (!name || !email) {
            this.showAlert(t.fill_required, 'error');
            return null;
        }
        
        // Basic email validation
        if (!email.includes('@') || !email.includes('.')) {
            this.showAlert('Email tidak valid', 'error');
            return null;
        }
        
        const data = {
            name: name,
            email: email,
            phone: document.getElementById('customerPhone')?.value?.trim() || '',
            notes: document.getElementById('customerNotes')?.value?.trim() || ''
        };
        
        // Add method-specific data
        switch(this.orderMethod) {
            case 'reservation':
                data.date = document.getElementById('reservationDate')?.value;
                data.time = document.getElementById('reservationTime')?.value;
                data.people = document.getElementById('peopleCount')?.value;
                break;
            case 'dinein':
                data.table = document.getElementById('tableNumber')?.value?.trim() || '';
                break;
            case 'takeaway':
                data.pickupTime = document.getElementById('pickupTime')?.value;
                break;
        }
        
        return data;
    },
    
    // Reset after order
    resetAfterOrder() {
        this.bag = [];
        this.orderMethod = null;
        this.updateBagUI();
        this.closeBag();
        
        // Reset form
        const formContainer = document.getElementById('dynamicForm');
        if (formContainer) formContainer.innerHTML = '';
        
        // Reset method buttons
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    },
    
    // Show alert
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="alert-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }
};

// Global functions
function scrollToMenu() {
    document.querySelector('.categories')?.scrollIntoView({ behavior: 'smooth' });
}

function toggleBag() {
    RestaurantApp.toggleBag();
}

function selectMethod(method) {
    RestaurantApp.selectMethod(method);
}

function processCheckout() {
    RestaurantApp.processCheckout();
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Load Chinese font for Chinese language
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Load Firebase SDK
    const firebaseScript = document.createElement('script');
    firebaseScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
    firebaseScript.onload = () => {
        // Load Firestore SDK
        const firestoreScript = document.createElement('script');
        firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
        firestoreScript.onload = () => {
            // Initialize the app
            RestaurantApp.init();
        };
        document.head.appendChild(firestoreScript);
    };
    document.head.appendChild(firebaseScript);
});
