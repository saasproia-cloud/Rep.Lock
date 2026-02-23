import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTabBar } from '@/components/ui/app-tab-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RepLockLogo } from '@/components/ui/replock-logo';
import { useAppColors } from '@/hooks/use-app-colors';
import { useRepLockStore } from '@/state/replock-store';

const SHOP_ITEMS = [
  { platform: 'tiktok', title: 'TikTok 10 min', tokenCost: 50, minutes: 10, subtitle: 'Debloque ton feed' },
  { platform: 'instagram', title: 'Instagram 10 min', tokenCost: 50, minutes: 10, subtitle: 'Stories et reels' },
  { platform: 'youtube', title: 'YouTube 10 min', tokenCost: 50, minutes: 10, subtitle: 'Videos longues' },
] as const;

export default function ShopScreen() {
  const colors = useAppColors();
  const { tokens, timeCredits, spendTokensForCredit } = useRepLockStore();

  const handleBuy = (platform: 'tiktok' | 'instagram' | 'youtube', tokenCost: number, minutes: number) => {
    const ok = spendTokensForCredit(platform, tokenCost, minutes);
    if (!ok) {
      Alert.alert('Tokens insuffisants', 'Fais plus de repetitions pour acheter ce pack.');
      return;
    }
    Alert.alert('Achat valide', `${minutes} min ajoutees pour ${platform}.`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <RepLockLogo size={70} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Boutique</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Convertis tes tokens en minutes d'acces.</Text>
          </View>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>SOLDE ACTUEL</Text>
          <Text style={[styles.balanceValue, { color: colors.accent }]}>{tokens} tokens</Text>
          <Text style={[styles.balanceLine, { color: colors.textMuted }]}>TikTok: {timeCredits.tiktok} min</Text>
          <Text style={[styles.balanceLine, { color: colors.textMuted }]}>Instagram: {timeCredits.instagram} min</Text>
          <Text style={[styles.balanceLine, { color: colors.textMuted }]}>YouTube: {timeCredits.youtube} min</Text>
        </View>

        {SHOP_ITEMS.map((item) => (
          <View key={item.platform} style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.itemSub, { color: colors.textMuted }]}>{item.subtitle}</Text>
              <Text style={[styles.itemPrice, { color: colors.accent }]}>{item.tokenCost} tokens</Text>
            </View>
            <PrimaryButton
              label="Acheter"
              onPress={() => handleBuy(item.platform, item.tokenCost, item.minutes)}
              style={styles.buyButton}
            />
          </View>
        ))}

        <PrimaryButton label="Retour accueil" onPress={() => router.replace('/')} variant="outline" />
        <AppTabBar current="shop" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 3,
  },
  balanceLabel: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '700',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  balanceLine: {
    fontSize: 14,
    fontWeight: '600',
  },
  item: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemTextWrap: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemPrice: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
  },
  buyButton: {
    minWidth: 102,
    minHeight: 48,
  },
});
