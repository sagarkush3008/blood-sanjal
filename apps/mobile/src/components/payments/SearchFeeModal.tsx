import React from 'react';
import {
  PaymentBottomSheet,
  PaymentBottomSheetProps,
  PaymentGatewayId,
  PaymentGatewayOption,
} from './PaymentBottomSheet';

export type { PaymentGatewayId, PaymentGatewayOption };
export type SearchFeeModalProps = PaymentBottomSheetProps;

export const SearchFeeModal: React.FC<SearchFeeModalProps> = (props) => {
  return <PaymentBottomSheet {...props} />;
};
