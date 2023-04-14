type SupportedRegions =
  | "AU" // Australia
  | "AT" // Austria
  | "BE" // Belgium
  | "BR" // Brazil
  | "CA" // Canada
  | "CL" // Chile
  | "CO" // Colombia
  | "DK" // Denmark
  | "FI" // Finland
  | "FR" // France
  | "DE" // Germany
  | "HU" // Hungary
  | "IE" // Ireland
  | "IT" // Italy
  | "MY" // Malaysia
  | "MX" // Mexico
  | "NL" // Netherlands
  | "NZ" // New Zealand
  | "PL" // Poland
  | "PR" // Puerto Rico
  | "SG" // Singapore
  | "SI" // Slovenia
  | "ES" // Spain
  | "SE" // Sweden
  | "CH" // Switzerland
  | "GB" // United Kingdom
  | "US"; // United States

export type Address = {
  addressLines: [string];
  locality?: string;
  // Supported regions: https://developers.google.com/maps/documentation/address-validation/coverage
  regionCode?: SupportedRegions;
};
