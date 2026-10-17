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
      provinceId: typeof user.provinceId === 'function' ? null : (user.provinceId ? String(user.provinceId) : null),
      districtId: typeof user.districtId === 'function' ? null : (user.districtId ? String(user.districtId) : null),
      cityId: typeof user.cityId === 'function' ? null : (user.cityId ? String(user.cityId) : null)
    }
  };
};

export const toDonorStatusDTO = (donor: any) => {
  return {
    status: donor.donorStatus,
    statusChangedAt: donor.lastStatusChangedAt || donor.updatedAt
  };
};
