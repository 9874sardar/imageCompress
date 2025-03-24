import {
  View,
  Text,
  Image as RNImage,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Clipboard,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import {Image} from 'react-native-compressor';
import {readFile, stat} from 'react-native-fs';

const App = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [base64String, setBase64String] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  const handleImageProcessing = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        setError('Image selection cancelled');
        return;
      }

      const asset = result.assets?.[0];
      if (!asset) {
        setError('No image selected');
        return;
      }

      setOriginalImage(asset.uri);
      setOriginalSize(asset.fileSize || 0);

      const compressedUri = await Image.compress(asset.uri, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        compressionMethod: 'auto',
      });

      const stats = await stat(compressedUri);
      setCompressedSize(stats.size);
      setCompressedImage(compressedUri);
      const mimeType = compressedUri.endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';
      const base64Data = await readFile(compressedUri, 'base64');

      const fullBase64 = `data:${mimeType};base64,${base64Data}`;
      setBase64String(fullBase64);
    } catch (error) {
        console.error('Image processing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(base64String);
    Alert.alert('Success', 'Base64 copied to clipboard!');
  };

  const sizeReductionPercentage =
    originalSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Image Compressor</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleImageProcessing}
        disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : 'Select & Compress Image'}
        </Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.imageContainer}>
        {originalImage && (
          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>Original Image</Text>
            <RNImage source={{uri: originalImage}} style={styles.image} />
            <Text style={styles.sizeText}>
              Size: {(originalSize / 1024).toFixed(2)} KB
            </Text>
          </View>
        )}

        {compressedImage && (
          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>Compressed Image</Text>
            <RNImage source={{uri: compressedImage}} style={styles.image} />
            <Text style={styles.sizeText}>
              Size: {(compressedSize / 1024).toFixed(2)} KB
              {sizeReductionPercentage > 0 &&
                ` (${sizeReductionPercentage}% reduction)`}
            </Text>
          </View>
        )}
      </View>

      {base64String && (
        <View style={styles.base64Container}>
          <View style={styles.base64Header}>
            <Text style={styles.base64Title}>Base64 Output:</Text>
            <TouchableOpacity onPress={copyToClipboard}>
              <Text style={styles.copyButton}>Copy</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.base64Scroll}>
            <Text style={styles.base64Text}>
              {base64String.substring(0, 100)}...
            </Text>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  imageWrapper: {
    width: '48%',
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginBottom: 8,
  },
  sizeText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  base64Container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  base64Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  base64Title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  copyButton: {
    color: '#007bff',
    fontWeight: '500',
  },
  base64Scroll: {
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
  },
  base64Text: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Courier New',
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});
