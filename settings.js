/* =====================================================
   ملف الإعدادات — مكرونجي Makaronjy (يُولَّد من لوحة التحكم)
===================================================== */
window.APP_SETTINGS = {
  brand: {
    nameAr: 'مكرونجي',
    nameEn: 'Makaronjy',
    tagAr: 'مكرونة بطعم لا يُقاوم',
    tagEn: 'Irresistible pasta experience'
  },
  /* ساعات افتراضية للفروع التي لم تُضبط بعد (يُرحّل تلقائياً) */
  hours: { open: { h: 13, m: 0 }, close: { h: 2, m: 0 } },

  branches: [
    {
      id: 'b-badiah',
      num: 1,
      nameAr: 'فرع البديعة',
      nameEn: 'Al Badi\'ah Branch',
      addrAr: 'الشيخ عبدالعزيز بن محمد، ظهرة البديعة، الرياض 11461',
      addrEn: 'Al Cheikh Abd Al Aziz, Dhahrat Al Badi\'ah, Riyadh 11461',
      wa: '966561296463',
      lat: 24.630, lng: 46.640,
      map: 'https://maps.app.goo.gl/sb9yK3bfk7aLApMaA',
      hours: [0, 1, 2, 3, 4, 5, 6].map(() => ({
        o: { h: 13, m: 0 },
        c: { h: 2, m: 0 }
      }))
    },
    {
      id: 'b-malqa',
      num: 2,
      nameAr: 'فرع الملقا',
      nameEn: 'Al Malqa Branch',
      addrAr: 'الأماسي، الملقا، الرياض 13525',
      addrEn: 'Al Amasi, Al Malqa, Riyadh 13525',
      wa: '966568183145',
      lat: 24.820, lng: 46.630,
      map: 'https://maps.app.goo.gl/7pmyuR4prVnyGke77',
      hours: [0, 1, 2, 3, 4, 5, 6].map(() => ({
        o: { h: 13, m: 0 },
        c: { h: 2, m: 0 }
      }))
    },
    {
      id: 'b-yasmeen',
      num: 3,
      nameAr: 'فرع الياسمين',
      nameEn: 'Al Yasmeen Branch',
      addrAr: 'القادسية، الياسمين، الرياض 13322',
      addrEn: 'Al Qadisiyah, Al Yasmeen, Riyadh 13322',
      wa: '966561203593',
      lat: 24.860, lng: 46.640,
      map: 'https://maps.app.goo.gl/WxasXA9oWLbSTCjq8',
      hours: [0, 1, 2, 3, 4, 5, 6].map(() => ({
        o: { h: 13, m: 0 },
        c: { h: 2, m: 0 }
      }))
    },
    {
      id: 'b-suwaidi',
      num: 4,
      nameAr: 'فرع السويدي الغربي',
      nameEn: 'Al Suwaidi Al Gharabi Branch',
      addrAr: 'الفجر، السويدي الغربي، الرياض 12992',
      addrEn: 'Al Fajar St, As Suwaidi Al Gharabi, Riyadh 12992',
      wa: '966544030086',
      lat: 24.620, lng: 46.650,
      map: 'https://maps.app.goo.gl/r7APZu7AgQz8Wk1d9',
      /* الجمعة يفتح 12:30 ظهراً، باقي الأيام 1 ظهراً — الجميع يُغلق 2:30 صباحاً */
      hours: [
        { o: { h: 13, m: 0 }, c: { h: 2, m: 30 } },   /* الأحد */
        { o: { h: 13, m: 0 }, c: { h: 2, m: 30 } },   /* الاثنين */
        { o: { h: 13, m: 0 }, c: { h: 2, m: 30 } },   /* الثلاثاء */
        { o: { h: 13, m: 0 }, c: { h: 2, m: 30 } },   /* الأربعاء */
        { o: { h: 13, m: 0 }, c: { h: 2, m: 30 } },   /* الخميس */
        { o: { h: 12, m: 30 }, c: { h: 2, m: 30 } },  /* الجمعة */
        { o: { h: 13, m: 0 }, c: { h: 2, m: 30 } }    /* السبت */
      ]
    }
  ],

  /* تطبيقات التوصيل المعتمدة — تظهر في شاشة اختيار الفروع */
  delivery: [
    {
      id: 'd-jahez',
      nameAr: 'جاهز',
      nameEn: 'Jahez',
      url: 'https://www.jahez.sa',
      color: '#e30613'
    },
    {
      id: 'd-keeta',
      nameAr: 'كيتا',
      nameEn: 'Keeta',
      url: 'https://www.keeta.com/sa/ar',
      color: '#000000'
    },
    {
      id: 'd-hungerstation',
      nameAr: 'هنقرستيشن',
      nameEn: 'HungerStation',
      url: 'https://hungerstation.com/sa-ar/restaurants/regions/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6/%D8%A7%D9%84%D9%85%D8%B1%D9%88%D8%AC/%D9%85%D9%83%D8%B1%D9%88%D9%86%D8%AC%D9%8A-172159',
      color: '#ffb700'
    }
  ],

  /* حسابات السوشيال ميديا */
  social: {
    instagram: 'https://www.instagram.com/makaronjy',
    tiktok: 'https://www.tiktok.com/@makaronjy'
  },

  /* الإعلان النصي (متوقف افتراضياً — يُفعّل من اللوحة) */
  ad: {
    enabled: false,
    oncePerDay: true,
    icon: '🍝',
    titleAr: 'افتتاح قريب',
    titleEn: 'Coming Soon',
    textAr: 'تابعونا على حساباتنا لمعرفة آخر العروض والافتتاحات الجديدة.',
    textEn: 'Follow us to catch the latest offers and openings.',
    btnAr: 'حسناً 🍝',
    btnEn: 'Got it 🍝'
  }
};
