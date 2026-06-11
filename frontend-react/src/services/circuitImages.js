export const CIRCUIT_FLAGS = {
  'Italy': '🇮🇹',
  'United Kingdom': '🇬🇧',
  'Belgium': '🇧🇪',
  'Japan': '🇯🇵',
  'Singapore': '🇸🇬',
  'Brazil': '🇧🇷',
  'Germany': '🇩🇪',
  'Spain': '🇪🇸',
  'Monaco': '🇲🇨',
  'Australia': '🇦🇺',
  'China': '🇨🇳',
  'Bahrain': '🇧🇭',
  'Saudi Arabia': '🇸🇦',
  'USA': '🇺🇸',
  'Canada': '🇨🇦',
  'Austria': '🇦🇹',
  'Hungary': '🇭🇺',
  'Netherlands': '🇳🇱',
  'Azerbaijan': '🇦🇿',
  'Mexico': '🇲🇽',
  'Qatar': '🇶🇦',
  'UAE': '🇦🇪',
  'United Arab Emirates': '🇦🇪'
}

export function getRaceImage(race) {
  if (race.imageUrl) return race.imageUrl;
  
  const name = race.name ? race.name.toLowerCase() : '';
  const circuit = race.circuitName ? race.circuitName.toLowerCase() : '';
  const country = race.country ? race.country.toLowerCase() : '';
  const location = race.location ? race.location.toLowerCase() : '';
  
  // Specific scenery / city / iconic landmark images for each GP
  
  // Monaco -> Port Hercule, luxury yachts, hillside town
  if (country.includes('monaco') || name.includes('monaco')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80';
  }
  
  // Singapore -> Marina Bay Sands night skyline
  if (country.includes('singapore') || name.includes('singapore')) {
    return 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop&q=80';
  }
  
  // Azerbaijan (Baku) -> Baku Flame Towers
  if (country.includes('azerbaijan') || name.includes('baku') || location.includes('baku')) {
    return 'https://images.unsplash.com/photo-1527068596641-ac333a9009c0?w=800&auto=format&fit=crop&q=80';
  }
  
  // Las Vegas -> Strip, casinos, night skyline
  if (name.includes('las vegas') || location.includes('las vegas')) {
    return 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&auto=format&fit=crop&q=80';
  }
  
  // Miami -> Palm trees and South Beach vibe
  if (name.includes('miami') || location.includes('miami')) {
    return 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&auto=format&fit=crop&q=80';
  }
  
  // Austin / COTA -> Texas Austin downtown skyline
  if (name.includes('cota') || location.includes('austin')) {
    return 'https://images.unsplash.com/photo-1531219572328-a0171b4448a3?w=800&auto=format&fit=crop&q=80';
  }
  
  // USA general -> Manhattan or US flag aesthetic
  if (country.includes('usa')) {
    return 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&auto=format&fit=crop&q=80';
  }
  
  // Australia (Melbourne) -> Yarra river and Melbourne skyline
  if (country.includes('australia')) {
    return 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&auto=format&fit=crop&q=80';
  }
  
  // China (Shanghai) -> Pudong night skyline / Pearl Tower
  if (country.includes('china') || location.includes('shanghai')) {
    return 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=800&auto=format&fit=crop&q=80';
  }
  
  // Japan (Suzuka) -> Japan pagoda and cherry blossoms
  if (country.includes('japan')) {
    return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80';
  }
  
  // Bahrain (Sakhir) -> desert sunset or Bahrain modern skyline
  if (country.includes('bahrain')) {
    return 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&auto=format&fit=crop&q=80';
  }
  
  // Saudi Arabia (Jeddah) -> Jeddah coastal mosque
  if (country.includes('saudi')) {
    return 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&auto=format&fit=crop&q=80';
  }
  
  // Italy (Imola) -> Tuscany hills
  if (name.includes('imola') || circuit.includes('imola')) {
    return 'https://images.unsplash.com/photo-1528114039593-4366cc08227d?w=800&auto=format&fit=crop&q=80';
  }
  
  // Italy (Monza) -> Milan Cathedral (Duomo)
  if (country.includes('italy')) {
    return 'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=800&auto=format&fit=crop&q=80';
  }
  
  // Spain (Barcelona) -> Sagrada Familia
  if (country.includes('spain') && !location.includes('madrid')) {
    return 'https://images.unsplash.com/photo-1583897184646-f947936a7154?w=800&auto=format&fit=crop&q=80';
  }
  
  // Spain (Madrid) -> Gran Via Madrid street
  if (location.includes('madrid') || name.includes('madrid')) {
    return 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&auto=format&fit=crop&q=80';
  }
  
  // Canada (Montreal) -> Montreal skyline
  if (country.includes('canada') || location.includes('montreal')) {
    return 'https://images.unsplash.com/photo-1519112232436-9923c6192a53?w=800&auto=format&fit=crop&q=80';
  }
  
  // Austria (Spielberg) -> green Austrian Alps
  if (country.includes('austria')) {
    return 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&auto=format&fit=crop&q=80';
  }
  
  // United Kingdom (Silverstone) -> London Westminster / Big Ben
  if (country.includes('united kingdom') || country.includes('uk') || country.includes('britain')) {
    return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop&q=80';
  }
  
  // Hungary (Budapest) -> Parliament building
  if (country.includes('hungary') || location.includes('budapest')) {
    return 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&auto=format&fit=crop&q=80';
  }
  
  // Belgium (Spa) -> Ardennes forest
  if (country.includes('belgium')) {
    return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=80';
  }
  
  // Netherlands (Zandvoort) -> Beach dunes
  if (country.includes('netherlands') || country.includes('dutch')) {
    return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80';
  }
  
  // Mexico -> Mexico City monument
  if (country.includes('mexico')) {
    return 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&auto=format&fit=crop&q=80';
  }
  
  // Brazil (Sao Paulo) -> Sao Paulo skyline
  if (country.includes('brazil') || location.includes('sao paulo')) {
    return 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&auto=format&fit=crop&q=80';
  }
  
  // Qatar (Lusail) -> Doha skyline
  if (country.includes('qatar')) {
    return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80';
  }
  
  // Abu Dhabi (Yas Marina) -> Yas Island Marina skyline
  if (country.includes('emirates') || country.includes('uae') || location.includes('abu dhabi')) {
    return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80';
  }

  // Fallback to general motorsport track
  return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80';
}
