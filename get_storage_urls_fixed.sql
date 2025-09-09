-- Run this in your Supabase SQL Editor to get all storage URLs
-- Your actual bucket information:
-- Project URL: https://baimixtdewflnnyudhwz.supabase.co
-- Bucket: quran-recitations
-- Folder: AlKahf_AsSudais

-- Get all files in your storage bucket
SELECT 
  name as filename,
  bucket_id,
  created_at,
  updated_at,
  'https://baimixtdewflnnyudhwz.supabase.co/storage/v1/object/public/' || bucket_id || '/' || name as public_url
FROM storage.objects 
WHERE bucket_id = 'quran-recitations'
ORDER BY name;

-- Get just the file names
SELECT 
  name as filename,
  bucket_id
FROM storage.objects 
WHERE bucket_id = 'quran-recitations'
ORDER BY name;

-- Get all Al-Kahf files specifically
SELECT 
  name as filename,
  'https://baimixtdewflnnyudhwz.supabase.co/storage/v1/object/public/quran-recitations/AlKahf_AsSudais/' || name as public_url
FROM storage.objects 
WHERE bucket_id = 'quran-recitations' 
  AND name LIKE 'AlKahf_AsSudais/%'
ORDER BY name;

-- Simple query to just see what files you have
SELECT name 
FROM storage.objects 
WHERE bucket_id = 'quran-recitations'
ORDER BY name;
