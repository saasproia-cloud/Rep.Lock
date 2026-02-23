import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors } from '@/constants/colors';
import { useRepLockStore } from '@/state/replock-store';

const SHOP_ITEMS = [
  { platform: 'tiktok', title: 'TikTok 10 min', tokenCost: 50, minutes: 10 },
  { platform: 'instagram', title: 'Instagram 10 min', tokenCost: 50, minutes: 10 },
  { platform: 'youtube', title: 'YouTube 10 min', tokenCost: 50, minutes: 10 },
] as const;

export default function ShopScreen() {
  const { tokens, timeCredits, spendTokensForCredit } = useRepLockStore();

  const handleBuy = (platform: 'tiktok' | 'instagram' | 'youtube', tokenCost: number, minutes: number) => {
    const ok = spendTokensForCredit(platform, tokenCost, minutes);
    if (!ok) {
      Alert.alert('Not enough tokens', 'Fais plus de reps pour acheter ce crédit.');
      return;
    }
    Alert.alert('Purchase done', `${minutes} minutes créditées sur ${platform}.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.balance}>Balance: {tokens} tokens</Text>

        <View style={styles.creditCard}>
          <Text style={styles.creditTitle}>Time credits (fake local logic)</Text>
          <Text style={styles.creditLine}>TikTok: {timeCredits.tiktok} min</Text>
          <Text style={styles.creditLine}>Instagram: {timeCredits.instagram} min</Text>
          <Text style={styles.creditLine}>YouTube: {timeCredits.youtube} min</Text>
        </View>

        {SHOP_ITEMS.map((item) => (
          <View key={item.platform} style={styles.item}>
            <View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>{item.tokenCost} tokens</Text>
            </View>
            <PrimaryButton
              label="Buy"
              onPress={() => handleBuy(item.platform, item.tokenCost, item.minutes)}
              style={styles.buyButton}
            />
          </View>
        ))}

        <PrimaryButton label="Back dashboard" onPress={() => router.replace('/')} variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: '800',
  },
  balance: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  creditCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 6,
  },
  creditTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  creditLine: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  item: {
    backgroundColor: '#0F1523',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  itemSub: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  buyButton: {
    minHeight: 46,
    minWidth: 88,
  },
});
