import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      } else {
        // Detect system language if not set
        const locales = RNLocalize.getLocales();
        if (Array.isArray(locales) && locales.length > 0 && locales[0].languageCode === 'ar') {
          setLanguage('ar');
        } else {
          setLanguage('en');
        }
      }
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      await AsyncStorage.setItem('app_language', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const translations = {
    en: {
      // Home Screen
      'memorization_progress': 'Memorization Progress',
      'out_of_ayaat': 'out of',
      'ayaat_memorized': 'ayaat memorized',
      'complete': 'Complete',
      'completed': 'COMPLETED - MASHA2ALLAH!',
      'hasanat_gains': '7asanat gains',
      'today_hasanat': 'Today\'s 7asanat',
      'total_hasanat': 'Total 7asanat',
      'streak': 'Day Streak',
      'memorized': 'Memorized',
      'total_ayaat': 'Total Ayaat',
      'memorize': 'Memorize',
      'review': 'Review',
      'settings': 'Settings',
      'close': 'Close',
      'reset_today': 'Reset Today\'s Progress Only',
      'reset_all': 'Reset ALL Progress',
      'resetting': 'Resetting...',
      'language': 'Language',
      'english': 'English',
      'arabic': 'Arabic',
      'english_button': 'English',
      'arabic_button': 'العربية',
      'days': 'days',
      'masha2allah': 'masha2Allah',
      'insha2allah': 'insha2Allah',
      'quran_memorize': 'Memorize Qur2an b2ithnAllah',
      'welcome_subtitle': 'Qa2imat as-Suwar (Surah List)',
      'intro_title': 'Asalamu alaykum\nwa rahmat Allah',
      'intro_description': '{app_name} is your personal Qur2an memorization companion. Track your progress, earn 7asanat, and maintain your daily streak as you journey through the Holy Qur2an.',
      'welcome_to_iqra2': 'Welcome to IQRA2',
      'app_name': 'IQRA2',
      'bismillah': 'Bismillah',
      'start': 'Start',
      'finish': 'Finish',
      'next_surah': 'Next Surah',
      'next_ayah': 'Next Ayah',
      'translation': 'Translation',
      'rewards': 'Rewards',
      'navigation': 'Navigation',
      'search_surahs': 'Search surahs by name or number...',
      'home': 'Home',
      'continue': 'Continue',
      'masha2allah': 'masha2Allah',
      'you_earned_hasanat': 'You\'ve earned {amount} 7asanaat for this Ayah!',
      'insha2allah': 'insha2Allah',
      'revise': 'Revise',
      'back': 'Back',
      'previous': 'Previous',
      'next': 'Next',
      'hide': 'Hide',
      'reveal': 'Reveal',
      'daily_streak': 'Daily Streak!',
      'search_ayah': 'Enter ayah number...',
      'istiadhah': 'Isti\'adhah',
      'ayah': 'Ayah',
      'audio_error': 'Audio Error',
      'audio_playback_error': 'There was an error playing the audio. Please try again.',
      'audio_not_available': 'Audio Not Available',
      'audio_not_available_message': 'Audio recitation is not available for this ayah yet.',
      'audio_only_for_ayahs': 'Audio is only available for Quranic ayahs.',
      'choose_reciter': 'Choose Reciter',
      'reciter_selection': 'Reciter Selection',
      
      // Surah names in English
      'surah_1': 'Al-Fatihah',
      'surah_2': 'Al-Baqarah',
      'surah_3': 'Al-Imran',
      'surah_4': 'An-Nisa',
      'surah_5': 'Al-Ma\'idah',
      'surah_6': 'Al-An\'am',
      'surah_7': 'Al-A\'raf',
      'surah_8': 'Al-Anfal',
      'surah_9': 'At-Tawbah',
      'surah_10': 'Yunus',
      'surah_11': 'Hud',
      'surah_12': 'Yusuf',
      'surah_13': 'Ar-Ra\'d',
      'surah_14': 'Ibrahim',
      'surah_15': 'Al-Hijr',
      'surah_16': 'An-Nahl',
      'surah_17': 'Al-Isra',
      'surah_18': 'Al-Kahf',
      'surah_19': 'Maryam',
      'surah_20': 'Ta-Ha',
      'surah_21': 'Al-Anbya',
      'surah_22': 'Al-Hajj',
      'surah_23': 'Al-Mu\'minun',
      'surah_24': 'An-Nur',
      'surah_25': 'Al-Furqan',
      'surah_26': 'Ash-Shu\'ara',
      'surah_27': 'An-Naml',
      'surah_28': 'Al-Qasas',
      'surah_29': 'Al-Ankabut',
      'surah_30': 'Ar-Rum',
      'surah_31': 'Luqman',
      'surah_32': 'As-Sajdah',
      'surah_33': 'Al-Ahzab',
      'surah_34': 'Saba',
      'surah_35': 'Fatir',
      'surah_36': 'Ya-Sin',
      'surah_37': 'As-Saffat',
      'surah_38': 'Sad',
      'surah_39': 'Az-Zumar',
      'surah_40': 'Ghafir',
      'surah_41': 'Fussilat',
      'surah_42': 'Ash-Shura',
      'surah_43': 'Az-Zukhruf',
      'surah_44': 'Ad-Dukhan',
      'surah_45': 'Al-Jathiyah',
      'surah_46': 'Al-Ahqaf',
      'surah_47': 'Muhammad',
      'surah_48': 'Al-Fath',
      'surah_49': 'Al-Hujurat',
      'surah_50': 'Qaf',
      'surah_51': 'Adh-Dhariyat',
      'surah_52': 'At-Tur',
      'surah_53': 'An-Najm',
      'surah_54': 'Al-Qamar',
      'surah_55': 'Ar-Rahman',
      'surah_56': 'Al-Waqi\'ah',
      'surah_57': 'Al-Hadid',
      'surah_58': 'Al-Mujadila',
      'surah_59': 'Al-Hashr',
      'surah_60': 'Al-Mumtahanah',
      'surah_61': 'As-Saf',
      'surah_62': 'Al-Jumu\'ah',
      'surah_63': 'Al-Munafiqun',
      'surah_64': 'At-Taghabun',
      'surah_65': 'At-Talaq',
      'surah_66': 'At-Tahrim',
      'surah_67': 'Al-Mulk',
      'surah_68': 'Al-Qalam',
      'surah_69': 'Al-Haqqah',
      'surah_70': 'Al-Ma\'arij',
      'surah_71': 'Nuh',
      'surah_72': 'Al-Jinn',
      'surah_73': 'Al-Muzzammil',
      'surah_74': 'Al-Muddathir',
      'surah_75': 'Al-Qiyamah',
      'surah_76': 'Al-Insan',
      'surah_77': 'Al-Mursalat',
      'surah_78': 'An-Naba',
      'surah_79': 'An-Nazi\'at',
      'surah_80': 'Abasa',
      'surah_81': 'At-Takwir',
      'surah_82': 'Al-Infitar',
      'surah_83': 'Al-Mutaffifin',
      'surah_84': 'Al-Inshiqaq',
      'surah_85': 'Al-Buruj',
      'surah_86': 'At-Tariq',
      'surah_87': 'Al-A\'la',
      'surah_88': 'Al-Ghashiyah',
      'surah_89': 'Al-Fajr',
      'surah_90': 'Al-Balad',
      'surah_91': 'Ash-Shams',
      'surah_92': 'Al-Layl',
      'surah_93': 'Ad-Duha',
      'surah_94': 'Ash-Sharh',
      'surah_95': 'At-Tin',
      'surah_96': 'Al-Alaq',
      'surah_97': 'Al-Qadr',
      'surah_98': 'Al-Bayyinah',
      'surah_99': 'Az-Zalzalah',
      'surah_100': 'Al-Adiyat',
      'surah_101': 'Al-Qari\'ah',
      'surah_102': 'At-Takathur',
      'surah_103': 'Al-Asr',
      'surah_104': 'Al-Humazah',
      'surah_105': 'Al-Fil',
      'surah_106': 'Quraish',
      'surah_107': 'Al-Ma\'un',
      'surah_108': 'Al-Kawthar',
      'surah_109': 'Al-Kafirun',
      'surah_110': 'An-Nasr',
      'surah_111': 'Al-Masad',
      'surah_112': 'Al-Ikhlas',
      'surah_113': 'Al-Falaq',
      'surah_114': 'An-Nas',
      
      // Common
      'loading': 'Loading...',
    },
    ar: {
      // Home Screen
      'memorization_progress': 'تقدم الحفظ',
      'out_of_ayaat': 'من أصل',
      'ayaat_memorized': 'آية محفوظة',
      'complete': 'مكتمل',
      'completed': 'مكتمل - ما شاء الله!',
      'hasanat_gains': 'الحسنات المكتسبة',
      'today_hasanat': 'حسنات اليوم',
      'total_hasanat': 'إجمالي الحسنات',
      'streak': 'يوم متتالي',
      'memorized': 'محفوظ',
      'total_ayaat': 'إجمالي الآيات',
      'memorize': 'حفظ',
      'review': 'مراجعة',
      'settings': 'الإعدادات',
      'close': 'إغلاق',
      'reset_today': 'إعادة تعيين تقدم اليوم فقط',
      'reset_all': 'إعادة تعيين كل التقدم',
      'resetting': 'جاري إعادة التعيين...',
      'language': 'اللغة',
      'english': 'الإنجليزية',
      'arabic': 'العربية',
      'english_button': 'English',
      'arabic_button': 'العربية',
      'days': 'أيام',
      'masha2allah': 'ما شاء الله',
      'insha2allah': 'إن شاء الله',
      'quran_memorize': 'احفظ القرآن بإذن الله',
      'welcome_subtitle': 'قائمة السور',
      'intro_title': 'السلام عليكم ورحمة الله',
      'intro_description': 'ٱقۡرَأۡ هو رفيقك الشخصي لحفظ القرآن. تتبع تقدمك، اكسب الحسنات، وحافظ على تتابعك اليومي أثناء رحلتك في القرآن الكريم.',
      'welcome_to_iqra2': 'مرحباً بك في ٱقۡرَأۡ',
      'app_name': 'ٱقۡرَأۡ',
      'bismillah': 'بسم الله',
      'start': 'ابدأ',
      'finish': 'إنهاء',
      'next_surah': 'السورة التالية',
      'next_ayah': 'الآية التالية',
      'translation': 'الترجمة',
      'rewards': 'المكافآت',
      'navigation': 'التنقل',
      'search_surahs': 'ابحث عن السورة بالاسم أو الرقم...',
      'home': 'الرئيسية',
      'continue': 'استمر',
      'masha2allah': 'ما شاء الله',
      'you_earned_hasanat': 'لقد كسبت {amount} حسنة لهذه الآية!',
      'insha2allah': 'إن شاء الله',
      'revise': 'راجع',
      'back': 'رجوع',
      'previous': 'السابق',
      'next': 'التالي',
      'hide': 'إخفاء',
      'reveal': 'إظهار',
      'daily_streak': 'سلسلة الأيام!',
      'search_ayah': 'أدخل رقم الآية...',
      'istiadhah': 'الاستعاذة',
      'ayah': 'آية',
      'audio_error': 'خطأ في الصوت',
      'audio_playback_error': 'حدث خطأ في تشغيل الصوت. يرجى المحاولة مرة أخرى.',
      'audio_not_available': 'الصوت غير متاح',
      'audio_not_available_message': 'التلاوة الصوتية غير متاحة لهذه الآية بعد.',
      'audio_only_for_ayahs': 'الصوت متاح فقط لآيات القرآن.',
      'choose_reciter': 'اختر القارئ',
      'reciter_selection': 'اختيار القارئ',
      
      // Surah names in Arabic
      'surah_1': 'الفاتحة',
      'surah_2': 'البقرة',
      'surah_3': 'آل عمران',
      'surah_4': 'النساء',
      'surah_5': 'المائدة',
      'surah_6': 'الأنعام',
      'surah_7': 'الأعراف',
      'surah_8': 'الأنفال',
      'surah_9': 'التوبة',
      'surah_10': 'يونس',
      'surah_11': 'هود',
      'surah_12': 'يوسف',
      'surah_13': 'الرعد',
      'surah_14': 'إبراهيم',
      'surah_15': 'الحجر',
      'surah_16': 'النحل',
      'surah_17': 'الإسراء',
      'surah_18': 'الكهف',
      'surah_19': 'مريم',
      'surah_20': 'طه',
      'surah_21': 'الأنبياء',
      'surah_22': 'الحج',
      'surah_23': 'المؤمنون',
      'surah_24': 'النور',
      'surah_25': 'الفرقان',
      'surah_26': 'الشعراء',
      'surah_27': 'النمل',
      'surah_28': 'القصص',
      'surah_29': 'العنكبوت',
      'surah_30': 'الروم',
      'surah_31': 'لقمان',
      'surah_32': 'السجدة',
      'surah_33': 'الأحزاب',
      'surah_34': 'سبأ',
      'surah_35': 'فاطر',
      'surah_36': 'يس',
      'surah_37': 'الصافات',
      'surah_38': 'ص',
      'surah_39': 'الزمر',
      'surah_40': 'غافر',
      'surah_41': 'فصلت',
      'surah_42': 'الشورى',
      'surah_43': 'الزخرف',
      'surah_44': 'الدخان',
      'surah_45': 'الجاثية',
      'surah_46': 'الأحقاف',
      'surah_47': 'محمد',
      'surah_48': 'الفتح',
      'surah_49': 'الحجرات',
      'surah_50': 'ق',
      'surah_51': 'الذاريات',
      'surah_52': 'الطور',
      'surah_53': 'النجم',
      'surah_54': 'القمر',
      'surah_55': 'الرحمن',
      'surah_56': 'الواقعة',
      'surah_57': 'الحديد',
      'surah_58': 'المجادلة',
      'surah_59': 'الحشر',
      'surah_60': 'الممتحنة',
      'surah_61': 'الصف',
      'surah_62': 'الجمعة',
      'surah_63': 'المنافقون',
      'surah_64': 'التغابن',
      'surah_65': 'الطلاق',
      'surah_66': 'التحريم',
      'surah_67': 'الملك',
      'surah_68': 'القلم',
      'surah_69': 'الحاقة',
      'surah_70': 'المعارج',
      'surah_71': 'نوح',
      'surah_72': 'الجن',
      'surah_73': 'المزمل',
      'surah_74': 'المدثر',
      'surah_75': 'القيامة',
      'surah_76': 'الإنسان',
      'surah_77': 'المرسلات',
      'surah_78': 'النبأ',
      'surah_79': 'النازعات',
      'surah_80': 'عبس',
      'surah_81': 'التكوير',
      'surah_82': 'الانفطار',
      'surah_83': 'المطففين',
      'surah_84': 'الانشقاق',
      'surah_85': 'البروج',
      'surah_86': 'الطارق',
      'surah_87': 'الأعلى',
      'surah_88': 'الغاشية',
      'surah_89': 'الفجر',
      'surah_90': 'البلد',
      'surah_91': 'الشمس',
      'surah_92': 'الليل',
      'surah_93': 'الضحى',
      'surah_94': 'الشرح',
      'surah_95': 'التين',
      'surah_96': 'العلق',
      'surah_97': 'القدر',
      'surah_98': 'البينة',
      'surah_99': 'الزلزلة',
      'surah_100': 'العاديات',
      'surah_101': 'القارعة',
      'surah_102': 'التكاثر',
      'surah_103': 'العصر',
      'surah_104': 'الهمزة',
      'surah_105': 'الفيل',
      'surah_106': 'قريش',
      'surah_107': 'الماعون',
      'surah_108': 'الكوثر',
      'surah_109': 'الكافرون',
      'surah_110': 'النصر',
      'surah_111': 'المسد',
      'surah_112': 'الإخلاص',
      'surah_113': 'الفلق',
      'surah_114': 'الناس',
      
      // Common
      'loading': 'جاري التحميل...',
    }
  };

  const t = (key, params = {}) => {
    let translation = translations[language][key] || translations.en[key] || key;
    
    // Handle interpolation for app_name
    if (translation.includes('{app_name}')) {
      const appName = translations[language]['app_name'] || translations.en['app_name'] || 'IQRA2';
      translation = translation.replace(/{app_name}/g, appName);
    }
    
    // Handle interpolation for amount
    if (translation.includes('{amount}')) {
      const amount = params.amount || '';
      translation = translation.replace(/{amount}/g, amount);
    }
    
    return translation;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 