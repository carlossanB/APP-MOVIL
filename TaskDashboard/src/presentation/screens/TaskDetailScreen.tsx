import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
  ScrollView,
  Image,
  PermissionsAndroid,
  Platform,
  Modal,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTaskStore } from '../stores/useTaskStore';
import { NativeModules } from 'react-native';

const { CameraModule } = NativeModules;

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

export const TaskDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { taskId } = route.params;
  const isNew = taskId === null;

  const { tasks, createTask, updateTask, deleteTask } = useTaskStore();
  const task = taskId ? tasks.find(t => t.id === taskId) : null;

  const [title, setTitle] = useState(task?.title ?? '');
  const [completed, setCompleted] = useState(task?.completed ?? false);
  const [photoUri, setPhotoUri] = useState<string | null>(task?.photoUri ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Nueva Tarea' : 'Editar Tarea',
      headerStyle: { backgroundColor: '#161B22' },
      headerTintColor: '#E6EDF3',
      headerTitleStyle: { fontWeight: '700' },
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validación', 'El título de la tarea no puede estar vacío.');
      return;
    }
    setIsSaving(true);
    try {
      if (isNew) {
        await createTask({ title: title.trim(), userId: 1, ...(photoUri && { photoUri }) });
      } else if (taskId) {
        await updateTask(taskId, { title: title.trim(), completed, ...(photoUri && { photoUri }) });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Eliminar Tarea', '¿Estás seguro de que quieres eliminar esta tarea?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (taskId) {
            await deleteTask(taskId);
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const handleCamera = async () => {
    try {
      if (!CameraModule) {
        Alert.alert('Cámara', 'Módulo de cámara no disponible en esta plataforma.');
        return;
      }
      
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permiso de Cámara',
            message: 'La aplicación necesita acceso a la cámara para tomar fotos de la tarea.',
            buttonNeutral: 'Preguntar Luego',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permiso Denegado', 'El permiso de la cámara es requerido para tomar fotos.');
          return;
        }
      }

      const uri: string = await CameraModule.launchCamera();
      setPhotoUri(uri);
    } catch (err) {
      Alert.alert('Camera Error', String(err));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          testID="task-title-input"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="¿Qué necesitas hacer?"
          placeholderTextColor="#8B949E"
          multiline
        />

        {!isNew && (
          <View style={styles.row}>
            <Text style={styles.label}>Completado</Text>
            <Switch
              testID="task-completed-switch"
              value={completed}
              onValueChange={setCompleted}
              trackColor={{ false: '#3D4148', true: '#238636' }}
              thumbColor={completed ? '#3FB950' : '#E6EDF3'}
            />
          </View>
        )}

        {/* Photo Preview */}
        {photoUri && (
          <TouchableOpacity 
            style={styles.photoContainer} 
            activeOpacity={0.8}
            onPress={() => setIsImageViewerVisible(true)}
          >
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            <View style={styles.photoOverlay}>
              <Text style={styles.photoOverlayText}>🔍 Toca para ampliar</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Camera Button */}
        <TouchableOpacity testID="camera-btn" style={styles.cameraBtn} onPress={handleCamera}>
          <Text style={styles.cameraBtnText}>📷  {photoUri ? 'Tomar otra Foto' : 'Adjuntar Foto'}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          testID="save-btn"
          style={[styles.saveBtn, isSaving && styles.disabled]}
          onPress={handleSave}
          disabled={isSaving}>
          <Text style={styles.saveBtnText}>{isSaving ? 'Guardando…' : isNew ? 'Crear Tarea' : 'Guardar Cambios'}</Text>
        </TouchableOpacity>

        {/* Delete */}
        {!isNew && (
          <TouchableOpacity testID="delete-btn" style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑  Eliminar Tarea</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Fullscreen Image Modal */}
      <Modal visible={isImageViewerVisible} transparent={true} animationType="fade" onRequestClose={() => setIsImageViewerVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsImageViewerVisible(false)}>
            <Text style={styles.modalCloseText}>✕ Cerrar</Text>
          </TouchableOpacity>
          {photoUri && <Image source={{ uri: photoUri }} style={styles.modalImage} resizeMode="contain" />}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  scroll: { padding: 20, paddingBottom: 48 },
  label: { color: '#8B949E', fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 8,
    padding: 14,
    color: '#E6EDF3',
    fontSize: 16,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  photoContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    position: 'relative',
  },
  photo: { width: '100%', height: 200 },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    alignItems: 'center',
  },
  photoOverlayText: { color: '#E6EDF3', fontSize: 13, fontWeight: '500' },
  cameraBtn: {
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraBtnText: { color: '#58A6FF', fontSize: 15, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#238636',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#F85149',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#F85149', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  modalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: '#21262D', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  modalCloseText: { color: '#E6EDF3', fontSize: 16, fontWeight: '600' },
  modalImage: { width: '100%', height: '85%' },
});
