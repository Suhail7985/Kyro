/**
 * Geofencing utilities for location-verified attendance check-ins.
 * Supports GPS radius check and IP-based CIDR validation.
 */

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Checks whether (lat, lng) is within `radiusMeters` of (officeLat, officeLng)
 * using the Haversine formula.
 */
function isWithinRadius(lat, lng, officeLat, officeLng, radiusMeters) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat - officeLat);
  const dLng = toRad(lng - officeLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(officeLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_METERS * c;
  return distance <= radiusMeters;
}

/**
 * Calculates distance in meters between two lat/lng points (Haversine).
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Converts an IPv4 address string to a 32-bit unsigned integer.
 */
function ipToLong(ip) {
  const parts = ip.trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Checks if `clientIP` falls within any of the CIDR ranges in the comma-separated string.
 * Example allowedCIDRs: "192.168.1.0/24, 10.0.0.0/8"
 */
function isAllowedIP(clientIP, allowedCIDRs) {
  if (!clientIP || !allowedCIDRs) return false;

  const ip = clientIP.replace('::ffff:', '').trim();
  const ipNum = ipToLong(ip);
  if (ipNum === null) return false;

  const cidrs = allowedCIDRs.split(',').map((s) => s.trim()).filter(Boolean);

  for (const cidr of cidrs) {
    // Support plain IP (treated as /32) or CIDR notation
    const [network, prefixStr] = cidr.includes('/') ? cidr.split('/') : [cidr, '32'];
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) continue;

    const networkNum = ipToLong(network);
    if (networkNum === null) continue;

    // Build subnet mask from prefix length
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    if ((ipNum & mask) === (networkNum & mask)) return true;
  }

  return false;
}

/**
 * Validates a check-in attempt against geofence rules.
 * Reads config from environment variables.
 * @returns {{ allowed: boolean, method: 'gps'|'ip'|'bypass', distance: number|null, message: string }}
 */
function validateCheckIn(lat, lng, clientIP) {
  const enabled = process.env.GEOFENCE_ENABLED;
  if (!enabled || enabled === 'false' || enabled === '0') {
    return { allowed: true, method: 'bypass', distance: null, message: 'Geofencing disabled — check-in allowed.' };
  }

  const officeLat = parseFloat(process.env.OFFICE_LAT);
  const officeLng = parseFloat(process.env.OFFICE_LNG);
  const radiusMeters = parseFloat(process.env.OFFICE_RADIUS_METERS) || 500;
  const allowedIPs = process.env.OFFICE_ALLOWED_IPS || '';

  // Try GPS validation first
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && !isNaN(officeLat) && !isNaN(officeLng)) {
    const distance = Math.round(haversineDistance(lat, lng, officeLat, officeLng));
    if (isWithinRadius(lat, lng, officeLat, officeLng, radiusMeters)) {
      return { allowed: true, method: 'gps', distance, message: `Within office radius (${distance}m).` };
    }
    // GPS check failed — fall through to IP check
  }

  // Try IP validation
  if (clientIP && allowedIPs && isAllowedIP(clientIP, allowedIPs)) {
    return { allowed: true, method: 'ip', distance: null, message: 'Office network IP verified.' };
  }

  // Both failed — compute distance for the error response
  let distance = null;
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && !isNaN(officeLat) && !isNaN(officeLng)) {
    distance = Math.round(haversineDistance(lat, lng, officeLat, officeLng));
  }

  return {
    allowed: false,
    method: 'gps',
    distance,
    message: `Check-in denied. ${distance != null ? `You are ${distance}m from the office (max ${radiusMeters}m).` : 'Location unavailable and IP not whitelisted.'}`,
  };
}

module.exports = { isWithinRadius, isAllowedIP, validateCheckIn };
