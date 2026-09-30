import { Booking, Language, LocalizedText, Room, BeachService } from '../types/resort';

export const UI_TEXT = {
  uz: {
    // Navbar
    navHome: 'Home',
    navRooms: 'Xonalar',
    navServices: 'Xizmatlar',
    navAbout: 'Biz haqimizda',
    navGallery: 'Galereya',
    navContact: 'Aloqa',
    loginBtn: 'Kirish',
    registerBtn: 'Ro‘yxatdan o‘tish',
    dashboardBtn: 'Kabinet',
    logoutBtn: 'Chiqish',
    adminPortalBtn: 'Admin panel',
    receptionPortalBtn: 'Resepshn paneli',
    customerPortalBtn: 'Shaxsiy kabinet',

    // Hero
    heroKicker: 'Xalqaro Dabdabali Sohil Kurorti · 5 Yulduzli Xizmat',
    heroTitle: 'Dam olishni hozirdan boshlang',
    heroSubtitle:
      'BEACH — dengiz bo‘yidagi unutilmas dam olish, qulay xonalar va ajoyib sarguzashtlar maskani.',
    bookRoomBtn: 'Xona bron qilish',
    viewServicesBtn: 'Xizmatlarni ko‘rish',

    // Search bar
    checkIn: 'Kirish sanasi',
    checkOut: 'Chiqish sanasi',
    guests: 'Mehmonlar',
    roomType: 'Xona turi',
    allRooms: 'Barcha xonalar',
    searchBtn: 'Qidirish',
    guestsUnit: 'nafar',
    nightUnit: 'tun',

    // Rooms section
    roomsKicker: 'Dengiz Manzarali Turar Joylar',
    roomsTitle: 'Mukammal Qulaylikdagi Xonalar va Villalar',
    roomsSubtitle:
      'Har bir xona tabiiy yog‘och, travertin tosh va bepoyon moviy dengiz manzarasi bilan jihozlangan.',
    perNight: '/ tun',
    detailsBtn: 'Batafsil',
    bookNowBtn: 'Bron qilish',
    availableLabel: 'Mavjud',
    unavailableLabel: 'Band',
    wifiLabel: 'Yuqori tezlikdagi Wi-Fi',
    acLabel: 'Iqlim nazorati (AC)',
    bathroomLabel: 'Shaxsiy hammom',
    seaViewLabel: 'Dengiz manzarasi',
    priceCalcTitle: 'Narx kalkulyatori',
    nightsCount: 'Tunlar soni',
    roomPriceLabel: 'Xona narxi',
    extraServicesLabel: 'Qo‘shimcha xizmatlar',
    totalPriceLabel: 'Jami summa',

    // Services section
    servicesKicker: 'Sohil va Dengiz Sarguzashtlari',
    servicesTitle: 'Plyaj Xizmatlari va Suv Ko‘ngilochar Maskani',
    servicesSubtitle:
      'Sohil bo‘yidagi shaxsiy tapchanlardan tortib tezyurar yaxta va suv skuterlarigacha — barchasini broningizga qo‘shing.',
    addServiceToBooking: 'Bronga qo‘shish',
    serviceAdded: 'Tanlandi',
    durationLabel: 'Davomiyligi',

    // About & Proof section
    aboutKicker: 'BEACH Kurorti Haqida',
    aboutTitle: 'Tabiat va Zamonaviy Arxitekturaning Uyg‘unligi',
    aboutBody:
      'BEACH kurorti 1.4 kilometrlik shaxsiy oq qumli sohil, maxsus gastronomik restoranlar, shaxsiy pristan va 24/7 konsyerj xizmatini taqdim etadi.',
    statCoastline: '1.4 km Shaxsiy Oq Qumli Sohil',
    statSatisfaction: 'Yuqori Darajadagi Sohil Xizmati',
    statConcierge: '24/7 Shaxsiy Resepshn va Konsyerj',
    statVillas: 'Panoramali Xonalar va VIP Villalar',

    // Gallery section
    galleryKicker: 'Fotogalereya',
    galleryTitle: 'Sohil Atmosferasi va Kurort Hayoti',
    gallerySubtitle: 'Quyosh botishi, moviy to‘lqinlar va mehmondo‘stlik lahzalari.',

    // Contact section
    contactKicker: 'Biz Bilan Bog‘lanish',
    contactTitle: 'Resepshn va Konsyerj Xizmati',
    contactSubtitle:
      'Savollaringiz bormi yoki maxsus tadbir rejalashtiryapsizmi? Bizning resepshn jamoamiz tez fursatda javob beradi.',
    yourName: 'To‘liq ismingiz',
    yourEmail: 'Email manzilingiz',
    yourPhone: 'Telefon raqamingiz',
    subjectLabel: 'Mavzu',
    messageLabel: 'Xabar matni',
    sendMessageBtn: 'Xabar yuborish',

    // Booking Wizard (6 Steps)
    wizardTitle: 'Xona va Xizmatlarni Bron Qilish',
    step1: '1. Xona tanlash',
    step2: '2. Sanalar',
    step3: '3. Mehmonlar',
    step4: '4. Xizmatlar',
    step5: '5. Ma’lumotlar',
    step6: '6. Tasdiqlash',
    nextStep: 'Keyingi qadam',
    prevStep: 'Orqaga',
    confirmBookingBtn: 'Bronni tasdiqlash',
    bookingSummary: 'Bron ma’lumotlari xulosasi',
    bookingIdLabel: 'Bron ID',
    guestNameLabel: 'Mehmon ismi',
    selectedRoomLabel: 'Tanlangan xona',
    selectedServicesLabel: 'Tanlangan xizmatlar',
    bookingStatusLabel: 'Bron holati',
    paymentStatusLabel: 'To‘lov holati',
    specialRequestsLabel: 'Maxsus istaklar (ixtiyoriy)',
    noExtraServices: 'Qo‘shimcha xizmat tanlanmagan',

    // Required exact UX notifications & messages
    msgBookingCreated: 'Bron muvaffaqiyatli yaratildi.',
    msgBookingConfirmed: 'Broningiz tasdiqlandi.',
    msgBookingCancelled: 'Bron bekor qilindi.',
    msgBookingRejected: 'Bron rad etildi.',
    msgRoomUnavailable: 'Bu xona tanlangan sanalarda band.',
    msgEmailSent: 'Xabar muvaffaqiyatli yuborildi.',
    msgDataSaved: "Ma'lumotlar muvaffaqiyatli saqlandi.",
    notifNewBooking: 'Yangi bron so‘rovi tushdi.',
    notifBookingConfirmed: 'Broningiz tasdiqlandi.',
    notifBookingCancelled: 'Bron bekor qilindi.',
    notifGuestCheckIn: 'Mehmon check-in qildi.',
    notifGuestCheckOut: 'Mehmon check-out qildi.',
    notifNewMessage: 'Yangi xabar keldi.',
    noBookingsYet: 'Bronlar hozircha mavjud emas. (Бронлар ҳозирча мавжуд эмас.)',

    // Authentication
    authSplitQuote:
      '“Dengiz nafasi, sokin to‘lqinlar va mukammal xizmat — har bir kuningiz unutilmas xotiraga aylanadi.”',
    loginTitle: 'Hisobga kirish',
    registerTitle: 'Yangi hisob yaratish',
    adminLoginTitle: 'Boshqaruv tizimiga kirish',
    passwordLabel: 'Parol',
    confirmPasswordLabel: 'Parolni tasdiqlang',
    showPassword: 'Parolni ko‘rsatish',
    rememberMe: 'Eslab qolish',
    forgotPassword: 'Parolni unutdingizmi?',
    backToSite: 'Asosiy saytga qaytish',

    // Customer Dashboard Sidebar
    custDash: 'Dashboard',
    custMyBookings: 'Mening bronlarim',
    custMyRooms: 'Xonalarim',
    custMyServices: 'Xizmatlarim',
    custMessages: 'Xabarlar',
    custNotifications: 'Bildirishnomalar',
    custProfile: 'Profil',
    custSettings: 'Sozlamalar',
    upcomingBookings: 'Kelgusi bronlar',
    currentBooking: 'Joriy bron',
    previousBookings: 'Oldingi bronlar',
    cancelBookingBtn: 'Bronni bekor qilish',
    contactReceptionBtn: 'Resepshn bilan aloqa',
    saveProfileBtn: 'Profilni saqlash',

    // Reception Dashboard Sidebar & Stats
    recDash: 'Dashboard',
    recBookings: 'Bronlar',
    recGuests: 'Mehmonlar',
    recRooms: 'Xonalar',
    recServices: 'Xizmatlar',
    recMessages: 'Xabarlar (Email)',
    recCheckIn: 'Check-in',
    recCheckOut: 'Check-out',
    recNotifications: 'Bildirishnomalar',
    recProfile: 'Profil',
    statNewBookings: 'Yangi bronlar',
    statTodayArrivals: 'Bugungi kelishlar',
    statTodayDepartures: 'Bugungi ketishlar',
    statAvailableRooms: 'Bo‘sh xonalar',
    statOccupiedRooms: 'Band xonalar',
    statPendingBookings: 'Kutilayotgan bronlar',

    // Reception Email System
    emailCatNew: 'Yangi bronlar',
    emailCatQuestions: 'Mijoz savollari',
    emailCatConfirmed: 'Tasdiqlangan',
    emailCatCancelled: 'Bekor qilingan',
    emailCatCompleted: 'Yakunlangan',
    replyBtn: 'Javob yozish',
    confirmBtn: 'Bronni tasdiqlash',
    rejectBtn: 'Rad etish',
    markAsReadBtn: 'O‘qilgan deb belgilash',
    sendCheckInInfoBtn: 'Check-in ma’lumotini yuborish',
    sendCheckOutInfoBtn: 'Check-out ma’lumotini yuborish',
    sendBookingInfoBtn: 'Bron tafsilotini yuborish',
    composeCustomBtn: 'Yangi xat yozish',

    // Room Physical Statuses
    statusAVAILABLE: 'AVAILABLE (Bo‘sh)',
    statusRESERVED: 'RESERVED (Band qilingan)',
    statusOCCUPIED: 'OCCUPIED (Mehmon bor)',
    statusCLEANING: 'CLEANING (Tozalanmoqda)',
    statusMAINTENANCE: 'MAINTENANCE (Ta’mirda)',
    assignRoomBtn: 'Xona biriktirish',
    changeStatusBtn: 'Holatni o‘zgartirish',
    checkInActionBtn: 'Check-in qilish',
    checkOutActionBtn: 'Check-out qilish',

    // Admin Dashboard Sidebar
    admDash: 'Dashboard',
    admRooms: 'Xonalar (Rooms)',
    admServices: 'Xizmatlar (Services)',
    admBookings: 'Bronlar (Bookings)',
    admCustomers: 'Mijozlar (Customers)',
    admReception: 'Resepshn (Reception)',
    admPayments: 'To‘lovlar (Payments)',
    admReports: 'Hisobotlar (Reports)',
    admSettings: 'Sozlamalar (Settings)',
    addRoomBtn: '+ Yangi xona qo‘shish',
    addServiceBtn: '+ Yangi xizmat qo‘shish',
    addReceptionBtn: '+ Resepshn xodimi qo‘shish',
    totalRevenue: 'Haqiqiy daromad',
    popularServices: 'Bron qilingan xizmatlar statistikasi',
    securityBannerTitle: 'Xavfsizlik eslatmasi: Hisob parolini yangilang',
    securityBannerDesc:
      'Xavfsizlikni ta’minlash uchun Sozlamalar bo‘limida yangi shaxsiy parol o‘rnatish tavsiya etiladi.',
  },
  ru: {
    // Navbar
    navHome: 'Главная',
    navRooms: 'Номера',
    navServices: 'Услуги',
    navAbout: 'О курорте',
    navGallery: 'Галерея',
    navContact: 'Контакты',
    loginBtn: 'Войти',
    registerBtn: 'Регистрация',
    dashboardBtn: 'Кабинет',
    logoutBtn: 'Выйти',
    adminPortalBtn: 'Админ панель',
    receptionPortalBtn: 'Панель ресепшн',
    customerPortalBtn: 'Личный кабинет',

    // Hero
    heroKicker: 'Международный Пляжный Курорт Люкс · 5 Звезд',
    heroTitle: 'Начните свой идеальный отдых уже сейчас',
    heroSubtitle:
      'BEACH — место незабываемого отдыха у моря, роскошных номеров и ярких морских приключений.',
    bookRoomBtn: 'Забронировать номер',
    viewServicesBtn: 'Смотреть услуги',

    // Search bar
    checkIn: 'Заезд',
    checkOut: 'Выезд',
    guests: 'Гости',
    roomType: 'Тип номера',
    allRooms: 'Все категории',
    searchBtn: 'Найти',
    guestsUnit: 'чел.',
    nightUnit: 'ноч.',

    // Rooms section
    roomsKicker: 'Резиденции с Видом на Океан',
    roomsTitle: 'Номера и Приватные Виллы Премиум-Класса',
    roomsSubtitle:
      'Каждый номер оформлен натуральным тиковым деревом, травертином и панорамными террасами с видом на море.',
    perNight: '/ ночь',
    detailsBtn: 'Подробнее',
    bookNowBtn: 'Забронировать',
    availableLabel: 'Доступно',
    unavailableLabel: 'Занято',
    wifiLabel: 'Скоростной Wi-Fi',
    acLabel: 'Климат-контроль (AC)',
    bathroomLabel: 'Приватная ванная',
    seaViewLabel: 'Вид на море',
    priceCalcTitle: 'Калькулятор стоимости',
    nightsCount: 'Количество ночей',
    roomPriceLabel: 'Стоимость номера',
    extraServicesLabel: 'Дополнительные услуги',
    totalPriceLabel: 'Итоговая сумма',

    // Services section
    servicesKicker: 'Пляжный Отдых и Водный Спорт',
    servicesTitle: 'Пляжные Сервисы и Морские Развлечения',
    servicesSubtitle:
      'От приватных пляжных тапчанов до скоростных катеров и гидроциклов — добавьте впечатления к вашему бронированию.',
    addServiceToBooking: 'Добавить к брони',
    serviceAdded: 'Выбрано',
    durationLabel: 'Длительность',

    // About & Proof section
    aboutKicker: 'О Курорте BEACH',
    aboutTitle: 'Гармония Природы и Современной Архитектуры',
    aboutBody:
      'Курорт BEACH предлагает 1.4 км частного белоснежного пляжа, авторские рестораны, собственный причал и круглосуточный консьерж-сервис.',
    statCoastline: '1.4 км Частного Пляжа',
    statSatisfaction: 'Премиальный Пляжный Сервис',
    statConcierge: '24/7 Персональный Ресепшн и Консьерж',
    statVillas: 'Панорамные Номера и VIP Виллы',

    // Gallery section
    galleryKicker: 'Фотогалерея',
    galleryTitle: 'Атмосфера Побережья и Жизнь Курорта',
    gallerySubtitle: 'Золотые закаты, бирюзовые волны и безупречное гостеприимство.',

    // Contact section
    contactKicker: 'Связаться с Нами',
    contactTitle: 'Служба Ресепшн и Консьерж',
    contactSubtitle:
      'Есть вопросы или планируете особое событие? Служба ресепшн оперативно ответит вам.',
    yourName: 'Ваше полное имя',
    yourEmail: 'Ваш Email',
    yourPhone: 'Номер телефона',
    subjectLabel: 'Тема обращения',
    messageLabel: 'Текст сообщения',
    sendMessageBtn: 'Отправить сообщение',

    // Booking Wizard (6 Steps)
    wizardTitle: 'Бронирование Номера и Услуг',
    step1: '1. Выбор номера',
    step2: '2. Даты',
    step3: '3. Гости',
    step4: '4. Услуги',
    step5: '5. Данные гостя',
    step6: '6. Подтверждение',
    nextStep: 'Далее',
    prevStep: 'Назад',
    confirmBookingBtn: 'Подтвердить бронь',
    bookingSummary: 'Сводка бронирования',
    bookingIdLabel: 'ID бронирования',
    guestNameLabel: 'Имя гостя',
    selectedRoomLabel: 'Выбранный номер',
    selectedServicesLabel: 'Выбранные услуги',
    bookingStatusLabel: 'Статус брони',
    paymentStatusLabel: 'Статус оплаты',
    specialRequestsLabel: 'Особые пожелания (необязательно)',
    noExtraServices: 'Дополнительные услуги не выбраны',

    // UX messages
    msgBookingCreated: 'Бронирование успешно создано.',
    msgBookingConfirmed: 'Ваше бронирование подтверждено.',
    msgBookingCancelled: 'Бронирование отменено.',
    msgBookingRejected: 'Бронирование отклонено.',
    msgRoomUnavailable: 'Bu xona tanlangan sanalarda band. (Этот номер занят на выбранные даты.)',
    msgEmailSent: 'Сообщение успешно отправлено.',
    msgDataSaved: 'Данные успешно сохранены.',
    notifNewBooking: 'Поступил новый запрос на бронирование.',
    notifBookingConfirmed: 'Бронирование подтверждено.',
    notifBookingCancelled: 'Бронирование отменено.',
    notifGuestCheckIn: 'Гость выполнил check-in.',
    notifGuestCheckOut: 'Гость выполнил check-out.',
    notifNewMessage: 'Получено новое сообщение.',
    noBookingsYet: 'Бронлар ҳозирча мавжуд эмас. (Бронирований пока нет.)',

    // Authentication
    authSplitQuote:
      '«Морской бриз, ласковые волны и безупречный сервис — каждый день здесь становится незабываемым.»',
    loginTitle: 'Вход в аккаунт',
    registerTitle: 'Регистрация аккаунта',
    adminLoginTitle: 'Вход в систему управления',
    passwordLabel: 'Пароль',
    confirmPasswordLabel: 'Подтвердите пароль',
    showPassword: 'Показать пароль',
    rememberMe: 'Запомнить меня',
    forgotPassword: 'Забыли пароль?',
    backToSite: 'Вернуться на сайт',

    // Customer Dashboard Sidebar
    custDash: 'Обзор',
    custMyBookings: 'Мои бронирования',
    custMyRooms: 'Мои номера',
    custMyServices: 'Мои услуги',
    custMessages: 'Сообщения',
    custNotifications: 'Уведомления',
    custProfile: 'Профиль',
    custSettings: 'Настройки',
    upcomingBookings: 'Предстоящие бронирования',
    currentBooking: 'Текущее проживание',
    previousBookings: 'Прошлые бронирования',
    cancelBookingBtn: 'Отменить бронь',
    contactReceptionBtn: 'Связаться с ресепшн',
    saveProfileBtn: 'Сохранить профиль',

    // Reception Dashboard Sidebar & Stats
    recDash: 'Панель управления',
    recBookings: 'Бронирования',
    recGuests: 'Гости',
    recRooms: 'Номера',
    recServices: 'Услуги',
    recMessages: 'Почта (Email)',
    recCheckIn: 'Check-in (Заезд)',
    recCheckOut: 'Check-out (Выезд)',
    recNotifications: 'Уведомления',
    recProfile: 'Профиль',
    statNewBookings: 'Новые брони',
    statTodayArrivals: 'Заезды сегодня',
    statTodayDepartures: 'Выезды сегодня',
    statAvailableRooms: 'Свободные номера',
    statOccupiedRooms: 'Занятые номера',
    statPendingBookings: 'Ожидают подтверждения',

    // Reception Email System
    emailCatNew: 'Новые брони',
    emailCatQuestions: 'Вопросы гостей',
    emailCatConfirmed: 'Подтвержденные',
    emailCatCancelled: 'Отмененные',
    emailCatCompleted: 'Завершенные',
    replyBtn: 'Ответить',
    confirmBtn: 'Подтвердить бронь',
    rejectBtn: 'Отклонить',
    markAsReadBtn: 'Отметить прочитанным',
    sendCheckInInfoBtn: 'Отправить инфо о Check-in',
    sendCheckOutInfoBtn: 'Отправить инфо о Check-out',
    sendBookingInfoBtn: 'Отправить детали брони',
    composeCustomBtn: 'Написать письмо',

    // Room Physical Statuses
    statusAVAILABLE: 'AVAILABLE (Свободен)',
    statusRESERVED: 'RESERVED (Забронирован)',
    statusOCCUPIED: 'OCCUPIED (Занят)',
    statusCLEANING: 'CLEANING (Уборка)',
    statusMAINTENANCE: 'MAINTENANCE (Ремонт)',
    assignRoomBtn: 'Назначить номер',
    changeStatusBtn: 'Изменить статус',
    checkInActionBtn: 'Оформить Check-in',
    checkOutActionBtn: 'Оформить Check-out',

    // Admin Dashboard Sidebar
    admDash: 'Дашборд',
    admRooms: 'Номера (Rooms)',
    admServices: 'Услуги (Services)',
    admBookings: 'Бронирования (Bookings)',
    admCustomers: 'Клиенты (Customers)',
    admReception: 'Ресепшн (Reception)',
    admPayments: 'Платежи (Payments)',
    admReports: 'Отчеты (Reports)',
    admSettings: 'Настройки (Settings)',
    addRoomBtn: '+ Добавить номер',
    addServiceBtn: '+ Добавить услугу',
    addReceptionBtn: '+ Добавить сотрудника ресепшн',
    totalRevenue: 'Реальная выручка',
    popularServices: 'Статистика заказанных услуг',
    securityBannerTitle: 'Рекомендация безопасности: Обновите пароль',
    securityBannerDesc:
      'Для обеспечения безопасности рекомендуется установить новый персональный пароль в разделе Настройки.',
  },
  en: {
    // Navbar
    navHome: 'Home',
    navRooms: 'Rooms',
    navServices: 'Services',
    navAbout: 'About Us',
    navGallery: 'Gallery',
    navContact: 'Contact',
    loginBtn: 'Sign In',
    registerBtn: 'Register',
    dashboardBtn: 'Portal',
    logoutBtn: 'Sign Out',
    adminPortalBtn: 'Admin Console',
    receptionPortalBtn: 'Reception Desk',
    customerPortalBtn: 'Guest Portal',

    // Hero
    heroKicker: 'International Luxury Coastal Sanctuary · Five-Star Hospitality',
    heroTitle: 'Begin Your Unforgettable Escape Today',
    heroSubtitle:
      'BEACH — an oceanfront sanctuary of serene relaxation, bespoke suites, and curated marine adventures.',
    bookRoomBtn: 'Book a Suite',
    viewServicesBtn: 'Explore Services',

    // Search bar
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    roomType: 'Room Category',
    allRooms: 'All Categories',
    searchBtn: 'Search Availability',
    guestsUnit: 'guests',
    nightUnit: 'nights',

    // Rooms section
    roomsKicker: 'Oceanfront Accommodations',
    roomsTitle: 'Bespoke Suites & Private Beachfront Villas',
    roomsSubtitle:
      'Crafted with natural teak timber, cool travertine stone, and unobstructed panoramic views of the turquoise horizon.',
    perNight: '/ night',
    detailsBtn: 'View Details',
    bookNowBtn: 'Reserve Now',
    availableLabel: 'Available',
    unavailableLabel: 'Booked',
    wifiLabel: 'High-Speed Wi-Fi',
    acLabel: 'Climate Control (AC)',
    bathroomLabel: 'Private Ensuite Bath',
    seaViewLabel: 'Panoramic Sea View',
    priceCalcTitle: 'Rate Calculator',
    nightsCount: 'Number of nights',
    roomPriceLabel: 'Accommodation rate',
    extraServicesLabel: 'Curated services',
    totalPriceLabel: 'Total estimate',

    // Services section
    servicesKicker: 'Coastal & Marine Experiences',
    servicesTitle: 'Beachfront Cabanas & Watercraft Charters',
    servicesSubtitle:
      'From shaded teak tapchan pavilions to private motor yachts and jet skis — seamlessly add experiences to your stay.',
    addServiceToBooking: 'Add to Stay',
    serviceAdded: 'Selected',
    durationLabel: 'Duration',

    // About & Proof section
    aboutKicker: 'The BEACH Sanctuary',
    aboutTitle: 'Where Coastal Architecture Meets Timeless Serenity',
    aboutBody:
      'Spanning 1.4 kilometers of private white-sand coastline, BEACH offers fine coastal dining, a private marina, and 24/7 dedicated concierge service.',
    statCoastline: '1.4 km Private White-Sand Coastline',
    statSatisfaction: 'Five-Star Coastal Hospitality',
    statConcierge: '24/7 Dedicated Reception & Concierge',
    statVillas: 'Panoramic Oceanfront Suites & Villas',

    // Gallery section
    galleryKicker: 'Visual Chronicle',
    galleryTitle: 'Coastal Atmosphere & Resort Living',
    gallerySubtitle: 'Golden hour horizons, crystal waters, and refined architectural spaces.',

    // Contact section
    contactKicker: 'Direct Concierge Line',
    contactTitle: 'Contact Reception & Guest Relations',
    contactSubtitle:
      'Planning a bespoke stay or private yacht charter? Our reception desk responds promptly.',
    yourName: 'Full Name',
    yourEmail: 'Email Address',
    yourPhone: 'Phone Number',
    subjectLabel: 'Subject',
    messageLabel: 'Your Message',
    sendMessageBtn: 'Send Inquiry',

    // Booking Wizard (6 Steps)
    wizardTitle: 'Suite & Experience Reservation',
    step1: '1. Select Room',
    step2: '2. Dates',
    step3: '3. Guests',
    step4: '4. Services',
    step5: '5. Guest Details',
    step6: '6. Confirmation',
    nextStep: 'Continue',
    prevStep: 'Back',
    confirmBookingBtn: 'Complete Reservation',
    bookingSummary: 'Reservation Summary',
    bookingIdLabel: 'Booking ID',
    guestNameLabel: 'Guest Name',
    selectedRoomLabel: 'Selected Suite',
    selectedServicesLabel: 'Selected Services',
    bookingStatusLabel: 'Booking Status',
    paymentStatusLabel: 'Payment Status',
    specialRequestsLabel: 'Special Requests (Optional)',
    noExtraServices: 'No additional services selected',

    // UX messages
    msgBookingCreated: 'Reservation successfully created.',
    msgBookingConfirmed: 'Your reservation is confirmed.',
    msgBookingCancelled: 'Reservation cancelled.',
    msgBookingRejected: 'Reservation declined.',
    msgRoomUnavailable: 'Bu xona tanlangan sanalarda band. (This room is booked for selected dates.)',
    msgEmailSent: 'Message sent successfully.',
    msgDataSaved: 'Changes saved successfully.',
    notifNewBooking: 'New booking request received.',
    notifBookingConfirmed: 'Booking has been confirmed.',
    notifBookingCancelled: 'Booking has been cancelled.',
    notifGuestCheckIn: 'Guest has completed check-in.',
    notifGuestCheckOut: 'Guest has completed check-out.',
    notifNewMessage: 'New message received.',
    noBookingsYet: 'Bronlar hozircha mavjud emas. (Бронлар ҳозирча мавжуд эмас.)',

    // Authentication
    authSplitQuote:
      '“Ocean breeze, tranquil horizons, and effortless hospitality — where every moment is designed to linger.”',
    loginTitle: 'Sign In to Your Account',
    registerTitle: 'Create Your Guest Profile',
    adminLoginTitle: 'Management System Sign In',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm Password',
    showPassword: 'Show password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    backToSite: 'Return to Resort Home',

    // Customer Dashboard Sidebar
    custDash: 'Dashboard',
    custMyBookings: 'My Bookings',
    custMyRooms: 'My Suites',
    custMyServices: 'My Services',
    custMessages: 'Messages',
    custNotifications: 'Notifications',
    custProfile: 'Profile',
    custSettings: 'Settings',
    upcomingBookings: 'Upcoming Reservations',
    currentBooking: 'Active Stay',
    previousBookings: 'Past Stays',
    cancelBookingBtn: 'Cancel Booking',
    contactReceptionBtn: 'Message Reception',
    saveProfileBtn: 'Save Profile',

    // Reception Dashboard Sidebar & Stats
    recDash: 'Dashboard',
    recBookings: 'Bookings',
    recGuests: 'Guests',
    recRooms: 'Room Status',
    recServices: 'Beach Services',
    recMessages: 'Email Inbox',
    recCheckIn: 'Check-in',
    recCheckOut: 'Check-out',
    recNotifications: 'Notifications',
    recProfile: 'Profile',
    statNewBookings: 'New Bookings',
    statTodayArrivals: "Today's Arrivals",
    statTodayDepartures: "Today's Departures",
    statAvailableRooms: 'Available Rooms',
    statOccupiedRooms: 'Occupied Rooms',
    statPendingBookings: 'Pending Requests',

    // Reception Email System
    emailCatNew: 'New bookings',
    emailCatQuestions: 'Customer questions',
    emailCatConfirmed: 'Confirmed',
    emailCatCancelled: 'Cancelled',
    emailCatCompleted: 'Completed',
    replyBtn: 'Reply',
    confirmBtn: 'Confirm booking',
    rejectBtn: 'Reject',
    markAsReadBtn: 'Mark as read',
    sendCheckInInfoBtn: 'Send check-in info',
    sendCheckOutInfoBtn: 'Send check-out info',
    sendBookingInfoBtn: 'Send booking info',
    composeCustomBtn: 'Compose message',

    // Room Physical Statuses
    statusAVAILABLE: 'AVAILABLE',
    statusRESERVED: 'RESERVED',
    statusOCCUPIED: 'OCCUPIED',
    statusCLEANING: 'CLEANING',
    statusMAINTENANCE: 'MAINTENANCE',
    assignRoomBtn: 'Assign Room',
    changeStatusBtn: 'Update Status',
    checkInActionBtn: 'Check-in',
    checkOutActionBtn: 'Check-out',

    // Admin Dashboard Sidebar
    admDash: 'Dashboard',
    admRooms: 'Rooms',
    admServices: 'Services',
    admBookings: 'Bookings',
    admCustomers: 'Customers',
    admReception: 'Reception',
    admPayments: 'Payments',
    admReports: 'Reports',
    admSettings: 'Settings',
    addRoomBtn: '+ Add New Suite',
    addServiceBtn: '+ Add Beach Service',
    addReceptionBtn: '+ Create Reception Account',
    totalRevenue: 'Real Revenue',
    popularServices: 'Booked Services Analytics',
    securityBannerTitle: 'Security Notice: Update Account Password',
    securityBannerDesc:
      'For enhanced security, please configure a new personal password in the Settings tab.',
  },
} as const;

export type TranslationKey = keyof typeof UI_TEXT.uz;

export function t(lang: Language, key: TranslationKey): string {
  return UI_TEXT[lang][key] || UI_TEXT.uz[key];
}

export function localize(lang: Language, textObj: LocalizedText): string {
  return textObj[lang] || textObj.uz;
}

export function generateEmailTemplate(
  type: 'CREATED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'CHECKIN_INFO' | 'CHECKOUT_INFO',
  booking: Booking,
  room?: Room,
  services: BeachService[] = []
): { subject: LocalizedText; message: LocalizedText } {
  const roomNameUz = room ? room.name.uz : booking.roomCategory;
  const roomNameRu = room ? room.name.ru : booking.roomCategory;
  const roomNameEn = room ? room.name.en : booking.roomCategory;

  const serviceListUz =
    services.length > 0 ? services.map((s) => s.name.uz).join(', ') : 'Yo‘q';
  const serviceListRu =
    services.length > 0 ? services.map((s) => s.name.ru).join(', ') : 'Нет';
  const serviceListEn =
    services.length > 0 ? services.map((s) => s.name.en).join(', ') : 'None';

  switch (type) {
    case 'CREATED':
      return {
        subject: {
          uz: `Yangi bron so‘rovi #${booking.id} — ${roomNameUz}`,
          ru: `Новый запрос на бронирование #${booking.id} — ${roomNameRu}`,
          en: `New Booking Request #${booking.id} — ${roomNameEn}`,
        },
        message: {
          uz: `Hurmatli ${booking.guestName},\n\nBEACH kurortida #${booking.id} raqamli bron so‘rovingiz qabul qilindi.\n• Xona: ${roomNameUz} (${booking.roomCategory} #${booking.assignedUnitNumber || ''})\n• Kirish: ${booking.checkIn} | Chiqish: ${booking.checkOut} (${booking.nights} tun)\n• Mehmonlar: ${booking.guests} nafar\n• Xizmatlar: ${serviceListUz}\n• Jami summa: $${booking.totalPrice}\n\nResepshn xodimimiz xona mavjudligini tekshirib, tez orada tasdiqnoma yuboradi.`,
          ru: `Уважаемый(ая) ${booking.guestName},\n\nВаш запрос на бронирование #${booking.id} в курорте BEACH успешно получен.\n• Номер: ${roomNameRu} (${booking.roomCategory} #${booking.assignedUnitNumber || ''})\n• Заезд: ${booking.checkIn} | Выезд: ${booking.checkOut} (${booking.nights} ноч.)\n• Гости: ${booking.guests} чел.\n• Услуги: ${serviceListRu}\n• Итоговая сумма: $${booking.totalPrice}\n\nСлужба ресепшн проверит наличие и отправит подтверждение в ближайшее время.`,
          en: `Dear ${booking.guestName},\n\nYour reservation request #${booking.id} at BEACH Resort has been received.\n• Suite: ${roomNameEn} (${booking.roomCategory} #${booking.assignedUnitNumber || ''})\n• Check-in: ${booking.checkIn} | Check-out: ${booking.checkOut} (${booking.nights} nights)\n• Guests: ${booking.guests}\n• Services: ${serviceListEn}\n• Total Amount: $${booking.totalPrice}\n\nOur reception team is reviewing availability and will confirm your stay shortly.`,
        },
      };

    case 'CONFIRMED':
      return {
        subject: {
          uz: `Broningiz tasdiqlandi #${booking.id} — Xush kelibsiz BEACH kurortiga!`,
          ru: `Бронирование подтверждено #${booking.id} — Добро пожаловать в BEACH!`,
          en: `Reservation Confirmed #${booking.id} — Welcome to BEACH Resort!`,
        },
        message: {
          uz: `Hurmatli ${booking.guestName},\n\nSizning #${booking.id} raqamli broningiz RESEPSHN tomonidan rasman TASDIQLANDI!\n• Xona: ${roomNameUz} ${booking.assignedUnitNumber ? `(Xona #${booking.assignedUnitNumber})` : ''}\n• Sanalar: ${booking.checkIn} — ${booking.checkOut}\n• Qo‘shimcha xizmatlar: ${serviceListUz}\n• Jami to‘lov: $${booking.totalPrice}\n\nSizni BEACH sohil kurortida kutib qolamiz!`,
          ru: `Уважаемый(ая) ${booking.guestName},\n\nВаше бронирование #${booking.id} официально ПОДТВЕРЖДЕНО службой ресепшн!\n• Номер: ${roomNameRu} ${booking.assignedUnitNumber ? `(Номер #${booking.assignedUnitNumber})` : ''}\n• Даты: ${booking.checkIn} — ${booking.checkOut}\n• Дополнительные услуги: ${serviceListRu}\n• Сумма к оплате: $${booking.totalPrice}\n\nС нетерпением ждем вас в пляжном курорте BEACH!`,
          en: `Dear ${booking.guestName},\n\nYour reservation #${booking.id} has been officially CONFIRMED by our Reception Desk!\n• Suite: ${roomNameEn} ${booking.assignedUnitNumber ? `(Unit #${booking.assignedUnitNumber})` : ''}\n• Dates: ${booking.checkIn} — ${booking.checkOut}\n• Curated Services: ${serviceListEn}\n• Total Amount: $${booking.totalPrice}\n\nWe look forward to welcoming you to BEACH Resort!`,
        },
      };

    case 'REJECTED':
      return {
        subject: {
          uz: `Bron so‘rovi #${booking.id} bo‘yicha ma’lumot`,
          ru: `Информация по запросу бронирования #${booking.id}`,
          en: `Update Regarding Booking Request #${booking.id}`,
        },
        message: {
          uz: `Hurmatli ${booking.guestName},\n\nAfsuski, tanlangan sanalarda (${booking.checkIn} — ${booking.checkOut}) ${roomNameUz} xonasi to‘liq band bo‘lganligi sababli #${booking.id} so‘rovingiz rad etildi. Iltimos, boshqa sana yoki xona turini tanlang.`,
          ru: `Уважаемый(ая) ${booking.guestName},\n\nК сожалению, на выбранные даты (${booking.checkIn} — ${booking.checkOut}) категория ${roomNameRu} полностью занята, поэтому запрос #${booking.id} отклонен. Пожалуйста, выберите другие даты или категорию номера.`,
          en: `Dear ${booking.guestName},\n\nUnfortunately, ${roomNameEn} is fully booked for your requested dates (${booking.checkIn} — ${booking.checkOut}), and request #${booking.id} could not be accommodated. Please select alternative dates or another suite category.`,
        },
      };

    case 'CANCELLED':
      return {
        subject: {
          uz: `Bron bekor qilindi #${booking.id}`,
          ru: `Бронирование отменено #${booking.id}`,
          en: `Reservation Cancelled #${booking.id}`,
        },
        message: {
          uz: `Hurmatli ${booking.guestName},\n\nSizning #${booking.id} raqamli broningiz (${roomNameUz}, ${booking.checkIn} — ${booking.checkOut}) bekor qilindi. Savollaringiz bo‘lsa, resepshn xizmatiga murojaat qiling.`,
          ru: `Уважаемый(ая) ${booking.guestName},\n\nВаше бронирование #${booking.id} (${roomNameRu}, ${booking.checkIn} — ${booking.checkOut}) было отменено. При возникновении вопросов свяжитесь с ресепшн.`,
          en: `Dear ${booking.guestName},\n\nYour reservation #${booking.id} (${roomNameEn}, ${booking.checkIn} — ${booking.checkOut}) has been cancelled. Please reach out to our reception team if you need further assistance.`,
        },
      };

    case 'CHECKIN_INFO':
      return {
        subject: {
          uz: `Check-in ma’lumotlari — Bron #${booking.id}`,
          ru: `Инструкции по заселению (Check-in) — Бронь #${booking.id}`,
          en: `Arrival & Check-In Instructions — Booking #${booking.id}`,
        },
        message: {
          uz: `Hurmatli ${booking.guestName},\n\nBEACH kurortiga kelishingiz oldidan Check-in ma’lumotlarini taqdim etamiz:\n• Kirish sanasi: ${booking.checkIn} (soat 14:00 dan boshlab)\n• Tayinlangan xona: ${booking.assignedUnitNumber || 'Resepshnda beriladi'}\n• Shaxsni tasdiqlovchi hujjat (pasport/ID) o‘zingiz bilan bo‘lishini so‘raymiz.\n• Sohil konsyerji sizni asosiy lobbi kirishida kutib oladi.`,
          ru: `Уважаемый(ая) ${booking.guestName},\n\nНаправляем вам информацию для заселению (Check-in) в курорт BEACH:\n• Дата заезда: ${booking.checkIn} (с 14:00)\n• Назначенный номер: ${booking.assignedUnitNumber || 'Выдается на ресепшн'}\n• Пожалуйста, имейте при себе паспорт или удостоверение личности.\n• Наш консьерж встретит вас у главного входа в лобби.`,
          en: `Dear ${booking.guestName},\n\nHere are your arrival and check-in details for BEACH Resort:\n• Arrival Date: ${booking.checkIn} (Check-in begins at 14:00)\n• Assigned Suite Unit: ${booking.assignedUnitNumber || 'Assigned upon arrival'}\n• Please present a valid passport or government ID at the reception desk.\n• Our coastal concierge will greet you at the main pavilion lobby.`,
        },
      };

    case 'CHECKOUT_INFO':
      return {
        subject: {
          uz: `Check-out va yakuniy hisob — Bron #${booking.id}`,
          ru: `Информация о выезде (Check-out) — Бронь #${booking.id}`,
          en: `Departure & Check-Out Summary — Booking #${booking.id}`,
        },
        message: {
          uz: `Hurmatli ${booking.guestName},\n\nBEACH kurortida dam olganingiz uchun tashakkur!\n• Chiqish sanasi: ${booking.checkOut} (soat 12:00 gacha)\n• Umumiy hisob: $${booking.totalPrice} (${booking.paymentStatus})\n• Bagaj xizmati va aeroport transferi uchun resepshnga 0 ichki raqami orqali murojaat qilishingiz mumkin.`,
          ru: `Уважаемый(ая) ${booking.guestName},\n\nБлагодарим вас за отдых в курорте BEACH!\n• Дата выезда: ${booking.checkOut} (до 12:00)\n• Итоговый счет: $${booking.totalPrice} (${booking.paymentStatus})\n• Для помощи с багажом или трансфером наберите 0 с телефона в номере.`,
          en: `Dear ${booking.guestName},\n\nThank you for staying with us at BEACH Resort!\n• Departure Date: ${booking.checkOut} (Check-out by 12:00)\n• Final Folio Amount: $${booking.totalPrice} (${booking.paymentStatus})\n• Dial 0 from your suite telephone for luggage assistance or private transfer arrangements.`,
        },
      };
  }
}
