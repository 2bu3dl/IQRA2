import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import audioRecorder from '../utils/audioRecorder';

const RecordingTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordings, setHasRecordings] = useState(false);

  const testRecording = async () => {
    try {
      if (isRecording) {
        console.log('[RecordingTest] Stopping recording...');
        await audioRecorder.stopRecording();
        setIsRecording(false);
        setHasRecordings(true);
        Alert.alert('Test Complete', 'Recording saved successfully!');
      } else {
        console.log('[RecordingTest] Starting test recording...');
        await audioRecorder.startRecording('TestSurah', 1);
        setIsRecording(true);
        Alert.alert('Test Started', 'Recording in progress... Tap again to stop.');
      }
    } catch (error) {
      console.error('[RecordingTest] Error:', error);
      Alert.alert('Test Error', error.message);
      setIsRecording(false);
    }
  };

  const testPermissions = async () => {
    try {
      const hasPermission = await audioRecorder.requestPermissions();
      Alert.alert('Permission Test', `Permission granted: ${hasPermission}`);
    } catch (error) {
      Alert.alert('Permission Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recording Test</Text>
      
      <TouchableOpacity
        style={[styles.button, isRecording && styles.recordingButton]}
        onPress={testRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop Recording' : 'Start Test Recording'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={testPermissions}
      >
        <Text style={styles.buttonText}>Test Permissions</Text>
      </TouchableOpacity>

      <Text style={styles.status}>
        Status: {isRecording ? 'Recording' : 'Not Recording'}
      </Text>
      <Text style={styles.status}>
        Has Recordings: {hasRecordings ? 'Yes' : 'No'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F5E6C8',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#5b7f67',
  },
  button: {
    backgroundColor: '#5b7f67',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  recordingButton: {
    backgroundColor: '#FF4444',
  },
  buttonText: {
    color: '#F5E6C8',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  status: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
});

export default RecordingTest; 