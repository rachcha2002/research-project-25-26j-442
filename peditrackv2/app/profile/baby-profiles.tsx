import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useBaby } from '../../src/contexts/BabyContext';

export default function BabyProfilesScreen() {
  const router = useRouter();
  const { babies, selectedBaby, selectBaby, deleteBaby, setAsDefaultBaby } = useBaby();

  const handleDelete = (babyId: string, babyName: string) => {
    Alert.alert(
      'Delete Baby Profile',
      `Are you sure you want to delete ${babyName}'s profile? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBaby(babyId);
              Alert.alert('Success', 'Baby profile deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete baby profile');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (babyId: string, babyName: string) => {
    try {
      await setAsDefaultBaby(babyId);
      Alert.alert('Success', `${babyName} set as default baby`);
    } catch (error) {
      Alert.alert('Error', 'Failed to set default baby');
    }
  };

  const calculateAge = (dateOfBirth: string): string => {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 +
                       (now.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`;
    }
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years}y ${months}m`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Baby Profiles</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/profile/add-baby')}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {babies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👶</Text>
            <Text style={styles.emptyTitle}>No Baby Profiles Yet</Text>
            <Text style={styles.emptyText}>
              Add your baby's profile to start tracking their health and development
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/profile/add-baby')}
            >
              <Text style={styles.emptyButtonText}>Add Baby Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {babies.map((baby) => (
              <View key={baby._id} style={styles.babyCard}>
                <View style={styles.babyHeader}>
                  {baby.photo ? (
                    <Image source={{ uri: baby.photo }} style={styles.babyAvatar} />
                  ) : (
                    <View style={[styles.babyAvatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarText}>
                        {baby.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.babyInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.babyName}>{baby.name}</Text>
                      {baby.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                      {selectedBaby?._id === baby._id && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedText}>Selected</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.babyAge}>{calculateAge(baby.dateOfBirth)}</Text>
                    <Text style={styles.babyGender}>
                      {baby.gender.charAt(0).toUpperCase() + baby.gender.slice(1)}
                    </Text>
                  </View>
                </View>

                {baby.bloodType && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Blood Type:</Text>
                    <Text style={styles.detailValue}>{baby.bloodType}</Text>
                  </View>
                )}

                {baby.allergies && baby.allergies.length > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Allergies:</Text>
                    <Text style={styles.detailValue}>{baby.allergies.join(', ')}</Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => selectBaby(baby)}
                  >
                    <Text style={styles.actionIcon}>✓</Text>
                    <Text style={styles.actionText}>Select</Text>
                  </TouchableOpacity>

                  {!baby.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(baby._id, baby.name)}
                    >
                      <Text style={styles.actionIcon}>⭐</Text>
                      <Text style={styles.actionText}>Set Default</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/profile/edit-baby?id=${baby._id}`)}
                  >
                    <Text style={styles.actionIcon}>✏️</Text>
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(baby._id, baby.name)}
                  >
                    <Text style={styles.actionIcon}>🗑️</Text>
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 28,
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  babyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  babyHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  babyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  babyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  babyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#ffd93d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedBadge: {
    backgroundColor: '#6bcf7f',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  babyAge: {
    fontSize: 16,
    color: '#667eea',
    marginBottom: 2,
  },
  babyGender: {
    fontSize: 14,
    color: '#999',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#ffe0e0',
  },
  deleteText: {
    color: '#ff6b6b',
  },
});
