const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://baimixtdewflnnyudhwz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaW1peHRkZXdmbG5ueXVkaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIwMTcsImV4cCI6MjA2OTE5ODAxN30.vXIW8HICOhsMO0bWk59PFLWmn8aKhFUUk25llLp4jSc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration
const BUCKET_NAME = 'quran-audio';
const AUDIO_DIR = path.join(__dirname, '../src/assets/AlKahf_Sudais');

async function createBucket() {
  try {
    console.log('Creating storage bucket...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['audio/*']
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }
      
      console.log('✅ Bucket created successfully');
    } else {
      console.log('✅ Bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error in createBucket:', error);
    return false;
  }
}

async function uploadFile(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`AlKahf_Sudais/${fileName}`, fileBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });
    
    if (error) {
      console.error(`❌ Error uploading ${fileName}:`, error);
      return false;
    }
    
    console.log(`✅ Uploaded: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error);
    return false;
  }
}

async function uploadAudioFiles() {
  try {
    console.log('Starting audio file upload...');
    
    // Check if directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
      console.error(`❌ Directory not found: ${AUDIO_DIR}`);
      return;
    }
    
    // Get all MP3 files
    const files = fs.readdirSync(AUDIO_DIR)
      .filter(file => file.endsWith('.mp3'))
      .sort();
    
    console.log(`Found ${files.length} MP3 files to upload`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      const filePath = path.join(AUDIO_DIR, file);
      const success = await uploadFile(filePath, file);
      
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successfully uploaded: ${successCount} files`);
    console.log(`❌ Failed uploads: ${errorCount} files`);
    console.log(`📁 Total files: ${files.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Upload completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Remove AlKahf_Sudais from your app bundle');
      console.log('2. Update your app to use the audioDownloader utility');
      console.log('3. Test the cloud audio functionality');
    }
    
  } catch (error) {
    console.error('❌ Error in uploadAudioFiles:', error);
  }
}

async function main() {
  console.log('🚀 Starting Supabase audio upload...\n');
  
  // Create bucket first
  const bucketCreated = await createBucket();
  
  if (!bucketCreated) {
    console.error('❌ Failed to create bucket. Exiting...');
    return;
  }
  
  // Upload files
  await uploadAudioFiles();
}

// Run the script
main().catch(console.error);
