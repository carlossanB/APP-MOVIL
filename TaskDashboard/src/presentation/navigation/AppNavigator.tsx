import React from 'react';
import { View, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { TaskListScreen } from '../screens/TaskListScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { useTaskStore } from '../stores/useTaskStore';

export type RootStackParamList = {
  TaskList: undefined;
  TaskDetail: { taskId: string | null };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

const MainStack = () => (
  <Stack.Navigator
    initialRouteName="TaskList"
    screenOptions={{
      headerStyle: { backgroundColor: '#161B22' },
      headerTintColor: '#E6EDF3',
      headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      contentStyle: { backgroundColor: '#0D1117' },
      animation: 'slide_from_right',
    }}>
    <Stack.Screen
      name="TaskList"
      component={TaskListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="TaskDetail"
      component={TaskDetailScreen}
      options={{ title: 'Detalle de Tarea' }}
    />
  </Stack.Navigator>
);

const CustomDrawerContent = (props: any) => {
  const { filterType, setFilterType, deleteAllTasks } = useTaskStore();
  
  const confirmDeleteAll = () => {
    Alert.alert(
      'Eliminar Todas',
      '¿Estás seguro de que deseas eliminar permanentemente todas las tareas? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            deleteAllTasks();
            props.navigation.closeDrawer();
          }
        }
      ]
    );
  };

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: '#161B22' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#E6EDF3', fontSize: 22, fontWeight: 'bold', marginBottom: 24, paddingLeft: 8 }}>Gestor de Tareas</Text>
        
        <DrawerItem 
          label="Todas" 
          activeTintColor="#FFFFFF"
          inactiveTintColor="#8B949E"
          activeBackgroundColor="#F43F5E"
          focused={filterType === 'all'}
          onPress={() => { setFilterType('all'); props.navigation.closeDrawer(); }}
        />
        <DrawerItem 
          label="Completas" 
          activeTintColor="#FFFFFF"
          inactiveTintColor="#8B949E"
          activeBackgroundColor="#F43F5E"
          focused={filterType === 'completed'}
          onPress={() => { setFilterType('completed'); props.navigation.closeDrawer(); }}
        />
        <DrawerItem 
          label="Pendientes" 
          activeTintColor="#FFFFFF"
          inactiveTintColor="#8B949E"
          activeBackgroundColor="#F43F5E"
          focused={filterType === 'pending'}
          onPress={() => { setFilterType('pending'); props.navigation.closeDrawer(); }}
        />
        
        <View style={{ height: 1, backgroundColor: '#30363D', marginVertical: 20 }} />
        
        <DrawerItem 
          label="Eliminar todas las tareas" 
          inactiveTintColor="#F85149"
          onPress={confirmDeleteAll}
        />
      </View>
    </DrawerContentScrollView>
  );
};

export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#161B22', width: 280 },
      }}>
      <Drawer.Screen 
        name="DashboardRoot" 
        component={MainStack} 
        options={{ title: 'Inicio' }} 
      />
    </Drawer.Navigator>
  </NavigationContainer>
);
