export const toPublicDonorDTO = (donor: any, user: any) => {
  return {
    id: donor._id,
    userId: user._id,
    name: user.name,
    bloodGroup: donor.bloodGroup,
    donorStatus: donor.donorStatus, // Only safe statuses like ACTIVE/UNAVAILABLE
    lastDonationDate: donor.lastDonationDate,
    totalDonations: donor.totalDonations,
    // Redact exact coordinates and personal identifiable info (email, phone, address)
    approximateLocation: {
      provinceId: user.provinceId,
      districtId: user.districtId,
      cityId: user.cityId
    }
  };
};
