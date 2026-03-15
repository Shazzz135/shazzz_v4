/**
 * Address Parser Utilities
 * Handles parsing of grid addresses with direction/flip suffixes
 */

/**
 * Cleans an address by removing direction/flip suffixes (F, L, D, R)
 * F = Flip (horizontal)
 * L = Rotate Left (90° counter-clockwise)
 * D = Rotate Down (180°)
 * R = Rotate Right (90° clockwise)
 */
export const getCleanAddress = (address: string): string => {
  return address.replace(/[FLDR]$/, '');
};

/**
 * Gets the direction/flip suffix from an address
 * Returns the last character if it's a valid suffix, otherwise empty string
 */
export const getDirectionSuffix = (address: string): string => {
  const lastChar = address.charAt(address.length - 1);
  if (/[FLDR]/.test(lastChar)) {
    return lastChar;
  }
  return '';
};

/**
 * Checks if an address has a flip suffix (F)
 */
export const isFlipped = (address: string): boolean => {
  return getDirectionSuffix(address) === 'F';
};

/**
 * Gets the rotation angle in degrees from direction suffix
 * F = 0° (no rotation, just flip)
 * L = 270° (90° counter-clockwise)
 * D = 180°
 * R = 90°
 */
export const getRotationAngle = (address: string): number => {
  const suffix = getDirectionSuffix(address);
  switch (suffix) {
    case 'L':
      return 270; // 90 degrees counter-clockwise
    case 'D':
      return 180; // 180 degrees
    case 'R':
      return 90; // 90 degrees clockwise
    default:
      return 0; // No rotation
  }
};
