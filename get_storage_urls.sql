-- Run this in your Supabase SQL Editor to get all storage URLs
-- Your actual bucket information:
-- Project URL: https://baimixtdewflnnyudhwz.supabase.co
-- Bucket: quran-recitations
-- Folder: AlKahf_AsSudais

SELECT 
  name as filename,
  bucket_id,
  created_at,
  updated_at,
  -- This constructs the public URL for your file
  'https://baimixtdewflnnyudhwz.supabase.co/storage/v1/object/public/' || bucket_id || '/' || name as public_url
FROM storage.objects 
WHERE bucket_id = 'quran-recitations'  -- Your actual bucket name
ORDER BY name;

-- Alternative: Get just the file names and construct URLs manually
SELECT 
  name as filename,
  bucket_id
FROM storage.objects 
WHERE bucket_id = 'quran-recitations'  -- Your actual bucket name
ORDER BY name;

-- To get all Al-Kahf files specifically:
SELECT 
  name as filename,
  'https://baimixtdewflnnyudhwz.supabase.co/storage/v1/object/public/quran-recitations/AlKahf_AsSudais/' || name as public_url
FROM storage.objects 
WHERE bucket_id = 'quran-recitations' 
  AND name LIKE 'AlKahf_AsSudais/%'
ORDER BY name;
