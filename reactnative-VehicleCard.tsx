import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from './Modal';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Badge from './Badge';
import Button from './Button';
import { useUser } from '../hooks/useUser';
import bidService from '../services/bidService';
import FullScreenLoader from './FullScreenLoader';
import watchlistService from '../services/watchlistService';
import { useToast } from './Toast';
import { theme } from '../theme';
import { errorHandlers } from '../utils/errorHandlers';
import { watchlistEvents } from '../services/eventBus';

export type VehicleCardProps = {
  image: string;
  title: string;
  kms: string;
  fuel: string;
  transmissionType: string;
  rc_availability: boolean;
  repo_date: string;
  regs_no: string;
  has_bidded: boolean;
  owner: string;
  region: string;
  status: 'Winning' | 'Losing';
  onPressBid?: () => void;
  isFavorite?: boolean;
  endTime?: string; // ISO string for countdown
  manager_name: string;
  manager_phone: string;
  id: string;
  onBidSuccess?: () => void; // Callback for when bid is successful
  onFavoriteToggle?: (vehicleId: string, shouldToggle: boolean) => void; // Callback for favorite toggle with success status
};

export default function VehicleCard(props: VehicleCardProps) {
  const { colors, dark } = useTheme();
  const isDark = dark;
  const navigation = useNavigation<any>();
  const { buyerId } = useUser();
  const { show } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [buyerLimits, setBuyerLimits] = useState<import('../services/bidService').BuyerLimits | null>(null);

  // Interpret naive end time strings as IST (Asia/Kolkata)
  function getIstEndMs(end?: string) {
    if (!end) return Date.now();
    try {
      const s = String(end).replace('T', ' ').trim();
      const m = s.match(/^(\d{4})[-\/]?(\d{2}|\d{1})[-\/]?(\d{2}|\d{1})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        const hh = Number(m[4]);
        const mm = Number(m[5]);
        const ss = m[6] ? Number(m[6]) : 0;
        // Convert IST (UTC+05:30) naive timestamp to UTC epoch
        return Date.UTC(y, mo, d, hh - 5, mm - 30, ss);
      }
      // Fallback for ISO strings with timezone info
      return new Date(end).getTime();
    } catch {
      return new Date(end).getTime();
    }
  }

  const [remaining, setRemaining] = useState<number>(() => {
    const end = props.endTime ? getIstEndMs(props.endTime) : Date.now();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!props.endTime) return;
    const interval = setInterval(() => {
      const end = getIstEndMs(props.endTime as string);
      const secs = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(secs);
    }, 1000);
    return () => clearInterval(interval);
  }, [props.endTime]);

  useEffect(() => {
    const fetchLimits = async () => {
      if (!bidModalOpen || !buyerId) return;
      try {
        setLimitsLoading(true);
        const limits = await bidService.getBuyerLimits(Number(buyerId));
        setBuyerLimits(limits);
      } catch (e) {
        setBuyerLimits(null);
      } finally {
        setLimitsLoading(false);
      }
    };
    fetchLimits();
  }, [bidModalOpen, buyerId]);

  const ddhhmmss = useMemo(() => {
    let s = remaining;
    const days = Math.floor(s / 86400);
    s -= days * 86400;
    const hours = Math.floor(s / 3600);
    s -= hours * 3600;
    const minutes = Math.floor(s / 60);
    s -= minutes * 60;
    const seconds = s;
    const pad = (n: number) => String(n).padStart(2, '0');
    return [days, pad(hours), pad(minutes), pad(seconds)] as [
      number,
      string,
      string,
      string,
    ];
  }, [remaining]);
  const goDetail = () =>
    navigation.navigate('VehicleDetail', { vehicle: {...props, bidding_status: props.status} , id: props.id});

  const onPressBid = () => {
    if (!buyerId) {
      show('Not authenticated', 'error');
      return;
    }
    setBidModalOpen(true);
  };

  const placeBid = async () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      show('Enter a valid bid amount', 'error');
      return;
    }
    try {
      setIsLoading(true);
      const res = await bidService.placeManualBid({ buyer_id: buyerId!, vehicle_id: Number(props.id), bid_amount: num });
      
      show('Bid placed successfully', 'success');
      setAmount('');
      setBidModalOpen(false);
      // Call the callback to refetch data
      if (props.onBidSuccess) {
        props.onBidSuccess();
      }
    } catch (e: any) {
      show(errorHandlers(e.response.data.message), 'error');
    } finally {
      setIsLoading(false);
      setBidModalOpen(false)
    }
  };

  const toggleFavorite = async (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      setIsLoading(true);
      const response = await watchlistService.toggle(Number(props.id));
      
      // Check if the vehicle is locked and user can't toggle
      if (response.is_favorite && response.locked) {
        show('You can\'t toggle favorite while bidding', 'error');
        // Don't update the UI state if locked
        if (props.onFavoriteToggle) {
          props.onFavoriteToggle(props.id, false);
        }
        return;
      }
      
      // Only update local state if the API call was successful and not locked
      if (props.onFavoriteToggle) {
        props.onFavoriteToggle(props.id, true);
      } else if (props.onBidSuccess) {
        props.onBidSuccess(); // Fallback for backward compatibility
      }
      
      // Show success message
      show(response?.message || 'Favorite updated', 'success');
      // Broadcast watchlist changed so screens can refresh
      watchlistEvents.emitChanged();
    } catch (err: any) {
      show(err?.response?.data?.message || 'Failed to update favorite', 'error');
      // Don't update the UI state if there was an error
      if (props.onFavoriteToggle) {
        props.onFavoriteToggle(props.id, false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      onPress={goDetail}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.countdownRow} pointerEvents="none">
        {[
          { v: String(ddhhmmss[0]), l: 'Days' },
          { v: ddhhmmss[1], l: 'Hours' },
          { v: ddhhmmss[2], l: 'Minutes' },
          { v: ddhhmmss[3], l: 'Seconds' },
        ].map((i, idx) => (
          <View key={idx} style={styles.countItem}>
            <View
              style={[
                styles.countBox,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <Text style={[styles.countText, { color: theme.colors.warning }]}>
                {i.v}
              </Text>
            </View>
            <Text
              style={[
                styles.countUnderLabel,
                { color: theme.colors.textMuted },
              ]}
            >
              {i.l}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.mediaRow}>
        <Image source={{ uri: props.image } as any} style={styles.media} />
        <View style={[styles.meta, { borderColor: theme.colors.border }]}>
          <Text style={{...styles.metaAccent}}>{props.kms}</Text>
          <Text style={{...styles.metaAccent}}>{props.fuel}</Text>
          <Text
            style={{
              fontSize: theme.fontSizes.sm,
              fontWeight: '700',
              color:
                props.owner === 'Current Owner'
                  ? theme.colors.success
                  : theme.colors.info,
              fontFamily: theme.fonts.bold,
            }}
          >
            {props.owner}
          </Text>
          <Text style={[styles.metaAccent]}>{props.region}</Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Pressable onPress={toggleFavorite} hitSlop={8}>
          <MaterialIcons
            name={props.isFavorite ? 'star' : 'star-outline'}
            size={32}
            color={props.isFavorite ? theme.colors.error : theme.colors.textMuted}
            style={styles.starIcon}
          />
        </Pressable>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {props.title}
        </Text>
      </View>

      <View style={styles.actionRow}>
        {((props as any).has_bidded !== false) ? (
          <Badge status={props.status as any} />
        ) : (
          <View />
        )}
        <Button
          variant="secondary"
          title="₹ Place Bid"
          onPress={onPressBid}
        />
      </View>

      <View style={[styles.contact]}>
        <View style={styles.contactRow}>
        <MaterialIcons name="phone-iphone" color="#2563eb" size={18} />
          <Text style={styles.managerName}>{props.manager_name}</Text>
        </View>
        <TouchableOpacity style={styles.contactRow}
         onPress={() => {
          if (props.manager_phone) {
            Linking.openURL(`tel:${props.manager_phone}`);
          }
        }}
        >
          <Text style={styles.phone}>{props.manager_phone}</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Bid Modal */}
      <Modal
        visible={bidModalOpen}
        onClose={() => setBidModalOpen(false)}
        title="Place Manual Bid"
      >
        <View style={modalStyles.fieldRow}>
          <Text style={modalStyles.fieldLabel}>Bid Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            style={modalStyles.fieldInput}
            placeholder="e.g. 50000"
            keyboardType="numeric"
          />
        </View>

        <View style={modalStyles.limitBox}>
          {limitsLoading ? (
            <Text style={modalStyles.limitText}>Loading limits...</Text>
          ) : buyerLimits ? (
            <>
              <Text style={modalStyles.limitText}>
                Security Deposit: {buyerLimits.security_deposit.toLocaleString()}
              </Text>
              <Text style={modalStyles.limitText}>
                Bid Limit: {buyerLimits.bid_limit.toLocaleString()}
              </Text>
              <Text style={modalStyles.limitText}>
                Limit Used: {buyerLimits.limit_used.toLocaleString()}
              </Text>
              <Text style={modalStyles.limitText}>
                Pending Limit: {buyerLimits.pending_limit.toLocaleString()}
              </Text>
              {buyerLimits.active_vehicle_bids?.length ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={modalStyles.fieldLabel}>Active Vehicle Bids</Text>
                  {buyerLimits.active_vehicle_bids.map(item => (
                    <Text key={`avb-${item.vehicle_id}`} style={modalStyles.limitText}>
                      Vehicle #{item.vehicle_id}: Max Bidded {item.max_bidded.toLocaleString()}
                    </Text>
                  ))}
                </View>
              ) : null}
              {buyerLimits.unpaid_vehicles?.length ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={modalStyles.fieldLabel}>Unpaid Vehicles</Text>
                  {buyerLimits.unpaid_vehicles.map(item => (
                    <Text key={`uv-${item.vehicle_id}`} style={modalStyles.limitText}>
                      Vehicle #{item.vehicle_id}: Unpaid {item.unpaid_amt.toLocaleString()}
                    </Text>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <Text style={modalStyles.limitText}>Limits unavailable</Text>
          )}
        </View>

        <View style={modalStyles.modalActions}>
          <Pressable
            style={[modalStyles.modalBtn, modalStyles.saveBtn]}
            onPress={placeBid}
            disabled={isLoading}
          >
            <Text style={modalStyles.modalBtnText}>
              {isLoading ? 'Placing Bid...' : 'Place Bid'}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  bidIcon: {
    marginRight: theme.spacing.xs,
  },
  bidText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.bold,
  },
  countItem: {
    alignItems: 'center',
    flex: 1,
  },
  countBox: {
    width: '100%',
    paddingVertical: theme.spacing.sm,

    borderRadius: theme.radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
    fontFamily: theme.fonts.bold,
  },
  countUnderLabel: {
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
    fontFamily: theme.fonts.medium,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  media: {
    width: 220,
    height: 120,
    borderRadius: theme.radii.md,
  },
  meta: {
    flex: 1,
    borderLeftWidth: 1,
    paddingLeft: theme.spacing.md,
    justifyContent: 'space-between',
  },
  metaLine: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    fontFamily: theme.fonts.medium,
  },
  metaAccent: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    color: theme.colors.success,
    fontFamily: theme.fonts.bold,
  },
  title: {
    fontSize: theme.fontSizes.md,
    fontWeight: '700',
    lineHeight: 22,
    fontFamily: theme.fonts.bold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  starIcon: {
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  contact: {
    fontSize: theme.fontSizes.md,
    // textAlign: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    fontWeight: '600',
    fontFamily: theme.fonts.medium,
  },
  managerName: {
    fontWeight: '600',
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
  },
  phone: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
});

const modalStyles = StyleSheet.create({
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  fieldLabel: {
    color: theme.colors.text,
    fontWeight: '600',
    fontFamily: theme.fonts.medium,
  },
  fieldInput: {
    width: 160,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
  },
  modalBtnText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontFamily: theme.fonts.bold,
  },
  limitBox: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  limitText: {
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.fonts.regular,
  },
});
