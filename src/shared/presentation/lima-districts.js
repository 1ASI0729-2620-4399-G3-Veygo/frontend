/**
 * Approximate center coordinates of the districts of Lima Metropolitana and Callao.
 *
 * @remarks
 * Used to place a vehicle on the map when the owner selects its district. In later
 * sprints the exact position will be obtained from a geocoding service.
 *
 * @type {Object<string, [number, number]>}
 */
export const limaDistrictCoordinates = {
    'Barranco': [-12.1492, -77.0214],
    'Bellavista': [-12.0621, -77.1222],
    'Breña': [-12.0594, -77.0508],
    'Callao': [-12.0566, -77.1181],
    'Chorrillos': [-12.1692, -77.0244],
    'Comas': [-11.9446, -77.0626],
    'Independencia': [-11.9914, -77.0458],
    'Jesús María': [-12.0786, -77.0467],
    'La Molina': [-12.0797, -76.9380],
    'La Victoria': [-12.0708, -77.0167],
    'Lima': [-12.0464, -77.0428],
    'Lince': [-12.0833, -77.0333],
    'Los Olivos': [-11.9692, -77.0719],
    'Magdalena del Mar': [-12.0917, -77.0717],
    'Miraflores': [-12.1211, -77.0297],
    'Pueblo Libre': [-12.0744, -77.0628],
    'Rímac': [-12.0289, -77.0431],
    'San Borja': [-12.1006, -76.9989],
    'San Isidro': [-12.0977, -77.0365],
    'San Juan de Lurigancho': [-11.9819, -77.0036],
    'San Juan de Miraflores': [-12.1575, -76.9719],
    'San Martín de Porres': [-12.0006, -77.0708],
    'San Miguel': [-12.0776, -77.0847],
    'Santiago de Surco': [-12.1391, -76.9933],
    'Surquillo': [-12.1136, -77.0181],
    'Villa El Salvador': [-12.2131, -76.9361]
};

/**
 * Districts offered in location selectors, sorted alphabetically.
 *
 * @type {string[]}
 */
export const limaDistricts = Object.keys(limaDistrictCoordinates);
