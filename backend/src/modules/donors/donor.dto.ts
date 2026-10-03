export const toPublicDonorDTO = (donor: any, user: any) => {
  return {
    id: donor._id,
    userId: user._id,
    name: user.name,
    bloodGroup: donor.bloodGroup,
    donorStatus: donor.donorStatus, // Only safe statuses like ACTIVE/UNAVAILABLE
    inactiveUntil: donor.inactiveUntil,
    inactiveReason: donor.inactiveReason,
    lastDonationDate: donor.lastDonationDate,
    reminderDate: donor.reminderDate,
    totalDonations: donor.totalDonations,
    // Redact exact coordinates and personal identifiable info (email, phone, address)
    approximateLocation: {
      provinceId: user.provinceId,
      districtId: user.districtId,
      cityId: user.cityId
    }
  };
};

export const toDonorStatusDTO = (donor: any) => {
  return {
    status: donor.donorStatus,
    statusChangedAt: donor.lastStatusChangedAt || donor.updatedAt
  };
};
