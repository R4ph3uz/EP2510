export async function getRoute(start, end, notify) {

    try {
        const url = `https://router.project-osrm.org/route/v1/bike/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`OSRM error (${res.status})`);
        }

        const data = await res.json();

        if (!data.routes || data.routes.length === 0) {
            throw new Error("No route found");
        }

        return data.routes[0].geometry.coordinates.map(
            c => [c[1], c[0]]
        );

    } catch (error) {
        let msg = error.message;
        let type = 'error';
        setNotification({msg,type});
        return [];
    }
}

export function getDistanceMeters(p1, p2) {
    const R = 6371000; // Rayon de la Terre en mètres
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(p2.lat - p1.lat);
    const dLng = toRad(p2.lng - p1.lng);

    const lat1 = toRad(p1.lat);
    const lat2 = toRad(p2.lat);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

export function offsetLatLng(lat, lng, dxMeters, dyMeters) {
    const earthRadius = 6378137 // mètres

    const dLat = dyMeters / earthRadius
    const dLng = dxMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))

    return {
        lat: lat + (dLat * 180) / Math.PI,
        lng: lng + (dLng * 180) / Math.PI,
    }
}

export function generatePointInRadius(base, radius) {
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.random() * radius;
    const x = Math.cos(angle) * rad;
    const y = Math.sin(angle) * rad;

    return offsetLatLng(base.lat, base.lng, x, y);
}

export function pathLength(path) {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
        length += getDistanceMeters(normalizePoint(path[i - 1]), normalizePoint(path[i]));
    }
    return length;
}

function distancePointToSegment(p, a, b) {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;

    const refLat = toRad(a.lat);

    const ax = toRad(a.lng) * R * Math.cos(refLat);
    const ay = toRad(a.lat) * R;

    const bx = toRad(b.lng) * R * Math.cos(refLat);
    const by = toRad(b.lat) * R;

    const px = toRad(p.lng) * R * Math.cos(refLat);
    const py = toRad(p.lat) * R;

    const ABx = bx - ax;
    const ABy = by - ay;
    const APx = px - ax;
    const APy = py - ay;

    const ab2 = ABx * ABx + ABy * ABy;

    if (ab2 === 0) {
        return Math.hypot(px - ax, py - ay);
    }

    // Projection
    const t = (APx * ABx + APy * ABy) / ab2;
    const tClamped = Math.max(0, Math.min(1, t));

    const projx = ax + ABx * tClamped;
    const projy = ay + ABy * tClamped;

    return Math.hypot(px - projx, py - projy);
}

function isPointOnPath(point, pathA, tolerance) {
    for (let i = 1; i < pathA.length; i++) {
        const a = normalizePoint(pathA[i - 1]);
        const b = normalizePoint(pathA[i]);
        const p = normalizePoint(point);

        if (distancePointToSegment(p, a, b) <= tolerance) {
            return true;
        }
    }
    return false;
}

export function sharedPathLength(pathA, pathB, tolerance = 15) {
    let shared = 0;

    for (let i = 1; i < pathB.length; i++) {
        const p1 = normalizePoint(pathB[i - 1]);
        const p2 = normalizePoint(pathB[i]);

        const onA1 = isPointOnPath(p1, pathA, tolerance);
        const onA2 = isPointOnPath(p2, pathA, tolerance);

        if (onA1) {
            shared += getDistanceMeters(p1, p2);
        }
    }

    return shared;
}

function normalizePoint(p) {
    if (Array.isArray(p)) {
        return { lat: p[0], lng: p[1] };
    }
    if (p && typeof p === "object" && "lat" in p && "lng" in p) {
        return p;
    }
    throw new Error("Invalid point format");
}
