/**
 * Simplified WMATA Metrorail line paths as [lat, lng] coordinate arrays.
 * These are approximate paths for visual rendering on the map.
 */

export interface WmataLineGeo {
  code: string;
  name: string;
  color: string;
  path: [number, number][];
}

export const WMATA_LINES_GEO: WmataLineGeo[] = [
  {
    code: "RD",
    name: "Red Line",
    color: "#BF0D3E",
    path: [
      [38.9510, -77.0789], // Shady Grove
      [38.9478, -77.0740],
      [38.9370, -77.0584], // Rockville
      [38.9283, -77.0498], // Twinbrook
      [38.9215, -77.0435], // White Flint
      [38.9107, -77.0378], // Grosvenor
      [38.8984, -77.0302], // Medical Center
      [38.8970, -77.0222], // Bethesda
      [38.9050, -77.0039], // Friendship Heights
      [38.9114, -76.9984], // Tenleytown
      [38.9225, -76.9795], // Van Ness
      [38.9290, -76.9726], // Cleveland Park
      [38.9346, -76.9694], // Woodley Park
      [38.9426, -76.9667], // Dupont Circle
      [38.9510, -76.9613], // Farragut North
      [38.9532, -76.9530], // Metro Center
      [38.9555, -76.9434], // Gallery Place
      [38.9563, -76.9359], // Judiciary Square
      [38.9586, -76.9268], // Union Station
      [38.9577, -76.9070], // NoMa
      [38.9478, -76.8903], // Rhode Island Ave
      [38.9347, -76.8641], // Brookland
      [38.9218, -76.8494], // Fort Totten
      [38.9063, -76.8360], // Takoma
      [38.8934, -76.8187], // Silver Spring
      [38.8835, -76.7923], // Forest Glen
      [38.8733, -76.7710], // Wheaton
      [38.8625, -76.7440], // Glenmont
    ],
  },
  {
    code: "OR",
    name: "Orange Line",
    color: "#ED8B00",
    path: [
      [38.8874, -77.1715], // Vienna
      [38.8850, -77.1572],
      [38.8850, -77.1420], // Dunn Loring
      [38.8840, -77.1227], // West Falls Church
      [38.8826, -77.1069], // East Falls Church
      [38.8830, -77.0887], // Ballston
      [38.8879, -77.0791], // Virginia Square
      [38.8869, -77.0713], // Clarendon
      [38.8868, -77.0630], // Court House
      [38.8858, -77.0530], // Rosslyn
      [38.9013, -77.0395], // Foggy Bottom
      [38.9015, -77.0328], // Farragut West
      [38.8985, -77.0215], // McPherson Square
      [38.9532, -76.9530], // Metro Center
      [38.9555, -76.9434], // Gallery Place (shared)
      [38.9463, -76.9354], // L'Enfant Plaza (shared)
      [38.9345, -76.9215], // Federal Center SW
      [38.9252, -76.9141], // Capitol South
      [38.9168, -76.9048], // Eastern Market
      [38.9058, -76.8917], // Potomac Ave
      [38.8905, -76.8720], // Stadium-Armory
      [38.8850, -76.8450], // Minnesota Ave
      [38.8790, -76.8266], // Deanwood
      [38.8721, -76.8100], // Cheverly
      [38.8678, -76.7951], // Landover
      [38.8573, -76.7680], // New Carrollton
    ],
  },
  {
    code: "BL",
    name: "Blue Line",
    color: "#009CDE",
    path: [
      [38.7674, -77.1691], // Franconia-Springfield
      [38.7876, -77.1634], // Van Dorn Street
      [38.8103, -77.1441], // King St-Old Town
      [38.8266, -77.1276], // Braddock Road
      [38.8441, -77.0596], // Pentagon City
      [38.8692, -77.0546], // Pentagon
      [38.8857, -77.0530], // Arlington Cemetery
      [38.8858, -77.0530], // Rosslyn
      [38.9013, -77.0395], // Foggy Bottom
      [38.9015, -77.0328], // Farragut West
      [38.8985, -77.0215], // McPherson Square
      [38.9532, -76.9530], // Metro Center
      [38.9555, -76.9434], // Gallery Place (shared)
      [38.9463, -76.9354], // L'Enfant Plaza (shared)
      [38.9345, -76.9215], // Federal Center SW
      [38.9252, -76.9141], // Capitol South
      [38.9168, -76.9048], // Eastern Market
      [38.9058, -76.8917], // Potomac Ave
      [38.8905, -76.8720], // Stadium-Armory
      [38.8730, -76.8535], // Benning Road
      [38.8593, -76.8398], // Capitol Heights
      [38.8498, -76.8270], // Addison Road
      [38.8436, -76.8110], // Morgan Boulevard
      [38.8385, -76.7874], // Downtown Largo
    ],
  },
  {
    code: "SV",
    name: "Silver Line",
    color: "#919D9D",
    path: [
      [38.9570, -77.4624], // Ashburn
      [38.9555, -77.4380], // Loudoun Gateway
      [38.9537, -77.4130], // Washington Dulles
      [38.9510, -77.3870], // Innovation Center
      [38.9253, -77.3387], // Herndon
      [38.9221, -77.2890], // Reston Town Center
      [38.9210, -77.2270], // Wiehle-Reston East
      [38.9017, -77.2062], // Spring Hill
      [38.9008, -77.1866], // Greensboro
      [38.9008, -77.1710], // Tysons
      [38.8931, -77.1465], // McLean
      [38.8840, -77.1227], // West Falls Church (shared with OR)
      [38.8826, -77.1069], // East Falls Church
      [38.8830, -77.0887], // Ballston
      [38.8879, -77.0791], // Virginia Square
      [38.8869, -77.0713], // Clarendon
      [38.8868, -77.0630], // Court House
      [38.8858, -77.0530], // Rosslyn
      [38.9013, -77.0395], // Foggy Bottom
      [38.9015, -77.0328], // Farragut West
      [38.8985, -77.0215], // McPherson Square
      [38.9532, -76.9530], // Metro Center
      [38.9555, -76.9434], // Gallery Place
      [38.9463, -76.9354], // L'Enfant Plaza
      [38.9345, -76.9215], // Federal Center SW
      [38.9252, -76.9141], // Capitol South
      [38.9168, -76.9048], // Eastern Market
      [38.9058, -76.8917], // Potomac Ave
      [38.8905, -76.8720], // Stadium-Armory
      [38.8850, -76.8450], // Minnesota Ave (shared)
      [38.8790, -76.8266], // Deanwood
      [38.8721, -76.8100], // Cheverly
      [38.8678, -76.7951], // Landover
      [38.8573, -76.7680], // New Carrollton (shared)
    ],
  },
  {
    code: "GR",
    name: "Green Line",
    color: "#00B050",
    path: [
      [38.9322, -76.9943], // Branch Ave (south terminus — approx)
      [38.9246, -76.9860], // Suitland
      [38.9184, -76.9697], // Naylor Road
      [38.9126, -76.9538], // Southern Avenue
      [38.8960, -76.9382], // Congress Heights
      [38.8823, -76.9318], // Anacostia
      [38.8710, -76.9214], // Navy Yard-Ballpark
      [38.8848, -76.9340], // Waterfront
      [38.9463, -76.9354], // L'Enfant Plaza (shared)
      [38.9555, -76.9434], // Gallery Place (shared/Archives)
      [38.9513, -76.9470], // Mt Vernon Sq
      [38.9490, -76.9369], // Shaw-Howard U
      [38.9421, -76.9218], // U Street
      [38.9365, -76.9117], // Columbia Heights
      [38.9291, -76.8976], // Georgia Ave-Petworth
      [38.9218, -76.8494], // Fort Totten (shared w/ RD)
      [38.9200, -76.8300], // West Hyattsville
      [38.9146, -76.8150], // Hyattsville Crossing
      [38.9125, -76.7930], // College Park
      [38.9035, -76.7530], // Greenbelt
    ],
  },
  {
    code: "YL",
    name: "Yellow Line",
    color: "#FFD200",
    path: [
      [38.7684, -77.0742], // Huntington
      [38.7932, -77.0739], // Eisenhower Ave
      [38.8103, -77.1441], // King St-Old Town (shared w/ BL)
      [38.8266, -77.1276], // Braddock Road (shared w/ BL)
      [38.8692, -77.0546], // Pentagon
      [38.8857, -77.0530], // Pentagon City → crosses river
      [38.9463, -76.9354], // L'Enfant Plaza (shared)
      [38.9555, -76.9434], // Gallery Place (shared/Archives)
      [38.9513, -76.9470], // Mt Vernon Sq
      [38.9490, -76.9369], // Shaw-Howard U
      [38.9421, -76.9218], // U Street
      [38.9365, -76.9117], // Columbia Heights
      [38.9291, -76.8976], // Georgia Ave-Petworth
      [38.9218, -76.8494], // Fort Totten
    ],
  },
];
