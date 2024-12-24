import { Audio } from 'expo-av';

export class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private lastSize: number = 0;

  async startRecording(onData: (data: ArrayBuffer) => void) {
    try {
      console.log("Starting recording setup...");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.raw',
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
        },
        ios: {
          extension: '.raw',
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          audioQuality: Audio.IOSAudioQuality.MAX,
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 256000,
        },
      });

      this.recording = recording;
      this.lastSize = 0;

      // Stream data as fast as possible
      const streamAudio = async () => {
        if (this.recording) {
          const uri = await this.recording.getURI();
          if (uri) {
            const response = await fetch(uri);
            const buffer = await response.arrayBuffer();
            
            // Only send the new data
            if (buffer.byteLength > this.lastSize) {
              const newData = buffer.slice(this.lastSize);
              onData(newData);
              this.lastSize = buffer.byteLength;
            }
            
            // Schedule next capture
            requestAnimationFrame(streamAudio);
          }
        }
      };
      
      // Start streaming
      streamAudio();
      await this.recording.startAsync();
      console.log("Recording started!");
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  async stopRecording() {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.lastSize = 0;
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }
} 