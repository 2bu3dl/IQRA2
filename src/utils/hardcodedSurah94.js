/**
 * Hard-coded Surah Ash-Sharh (Surah 94) for testing
 * This bypasses the JSON data and provides direct text
 */

export const hardcodedSurah94 = {
  surah: 94,
  name: 'Ash-Sharh',
  ayaat: [
    {
      ayah: 1,
      text: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ'
    },
    {
      ayah: 2,
      text: 'وَوَضَعْنَا عَنكَ وِزْرَكَ'
    },
    {
      ayah: 3,
      text: 'ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ'
    },
    {
      ayah: 4,
      text: 'وَرَفَعْنَا لَكَ ذِكْرَكَ'
    },
    {
      ayah: 5,
      text: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا'
    },
    {
      ayah: 6,
      text: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا'
    },
    {
      ayah: 7,
      text: 'فَإِذَا فَرَغْتَ فَٱنصَبْ' // The problematic one with wasla
    },
    {
      ayah: 8,
      text: 'وَإِلَىٰ رَبِّكَ فَٱرْغَب'
    }
  ]
};

// Test variations for ayah 7
export const testVariationsAyah7 = {
  original: 'فَإِذَا فَرَغْتَ فَٱنصَبْ',
  withRegularAlif: 'فَإِذَا فَرَغْتَ فَانصَبْ',
  withSpaces: 'فَ إِذَا فَرَغْتَ فَ ٱنصَبْ',
  withJoiner: 'فَإِذَا فَرَغْتَ فَٱ‍نصَبْ'
};

export default hardcodedSurah94;
